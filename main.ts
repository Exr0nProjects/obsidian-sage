// heavily reverse engineered from https://github.com/EricR/obsidian-sagecell/blob/master/src/client.ts

import { nanoid } from "nanoid";
import { Plugin, Notice, PluginSettingTab, App, Setting } from "obsidian";
import DOMPurify from "dompurify";
import SockJS from "sockjs-client";

interface ObsidanSageSettings {
    serverURL: string
}

const DEFAULT_SETTINGS: ObsidanSageSettings = {
    serverURL: "https://sagecell.sagemath.org/"
}

export default class ObsidianSage extends Plugin {
    ws: any;
    settings: ObsidanSageSettings;
    outputWriters: any;

    async onload() {
        this.outputWriters = {};
        await this.loadSettings();

        this.addSettingTab(new SettingTab(this.app, this));

        const cell_session_id = nanoid();

        await fetch(this.settings.serverURL + `kernel?CellSessionID=${cell_session_id}&timeout=inf&accepted_tos=true`, { method: "POST" })
            .then(res => res.json())
            .then(({ ws_url, id }) => {
                this.ws = new SockJS(`${this.settings.serverURL}sockjs?CellSessionID=${cell_session_id}`);

                //this.ws.onmessage = console.log;
                this.ws.onclose = () => { console.log("socket closed"); }
                this.ws.onerror = this.connectFailed;

                //this.registerInterval(window.setInterval(() => { console.log(this.ws) }, 3000));

                this.ws.onmessage = (msg: any) =>
                {
                    const data = JSON.parse(msg.data.substring(46));
                    const msgType = data.msg_type;
                    const msgId = data.parent_header.msg_id;
                    const content = data.content;

                    console.log(msgType);

                    if (msgType === 'error') {
                        //new Notice("Obsidian Sage evaluation error occured.")
                        this.outputWriters[msgId].appendError(content);
                    }
                    //if (msgType === 'display_data') {
                    //    console.log(content.data['text/html']);
                    //}

                    if (msgType == 'stream' && content.text) {
                        console.log("got text", content.text)
                        this.outputWriters[msgId].appendText(content.text);
                    }
                    if (msgType == 'display_data' && content.data['text/image-filename']) {
                        console.log("got image", content.data['text/image-filename'])
                        this.outputWriters[msgId].appendImage(this.getFileUrl(id, content.data['text/image-filename']));
                    }
                    if (msgType == 'display_data' && content.data['text/html']) {
                        console.log("got html", content.data['text/html'])
                        this.outputWriters[msgId].appendSafeHTML(content.data['text/html']);
                    }
                    //if (msgType == 'error') {
                    //    this.outputWriters[msgId].appendError(content);
                    //}
                    //if (msgType == 'execute_reply') {
                    //    // DONE
                    //}
                }

                return [ ws_url, id ];
            })
            .then(([ ws_url, session_id ]) => {

                this.registerMarkdownCodeBlockProcessor("sage", (src, el, ctx) => {
                    const req_id = nanoid();
                    const payload = JSON.stringify({
                        header: {
                            msg_id: req_id,
                            username: "",
                            session: cell_session_id,
                            msg_type: 'execute_request',
                        },
                        metadata: {},
                        content: {
                            code: src,
                            silent: false,
                            user_variables: [],
                            user_expressions: {
                                "_sagecell_files": "sys._sage_.new_files()",
                            },
                            allow_stdin: false
                        },
                        parent_header: {}
                    }, null, 4);

                    el.addClass('sagecell-display-wrapper');
                    const wrapper = el.createEl("div");
                    const code_disp = wrapper.createEl("pre");
                    code_disp.addClass('sagecell-display-code')
                    code_disp.innerText = src;
                    this.outputWriters[req_id] = new OutputWriter(wrapper);
                    this.ws.send(`${session_id}/channels,${payload}`);
                    //console.log("\n\n\n\n\n\n\n\n\nsent a request!", payload)
                    //wrapper.innerText = rows.join("\n");
                    //const body = table.createEl("tbody");
                    //
                    //for (let i = 0; i < rows.length; i++) {
                    //    const cols = rows[i].split(",");
                    //
                    //    const row = body.createEl("tr");
                    //
                    //    for (let j = 0; j < cols.length; j++) {
                    //        row.createEl("td", { text: cols[j] });
                    //    }
                    //}
                });
            })
            .catch(this.connectFailed);
    }
    connectFailed(e: any) {
        console.error(e);
        new Notice("ObsidianSage failed to connect to render server.");
    }
    async onunload() {
        if (this.ws) this.ws.close();
    }

    getFileUrl(sess: string, file: string): string {
        return `${this.settings.serverURL}kernel/${sess}/files/${file}`
    }

    async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
    plugin: ObsidianSage;

    constructor(app: App, plugin: ObsidianSage) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

        new Setting(containerEl)
        .setName('Setting #1')
        .setDesc('It\'s a secret')
        .addText(text => text
                 .setPlaceholder('Enter a custom server URL that behaves like https://sagecell.sagemath.org/')
                 .setValue(this.plugin.settings.serverURL)
                 .onChange(async (value: string) => {
                     if (value[value.length - 1] !== '/') value += '/';
                     this.plugin.settings.serverURL = value;
                     await this.plugin.saveSettings();
                 }));
    }
}

class OutputWriter {
    // from https://github.com/EricR/obsidian-sagecell/blob/bd4c5af9fe2c5f8b90225796f267c5471f3f505d/src/output-writer.ts
    outputEl: HTMLElement
    target: HTMLElement
    lastType: string

    constructor(target: HTMLElement) {
        this.target = target;
        this.lastType = "";
    }

    initOutput() {
        if (this.lastType !== "") return;
        const output = this.target.createEl('details');
        const summary_text = output.createEl('summary');
        summary_text.innerText = 'Execution Output';
        const actual_output = output.createEl('div');
        actual_output.addClass('sagecell-display-output');
        this.outputEl = actual_output;
    }

    appendText(text: string) {
        this.initOutput();
        if (this.lastType == 'text') {
            const previousPreEl = this.outputEl.querySelectorAll('pre');

            if (previousPreEl.length > 0) {
                previousPreEl[previousPreEl.length-1].innerText += text;
            }
        } else {
            const preEl = document.createElement("pre");
            preEl.addClass('sagecell-output');
            preEl.innerText = text;
            this.outputEl.appendChild(preEl);
        }
        this.lastType = 'text';
    }

    appendImage(url: string) {
        this.initOutput();
        const imgEl = document.createElement("img");
        imgEl.src = url;
        imgEl.classList.add('sagecell-image');

        this.outputEl.appendChild(imgEl);
        this.outputEl.appendChild(document.createTextNode("\n"));
        this.lastType = 'image';
    }

    appendSafeHTML(html: string) {
        this.initOutput();
        console.log("appending AFTER SAFE")
        //const sanitized = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
        //const sanitized = DOMPurify.sanitize(html);
        //console.log("adding sanitized", sanitized);
        //this.outputEl.innerHTML += sanitized;

        this.outputEl.innerHTML += html;
        this.lastType = 'html';


        //const parser = new DOMParser();
        //const unsafeDoc = parser.parseFromString(html, 'text/html');
        //
        ////unsafeDoc.querySelectorAll('script').forEach((scriptEl: HTMLElement) => {
        ////    if (scriptEl.type == 'math/tex') {
        ////        const mathEl = document.createElement('math');
        ////        mathEl.appendChild(document.createTextNode(scriptEl.innerText));
        ////        scriptEl.parentNode.replaceChild(mathEl, scriptEl);
        ////    }
        ////});
        //
        //const safeHTML = DOMPurify.sanitize(unsafeDoc.documentElement.innerHTML);
        //const safeDoc = parser.parseFromString(safeHTML, 'text/html');
        //
        //console.log(safeDoc)
        //
        ////safeDoc.querySelectorAll('math').forEach((mathEl: HTMLElement) => {
        ////    const spanEl = document.createElement('span')
        ////    spanEl.classList = 'math math-inline';
        ////    spanEl.appendChild(window.MathJax.tex2chtml(mathEl.textContent, {display: false}));
        ////    mathEl.parentNode.replaceChild(spanEl, mathEl);
        ////});
        //
        //this.outputEl.innerHTML += safeDoc.body.innerHTML;
        //this.lastType = 'html';
        //
        ////window.MathJax.startup.document.clear();
        ////window.MathJax.startup.document.updateDocument();
    }

    appendError(error: any) {
        this.initOutput();
        const spanEl = document.createElement("pre");
        spanEl.classList.add('sagecell-error', 'bg-red-300');
        spanEl.innerText =`${error.ename}: ${error.evalue}`;

        this.outputEl.appendChild(spanEl);
        this.lastType = 'error';
    }
}

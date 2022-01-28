// heavily reverse engineered from https://github.com/EricR/obsidian-sagecell/blob/master/src/client.ts

import { Plugin, Notice } from "obsidian";

export default class ObsidianSage extends Plugin {
    async onload() {
        await fetch("https://sagecell.sagemath.org/kernel", { method: "POST" })
            .then(res => res.json())
            .then(({ws_url, id}) => {
                this.registerMarkdownCodeBlockProcessor("sage", (src, el, ctx) => {
                    const rows = src.split("\n").filter((row) => row.length > 0);

                    const wrapper = el.createEl("div");
                    console.log("wrapper", wrapper);
                    wrapper.innerText = rows.join("\n");
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
            .catch(e => {
                new Notice("ObsidianSage failed to connect to render server.");
                console.error(e)
            });
    }
}

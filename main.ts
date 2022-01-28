import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface ObsidanSageSettings {
    renderOnSave: boolean
}

const DEFAULT_SETTINGS: ObsidanSageSettings = {
    renderOnSave: false
}

export default class ObsidianSage extends Plugin {
	settings: ObsidanSageSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingTab(this.app, this));

        this.addCommand({
            id: 'obsidian-sage-render-under-point',
            name: 'Render Sage Math Block at Cursor',
            editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
                if (true /* editor in a sage math block */) {
                    console.log("in a sage math block!")
                    if (checking) return true;

                    // TODO: actually render the thing

                    return true;
                }
                return false;
            }
        });

		//// This creates an icon in the left ribbon.
		//const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		//    // Called when the user clicks the icon.
		//    new Notice('This is a notice!');
		//});
		//// Perform additional things with the ribbon
		//ribbonIconEl.addClass('my-plugin-ribbon-class');

		//// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		//const statusBarItemEl = this.addStatusBarItem();
		//statusBarItemEl.setText('Status Bar Text');

		//// This adds a simple command that can be triggered anywhere
		//this.addCommand({
		//    id: 'open-sample-modal-simple',
		//    name: 'Open sample modal (simple)',
		//    callback: () => {
		//        new SampleModal(this.app).open();
		//    }
		//});
		//// This adds an editor command that can perform some operation on the current editor instance
		//this.addCommand({
		//    id: 'sample-editor-command',
		//    name: 'Sample editor command',
		//    editorCallback: (editor: Editor, view: MarkdownView) => {
		//        console.log(editor.getSelection());
		//        editor.replaceSelection('Sample Editor Command');
		//    }
		//});
		//// This adds a complex command that can check whether the current state of the app allows execution of the command
		//this.addCommand({
		//    id: 'open-sample-modal-complex',
		//    name: 'Open sample modal (complex)',
		//    checkCallback: (checking: boolean) => {
		//        // Conditions to check
		//        const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		//        if (markdownView) {
		//            // If checking is true, we're simply "checking" if the command can be run.
		//            // If checking is false, then we want to actually perform the operation.
		//            if (!checking) {
		//                new SampleModal(this.app).open();
		//            }
        //
		//            // This command will only show up in Command Palette when the check function returns true
		//            return true;
		//        }
		//    }
		//});

		// This adds a settings tab so the user can configure various aspects of the plugin
		//// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		//// Using this function will automatically remove the event listener when this plugin is disabled.
		//this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		//    console.log('click', evt);
		//});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        //this.registerInterval(window.setInterval(() => console.log('setInterval'),  100));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

//class SampleModal extends Modal {
//    constructor(app: App) {
//        super(app);
//    }
//
//    onOpen() {
//        const {contentEl} = this;
//        console.log(contentEl);
//        contentEl.setText('Woah!');
//    }
//
//    onClose() {
//        const {contentEl} = this;
//        contentEl.empty();
//    }
//}

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
			.setName('Render on Save')
			.setDesc('Enable re-rendering Sage Math blocks on save.')
			.addToggle(val => val
				.setValue(this.plugin.settings.renderOnSave)
				.onChange(async (value) => {
					this.plugin.settings.renderOnSave = value;
					await this.plugin.saveSettings();
				}));
	}
}

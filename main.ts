import { App, Notice, Plugin, PluginSettingTab, Setting, TFile, debounce } from 'obsidian';
import { clearVerseCache } from './verseService';
import { VerseParser } from './VerseParser';
import { VerseSidebarView, VIEW_TYPE_VERSE_SIDEBAR } from './VerseSidebarView';
import { createVerseEditorPlugin } from './VerseEditorPlugin';

// Define the display options
export type VerseDisplayOption = 'modal' | 'popover';

// Define the interface for our plugin settings
export interface VersePluginSettings {
	verseDisplayOption: VerseDisplayOption;
}

// Define the default settings
const DEFAULT_SETTINGS: VersePluginSettings = {
	verseDisplayOption: 'modal',
}

export default class VersePlugin extends Plugin {
	settings: VersePluginSettings;
	private verseParser: VerseParser;

	async onload() {
		console.log('Loading Verse Plugin');

		await this.loadSettings();

		this.verseParser = new VerseParser(this);

		// Register the sidebar view
		this.registerView(VIEW_TYPE_VERSE_SIDEBAR, (leaf) => new VerseSidebarView(leaf));

		// Register the markdown post processor
		this.registerMarkdownPostProcessor(async (el, _ctx) => {
			this.verseParser.setupVerseLinks(el);
		});

		// Register Live Preview editor extension
		this.registerEditorExtension(createVerseEditorPlugin(this));

		// File-open: repopulate sidebar whenever a new file is opened
		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				this.updateSidebar(file);
			})
		);

		// Editor-change: repopulate after the user stops typing for 500ms
		this.registerEvent(
			this.app.workspace.on('editor-change', debounce(() => {
				this.updateSidebar(this.app.workspace.getActiveFile());
			}, 500))
		);

		// Once the workspace is ready, open the sidebar and populate it
		this.app.workspace.onLayoutReady(async () => {
			await this.activateSidebar();
			this.updateSidebar(this.app.workspace.getActiveFile());
		});

		// Add settings tab
		this.addSettingTab(new VerseSettingTab(this.app, this));

		// Command palette: clear verse cache
		this.addCommand({
			id: 'clear-verse-cache',
			name: 'Clear verse cache',
			callback: () => {
				clearVerseCache();
				new Notice('Verse cache cleared.');
			},
		});
	}

	onunload() {
		console.log('Unloading Verse Plugin');
	}

	private async activateSidebar() {
		const { workspace } = this.app;
		if (workspace.getLeavesOfType(VIEW_TYPE_VERSE_SIDEBAR).length > 0) return;

		const leaf = workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({ type: VIEW_TYPE_VERSE_SIDEBAR, active: true });
		}
	}

	private updateSidebar(file: TFile | null) {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_VERSE_SIDEBAR);
		if (leaves.length === 0) return;

		const view = leaves[0].view as VerseSidebarView;
		view.update(file);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class VerseSettingTab extends PluginSettingTab {
	plugin: VersePlugin;

	constructor(app: App, plugin: VersePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Verse Plugin Settings'});

		new Setting(containerEl)
			.setName('Verse Display Option')
			.setDesc('Choose how verse references are displayed when clicked.')
			.addDropdown(dropdown => dropdown
				.addOption('modal', 'Modal Dialog')
				.addOption('popover', 'Pop-over')
				.setValue(this.plugin.settings.verseDisplayOption)
				.onChange(async (value) => {
					this.plugin.settings.verseDisplayOption = value as VerseDisplayOption;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Verse cache')
			.setDesc('Fetched verses are cached in memory for the current session. Clear the cache to force fresh fetches.')
			.addButton(button => button
				.setButtonText('Clear cache')
				.onClick(() => {
					clearVerseCache();
					new Notice('Verse cache cleared.');
				}));
	}
}

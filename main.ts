import { App, Notice, Plugin, PluginSettingTab, Setting, TFile, debounce } from 'obsidian';
import { clearReferenceCache } from './referenceService';
import { ReferenceParser } from './ReferenceParser';
import { ReferenceSidebarView, VIEW_TYPE_REFERENCE_SIDEBAR } from './ReferenceSidebarView';
import { createReferenceEditorPlugin } from './ReferenceEditorPlugin';
import styles from './styles.css';

// Define the display options
export type ReferenceDisplayOption = 'modal' | 'popover';

// Define the interface for our plugin settings
export interface WolPluginSettings {
	referenceDisplayOption: ReferenceDisplayOption;
}

// Define the default settings
const DEFAULT_SETTINGS: WolPluginSettings = {
	referenceDisplayOption: 'modal',
}

export default class WolPlugin extends Plugin {
	settings: WolPluginSettings;
	private referenceParser: ReferenceParser;

	private styleEl: HTMLStyleElement;

	async onload() {
		console.log('Loading WOL Reference Tools');

		this.styleEl = document.createElement('style');
		this.styleEl.id = 'wol-reference-tools-styles';
		this.styleEl.textContent = styles;
		document.head.appendChild(this.styleEl);

		await this.loadSettings();

		this.referenceParser = new ReferenceParser(this);

		// Register the sidebar view
		this.registerView(VIEW_TYPE_REFERENCE_SIDEBAR, (leaf) => new ReferenceSidebarView(leaf));

		// Register the markdown post processor
		this.registerMarkdownPostProcessor(async (el, _ctx) => {
			this.referenceParser.setupReferenceLinks(el);
		});

		// Register Live Preview editor extension
		this.registerEditorExtension(createReferenceEditorPlugin(this));

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

		// Layout-change: trigger fetch when right panel is expanded
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.updateSidebar(this.app.workspace.getActiveFile());
			})
		);

		// Active-leaf-change: update sidebar when user switches tabs
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.updateSidebar(this.app.workspace.getActiveFile());
			})
		);

		// Once the workspace is ready, open the sidebar and populate it
		this.app.workspace.onLayoutReady(async () => {
			await this.activateSidebar();
			this.updateSidebar(this.app.workspace.getActiveFile());
		});

		// Add settings tab
		this.addSettingTab(new WolSettingTab(this.app, this));

		// Command palette: clear reference cache
		this.addCommand({
			id: 'clear-reference-cache',
			name: 'Clear reference cache',
			callback: () => {
				clearReferenceCache();
				new Notice('Reference cache cleared.');
			},
		});
	}

	onunload() {
		console.log('Unloading WOL Reference Tools');
		this.styleEl?.remove();
	}

	private async activateSidebar() {
		const { workspace } = this.app;
		if (workspace.getLeavesOfType(VIEW_TYPE_REFERENCE_SIDEBAR).length > 0) return;

		const leaf = workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({ type: VIEW_TYPE_REFERENCE_SIDEBAR, active: true });
		}
	}

	private updateSidebar(file: TFile | null) {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_REFERENCE_SIDEBAR);
		if (leaves.length === 0) return;

		const rightSplit = this.app.workspace.rightSplit;
		if ((rightSplit as any)?.collapsed) return;

		const view = leaves[0].view;
		if (view instanceof ReferenceSidebarView) {
			view.update(file);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class WolSettingTab extends PluginSettingTab {
	plugin: WolPlugin;

	constructor(app: App, plugin: WolPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Reference display option')
			.setDesc('Choose how references are displayed when clicked.')
			.addDropdown(dropdown => dropdown
				.addOption('modal', 'Modal Dialog')
				.addOption('popover', 'Pop-over')
				.setValue(this.plugin.settings.referenceDisplayOption)
				.onChange(async (value) => {
					this.plugin.settings.referenceDisplayOption = value as ReferenceDisplayOption;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Reference cache')
			.setDesc('Fetched references are cached in memory for the current session. Clear the cache to force fresh fetches.')
			.addButton(button => button
				.setButtonText('Clear cache')
				.onClick(() => {
					clearReferenceCache();
					new Notice('Reference cache cleared.');
				}));
	}
}

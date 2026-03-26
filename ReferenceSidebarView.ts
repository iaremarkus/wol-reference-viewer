import { ItemView, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import { ReferenceData } from './types';
import { fetchReference, isCached } from './referenceService';

export const VIEW_TYPE_REFERENCE_SIDEBAR = 'reference-sidebar-view';

const REF_REGEX = /!!(.+?)!!/g;

export class ReferenceSidebarView extends ItemView {
    private updateGeneration = 0;
    private abortController: AbortController | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE_REFERENCE_SIDEBAR;
    }

    getDisplayText(): string {
        return 'References';
    }

    getIcon(): string {
        return 'book-open';
    }

    async onOpen() {
        this.renderEmpty('Open a note with !!reference!! syntax to see results here.');
        const file = this.app.workspace.getActiveFile();
        if (file) await this.update(file);
    }

    onClose(): Promise<void> {
        this.abortController?.abort();
        this.updateGeneration++;
        return Promise.resolve();
    }

    async update(file: TFile | null) {
        this.abortController?.abort();
        const controller = new AbortController();
        this.abortController = controller;
        const { signal } = controller;

        if (!file) {
            this.renderEmpty('No file open.');
            return;
        }

        const content = await this.app.vault.read(file);
        const refs = this.extractRefs(content);

        if (refs.length === 0) {
            this.renderEmpty('No references in this note.');
            return;
        }

        this.renderPlaceholders(refs);

        const generation = ++this.updateGeneration;

        for (let i = 0; i < refs.length; i++) {
            if (signal.aborted || generation !== this.updateGeneration) return;
            if (i > 0 && !isCached(refs[i])) await new Promise(resolve => setTimeout(resolve, 1000));
            if (signal.aborted || generation !== this.updateGeneration) return;
            const data = await fetchReference(refs[i], signal);
            if (signal.aborted || generation !== this.updateGeneration) return;
            this.fillPlaceholder(refs[i], data);
        }
    }

    private extractRefs(content: string): string[] {
        const seen = new Set<string>();
        const refs: string[] = [];
        const regex = new RegExp(REF_REGEX.source, 'g');
        let match;

        while ((match = regex.exec(content)) !== null) {
            for (const part of match[1].split(';')) {
                const ref = part.trim();
                if (ref && !seen.has(ref)) {
                    seen.add(ref);
                    refs.push(ref);
                }
            }
        }
        return refs;
    }

    private renderEmpty(message: string) {
        this.contentEl.empty();
        this.contentEl.addClass('ref-sidebar');
        this.contentEl.createEl('p', { text: message, cls: 'ref-sidebar-empty' });
    }

    private renderPlaceholders(refs: string[]) {
        this.contentEl.empty();
        this.contentEl.addClass('ref-sidebar');

        for (const ref of refs) {
            const item = this.contentEl.createDiv({ cls: 'ref-sidebar-item' });
            item.dataset.ref = ref;

            const header = item.createDiv({ cls: 'ref-sidebar-header' });
            header.createDiv({ text: ref, cls: 'ref-sidebar-ref' });
            const wolLink = header.createEl('a', {
                href: `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(ref)}`,
                cls: 'ref-sidebar-wol-icon',
            });
            wolLink.setAttr('target', '_blank');
            wolLink.setAttr('aria-label', 'View on WOL');
            setIcon(wolLink, 'external-link');

            const body = item.createDiv({ cls: 'ref-sidebar-body' });
            body.createEl('p', { text: 'Loading\u2026', cls: 'ref-sidebar-loading' });
        }
    }

    private fillPlaceholder(ref: string, data: ReferenceData | null) {
        const item = this.contentEl.querySelector(
            `.ref-sidebar-item[data-ref="${CSS.escape(ref)}"]`
        ) as HTMLElement | null;
        if (!item) return;

        const body = item.querySelector('.ref-sidebar-body') as HTMLElement | null;
        if (!body) return;

        body.empty();

        if (!data) {
            body.createEl('p', { text: 'Could not load reference.', cls: 'ref-sidebar-error' });
        } else if (data.results.length === 0) {
            body.createEl('p', { text: 'No results found.', cls: 'ref-sidebar-error' });
        } else {
            for (const html of data.results) {
                body.createDiv({ cls: 'ref-sidebar-wol-result' }).innerHTML = html;
            }
        }
    }
}

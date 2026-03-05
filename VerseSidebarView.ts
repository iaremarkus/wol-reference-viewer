import { ItemView, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import { ReferenceData } from './types';
import { fetchReference } from './verseService';
import { renderVerseText } from './verse-stylist';

export const VIEW_TYPE_VERSE_SIDEBAR = 'verse-sidebar-view';

const VERSE_REGEX = /!!(.+?)!!/g;

export class VerseSidebarView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE_VERSE_SIDEBAR;
    }

    getDisplayText(): string {
        return 'Verses';
    }

    getIcon(): string {
        return 'book-open';
    }

    async onOpen() {
        this.renderEmpty('Open a note with !!verse!! references to see them here.');
    }

    onClose(): Promise<void> {
        return Promise.resolve();
    }

    async update(file: TFile | null) {
        if (!file) {
            this.renderEmpty('No file open.');
            return;
        }

        const content = await this.app.vault.read(file);
        const refs = this.extractRefs(content);

        if (refs.length === 0) {
            this.renderEmpty('No verse references in this note.');
            return;
        }

        this.renderPlaceholders(refs);

        for (const ref of refs) {
            fetchReference(ref).then(data => this.fillPlaceholder(ref, data));
        }
    }

    private extractRefs(content: string): string[] {
        const seen = new Set<string>();
        const refs: string[] = [];
        const regex = new RegExp(VERSE_REGEX.source, 'g');
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
        this.contentEl.addClass('verse-sidebar');
        this.contentEl.createEl('p', { text: message, cls: 'verse-sidebar-empty' });
    }

    private renderPlaceholders(refs: string[]) {
        this.contentEl.empty();
        this.contentEl.addClass('verse-sidebar');

        for (const ref of refs) {
            const item = this.contentEl.createDiv({ cls: 'verse-sidebar-item' });
            item.dataset.verseRef = ref;

            const header = item.createDiv({ cls: 'verse-sidebar-header' });
            header.createDiv({ text: ref, cls: 'verse-sidebar-ref' });
            const wolLink = header.createEl('a', {
                href: `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(ref)}`,
                cls: 'verse-sidebar-wol-icon',
            });
            wolLink.setAttr('target', '_blank');
            wolLink.setAttr('aria-label', 'View on WOL');
            setIcon(wolLink, 'external-link');

            const body = item.createDiv({ cls: 'verse-sidebar-body' });
            body.createEl('p', { text: 'Loading\u2026', cls: 'verse-sidebar-loading' });
        }
    }

    private fillPlaceholder(ref: string, data: ReferenceData | null) {
        const item = this.contentEl.querySelector(
            `.verse-sidebar-item[data-verse-ref="${CSS.escape(ref)}"]`
        ) as HTMLElement | null;
        if (!item) return;

        const body = item.querySelector('.verse-sidebar-body') as HTMLElement | null;
        if (!body) return;

        body.empty();

        if (!data) {
            body.createEl('p', { text: 'Could not load reference.', cls: 'verse-sidebar-error' });
        } else if (data.type === 'verse') {
            renderVerseText(body.createEl('p'), data.text, ref);
        } else {
            if (data.results.length === 0) {
                body.createEl('p', { text: 'No results found.', cls: 'verse-sidebar-error' });
            } else {
                for (const html of data.results) {
                    body.createDiv({ cls: 'verse-sidebar-wol-result' }).innerHTML = html;
                }
            }
        }
    }
}

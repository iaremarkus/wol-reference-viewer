import { App } from 'obsidian';
import { ReferenceData } from './types';
import { fetchReference } from './referenceService';

export class ReferencePopover {
    private app: App;
    private popoverEl: HTMLElement | null = null;
    private showGeneration = 0;
    private static instance: ReferencePopover | null = null;

    private constructor(app: App) {
        this.app = app;
    }

    public static getInstance(app: App): ReferencePopover {
        if (!ReferencePopover.instance) {
            ReferencePopover.instance = new ReferencePopover(app);
        }
        return ReferencePopover.instance;
    }

    public async show(targetEl: HTMLElement, verseRef: string) {
        this.hide();
        const generation = ++this.showGeneration;

        this.popoverEl = document.createElement('div');
        this.popoverEl.addClass('ref-popover');
        this.popoverEl.style.position = 'absolute';
        this.popoverEl.style.zIndex = '9999';
        this.popoverEl.style.maxWidth = '300px';
        this.popoverEl.style.padding = '10px';
        this.popoverEl.style.borderRadius = 'var(--radius-m)';
        this.popoverEl.style.backgroundColor = 'var(--background-secondary)';
        this.popoverEl.style.border = '1px solid var(--background-modifier-border)';
        this.popoverEl.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
        this.popoverEl.style.color = 'var(--text-normal)';
        this.popoverEl.style.fontSize = 'var(--font-ui-small)';
        this.popoverEl.style.lineHeight = '1.5';

        this.popoverEl.createEl('p', { text: 'Loading\u2026', cls: 'ref-popover-loading' });

        document.body.appendChild(this.popoverEl);
        this.positionPopover(targetEl);

        const data = await fetchReference(verseRef);
        if (generation !== this.showGeneration) return; // stale, another show() ran
        this.updateContent(data);

        document.addEventListener('click', this.handleOutsideClick);
        this.popoverEl.addEventListener('click', (e) => e.stopPropagation());
    }

    private updateContent(data: ReferenceData | null) {
        if (!this.popoverEl) return;

        this.popoverEl.empty();

        if (!data || data.results.length === 0) {
            this.popoverEl.createEl('p', { text: 'No results found.' });
            return;
        }

        for (const html of data.results) {
            this.popoverEl.createDiv({ cls: 'ref-popover-result' }).innerHTML = html;
        }
    }

    private positionPopover(targetEl: HTMLElement) {
        if (!this.popoverEl) return;

        const targetRect = targetEl.getBoundingClientRect();
        const popoverRect = this.popoverEl.getBoundingClientRect();

        let top = targetRect.bottom + window.scrollY + 5;
        let left = targetRect.left + window.scrollX;

        if (left + popoverRect.width > window.innerWidth) {
            left = window.innerWidth - popoverRect.width - 20;
        }
        if (top + popoverRect.height > window.innerHeight && targetRect.top > popoverRect.height) {
            top = targetRect.top + window.scrollY - popoverRect.height - 5;
        }

        this.popoverEl.style.top = `${top}px`;
        this.popoverEl.style.left = `${left}px`;
    }

    public hide() {
        if (this.popoverEl) {
            this.popoverEl.remove();
            this.popoverEl = null;
            document.removeEventListener('click', this.handleOutsideClick);
        }
    }

    private handleOutsideClick = (event: MouseEvent) => {
        if (this.popoverEl && !this.popoverEl.contains(event.target as Node)) {
            this.hide();
        }
    }
}

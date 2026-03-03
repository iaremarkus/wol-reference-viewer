import { App } from 'obsidian';
import { VerseData } from './types';
import { fetchVerse } from './verseService';
import { renderVerseText } from './verse-stylist';

export class VersePopover {
    private app: App;
    private popoverEl: HTMLElement | null = null;
    private static instance: VersePopover | null = null;

    private constructor(app: App) {
        this.app = app;
    }

    public static getInstance(app: App): VersePopover {
        if (!VersePopover.instance) {
            VersePopover.instance = new VersePopover(app);
        }
        return VersePopover.instance;
    }

    public async show(targetEl: HTMLElement, verseRef: string) {
        this.hide();

        this.popoverEl = document.createElement('div');
        this.popoverEl.addClass('verse-popover');
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

        this.popoverEl.createEl('p', { text: 'Loading verse\u2026', cls: 'verse-popover-loading' });

        document.body.appendChild(this.popoverEl);
        this.positionPopover(targetEl);

        const data = await fetchVerse(verseRef);
        this.updateContent(data, verseRef);

        document.addEventListener('click', this.handleOutsideClick);
        this.popoverEl.addEventListener('click', (e) => e.stopPropagation());
    }

    private updateContent(verseData: VerseData | null, verseRef: string) {
        if (!this.popoverEl) return;

        this.popoverEl.empty();

        if (verseData) {
            const p = this.popoverEl.createEl('p');
            renderVerseText(p, verseData.text, verseRef);

            const wolLink = this.popoverEl.createEl('a', {
                text: 'View on WOL',
                href: `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(verseData.reference)}`,
                cls: 'verse-popover-wol-link',
            });
            wolLink.setAttr('target', '_blank');
        } else {
            this.popoverEl.createEl('p', { text: 'Verse not found.' });
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

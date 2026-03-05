import { App, ButtonComponent, Modal } from 'obsidian';
import { ReferenceData, VerseData } from './types';
import { fetchReference } from './verseService';
import { renderVerseText } from './verse-stylist';

export class VerseModal extends Modal {
    verseRef: string;
    data: ReferenceData | null;
    loading: boolean;

    constructor(app: App, verseRef: string) {
        super(app);
        this.verseRef = verseRef;
        this.data = null;
        this.loading = true;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('verse-modal');

        this.titleEl.setText(this.verseRef);

        this.displayMessage();
        this.fetchAndDisplay();
    }

    onClose() {
        this.contentEl.empty();
    }

    private displayMessage() {
        const { contentEl } = this;
        contentEl.empty();

        if (this.loading) {
            contentEl.createEl('p', { text: 'Loading\u2026' });
            return;
        }

        if (!this.data) {
            contentEl.createEl('p', { text: 'Error loading reference.' });
            return;
        }

        if (this.data.type === 'verse') {
            const p = contentEl.createEl('p');
            renderVerseText(p, this.data.text, this.verseRef);

            const buttonContainer = contentEl.createDiv({ cls: 'verse-modal-button-container' });
            new ButtonComponent(buttonContainer)
                .setButtonText('View on WOL')
                .setCta()
                .onClick(() => {
                    window.open(
                        `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent((this.data as VerseData).reference)}`,
                        '_blank'
                    );
                });
        } else {
            // WolData
            if (this.data.results.length === 0) {
                contentEl.createEl('p', { text: 'No results found.' });
            } else {
                for (const html of this.data.results) {
                    contentEl.createDiv({ cls: 'verse-modal-wol-result' }).innerHTML = html;
                }
            }

            const buttonContainer = contentEl.createDiv({ cls: 'verse-modal-button-container' });
            new ButtonComponent(buttonContainer)
                .setButtonText('View on WOL')
                .setCta()
                .onClick(() => {
                    window.open(
                        `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(this.verseRef)}`,
                        '_blank'
                    );
                });
        }
    }

    private async fetchAndDisplay() {
        this.data = await fetchReference(this.verseRef);
        this.loading = false;
        this.displayMessage();
    }
}

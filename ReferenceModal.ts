import { App, ButtonComponent, Modal } from 'obsidian';
import { ReferenceData, appendHTML } from './types';
import { fetchReference } from './referenceService';

export class ReferenceModal extends Modal {
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
        contentEl.addClass('ref-modal');

        this.titleEl.setText(this.verseRef);

        this.displayMessage();
        void this.fetchAndDisplay();
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

        if (this.data.results.length === 0) {
            contentEl.createEl('p', { text: 'No results found.' });
        } else {
            for (const html of this.data.results) {
                appendHTML(contentEl.createDiv({ cls: 'ref-modal-result' }), html);
            }
        }

        const buttonContainer = contentEl.createDiv({ cls: 'ref-modal-button-container' });
        new ButtonComponent(buttonContainer)
            .setButtonText('View on wol.jw.org')
            .setCta()
            .onClick(() => {
                window.open(
                    `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(this.verseRef)}`,
                    '_blank'
                );
            });
    }

    private async fetchAndDisplay() {
        this.data = await fetchReference(this.verseRef);
        this.loading = false;
        this.displayMessage();
    }
}

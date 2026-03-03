import { App, ButtonComponent, Modal } from 'obsidian';
import { VerseData } from './types';
import { fetchVerse } from './verseService';
import { renderVerseText } from './verse-stylist';

export class VerseModal extends Modal {
    verseRef: string;
    verseData: VerseData | null;
    loading: boolean;

    constructor(app: App, verseRef: string) {
        super(app);
        this.verseRef = verseRef;
        this.verseData = null;
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
            contentEl.createEl('p', { text: 'Loading verse\u2026' });
        } else if (this.verseData) {
            const p = contentEl.createEl('p');
            renderVerseText(p, this.verseData.text, this.verseRef);

            const buttonContainer = contentEl.createDiv({ cls: 'verse-modal-button-container' });

            new ButtonComponent(buttonContainer)
                .setButtonText('View on WOL')
                .setCta()
                .onClick(() => {
                    if (this.verseData) {
                        window.open(
                            `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(this.verseData.reference)}`,
                            '_blank'
                        );
                    }
                });
        } else {
            contentEl.createEl('p', { text: 'Error loading verse.' });
        }
    }

    private async fetchAndDisplay() {
        this.verseData = await fetchVerse(this.verseRef);
        this.loading = false;
        this.displayMessage();
    }
}

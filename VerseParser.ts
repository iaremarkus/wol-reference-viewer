import VersePlugin, { VerseDisplayOption } from './main';
import { VerseModal } from './VerseModal';
import { VersePopover } from './VersePopover';
import { isBibleVerse } from './bibleBooks';

export class VerseParser {
    private plugin: VersePlugin;

    constructor(plugin: VersePlugin) {
        this.plugin = plugin;
    }

    setupVerseLinks(container: HTMLElement) {
        this.transformVerseMarkers(container);
        this.setupVerseClickHandler(container);
    }

    private transformVerseMarkers(container: HTMLElement) {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.nodeValue && /!!(.+?)!!/.test(node.nodeValue)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );

        const textNodes: Node[] = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        for (const textNode of textNodes) {
            if (textNode.nodeValue && /!!(.+?)!!/.test(textNode.nodeValue)) {
                this.processTextNode(textNode);
            }
        }
    }

    private processTextNode(textNode: Node) {
        const text = textNode.nodeValue || '';
        const regex = /!!(.+?)!!/g;
        let lastIndex = 0;
        let match;

        const fragment = document.createDocumentFragment();

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
            }

            const verseRef = match[1];
            const verseElement = document.createElement('span');
            verseElement.className = isBibleVerse(verseRef)
                ? 'verse-reference'
                : 'verse-reference wol-reference';
            verseElement.setAttribute('data-verse-ref', verseRef);
            verseElement.textContent = verseRef;

            fragment.appendChild(verseElement);

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        textNode.parentNode?.replaceChild(fragment, textNode);
    }

    private async setupVerseClickHandler(container: HTMLElement) {
        const verseElements = container.querySelectorAll('.verse-reference');

        for (let i = 0; i < verseElements.length; i++) {
            const element = verseElements[i] as HTMLElement;
            const verseRef = element.getAttribute('data-verse-ref');

            if (verseRef) {
                element.addEventListener('click', async () => {
                    await this.displayVerse(verseRef, element);
                });
            }
        }
    }

    private async displayVerse(verseRef: string, clickedElement: HTMLElement) {
        const displayOption = this.plugin.settings.verseDisplayOption;

        switch (displayOption) {
            case 'modal':
                new VerseModal(this.plugin.app, verseRef).open();
                break;
            case 'popover':
                VersePopover.getInstance(this.plugin.app).show(clickedElement, verseRef);
                break;
            default:
                console.warn(`Unknown verse display option: ${displayOption}. Defaulting to modal.`);
                new VerseModal(this.plugin.app, verseRef).open();
                break;
        }
    }
}

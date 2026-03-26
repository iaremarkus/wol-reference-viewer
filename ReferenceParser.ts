import WolPlugin from './main';
import { appendHTML } from './types';
import { ReferenceModal } from './ReferenceModal';
import { ReferencePopover } from './ReferencePopover';
import { isBibleVerse } from './bibleBooks';
import { fetchReference } from './referenceService';

export class ReferenceParser {
    private plugin: WolPlugin;

    constructor(plugin: WolPlugin) {
        this.plugin = plugin;
    }

    setupReferenceLinks(container: HTMLElement) {
        this.transformReferenceMarkers(container);
        this.setupReferenceClickHandler(container);
    }

    private transformReferenceMarkers(container: HTMLElement) {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.nodeValue && /!!(.+?)!!(>?)/.test(node.nodeValue)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );

        const textNodes: Node[] = [];
        let node;
        while ((node = walker.nextNode()) !== null) {
            textNodes.push(node);
        }

        for (const textNode of textNodes) {
            if (textNode.nodeValue && /!!(.+?)!!(>?)/.test(textNode.nodeValue)) {
                this.processTextNode(textNode);
            }
        }
    }

    private processTextNode(textNode: Node) {
        const text = textNode.nodeValue || '';
        const regex = /!!(.+?)!!(>?)/g;
        let lastIndex = 0;
        let match;

        const fragment = document.createDocumentFragment();
        let calloutEl: HTMLElement | null = null;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
            }

            const ref = match[1];
            const isCallout = match[2] === '>';

            if (isCallout) {
                const callout = document.createElement('div');
                callout.className = 'callout ref-callout';
                callout.setAttribute('data-callout', 'wol-reference');

                const titleEl = callout.createDiv({ cls: 'callout-title' });
                titleEl.createDiv({ cls: 'callout-title-inner', text: ref });

                const contentEl = callout.createDiv({ cls: 'callout-content' });
                contentEl.createEl('p', { cls: 'ref-callout-loading', text: 'Loading\u2026' });

                fragment.appendChild(callout);
                calloutEl = callout;

                void fetchReference(ref).then(data => {
                    contentEl.empty();
                    if (!data || data.results.length === 0) {
                        contentEl.createEl('p', { text: 'No results found.' });
                        return;
                    }
                    for (const html of data.results) {
                        const item = contentEl.createDiv({ cls: 'ref-callout-result' });
                        appendHTML(item, html);
                    }
                });
            } else {
                const refElement = document.createElement('span');
                refElement.className = isBibleVerse(ref)
                    ? 'wol-ref-link'
                    : 'wol-ref-link wol-ref-external';
                refElement.setAttribute('data-ref', ref);
                refElement.textContent = ref;

                fragment.appendChild(refElement);
            }

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        const parent = textNode.parentNode;
        parent?.replaceChild(fragment, textNode);

        // Lift callout out of <p> to avoid invalid div-in-p nesting
        if (calloutEl && parent instanceof HTMLElement && parent.tagName === 'P') {
            const nonEmptyChildren = Array.from(parent.childNodes).filter(n =>
                !(n.nodeType === Node.TEXT_NODE && n.textContent?.trim() === '')
            );
            if (nonEmptyChildren.length === 1 && nonEmptyChildren[0] === calloutEl) {
                parent.after(calloutEl);  // inserts calloutEl after <p> (detaches from <p>)
                parent.remove();          // remove the now-empty <p>
            }
        }
    }

    private setupReferenceClickHandler(container: HTMLElement) {
        const refElements = container.querySelectorAll('.wol-ref-link');

        for (let i = 0; i < refElements.length; i++) {
            const element = refElements[i] as HTMLElement;
            const ref = element.getAttribute('data-ref');

            if (ref) {
                element.addEventListener('click', () => {
                    void this.displayReference(ref, element);
                });
            }
        }
    }

    private async displayReference(ref: string, clickedElement: HTMLElement) {
        const displayOption = this.plugin.settings.referenceDisplayOption;

        switch (displayOption) {
            case 'modal':
                new ReferenceModal(this.plugin.app, ref).open();
                break;
            case 'popover':
                await ReferencePopover.getInstance(this.plugin.app).show(clickedElement, ref);
                break;
        }
    }
}

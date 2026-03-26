export interface ReferenceData {
    type: 'reference';
    ref: string;           // the original query string
    results: string[];     // HTML strings from each result
}

/** Safely append an HTML string to an element without using innerHTML. */
export function appendHTML(el: HTMLElement, html: string): void {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    el.append(...Array.from(doc.body.childNodes));
}

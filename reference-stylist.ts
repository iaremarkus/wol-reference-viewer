// reference-stylist.ts

/**
 * Parses verse numbers from a user-provided reference string.
 * Examples: "John 3:16" -> [16], "Romans 13:8-10" -> [8, 9, 10], "Ps 119:24,25" -> [24, 25]
 */
function parseReferenceNumbers(ref: string): number[] {
    const refNumbers: number[] = [];

    const refPartMatch = ref.match(/:(.+)$/);
    const refPart = refPartMatch ? refPartMatch[1] : ref;

    for (const segment of refPart.split(',')) {
        const parts = segment.trim().match(/^(\d+)(?:-(\d+))?$/);
        if (parts) {
            const start = parseInt(parts[1], 10);
            refNumbers.push(start);
            if (parts[2]) {
                const end = parseInt(parts[2], 10);
                for (let i = start + 1; i <= end; i++) {
                    refNumbers.push(i);
                }
            }
        }
    }

    return refNumbers;
}

/**
 * Renders reference text into a container element, wrapping inline verse numbers
 * (e.g. the leading "16" in "16 For God loved the world…") with styled spans.
 *
 * IMPORTANT: pass the original user-provided reference (e.g. "Romans 13:8-10"),
 * NOT the `reference` field from the API response (which is the WOL page title).
 */
export function renderReferenceText(container: HTMLElement, text: string, ref: string): void {
    const numbers = parseReferenceNumbers(ref);

    if (numbers.length === 0) {
        container.appendText(text);
        return;
    }

    // Sort descending so "10" is matched before "1"
    numbers.sort((a, b) => b - a);

    // Use digit lookahead/lookbehind instead of \b for reliable boundary matching
    const pattern = numbers.map(n => `(?<!\\d)${n}(?!\\d)`).join('|');
    const regex = new RegExp(pattern, 'g');

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            container.appendText(text.slice(lastIndex, match.index));
        }
        container.createSpan({ cls: 'ref-number', text: match[0] });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        container.appendText(text.slice(lastIndex));
    }
}

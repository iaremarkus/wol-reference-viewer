import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { editorLivePreviewField } from 'obsidian';
import { ReferenceModal } from './ReferenceModal';
import { ReferencePopover } from './ReferencePopover';
import type WolPlugin from './main';
import { appendHTML } from './types';
import { isBibleVerse } from './bibleBooks';
import { fetchReference } from './referenceService';

const REF_RE = /!!(.+?)!!(>?)/g;
const hideMark  = Decoration.replace({});
const refMark   = Decoration.mark({ class: 'cm-wol-ref' });
const wolMark   = Decoration.mark({ class: 'cm-wol-ref cm-wol-ref-external' });

// Widget that replaces !!ref!!> with fetched content inline in the editor
class ReferenceInlineWidget extends WidgetType {
    constructor(readonly ref: string) { super(); }

    eq(other: ReferenceInlineWidget): boolean { return this.ref === other.ref; }

    toDOM(): HTMLElement {
        const wrap = document.createElement('div');
        wrap.className = 'cm-ref-inline-result';

        const label = document.createElement('div');
        label.className = 'cm-ref-inline-label';
        label.textContent = this.ref;
        wrap.appendChild(label);

        const body = document.createElement('div');
        body.className = 'cm-ref-inline-body';
        body.textContent = 'Loading\u2026';
        wrap.appendChild(body);

        fetchReference(this.ref).then(data => {
            body.empty();
            if (!data || data.results.length === 0) {
                body.textContent = 'No results found.';
                return;
            }
            for (const html of data.results) {
                const item = document.createElement('div');
                item.className = 'cm-ref-inline-item';
                appendHTML(item, html);
                body.appendChild(item);
            }
        });

        return wrap;
    }

    ignoreEvent(): boolean { return true; }
}

function buildDecorations(view: EditorView): DecorationSet {
    if (!view.state.field(editorLivePreviewField, false)) {
        return Decoration.none;
    }

    const builder = new RangeSetBuilder<Decoration>();
    const cursor = view.state.selection.main;

    for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        const re = new RegExp(REF_RE.source, 'g');
        let match: RegExpExecArray | null;

        while ((match = re.exec(text)) !== null) {
            const isCallout  = match[2] === '>';
            const matchStart = from + match.index;
            const matchEnd   = matchStart + match[0].length;

            // Reveal raw text when cursor is anywhere inside the marker
            if (cursor.from <= matchEnd && cursor.to >= matchStart) continue;

            if (isCallout) {
                // Replace the entire !!ref!!> with a live inline widget
                builder.add(matchStart, matchEnd, Decoration.replace({
                    widget: new ReferenceInlineWidget(match[1]),
                }));
            } else {
                const innerStart = matchStart + 2;  // past opening !!
                const innerEnd   = matchEnd   - 2;  // before closing !!
                const mark = isBibleVerse(match[1]) ? refMark : wolMark;
                builder.add(matchStart, innerStart, hideMark);  // hide opening !!
                builder.add(innerStart, innerEnd,   mark);      // style ref
                builder.add(innerEnd,   matchEnd,   hideMark);  // hide closing !!
            }
        }
    }

    return builder.finish();
}

export function createReferenceEditorPlugin(plugin: WolPlugin) {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet || update.viewportChanged) {
                    this.decorations = buildDecorations(update.view);
                }
            }
        },
        {
            decorations: v => v.decorations,
            eventHandlers: {
                mousedown: (e: MouseEvent, view: EditorView) => {
                    // Only intercept in Live Preview
                    if (!view.state.field(editorLivePreviewField, false)) return;

                    const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
                    if (pos === null) return;

                    const line = view.state.doc.lineAt(pos);
                    const re = new RegExp(REF_RE.source, 'g');
                    let match: RegExpExecArray | null;

                    while ((match = re.exec(line.text)) !== null) {
                        const from = line.from + match.index;
                        const to   = from + match[0].length;

                        if (pos >= from && pos <= to) {
                            e.preventDefault();
                            const isCallout = match[2] === '>';

                            // Inline widgets handle their own events; only open modal/popover for plain refs
                            if (!isCallout) {
                                if (plugin.settings.referenceDisplayOption === 'popover') {
                                    ReferencePopover.getInstance(plugin.app).show(e.target as HTMLElement, match[1]);
                                } else {
                                    new ReferenceModal(plugin.app, match[1]).open();
                                }
                            }
                            return;
                        }
                    }
                },
            },
        }
    );
}

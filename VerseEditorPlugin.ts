import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { editorLivePreviewField } from 'obsidian';
import { VerseModal } from './VerseModal';
import { VersePopover } from './VersePopover';
import type VersePlugin from './main';
import { isBibleVerse } from './bibleBooks';

const VERSE_RE = /!!(.+?)!!/g;
const hideMark    = Decoration.replace({});
const verseMark   = Decoration.mark({ class: 'cm-verse-reference' });
const wolMark     = Decoration.mark({ class: 'cm-verse-reference cm-verse-reference-wol' });

function buildDecorations(view: EditorView): DecorationSet {
    if (!view.state.field(editorLivePreviewField, false)) {
        return Decoration.none;
    }

    const builder = new RangeSetBuilder<Decoration>();
    const cursor = view.state.selection.main;

    for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        const re = new RegExp(VERSE_RE.source, 'g');
        let match: RegExpExecArray | null;

        while ((match = re.exec(text)) !== null) {
            const matchStart = from + match.index;
            const matchEnd   = matchStart + match[0].length;
            const innerStart = matchStart + 2;   // past opening !!
            const innerEnd   = matchEnd   - 2;   // before closing !!

            // Reveal raw text when cursor is anywhere inside the marker
            if (cursor.from <= matchEnd && cursor.to >= matchStart) continue;

            const mark = isBibleVerse(match[1]) ? verseMark : wolMark;
            builder.add(matchStart, innerStart, hideMark);  // hide !!
            builder.add(innerStart, innerEnd,   mark);      // style ref
            builder.add(innerEnd,   matchEnd,   hideMark);  // hide !!
        }
    }

    return builder.finish();
}

export function createVerseEditorPlugin(plugin: VersePlugin) {
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
                    const re = new RegExp(VERSE_RE.source, 'g');
                    let match: RegExpExecArray | null;

                    while ((match = re.exec(line.text)) !== null) {
                        const from = line.from + match.index;
                        const to   = from + match[0].length;

                        if (pos >= from && pos <= to) {
                            // Stop cursor from moving into the marker
                            e.preventDefault();
                            const ref = match[1];

                            if (plugin.settings.verseDisplayOption === 'popover') {
                                VersePopover.getInstance(plugin.app).show(e.target as HTMLElement, ref);
                            } else {
                                new VerseModal(plugin.app, ref).open();
                            }
                            return;
                        }
                    }
                },
            },
        }
    );
}

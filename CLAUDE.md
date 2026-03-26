# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WOL Reference Tools** is an Obsidian plugin that looks up Bible verses and WOL research articles inline in your notes. Users mark content with `!!reference!!` syntax (e.g., `!!John 3:16!!`) and the plugin transforms these markers into clickable links that display results in a modal, popover, or sidebar panel. Results are fetched from a Cloudflare Worker that proxies wol.jw.org.

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Build with watch mode (development)
npm run build        # Type-check and build production bundle
npm run version      # Bump version across manifest.json and package.json
```

## Architecture

### Core Files

- **main.ts** - Plugin entry point. Exports `WolPlugin` class, `WolPluginSettings`, and `ReferenceDisplayOption`. Registers markdown post-processor, sidebar view, editor extension, and settings tab.
- **ReferenceParser.ts** - Core parsing logic. Uses DOM TreeWalker to find `!!...!!` patterns in text nodes, transforms them to styled spans (`.wol-ref-link`), and handles click events.
- **referenceService.ts** - Fetches from the Cloudflare Worker (`wol-worker.iaremark.us`) with in-memory caching (30 min TTL). Exports `fetchReference` and `clearReferenceCache`.
- **ReferenceModal.ts** - Modal display for reference results.
- **ReferencePopover.ts** - Singleton popover display for reference results.
- **ReferenceSidebarView.ts** - Right-panel sidebar that lists all `!!ref!!` markers in the active note and fetches them sequentially.
- **ReferenceEditorPlugin.ts** - CodeMirror Live Preview extension. Hides `!!` markers and styles the ref text; renders `!!ref!!>` as an inline widget.
- **reference-stylist.ts** - Utility for rendering verse text with styled verse-number spans (unused in production, available for future use).
- **bibleBooks.ts** - Bible book name/abbreviation registry. `isBibleVerse()` determines whether a ref maps to `.wol-ref-link` vs `.wol-ref-link .wol-ref-external` styling.

### Data Flow

1. Obsidian renders markdown
2. Post-processor (and Live Preview editor plugin) scans for `!!reference!!` patterns
3. Text nodes are replaced with `<span class="wol-ref-link" data-ref="...">` elements
4. On click: fetches from `https://wol-worker.iaremark.us/{ref}`
5. API response `{ results: string[] }` (HTML strings) displays in modal, popover, or sidebar
6. Inline callout syntax `!!ref!!>` renders result inline in the editor

### State Management

- `data-ref` attribute on span elements stores the reference string
- In-memory `referenceCache` Map in `referenceService.ts` (30 min TTL)

## Build System

- **esbuild** bundles TypeScript to CommonJS
- Obsidian library is external (not bundled)
- Output: `main.js` (minified in production)
- TypeScript target: ES2020 source, ES2018 runtime

## Testing

No test framework is currently configured. Plugin must be tested manually in Obsidian.

## Linting

ESLint packages are installed but not configured (no `.eslintrc`). TypeScript checking runs during `npm run build` via `tsc -noEmit`.

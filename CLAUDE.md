# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**verse-api** is an Obsidian plugin that fetches and displays Bible verses from the IAM Research Suite API. Users mark content with `!!reference!!` syntax (e.g., `!!John 3:16!!`) in their notes, and the plugin transforms these markers into clickable references that display verse text in hover popups.

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Build with watch mode (development)
npm run build        # Type-check and build production bundle
npm run version      # Bump version across manifest.json and package.json
```

## Architecture

### Core Files

- **main.ts** - Plugin entry point. Extends Obsidian's `Plugin` class, registers markdown post-processor, and injects styles on layout ready.
- **VerseParser.ts** - Core parsing logic. Uses DOM TreeWalker to find `!!...!!` patterns in text nodes, transforms them to styled spans, and attaches hover listeners for API fetching.

### Data Flow

1. Obsidian renders markdown
2. Post-processor scans for `!!reference!!` patterns via regex `/!!(.+?)!!/g`
3. Text nodes are replaced with `<span class="verse-reference">` elements
4. On hover: fetches from `https://iam-research-suite.vercel.app/api/verse/{reference}`
5. API response `{ text, reference }` displays in Obsidian's HoverPopover

### State Management

- `data-verse-ref` attribute stores the verse reference
- `data-fetching` attribute prevents duplicate API calls during hover

## Build System

- **esbuild** bundles TypeScript to CommonJS
- Obsidian library is external (not bundled)
- Output: `main.js` (minified in production)
- TypeScript target: ES2020 source, ES2018 runtime

## Testing

No test framework is currently configured. Plugin must be tested manually in Obsidian.

## Linting

ESLint packages are installed but not configured (no `.eslintrc`). TypeScript checking runs during `npm run build` via `tsc -noEmit`.

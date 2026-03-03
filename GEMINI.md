# Obsidian Verse Plugin

## Project Overview
This is an Obsidian plugin named "obsidian-verse-plugin" that allows users to embed Bible verse references in their notes. When a user marks a verse reference (e.g., `!!John 3:16!!`), the plugin transforms it into a clickable element. On hover, it fetches the actual verse text from the `IAM Research Suite API` (`https://iam-research-suite.vercel.app/api/verse/`) and displays it in a dynamically created popover. The plugin is built with TypeScript, uses `esbuild` for bundling, and targets Obsidian's Electron environment.

## Building and Running

*   **Install Dependencies:** `npm install`
*   **Development Build (with watch mode):** `npm run dev`
*   **Production Build:** `npm run build`
*   **Version Bump:** `npm run version` (updates `manifest.json` and `versions.json` and stages the changes)

## Development Conventions

*   The plugin is written in TypeScript.
*   `esbuild` is used for bundling the TypeScript code into JavaScript.
*   Bible verse references in Markdown notes should be enclosed in double exclamation marks, e.g., `!!John 3:16!!`.
*   Dynamic CSS styling is applied to `verse-reference` elements (underlined, clickable) and the verse popovers.
*   The plugin interacts with `https://iam-research-suite.vercel.app/api/verse/` to fetch verse data.

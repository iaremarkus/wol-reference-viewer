# WOL Reference Tools

An [Obsidian](https://obsidian.md) plugin that lets you look up Bible verses and WOL research articles directly inside your notes.

Wrap any reference in `!!double exclamation marks!!` and it becomes a clickable link. Click it to see the full text from [wol.jw.org](https://wol.jw.org) in a modal or popover. A sidebar panel automatically lists and loads all references in the active note.

---

## Features

- **Inline reference links** — `!!John 3:16!!` renders as a styled, clickable link in both Reading and Live Preview modes
- **Modal & popover display** — choose how results appear (configurable in settings)
- **Sidebar panel** — all references in the current note are fetched and displayed in the right panel
- **Inline callout** — `!!John 3:16!!>` renders the full result as an inline block directly in the editor
- **In-memory caching** — results are cached for 30 minutes per session to avoid redundant requests

---

## Usage

| Syntax | Result |
|---|---|
| `!!John 3:16!!` | Clickable inline link; click to open result |
| `!!Isaiah 40:8!!` | Works for any Bible book or WOL search term |
| `!!John 3:16!!>` | Renders result inline as a callout block |
| `!!John 3:16; Romans 8:28!!` | Semicolons separate multiple refs in one marker |

---

## Installation

### Via BRAT (recommended for pre-release)

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. In BRAT settings, add this repository URL
3. Enable **WOL Reference Tools** in Obsidian Settings → Community plugins

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Copy them to `<vault>/.obsidian/plugins/wol-reference-viewer/`
3. Enable **WOL Reference Tools** in Obsidian Settings → Community plugins

---

## Settings

| Setting | Description |
|---|---|
| Reference Display Option | Choose **Modal Dialog** or **Pop-over** for click behaviour |
| Reference cache | Clear the in-memory cache to force fresh fetches |

---

## Author

[@iaremarkus](https://github.com/iaremarkusdev)

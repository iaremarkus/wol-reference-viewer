var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => VersePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// verseService.ts
var cache = /* @__PURE__ */ new Map();
function clearVerseCache() {
  cache.clear();
}
async function fetchVerse(verseRef) {
  const key = verseRef.trim().toLowerCase();
  if (cache.has(key))
    return cache.get(key);
  try {
    const response = await fetch(
      `https://verse-api-worker.mark-11f.workers.dev/${encodeURIComponent(verseRef)}`
    );
    if (!response.ok)
      return null;
    const data = await response.json();
    cache.set(key, data);
    return data;
  } catch (error) {
    console.error(`Error fetching verse "${verseRef}":`, error);
    return null;
  }
}

// VerseModal.ts
var import_obsidian = require("obsidian");

// verse-stylist.ts
function parseVerseNumbers(verseReference) {
  const verseNumbers = [];
  const versePartMatch = verseReference.match(/:(.+)$/);
  const versePart = versePartMatch ? versePartMatch[1] : verseReference;
  for (const segment of versePart.split(",")) {
    const parts = segment.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (parts) {
      const start = parseInt(parts[1], 10);
      verseNumbers.push(start);
      if (parts[2]) {
        const end = parseInt(parts[2], 10);
        for (let i = start + 1; i <= end; i++) {
          verseNumbers.push(i);
        }
      }
    }
  }
  return verseNumbers;
}
function renderVerseText(container, text, verseRef) {
  const numbers = parseVerseNumbers(verseRef);
  if (numbers.length === 0) {
    container.appendText(text);
    return;
  }
  numbers.sort((a, b) => b - a);
  const pattern = numbers.map((n) => `(?<!\\d)${n}(?!\\d)`).join("|");
  const regex = new RegExp(pattern, "g");
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      container.appendText(text.slice(lastIndex, match.index));
    }
    container.createSpan({ cls: "verse-number", text: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    container.appendText(text.slice(lastIndex));
  }
}

// VerseModal.ts
var VerseModal = class extends import_obsidian.Modal {
  constructor(app, verseRef) {
    super(app);
    this.verseRef = verseRef;
    this.verseData = null;
    this.loading = true;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("verse-modal");
    this.titleEl.setText(this.verseRef);
    this.displayMessage();
    this.fetchAndDisplay();
  }
  onClose() {
    this.contentEl.empty();
  }
  displayMessage() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.loading) {
      contentEl.createEl("p", { text: "Loading verse\u2026" });
    } else if (this.verseData) {
      const p = contentEl.createEl("p");
      renderVerseText(p, this.verseData.text, this.verseRef);
      const buttonContainer = contentEl.createDiv({ cls: "verse-modal-button-container" });
      new import_obsidian.ButtonComponent(buttonContainer).setButtonText("View on WOL").setCta().onClick(() => {
        if (this.verseData) {
          window.open(
            `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(this.verseData.reference)}`,
            "_blank"
          );
        }
      });
    } else {
      contentEl.createEl("p", { text: "Error loading verse." });
    }
  }
  async fetchAndDisplay() {
    this.verseData = await fetchVerse(this.verseRef);
    this.loading = false;
    this.displayMessage();
  }
};

// VersePopover.ts
var _VersePopover = class {
  constructor(app) {
    this.popoverEl = null;
    this.handleOutsideClick = (event) => {
      if (this.popoverEl && !this.popoverEl.contains(event.target)) {
        this.hide();
      }
    };
    this.app = app;
  }
  static getInstance(app) {
    if (!_VersePopover.instance) {
      _VersePopover.instance = new _VersePopover(app);
    }
    return _VersePopover.instance;
  }
  async show(targetEl, verseRef) {
    this.hide();
    this.popoverEl = document.createElement("div");
    this.popoverEl.addClass("verse-popover");
    this.popoverEl.style.position = "absolute";
    this.popoverEl.style.zIndex = "9999";
    this.popoverEl.style.maxWidth = "300px";
    this.popoverEl.style.padding = "10px";
    this.popoverEl.style.borderRadius = "var(--radius-m)";
    this.popoverEl.style.backgroundColor = "var(--background-secondary)";
    this.popoverEl.style.border = "1px solid var(--background-modifier-border)";
    this.popoverEl.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
    this.popoverEl.style.color = "var(--text-normal)";
    this.popoverEl.style.fontSize = "var(--font-ui-small)";
    this.popoverEl.style.lineHeight = "1.5";
    this.popoverEl.createEl("p", { text: "Loading verse\u2026", cls: "verse-popover-loading" });
    document.body.appendChild(this.popoverEl);
    this.positionPopover(targetEl);
    const data = await fetchVerse(verseRef);
    this.updateContent(data, verseRef);
    document.addEventListener("click", this.handleOutsideClick);
    this.popoverEl.addEventListener("click", (e) => e.stopPropagation());
  }
  updateContent(verseData, verseRef) {
    if (!this.popoverEl)
      return;
    this.popoverEl.empty();
    if (verseData) {
      const p = this.popoverEl.createEl("p");
      renderVerseText(p, verseData.text, verseRef);
      const wolLink = this.popoverEl.createEl("a", {
        text: "View on WOL",
        href: `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(verseData.reference)}`,
        cls: "verse-popover-wol-link"
      });
      wolLink.setAttr("target", "_blank");
    } else {
      this.popoverEl.createEl("p", { text: "Verse not found." });
    }
  }
  positionPopover(targetEl) {
    if (!this.popoverEl)
      return;
    const targetRect = targetEl.getBoundingClientRect();
    const popoverRect = this.popoverEl.getBoundingClientRect();
    let top = targetRect.bottom + window.scrollY + 5;
    let left = targetRect.left + window.scrollX;
    if (left + popoverRect.width > window.innerWidth) {
      left = window.innerWidth - popoverRect.width - 20;
    }
    if (top + popoverRect.height > window.innerHeight && targetRect.top > popoverRect.height) {
      top = targetRect.top + window.scrollY - popoverRect.height - 5;
    }
    this.popoverEl.style.top = `${top}px`;
    this.popoverEl.style.left = `${left}px`;
  }
  hide() {
    if (this.popoverEl) {
      this.popoverEl.remove();
      this.popoverEl = null;
      document.removeEventListener("click", this.handleOutsideClick);
    }
  }
};
var VersePopover = _VersePopover;
VersePopover.instance = null;

// VerseParser.ts
var VerseParser = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  setupVerseLinks(container) {
    this.transformVerseMarkers(container);
    this.setupVerseClickHandler(container);
  }
  transformVerseMarkers(container) {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node2) {
          if (node2.nodeValue && /!!(.+?)!!/.test(node2.nodeValue)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );
    const textNodes = [];
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
  processTextNode(textNode) {
    var _a;
    const text = textNode.nodeValue || "";
    const regex = /!!(.+?)!!/g;
    let lastIndex = 0;
    let match;
    const fragment = document.createDocumentFragment();
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
      }
      const verseRef = match[1];
      const verseElement = document.createElement("span");
      verseElement.className = "verse-reference";
      verseElement.setAttribute("data-verse-ref", verseRef);
      verseElement.textContent = verseRef;
      fragment.appendChild(verseElement);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }
    (_a = textNode.parentNode) == null ? void 0 : _a.replaceChild(fragment, textNode);
  }
  async setupVerseClickHandler(container) {
    const verseElements = container.querySelectorAll(".verse-reference");
    for (let i = 0; i < verseElements.length; i++) {
      const element = verseElements[i];
      const verseRef = element.getAttribute("data-verse-ref");
      if (verseRef) {
        element.addEventListener("click", async () => {
          await this.displayVerse(verseRef, element);
        });
      }
    }
  }
  async displayVerse(verseRef, clickedElement) {
    const displayOption = this.plugin.settings.verseDisplayOption;
    switch (displayOption) {
      case "modal":
        new VerseModal(this.plugin.app, verseRef).open();
        break;
      case "popover":
        VersePopover.getInstance(this.plugin.app).show(clickedElement, verseRef);
        break;
      default:
        console.warn(`Unknown verse display option: ${displayOption}. Defaulting to modal.`);
        new VerseModal(this.plugin.app, verseRef).open();
        break;
    }
  }
};

// VerseSidebarView.ts
var import_obsidian2 = require("obsidian");
var VIEW_TYPE_VERSE_SIDEBAR = "verse-sidebar-view";
var VERSE_REGEX = /!!(.+?)!!/g;
var VerseSidebarView = class extends import_obsidian2.ItemView {
  constructor(leaf) {
    super(leaf);
  }
  getViewType() {
    return VIEW_TYPE_VERSE_SIDEBAR;
  }
  getDisplayText() {
    return "Verses";
  }
  getIcon() {
    return "book-open";
  }
  async onOpen() {
    this.renderEmpty("Open a note with !!verse!! references to see them here.");
  }
  onClose() {
    return Promise.resolve();
  }
  async update(file) {
    if (!file) {
      this.renderEmpty("No file open.");
      return;
    }
    const content = await this.app.vault.read(file);
    const refs = this.extractRefs(content);
    if (refs.length === 0) {
      this.renderEmpty("No verse references in this note.");
      return;
    }
    this.renderPlaceholders(refs);
    for (const ref of refs) {
      fetchVerse(ref).then((data) => this.fillPlaceholder(ref, data));
    }
  }
  extractRefs(content) {
    const seen = /* @__PURE__ */ new Set();
    const refs = [];
    let match;
    const regex = new RegExp(VERSE_REGEX.source, "g");
    while ((match = regex.exec(content)) !== null) {
      const ref = match[1].trim();
      if (!seen.has(ref)) {
        seen.add(ref);
        refs.push(ref);
      }
    }
    return refs;
  }
  renderEmpty(message) {
    this.contentEl.empty();
    this.contentEl.addClass("verse-sidebar");
    this.contentEl.createEl("p", { text: message, cls: "verse-sidebar-empty" });
  }
  renderPlaceholders(refs) {
    this.contentEl.empty();
    this.contentEl.addClass("verse-sidebar");
    for (const ref of refs) {
      const item = this.contentEl.createDiv({ cls: "verse-sidebar-item" });
      item.dataset.verseRef = ref;
      const header = item.createDiv({ cls: "verse-sidebar-header" });
      header.createDiv({ text: ref, cls: "verse-sidebar-ref" });
      const wolLink = header.createEl("a", {
        href: `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(ref)}`,
        cls: "verse-sidebar-wol-icon"
      });
      wolLink.setAttr("target", "_blank");
      wolLink.setAttr("aria-label", "View on WOL");
      (0, import_obsidian2.setIcon)(wolLink, "external-link");
      const body = item.createDiv({ cls: "verse-sidebar-body" });
      body.createEl("p", { text: "Loading\u2026", cls: "verse-sidebar-loading" });
    }
  }
  fillPlaceholder(ref, data) {
    const item = this.contentEl.querySelector(
      `.verse-sidebar-item[data-verse-ref="${CSS.escape(ref)}"]`
    );
    if (!item)
      return;
    const body = item.querySelector(".verse-sidebar-body");
    if (!body)
      return;
    body.empty();
    if (data) {
      const p = body.createEl("p");
      renderVerseText(p, data.text, ref);
    } else {
      body.createEl("p", { text: "Could not load verse.", cls: "verse-sidebar-error" });
    }
  }
};

// VerseEditorPlugin.ts
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var import_obsidian3 = require("obsidian");
var VERSE_RE = /!!(.+?)!!/g;
var hideMark = import_view.Decoration.replace({});
var verseMark = import_view.Decoration.mark({ class: "cm-verse-reference" });
function buildDecorations(view) {
  if (!view.state.field(import_obsidian3.editorLivePreviewField, false)) {
    return import_view.Decoration.none;
  }
  const builder = new import_state.RangeSetBuilder();
  const cursor = view.state.selection.main;
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    const re = new RegExp(VERSE_RE.source, "g");
    let match;
    while ((match = re.exec(text)) !== null) {
      const matchStart = from + match.index;
      const matchEnd = matchStart + match[0].length;
      const innerStart = matchStart + 2;
      const innerEnd = matchEnd - 2;
      if (cursor.from <= matchEnd && cursor.to >= matchStart)
        continue;
      builder.add(matchStart, innerStart, hideMark);
      builder.add(innerStart, innerEnd, verseMark);
      builder.add(innerEnd, matchEnd, hideMark);
    }
  }
  return builder.finish();
}
function createVerseEditorPlugin(plugin) {
  return import_view.ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = buildDecorations(view);
      }
      update(update) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        mousedown: (e, view) => {
          if (!view.state.field(import_obsidian3.editorLivePreviewField, false))
            return;
          const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
          if (pos === null)
            return;
          const line = view.state.doc.lineAt(pos);
          const re = new RegExp(VERSE_RE.source, "g");
          let match;
          while ((match = re.exec(line.text)) !== null) {
            const from = line.from + match.index;
            const to = from + match[0].length;
            if (pos >= from && pos <= to) {
              e.preventDefault();
              const ref = match[1];
              if (plugin.settings.verseDisplayOption === "popover") {
                VersePopover.getInstance(plugin.app).show(e.target, ref);
              } else {
                new VerseModal(plugin.app, ref).open();
              }
              return;
            }
          }
        }
      }
    }
  );
}

// main.ts
var DEFAULT_SETTINGS = {
  verseDisplayOption: "modal"
};
var VersePlugin = class extends import_obsidian4.Plugin {
  async onload() {
    console.log("Loading Verse Plugin");
    await this.loadSettings();
    this.verseParser = new VerseParser(this);
    this.registerView(VIEW_TYPE_VERSE_SIDEBAR, (leaf) => new VerseSidebarView(leaf));
    this.registerMarkdownPostProcessor(async (el, _ctx) => {
      this.verseParser.setupVerseLinks(el);
    });
    this.registerEditorExtension(createVerseEditorPlugin(this));
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        this.updateSidebar(file);
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-change", (0, import_obsidian4.debounce)(() => {
        this.updateSidebar(this.app.workspace.getActiveFile());
      }, 500))
    );
    this.app.workspace.onLayoutReady(async () => {
      await this.activateSidebar();
      this.updateSidebar(this.app.workspace.getActiveFile());
    });
    this.addSettingTab(new VerseSettingTab(this.app, this));
    this.addCommand({
      id: "clear-verse-cache",
      name: "Clear verse cache",
      callback: () => {
        clearVerseCache();
        new import_obsidian4.Notice("Verse cache cleared.");
      }
    });
  }
  onunload() {
    console.log("Unloading Verse Plugin");
  }
  async activateSidebar() {
    const { workspace } = this.app;
    if (workspace.getLeavesOfType(VIEW_TYPE_VERSE_SIDEBAR).length > 0)
      return;
    const leaf = workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE_VERSE_SIDEBAR, active: true });
    }
  }
  updateSidebar(file) {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_VERSE_SIDEBAR);
    if (leaves.length === 0)
      return;
    const view = leaves[0].view;
    view.update(file);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var VerseSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Verse Plugin Settings" });
    new import_obsidian4.Setting(containerEl).setName("Verse Display Option").setDesc("Choose how verse references are displayed when clicked.").addDropdown((dropdown) => dropdown.addOption("modal", "Modal Dialog").addOption("popover", "Pop-over").setValue(this.plugin.settings.verseDisplayOption).onChange(async (value) => {
      this.plugin.settings.verseDisplayOption = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian4.Setting(containerEl).setName("Verse cache").setDesc("Fetched verses are cached in memory for the current session. Clear the cache to force fresh fetches.").addButton((button) => button.setButtonText("Clear cache").onClick(() => {
      clearVerseCache();
      new import_obsidian4.Notice("Verse cache cleared.");
    }));
  }
};

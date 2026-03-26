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
  default: () => WolPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// referenceService.ts
var import_obsidian = require("obsidian");
var WORKER_BASE = "https://wol-worker.iaremark.us";
var CACHE_TTL_MS = 30 * 60 * 1e3;
var referenceCache = /* @__PURE__ */ new Map();
function slugify(ref) {
  return ref.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/, "");
}
function isFresh(entry) {
  return Date.now() - entry.ts < CACHE_TTL_MS;
}
function clearReferenceCache() {
  referenceCache.clear();
}
function isCached(ref) {
  const key = slugify(ref);
  const entry = referenceCache.get(key);
  return !!entry && isFresh(entry);
}
async function fetchReference(ref, signal) {
  var _a;
  const key = slugify(ref);
  const cached = referenceCache.get(key);
  if (cached && isFresh(cached))
    return cached.data;
  if (signal == null ? void 0 : signal.aborted)
    return null;
  try {
    const response = await (0, import_obsidian.requestUrl)(`${WORKER_BASE}/${encodeURIComponent(ref)}`);
    if (signal == null ? void 0 : signal.aborted)
      return null;
    if (response.status !== 200)
      return null;
    const raw = response.json;
    const data = {
      type: "reference",
      ref,
      results: (_a = raw.results) != null ? _a : []
    };
    referenceCache.set(key, { data, ts: Date.now() });
    return data;
  } catch (e) {
    if (signal == null ? void 0 : signal.aborted)
      return null;
    console.error(`Error fetching reference "${ref}":`, e);
    return null;
  }
}

// types.ts
function appendHTML(el, html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  el.append(...Array.from(doc.body.childNodes));
}

// ReferenceModal.ts
var import_obsidian2 = require("obsidian");
var ReferenceModal = class extends import_obsidian2.Modal {
  constructor(app, verseRef) {
    super(app);
    this.verseRef = verseRef;
    this.data = null;
    this.loading = true;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("ref-modal");
    this.titleEl.setText(this.verseRef);
    this.displayMessage();
    void this.fetchAndDisplay();
  }
  onClose() {
    this.contentEl.empty();
  }
  displayMessage() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.loading) {
      contentEl.createEl("p", { text: "Loading\u2026" });
      return;
    }
    if (!this.data) {
      contentEl.createEl("p", { text: "Error loading reference." });
      return;
    }
    if (this.data.results.length === 0) {
      contentEl.createEl("p", { text: "No results found." });
    } else {
      for (const html of this.data.results) {
        appendHTML(contentEl.createDiv({ cls: "ref-modal-result" }), html);
      }
    }
    const buttonContainer = contentEl.createDiv({ cls: "ref-modal-button-container" });
    new import_obsidian2.ButtonComponent(buttonContainer).setButtonText("View on wol.jw.org").setCta().onClick(() => {
      window.open(
        `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(this.verseRef)}`,
        "_blank"
      );
    });
  }
  async fetchAndDisplay() {
    this.data = await fetchReference(this.verseRef);
    this.loading = false;
    this.displayMessage();
  }
};

// ReferencePopover.ts
var _ReferencePopover = class {
  constructor(app) {
    this.popoverEl = null;
    this.showGeneration = 0;
    this.handleOutsideClick = (event) => {
      if (this.popoverEl && !this.popoverEl.contains(event.target)) {
        this.hide();
      }
    };
    this.app = app;
  }
  static getInstance(app) {
    if (!_ReferencePopover.instance) {
      _ReferencePopover.instance = new _ReferencePopover(app);
    }
    return _ReferencePopover.instance;
  }
  async show(targetEl, verseRef) {
    this.hide();
    const generation = ++this.showGeneration;
    this.popoverEl = document.createElement("div");
    this.popoverEl.addClass("ref-popover");
    this.popoverEl.createEl("p", { text: "Loading\u2026", cls: "ref-popover-loading" });
    document.body.appendChild(this.popoverEl);
    this.positionPopover(targetEl);
    const data = await fetchReference(verseRef);
    if (generation !== this.showGeneration)
      return;
    this.updateContent(data);
    document.addEventListener("click", this.handleOutsideClick);
    this.popoverEl.addEventListener("click", (e) => e.stopPropagation());
  }
  updateContent(data) {
    if (!this.popoverEl)
      return;
    this.popoverEl.empty();
    if (!data || data.results.length === 0) {
      this.popoverEl.createEl("p", { text: "No results found." });
      return;
    }
    for (const html of data.results) {
      appendHTML(this.popoverEl.createDiv({ cls: "ref-popover-result" }), html);
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
var ReferencePopover = _ReferencePopover;
ReferencePopover.instance = null;

// bibleBooks.ts
var BIBLE_BOOKS = {
  "Genesis": ["Ge", "Gen", "Gene"],
  "Exodus": ["Ex", "Exo", "Exod"],
  "Leviticus": ["Le", "Lev", "Levi"],
  "Numbers": ["Nu", "Num", "Numb"],
  "Deuteronomy": ["De", "Deu", "Deut"],
  "Joshua": ["Jo", "Jos", "Josh"],
  "Judges": ["Jg", "Jud", "Judg"],
  "Ruth": ["Ru", "Rut"],
  "1 Samuel": ["1Sa", "1Sam", "1 Sam"],
  "2 Samuel": ["2Sa", "2Sam", "2 Sam"],
  "1 Kings": ["1Ki", "1Kin", "1 Ki"],
  "2 Kings": ["2Ki", "2Kin", "2 Ki"],
  "1 Chronicles": ["1Ch", "1Chr", "1 Chr"],
  "2 Chronicles": ["2Ch", "2Chr", "2 Chr"],
  "Ezra": ["Ezr"],
  "Nehemiah": ["Ne", "Neh"],
  "Esther": ["Es", "Est", "Esth"],
  "Job": ["Job"],
  "Psalms": ["Ps", "Psa", "Psalm"],
  "Proverbs": ["Pr", "Pro", "Prov"],
  "Ecclesiastes": ["Ec", "Ecc", "Eccl"],
  "Song of Solomon": ["So", "Song", "Ca", "SS"],
  "Isaiah": ["Is", "Isa"],
  "Jeremiah": ["Je", "Jer"],
  "Lamentations": ["La", "Lam"],
  "Ezekiel": ["Eze", "Ezek"],
  "Daniel": ["Da", "Dan"],
  "Hosea": ["Ho", "Hos"],
  "Joel": ["Joe", "Joel"],
  "Amos": ["Am", "Amo"],
  "Obadiah": ["Ob", "Oba"],
  "Jonah": ["Jon"],
  "Micah": ["Mi", "Mic"],
  "Nahum": ["Na", "Nah"],
  "Habakkuk": ["Hab"],
  "Zephaniah": ["Ze", "Zep", "Zeph"],
  "Haggai": ["Hag"],
  "Zechariah": ["Zec", "Zech"],
  "Malachi": ["Mal"],
  "Matthew": ["Mt", "Mat", "Matt"],
  "Mark": ["Mr", "Mar", "Mrk"],
  "Luke": ["Lu", "Luk"],
  "John": ["Joh", "Jn"],
  "Acts": ["Ac", "Act"],
  "Romans": ["Ro", "Rom"],
  "1 Corinthians": ["1Co", "1Cor", "1 Cor"],
  "2 Corinthians": ["2Co", "2Cor", "2 Cor"],
  "Galatians": ["Ga", "Gal"],
  "Ephesians": ["Ep", "Eph"],
  "Philippians": ["Php", "Phil"],
  "Colossians": ["Col"],
  "1 Thessalonians": ["1Th", "1Thes", "1Thess", "1 Thes"],
  "2 Thessalonians": ["2Th", "2Thes", "2Thess", "2 Thes"],
  "1 Timothy": ["1Ti", "1Tim", "1 Tim"],
  "2 Timothy": ["2Ti", "2Tim", "2 Tim"],
  "Titus": ["Tit"],
  "Philemon": ["Phm", "Phile"],
  "Hebrews": ["Heb"],
  "James": ["Jas"],
  "1 Peter": ["1Pe", "1Pet", "1 Pet"],
  "2 Peter": ["2Pe", "2Pet", "2 Pet"],
  "1 John": ["1Jo", "1Jn", "1 Jn"],
  "2 John": ["2Jo", "2Jn", "2 Jn"],
  "3 John": ["3Jo", "3Jn", "3 Jn"],
  "Jude": ["Jude"],
  "Revelation": ["Re", "Rev"]
};
var ALL_TOKENS = [];
for (const [name, abbrevs] of Object.entries(BIBLE_BOOKS)) {
  ALL_TOKENS.push(name.toLowerCase());
  for (const a of abbrevs)
    ALL_TOKENS.push(a.toLowerCase());
}
function isBibleVerse(ref) {
  const normalized = ref.trim().toLowerCase();
  for (const token of ALL_TOKENS) {
    if (!normalized.startsWith(token))
      continue;
    const next = normalized[token.length];
    if (next === void 0 || next === " " || next >= "0" && next <= "9") {
      return true;
    }
  }
  return false;
}

// ReferenceParser.ts
var ReferenceParser = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  setupReferenceLinks(container) {
    this.transformReferenceMarkers(container);
    this.setupReferenceClickHandler(container);
  }
  transformReferenceMarkers(container) {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node2) {
          if (node2.nodeValue && /!!(.+?)!!(>?)/.test(node2.nodeValue)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );
    const textNodes = [];
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
  processTextNode(textNode) {
    const text = textNode.nodeValue || "";
    const regex = /!!(.+?)!!(>?)/g;
    let lastIndex = 0;
    let match;
    const fragment = document.createDocumentFragment();
    let calloutEl = null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
      }
      const ref = match[1];
      const isCallout = match[2] === ">";
      if (isCallout) {
        const callout = document.createElement("div");
        callout.className = "callout ref-callout";
        callout.setAttribute("data-callout", "wol-reference");
        const titleEl = callout.createDiv({ cls: "callout-title" });
        titleEl.createDiv({ cls: "callout-title-inner", text: ref });
        const contentEl = callout.createDiv({ cls: "callout-content" });
        contentEl.createEl("p", { cls: "ref-callout-loading", text: "Loading\u2026" });
        fragment.appendChild(callout);
        calloutEl = callout;
        void fetchReference(ref).then((data) => {
          contentEl.empty();
          if (!data || data.results.length === 0) {
            contentEl.createEl("p", { text: "No results found." });
            return;
          }
          for (const html of data.results) {
            const item = contentEl.createDiv({ cls: "ref-callout-result" });
            appendHTML(item, html);
          }
        });
      } else {
        const refElement = document.createElement("span");
        refElement.className = isBibleVerse(ref) ? "wol-ref-link" : "wol-ref-link wol-ref-external";
        refElement.setAttribute("data-ref", ref);
        refElement.textContent = ref;
        fragment.appendChild(refElement);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }
    const parent = textNode.parentNode;
    parent == null ? void 0 : parent.replaceChild(fragment, textNode);
    if (calloutEl && parent instanceof HTMLElement && parent.tagName === "P") {
      const nonEmptyChildren = Array.from(parent.childNodes).filter(
        (n) => {
          var _a;
          return !(n.nodeType === Node.TEXT_NODE && ((_a = n.textContent) == null ? void 0 : _a.trim()) === "");
        }
      );
      if (nonEmptyChildren.length === 1 && nonEmptyChildren[0] === calloutEl) {
        parent.after(calloutEl);
        parent.remove();
      }
    }
  }
  setupReferenceClickHandler(container) {
    const refElements = container.querySelectorAll(".wol-ref-link");
    for (let i = 0; i < refElements.length; i++) {
      const element = refElements[i];
      const ref = element.getAttribute("data-ref");
      if (ref) {
        element.addEventListener("click", () => {
          void this.displayReference(ref, element);
        });
      }
    }
  }
  async displayReference(ref, clickedElement) {
    const displayOption = this.plugin.settings.referenceDisplayOption;
    switch (displayOption) {
      case "modal":
        new ReferenceModal(this.plugin.app, ref).open();
        break;
      case "popover":
        await ReferencePopover.getInstance(this.plugin.app).show(clickedElement, ref);
        break;
    }
  }
};

// ReferenceSidebarView.ts
var import_obsidian3 = require("obsidian");
var VIEW_TYPE_REFERENCE_SIDEBAR = "reference-sidebar-view";
var REF_REGEX = /!!(.+?)!!/g;
var ReferenceSidebarView = class extends import_obsidian3.ItemView {
  constructor(leaf) {
    super(leaf);
    this.updateGeneration = 0;
    this.abortController = null;
  }
  getViewType() {
    return VIEW_TYPE_REFERENCE_SIDEBAR;
  }
  getDisplayText() {
    return "References";
  }
  getIcon() {
    return "book-open";
  }
  async onOpen() {
    this.renderEmpty("Open a note with !!reference!! syntax to see results here.");
    const file = this.app.workspace.getActiveFile();
    if (file)
      await this.update(file);
  }
  onClose() {
    var _a;
    (_a = this.abortController) == null ? void 0 : _a.abort();
    this.updateGeneration++;
    return Promise.resolve();
  }
  async update(file) {
    var _a;
    (_a = this.abortController) == null ? void 0 : _a.abort();
    const controller = new AbortController();
    this.abortController = controller;
    const { signal } = controller;
    if (!file) {
      this.renderEmpty("No file open.");
      return;
    }
    const content = await this.app.vault.read(file);
    const refs = this.extractRefs(content);
    if (refs.length === 0) {
      this.renderEmpty("No references in this note.");
      return;
    }
    this.renderPlaceholders(refs);
    const generation = ++this.updateGeneration;
    for (let i = 0; i < refs.length; i++) {
      if (signal.aborted || generation !== this.updateGeneration)
        return;
      if (i > 0 && !isCached(refs[i]))
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      if (signal.aborted || generation !== this.updateGeneration)
        return;
      const data = await fetchReference(refs[i], signal);
      if (signal.aborted || generation !== this.updateGeneration)
        return;
      this.fillPlaceholder(refs[i], data);
    }
  }
  extractRefs(content) {
    const seen = /* @__PURE__ */ new Set();
    const refs = [];
    const regex = new RegExp(REF_REGEX.source, "g");
    let match;
    while ((match = regex.exec(content)) !== null) {
      for (const part of match[1].split(";")) {
        const ref = part.trim();
        if (ref && !seen.has(ref)) {
          seen.add(ref);
          refs.push(ref);
        }
      }
    }
    return refs;
  }
  renderEmpty(message) {
    this.contentEl.empty();
    this.contentEl.addClass("ref-sidebar");
    this.contentEl.createEl("p", { text: message, cls: "ref-sidebar-empty" });
  }
  renderPlaceholders(refs) {
    this.contentEl.empty();
    this.contentEl.addClass("ref-sidebar");
    for (const ref of refs) {
      const item = this.contentEl.createDiv({ cls: "ref-sidebar-item" });
      item.dataset.ref = ref;
      const header = item.createDiv({ cls: "ref-sidebar-header" });
      header.createDiv({ text: ref, cls: "ref-sidebar-ref" });
      const wolLink = header.createEl("a", {
        href: `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(ref)}`,
        cls: "ref-sidebar-wol-icon"
      });
      wolLink.setAttr("target", "_blank");
      wolLink.setAttr("aria-label", "View on WOL");
      (0, import_obsidian3.setIcon)(wolLink, "external-link");
      const body = item.createDiv({ cls: "ref-sidebar-body" });
      body.createEl("p", { text: "Loading\u2026", cls: "ref-sidebar-loading" });
    }
  }
  fillPlaceholder(ref, data) {
    const item = this.contentEl.querySelector(
      `.ref-sidebar-item[data-ref="${CSS.escape(ref)}"]`
    );
    if (!item)
      return;
    const body = item.querySelector(".ref-sidebar-body");
    if (!body)
      return;
    body.empty();
    if (!data) {
      body.createEl("p", { text: "Could not load reference.", cls: "ref-sidebar-error" });
    } else if (data.results.length === 0) {
      body.createEl("p", { text: "No results found.", cls: "ref-sidebar-error" });
    } else {
      for (const html of data.results) {
        appendHTML(body.createDiv({ cls: "ref-sidebar-wol-result" }), html);
      }
    }
  }
};

// ReferenceEditorPlugin.ts
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var import_obsidian4 = require("obsidian");
var REF_RE = /!!(.+?)!!(>?)/g;
var hideMark = import_view.Decoration.replace({});
var refMark = import_view.Decoration.mark({ class: "cm-wol-ref" });
var wolMark = import_view.Decoration.mark({ class: "cm-wol-ref cm-wol-ref-external" });
var ReferenceInlineWidget = class extends import_view.WidgetType {
  constructor(ref) {
    super();
    this.ref = ref;
  }
  eq(other) {
    return this.ref === other.ref;
  }
  toDOM() {
    const wrap = document.createElement("div");
    wrap.className = "cm-ref-inline-result";
    const label = document.createElement("div");
    label.className = "cm-ref-inline-label";
    label.textContent = this.ref;
    wrap.appendChild(label);
    const body = document.createElement("div");
    body.className = "cm-ref-inline-body";
    body.textContent = "Loading\u2026";
    wrap.appendChild(body);
    void fetchReference(this.ref).then((data) => {
      body.empty();
      if (!data || data.results.length === 0) {
        body.textContent = "No results found.";
        return;
      }
      for (const html of data.results) {
        const item = document.createElement("div");
        item.className = "cm-ref-inline-item";
        appendHTML(item, html);
        body.appendChild(item);
      }
    });
    return wrap;
  }
  ignoreEvent() {
    return true;
  }
};
function buildDecorations(view) {
  if (!view.state.field(import_obsidian4.editorLivePreviewField, false)) {
    return import_view.Decoration.none;
  }
  const builder = new import_state.RangeSetBuilder();
  const cursor = view.state.selection.main;
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    const re = new RegExp(REF_RE.source, "g");
    let match;
    while ((match = re.exec(text)) !== null) {
      const isCallout = match[2] === ">";
      const matchStart = from + match.index;
      const matchEnd = matchStart + match[0].length;
      if (cursor.from <= matchEnd && cursor.to >= matchStart)
        continue;
      if (isCallout) {
        builder.add(matchStart, matchEnd, import_view.Decoration.replace({
          widget: new ReferenceInlineWidget(match[1])
        }));
      } else {
        const innerStart = matchStart + 2;
        const innerEnd = matchEnd - 2;
        const mark = isBibleVerse(match[1]) ? refMark : wolMark;
        builder.add(matchStart, innerStart, hideMark);
        builder.add(innerStart, innerEnd, mark);
        builder.add(innerEnd, matchEnd, hideMark);
      }
    }
  }
  return builder.finish();
}
function createReferenceEditorPlugin(plugin) {
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
          if (!view.state.field(import_obsidian4.editorLivePreviewField, false))
            return;
          const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
          if (pos === null)
            return;
          const line = view.state.doc.lineAt(pos);
          const re = new RegExp(REF_RE.source, "g");
          let match;
          while ((match = re.exec(line.text)) !== null) {
            const from = line.from + match.index;
            const to = from + match[0].length;
            if (pos >= from && pos <= to) {
              e.preventDefault();
              const isCallout = match[2] === ">";
              if (!isCallout) {
                if (plugin.settings.referenceDisplayOption === "popover") {
                  void ReferencePopover.getInstance(plugin.app).show(e.target, match[1]);
                } else {
                  new ReferenceModal(plugin.app, match[1]).open();
                }
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
  referenceDisplayOption: "modal"
};
var WolPlugin = class extends import_obsidian5.Plugin {
  async onload() {
    await this.loadSettings();
    this.referenceParser = new ReferenceParser(this);
    this.registerView(VIEW_TYPE_REFERENCE_SIDEBAR, (leaf) => new ReferenceSidebarView(leaf));
    this.registerMarkdownPostProcessor((el, _ctx) => {
      this.referenceParser.setupReferenceLinks(el);
    });
    this.registerEditorExtension(createReferenceEditorPlugin(this));
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        this.updateSidebar(file);
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-change", (0, import_obsidian5.debounce)(() => {
        this.updateSidebar(this.app.workspace.getActiveFile());
      }, 500))
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.updateSidebar(this.app.workspace.getActiveFile());
      })
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.updateSidebar(this.app.workspace.getActiveFile());
      })
    );
    this.app.workspace.onLayoutReady(async () => {
      await this.activateSidebar();
      this.updateSidebar(this.app.workspace.getActiveFile());
    });
    this.addSettingTab(new WolSettingTab(this.app, this));
    this.addCommand({
      id: "clear-reference-cache",
      name: "Clear reference cache",
      callback: () => {
        clearReferenceCache();
        new import_obsidian5.Notice("Reference cache cleared.");
      }
    });
  }
  onunload() {
  }
  async activateSidebar() {
    const { workspace } = this.app;
    if (workspace.getLeavesOfType(VIEW_TYPE_REFERENCE_SIDEBAR).length > 0)
      return;
    const leaf = workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE_REFERENCE_SIDEBAR, active: true });
    }
  }
  updateSidebar(file) {
    var _a;
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_REFERENCE_SIDEBAR);
    if (leaves.length === 0)
      return;
    if ((_a = this.app.workspace.rightSplit) == null ? void 0 : _a.collapsed)
      return;
    const view = leaves[0].view;
    if (view instanceof ReferenceSidebarView) {
      void view.update(file);
    }
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var WolSettingTab = class extends import_obsidian5.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian5.Setting(containerEl).setName("Reference display option").setDesc("Choose how references are displayed when clicked.").addDropdown((dropdown) => dropdown.addOption("modal", "Modal dialog").addOption("popover", "Pop-over").setValue(this.plugin.settings.referenceDisplayOption).onChange(async (value) => {
      this.plugin.settings.referenceDisplayOption = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian5.Setting(containerEl).setName("Reference cache").setDesc("Fetched references are cached in memory for the current session. Clear the cache to force fresh fetches.").addButton((button) => button.setButtonText("Clear cache").onClick(() => {
      clearReferenceCache();
      new import_obsidian5.Notice("Reference cache cleared.");
    }));
  }
};


"use client";

import * as React from "react";

export type RightNoteProps = {
  /**
   * Kept for compatibility with your existing callers.
   * Notes are GLOBAL (Notebook only), not scoped per lesson.
   */
  scopeKey: string;

  className?: string;
  defaultNotesTitle?: string; // default "My Notes"
};

function closestTag(node: Node | null, tag: string, stopAt?: HTMLElement | null): HTMLElement | null {
  let cur: Node | null = node;
  const upper = tag.toUpperCase();

  while (cur) {
    const el = cur instanceof HTMLElement ? cur : cur.parentElement;
    if (!el) return null;
    if (stopAt && el === stopAt) return null;
    if (el.tagName === upper) return el;
    cur = el.parentNode;
  }
  return null;
}

function selectionFocusNode(): Node | null {
  if (typeof window === "undefined") return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.focusNode;
}

function queryState(cmd: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.queryCommandState(cmd);
  } catch {
    return false;
  }
}


function safeGetLocalStorage(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function safeSetLocalStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function selectionStartNode(): Node | null {
  if (typeof window === "undefined") return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0).startContainer || sel.anchorNode;
}


function safeGetJson<T>(key: string, fallback: T): T {
  const raw = safeGetLocalStorage(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetJson(key: string, value: any) {
  safeSetLocalStorage(key, JSON.stringify(value));
}

function htmlToPlainText(html: string): string {
  if (typeof window === "undefined") return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ============================================================
   Tiny rich-text toolbar helpers (no deps)
============================================================ */

function exec(cmd: string, value?: string) {
  if (typeof document === "undefined") return;
  try {
    document.execCommand(cmd, false, value);
  } catch {
    // ignore
  }
}

function setCaretAtNodeStart(node: Node) {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  r.setStart(node, 0);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

function setCaretAfterNode(node: Node) {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  r.setStartAfter(node);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

function insertZwsAfter(node: Node): Text {
  const zws = document.createTextNode("\u200B"); // invisible caret anchor
  const parent = node.parentNode;
  if (!parent) return zws;
  parent.insertBefore(zws, node.nextSibling);
  return zws;
}

/**
 * "Turn off" a style without undoing what was already typed:
 * move caret OUT of the nearest matching tag.
 */
function exitNearestTag(root: HTMLElement, tags: string[]): boolean {
  const node = selectionFocusNode();
  if (!node || !root.contains(node)) return false;

  // find nearest ancestor matching any tag
  let el: HTMLElement | null = null;
  for (const t of tags) {
    const found = closestTag(node, t, root);
    if (found) {
      el = found;
      break;
    }
  }
  if (!el) return false;
    exitWithBreaker(el);
    return true;
}

function exitWithBreaker(afterEl: HTMLElement, breakerText = "\u200B") {
  // Create a breaker span that forces normal formatting
  const span = document.createElement("span");
  span.style.fontWeight = "normal";
  span.style.fontStyle = "normal";
  span.style.textDecoration = "none";
  span.style.fontFamily = "inherit";
  span.style.fontSize = "inherit";
  span.textContent = breakerText; // invisible anchor

  const parent = afterEl.parentNode;
  if (!parent) return;

  parent.insertBefore(span, afterEl.nextSibling);

  // Put caret inside the breaker span
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  r.selectNodeContents(span);
  r.collapse(false);
  sel.removeAllRanges();
  sel.addRange(r);
}

function isMacLike(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
}

function toggleInlineCodeAtSelection(root: HTMLElement) {
  root.focus();

  const node = selectionFocusNode();
  if (!node || !root.contains(node)) return;

  const codeEl = closestTag(node, "CODE", root);
  if (codeEl) {
    // OFF = exit code, keep existing code styling
    exitWithBreaker(codeEl);
    return;
  }

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  const hasSelection = !range.collapsed;

  if (!hasSelection) {
    const code = document.createElement("code");
    code.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    code.style.fontSize = "0.95em";
    code.style.background = "rgba(0,0,0,0.04)";
    code.style.padding = "0.1em 0.25em";
    code.style.borderRadius = "0.35em";
    code.textContent = "\u200B";

    range.insertNode(code);

    const r2 = document.createRange();
    r2.selectNodeContents(code);
    r2.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r2);
    return;
  }

  const code = document.createElement("code");
  code.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  code.style.fontSize = "0.95em";
  code.style.background = "rgba(0,0,0,0.04)";
  code.style.padding = "0.1em 0.25em";
  code.style.borderRadius = "0.35em";

  try {
    range.surroundContents(code);

    const r2 = document.createRange();
    r2.selectNodeContents(code);
    r2.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r2);
  } catch {
    // if surround fails (weird selections), do nothing
  }
}

function toggleCodeBlockAtSelection(root: HTMLElement) {
  root.focus();

  const node = selectionFocusNode();
  if (!node || !root.contains(node)) return;

  const preEl = closestTag(node, "PRE", root);
  if (preEl) {
    // OFF = exit pre, keep existing pre content
    exitWithBreaker(preEl);
    return;
  }

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  const pre = document.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  pre.style.fontSize = "0.9em";
  pre.style.background = "rgba(0,0,0,0.04)";
  pre.style.padding = "10px 12px";
  pre.style.borderRadius = "10px";
  pre.style.border = "1px solid rgba(0,0,0,0.08)";
  pre.style.margin = "8px 0";

  const text = range.collapsed ? "" : range.toString();
  pre.textContent = text || "/* code */";

  range.deleteContents();
  range.insertNode(pre);
  ensureOutsideAnchorAfterPre(pre);

  // caret inside pre
  const r2 = document.createRange();
  r2.selectNodeContents(pre);
  r2.collapse(false);
  sel.removeAllRanges();
  sel.addRange(r2);
}



type ToolbarProps = {
  editorRef: React.RefObject<HTMLDivElement | null>;
};

function Toolbar({ editorRef }: ToolbarProps) {
  const [active, setActive] = React.useState({
    bold: false,
    italic: false,
    underline: false,
    codeInline: false,
    codeBlock: false,
  });


  const computeActive = React.useCallback(() => {
    const root = editorRef.current;
    const node = selectionFocusNode();

    // If selection isn't in our editor, don't show as active
    if (!root || !node || !root.contains(node)) {
      setActive((s) => ({ ...s, bold: false, italic: false, underline: false, codeInline: false, codeBlock: false }));
      return;
    }

    const inCode = !!closestTag(node, "CODE", root);
    const inPre = !!closestTag(node, "PRE", root);

    setActive({
      bold: queryState("bold"),
      italic: queryState("italic"),
      underline: queryState("underline"),
      codeInline: inCode,
      codeBlock: inPre,
    });
  }, [editorRef]);

  // Keep highlight synced with caret/selection
  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const onSelChange = () => computeActive();
    document.addEventListener("selectionchange", onSelChange);

    // Also update after typing/clicking inside editor
    const root = editorRef.current;
    const onKeyUp = () => computeActive();
    const onMouseUp = () => computeActive();
    root?.addEventListener("keyup", onKeyUp);
    root?.addEventListener("mouseup", onMouseUp);

    // Initial
    computeActive();

    return () => {
      document.removeEventListener("selectionchange", onSelChange);
      root?.removeEventListener("keyup", onKeyUp);
      root?.removeEventListener("mouseup", onMouseUp);
    };
  }, [computeActive, editorRef]);

  const run = React.useCallback(
    (cmd: string, value?: string) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      try {
        document.execCommand(cmd, false, value);
      } catch {}
      // trigger autosave
      el.dispatchEvent(new Event("input", { bubbles: true }));
      computeActive();
    },
    [editorRef, computeActive]
  );

const toggleInlineCode = React.useCallback(() => {
  const root = editorRef.current;
  if (!root) return;
  root.focus();

  const node = selectionFocusNode();
  if (!node || !root.contains(node)) return;

  const codeEl = closestTag(node, "CODE", root);

  if (codeEl) {
    // OFF = exit code, do NOT unwrap (keeps previously typed code styled)
    exitWithBreaker(codeEl);


    root.dispatchEvent(new Event("input", { bubbles: true }));
    computeActive();
    return;
  }


  // toggle ON
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  const hasSelection = !range.collapsed;

  if (!hasSelection) {
    // No selection: create an empty <code> token at caret so highlight can stick
    const code = document.createElement("code");
    code.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    code.style.fontSize = "0.95em";
    code.style.background = "rgba(0,0,0,0.04)";
    code.style.padding = "0.1em 0.25em";
    code.style.borderRadius = "0.35em";
    code.textContent = "\u200B"; // zero-width space (invisible)

    range.insertNode(code);

    // put caret inside code (end)
    const r2 = document.createRange();
    r2.selectNodeContents(code);
    r2.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r2);

    root.dispatchEvent(new Event("input", { bubbles: true }));
    computeActive();
    return;
  }

  // Has selection: wrap selection in <code>
  const code = document.createElement("code");
  code.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  code.style.fontSize = "0.95em";
  code.style.background = "rgba(0,0,0,0.04)";
  code.style.padding = "0.1em 0.25em";
  code.style.borderRadius = "0.35em";

  try {
    range.surroundContents(code);

    // IMPORTANT: move caret inside the <code> so highlight turns on
    const r2 = document.createRange();
    r2.selectNodeContents(code);
    r2.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r2);
  } catch {
    // fallback: at least insert monospace typing, but this won't give <code> highlight
    run("fontName", "monospace");
    return;
  }

  root.dispatchEvent(new Event("input", { bubbles: true }));
  computeActive();
}, [editorRef, computeActive, run]);


const toggleCodeBlock = React.useCallback(() => {
  const root = editorRef.current;
  if (!root) return;
  root.focus();

  const node = selectionFocusNode();
  if (!node || !root.contains(node)) return;

  const preEl = closestTag(node, "PRE", root);

if (preEl) {
  // OFF = exit pre, do NOT unwrap
  exitWithBreaker(preEl);


  root.dispatchEvent(new Event("input", { bubbles: true }));
  computeActive();
  return;
}


  // toggle ON: insert/replace selection with <pre>
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  const pre = document.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  pre.style.fontSize = "0.9em";
  pre.style.background = "rgba(0,0,0,0.04)";
  pre.style.padding = "10px 12px";
  pre.style.borderRadius = "10px";
  pre.style.border = "1px solid rgba(0,0,0,0.08)";
  pre.style.margin = "8px 0";

  const text = range.collapsed ? "" : range.toString();
  pre.textContent = text || "/* code */";

  range.deleteContents();
  range.insertNode(pre);
  ensureOutsideAnchorAfterPre(pre);


  // IMPORTANT: put caret INSIDE the <pre>, not after it
  const r2 = document.createRange();
  r2.selectNodeContents(pre);
  r2.collapse(false); // end of pre
  sel.removeAllRanges();
  sel.addRange(r2);

  root.dispatchEvent(new Event("input", { bubbles: true }));
  computeActive();
}, [editorRef, computeActive]);


  const Btn = ({
    label,
    title,
    onClick,
    isActive,
  }: {
    label: string;
    title: string;
    onClick: () => void;
    isActive?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep selection
      onClick={onClick}
      title={title}
      className={[
        "text-xs px-2 py-1 rounded-md border",
        isActive
          ? "bg-gray-300 border-indigo-200 text-indigo-900"
          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-2 items-center">
<Btn
  label="B"
  title="Bold"
  isActive={active.bold}
  onClick={() => {
    const root = editorRef.current;
    if (!root) return;

    if (active.bold) {
      // exit bold without removing previous bold text
      exitNearestTag(root, ["B", "STRONG"]);
      root.dispatchEvent(new Event("input", { bubbles: true }));
      computeActive();
      return;
    }
    run("bold");
  }}
/>

<Btn
  label="I"
  title="Italic"
  isActive={active.italic}
  onClick={() => {
    const root = editorRef.current;
    if (!root) return;

    if (active.italic) {
      exitNearestTag(root, ["I", "EM"]);
      root.dispatchEvent(new Event("input", { bubbles: true }));
      computeActive();
      return;
    }
    run("italic");
  }}
/>

<Btn
  label="U"
  title="Underline"
  isActive={active.underline}
  onClick={() => {
    const root = editorRef.current;
    if (!root) return;

    if (active.underline) {
      exitNearestTag(root, ["U"]);
      root.dispatchEvent(new Event("input", { bubbles: true }));
      computeActive();
      return;
    }
    run("underline");
  }}
/>


      <div className="w-px h-6 bg-gray-200 mx-1" />

      <Btn label="Code" title="Inline code (toggle)" onClick={toggleInlineCode} isActive={active.codeInline} />
      <Btn label="Code Block" title="Code block (toggle)" onClick={toggleCodeBlock} isActive={active.codeBlock} />

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <Btn label="↶" title="Undo" onClick={() => run("undo")} />
      <Btn label="↷" title="Redo" onClick={() => run("redo")} />
    </div>
  );
}

function isInPre(root: HTMLElement, node: Node | null): HTMLElement | null {
  if (!root || !node) return null;
  if (!root.contains(node)) return null;
  return closestTag(node, "PRE", root);
}


function ensureOutsideAnchorAfterPre(pre: HTMLElement) {
  const next = pre.nextSibling;

  // If we already have an anchor, do nothing
  if (next instanceof HTMLElement && next.dataset?.preAnchor === "1") return;

  const anchor = document.createElement("div");
  anchor.dataset.preAnchor = "1";
  anchor.innerHTML = "<br>";
  anchor.style.minHeight = "16px"; // easier to click
  anchor.style.outline = "none";

  pre.parentNode?.insertBefore(anchor, pre.nextSibling);
}

function placeCaretInside(el: HTMLElement) {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

function exitPreToOutside(root: HTMLElement, pre: HTMLElement) {
  ensureOutsideAnchorAfterPre(pre);
  const anchor = pre.nextSibling as HTMLElement | null;
  if (anchor) placeCaretInside(anchor);
}



/* ============================================================
   Notebook-only RightNote (multi-page)
============================================================ */

type NotePageMeta = {
  id: string;
  title: string;
  updatedAt: number;
};

export default function RightNote({
  scopeKey, // intentionally unused now (global notebook)
  className,
  defaultNotesTitle = "My Notes",
}: RightNoteProps) {
  // GLOBAL NOTEBOOK KEYS
  const notebookPrefix = "curio:notes:notebook";
  const titleStorageKey = `${notebookPrefix}:title`;
  const pagesIndexKey = `${notebookPrefix}:index`;
  const activePageKey = `${notebookPrefix}:active`;
  const pageContentKey = React.useCallback((pageId: string) => `${notebookPrefix}:page:${pageId}`, []);

  //key helper
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  // Header title
  const [title, setTitle] = React.useState(defaultNotesTitle);

  // Pages
  const [pages, setPages] = React.useState<NotePageMeta[]>([]);
  const [activePageId, setActivePageId] = React.useState<string>("");

  // Search
  const [query, setQuery] = React.useState("");

  // Editor refs/state
  const notesRef = React.useRef<HTMLDivElement | null>(null);
  const saveTimer = React.useRef<number | null>(null);
  const [hasNotes, setHasNotes] = React.useState(false);

  // Save status
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved">("idle");

  // Load title on mount
  React.useEffect(() => {
    const savedTitle = safeGetLocalStorage(titleStorageKey);
    setTitle(savedTitle || "Notebook");
  }, [titleStorageKey]);

  // Persist title
  React.useEffect(() => {
    safeSetLocalStorage(titleStorageKey, title);
  }, [title, titleStorageKey]);

  // Load pages index + active on mount
  React.useEffect(() => {
    const loaded = safeGetJson<NotePageMeta[]>(pagesIndexKey, []);

    let nextPages = loaded;

    // If first time, create default page
    if (!nextPages || nextPages.length === 0) {
      const firstId = makeId();
      nextPages = [{ id: firstId, title: "Page 1", updatedAt: Date.now() }];

      safeSetJson(pagesIndexKey, nextPages);
      safeSetLocalStorage(activePageKey, firstId);
      safeSetLocalStorage(pageContentKey(firstId), "");
    }

    setPages(nextPages);

    const savedActive = safeGetLocalStorage(activePageKey);
    const fallbackId = nextPages[0]?.id || "";
    const nextActive =
      savedActive && nextPages.some((p) => p.id === savedActive) ? savedActive : fallbackId;

    setActivePageId(nextActive);
  }, [pagesIndexKey, activePageKey, pageContentKey]);

  // Persist active page id
  React.useEffect(() => {
    if (!activePageId) return;
    safeSetLocalStorage(activePageKey, activePageId);
  }, [activePageId, activePageKey]);

  // Load active page content into editor
  React.useEffect(() => {
    if (!activePageId) return;

    const html = safeGetLocalStorage(pageContentKey(activePageId));
    if (notesRef.current) {
  notesRef.current.innerHTML = html || "";
}


    if (notesRef.current) {
  notesRef.current.querySelectorAll("pre").forEach((p) => {
    ensureOutsideAnchorAfterPre(p as HTMLElement);
  });
}


    const plain = htmlToPlainText(html || "");
    setHasNotes(!!plain.trim());
    setSaveStatus("idle");
  }, [activePageId, pageContentKey]);

  // Debounced persist active page HTML
  const scheduleSaveNotes = React.useCallback(
    (html: string) => {
      if (typeof window === "undefined") return;
      if (!activePageId) return;

      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      setSaveStatus("saving");

      saveTimer.current = window.setTimeout(() => {
        safeSetLocalStorage(pageContentKey(activePageId), html);

        // bump updatedAt for this page
        setPages((prev) => {
          const next = prev.map((p) => (p.id === activePageId ? { ...p, updatedAt: Date.now() } : p));
          safeSetJson(pagesIndexKey, next);
          return next;
        });

        setSaveStatus("saved");
        window.setTimeout(() => setSaveStatus("idle"), 800);
      }, 200);
    },
    [activePageId, pageContentKey, pagesIndexKey]
  );

  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, []);

  // Page actions
  const createPage = React.useCallback(() => {
    const id = makeId();
    const newPage: NotePageMeta = { id, title: `Page ${pages.length + 1}`, updatedAt: Date.now() };

    setPages((prev) => {
      const next = [newPage, ...prev];
      safeSetJson(pagesIndexKey, next);
      return next;
    });

    safeSetLocalStorage(pageContentKey(id), "");
    setActivePageId(id);
    setQuery("");
  }, [pages.length, pagesIndexKey, pageContentKey]);

  const renameActivePage = React.useCallback(() => {
    if (!activePageId) return;
    const current = pages.find((p) => p.id === activePageId);
    const nextTitle = window.prompt("Rename page:", current?.title || "");
    if (!nextTitle) return;

    setPages((prev) => {
      const next = prev.map((p) => (p.id === activePageId ? { ...p, title: nextTitle } : p));
      safeSetJson(pagesIndexKey, next);
      return next;
    });
  }, [activePageId, pages, pagesIndexKey]);

  const deleteActivePage = React.useCallback(() => {
    if (!activePageId) return;
    if (pages.length <= 1) {
      window.alert("You need at least one page.");
      return;
    }

    const current = pages.find((p) => p.id === activePageId);
    const ok = window.confirm(`Delete "${current?.title || "this page"}"? This cannot be undone.`);
    if (!ok) return;

    const idx = pages.findIndex((p) => p.id === activePageId);
    const nextId = pages[idx + 1]?.id || pages[idx - 1]?.id || pages[0]?.id || "";

    setPages((prev) => {
      const next = prev.filter((p) => p.id !== activePageId);
      safeSetJson(pagesIndexKey, next);
      return next;
    });

    try {
      window.localStorage.removeItem(pageContentKey(activePageId));
    } catch {}

    setActivePageId(nextId);
    setQuery("");
  }, [activePageId, pages, pageContentKey, pagesIndexKey]);

  // Search results
  const filteredPages = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;

    return pages.filter((p) => {
      if (p.title.toLowerCase().includes(q)) return true;
      const html = safeGetLocalStorage(pageContentKey(p.id));
      const plain = htmlToPlainText(html || "").toLowerCase();
      return plain.includes(q);
    });
  }, [pages, query, pageContentKey]);

  const activePageTitle = pages.find((p) => p.id === activePageId)?.title ?? "";


  return (
    <aside
      className={[
        "shrink-0",
        "bg-white border-l border-gray-200",
        "flex flex-col",
        "min-w-0 h-full",
        className || "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 space-y-2">
        {/* Title + save status */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-indigo-900 truncate">
            <span
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setTitle(e.currentTarget.textContent || "")}
              className="outline-none border-b border-transparent focus:border-gray-400"
            >
              {title}
            </span>
          </div>

          <div className="text-xs text-gray-500 whitespace-nowrap">
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : ""}
          </div>
          <button
              type="button"
              onClick={() => setShowShortcuts((v) => !v)}
              className="h-5 w-5 rounded-full border border-gray-200 text-indigo-700 text-xs hover:bg-indigo-100 flex items-center justify-center"
              title="Keyboard shortcuts"
              aria-label="Keyboard shortcuts"
            >
              ?
            </button>
        </div>

        {/* Page picker + actions */}
        <div className="flex items-center gap-2">
          <select
            value={activePageId}
            onChange={(e) => setActivePageId(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
            title="Select a notes page"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={createPage}
            className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
            title="Create a new page"
          >
            + New
          </button>

          <button
            type="button"
            onClick={renameActivePage}
            className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
            title="Rename current page"
          >
            Rename
          </button>

          <button
            type="button"
            onClick={deleteActivePage}
            className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
            title="Delete current page"
          >
            Delete
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="w-full text-xs border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-gray-400"
          />
        </div>

        {/* Toolbar */}
        <Toolbar editorRef={notesRef} />

        {showShortcuts && (
  <div className="relative">
    <div className="absolute right-5 mt-0 w-[240px] rounded-lg border border-gray-200 bg-white shadow-sm p-3 text-xs text-gray-700 z-20">
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold text-indigo-800">Shortcuts</div>
        <button
          type="button"
          onClick={() => setShowShortcuts(false)}
          className="text-gray-400 hover:text-gray-700"
          aria-label="Close shortcuts"
          title="Close"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 space-y-2">

        <div>
          <div className="font-semibold text-gray-900">Formatting</div>
          <ul className="mt-1 space-y-1">
            <li>
              <span className="font-mono bg-gray-100 px-1 rounded">
                {isMacLike() ? "Cmd" : "Ctrl"} + B
              </span>{" "}
              Bold
            </li>
            <li>
              <span className="font-mono bg-gray-100 px-1 rounded">
                {isMacLike() ? "Cmd" : "Ctrl"} + I
              </span>{" "}
              Italic
            </li>
            <li>
              <span className="font-mono bg-gray-100 px-1 rounded">
                {isMacLike() ? "Cmd" : "Ctrl"} + U
              </span>{" "}
              Underline
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-gray-900">Code</div>
          <ul className="mt-1 space-y-1">
            <li>
              <span className="font-mono bg-gray-100 px-1 rounded">
                {isMacLike() ? "Cmd" : "Ctrl"} + .
              </span>{" "}
              Inline code
            </li>
            <li>
              <span className="font-mono bg-gray-100 px-1 rounded">
                {isMacLike() ? "Cmd" : "Ctrl"} + Shift + .
              </span>{" "}
              Code block
            </li>
                    <div>
          <div className="font-semibold text-gray-900">Inside a code block</div>
          <div className="mt-1 text-gray-700">
            Press <span className="font-mono bg-gray-100 px-1 rounded">Tab</span> to exit the block.
          </div>
        </div>
          </ul>
        </div>
      </div>
    </div>
  </div>
)}


        {/* Search results quick list */}
        {query.trim() && filteredPages.length > 0 && (
          <div className="max-h-28 overflow-y-auto border border-gray-100 rounded-md">
            {filteredPages.slice(0, 6).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePageId(p.id)}
                className={[
                  "w-full text-left px-2 py-1 text-xs",
                  p.id === activePageId ? "bg-indigo-50 text-indigo-900" : "hover:bg-gray-50 text-gray-700",
                ].join(" ")}
                title="Open page"
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        <div className="text-[11px] text-gray-500">
          Editing: <span className="text-gray-700">{activePageTitle}</span>
        </div>
      </div>

      {/* Notes body */}
      <div className="p-4 min-h-0 overflow-y-auto">
        
        <div className="relative">

<input
  value={activePageTitle}
  onChange={(e) => {
    const nextTitle = e.target.value;

    setPages((prev) => {
      const next = prev.map((p) =>
        p.id === activePageId ? { ...p, title: nextTitle, updatedAt: Date.now() } : p
      );
      safeSetJson(pagesIndexKey, next);
      return next;
    });
  }}
  onBlur={(e) => {
    const current = (e.currentTarget.value || "").trim();
    if (current) return;

    const fallback = "Untitled";

    setPages((prev) => {
      const next = prev.map((p) =>
        p.id === activePageId ? { ...p, title: fallback, updatedAt: Date.now() } : p
      );
      safeSetJson(pagesIndexKey, next);
      return next;
    });
  }}
  className={[
    "w-full",
    "bg-transparent",
    "text-[18px] font-semibold text-indigo-900",
    "outline-none",
    "border-b border-gray-200 focus:border-gray-400",
    "pb-1",
    "mb-3",
  ].join(" ")}
/>


          {!hasNotes && (
            <div className="pointer-events-none absolute left-3 top-14 text-sm text-gray-400">
              Type notes here
            </div>
          )}

          <div
            ref={notesRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {

              const root = e.currentTarget;
              const bodyEl = root.querySelector('[data-note-body="1"]') as HTMLElement | null;
              const html = (bodyEl?.innerHTML || "").replace(/\u200B/g, "");

              const cleaned = (root.innerHTML || "")
                .replace(/\u200B/g, "")
                .replace(/<span[^>]*><\/span>/g, "");

              scheduleSaveNotes(cleaned);

              const plain = e.currentTarget.textContent || "";
              setHasNotes(!!plain.trim());
              scheduleSaveNotes(html);
            }}
onKeyDown={(e) => {
  
  const root = notesRef.current;
  if (!root) return;
    // --- shortcuts (Cmd on Mac, Ctrl on Windows/Linux) ---
  const mod = e.metaKey || e.ctrlKey;
  const html = (root.innerHTML || "").replace(/\u200B/g, "");

  if (mod) {
    const k = e.key.toLowerCase();

    // Bold/Italic/Underline (native, but we’ll make it consistent + prevent browser quirks)
    if (k === "b") {
      e.preventDefault();
      exec("bold");
      requestAnimationFrame(() => root.dispatchEvent(new Event("input", { bubbles: true })));
      return;
    }
    if (k === "i") {
      e.preventDefault();
      exec("italic");
      requestAnimationFrame(() => root.dispatchEvent(new Event("input", { bubbles: true })));
      return;
    }
    if (k === "u") {
      e.preventDefault();
      exec("underline");
      requestAnimationFrame(() => root.dispatchEvent(new Event("input", { bubbles: true })));
      return;
    }

// Inline code: Cmd/Ctrl + .
if (mod && e.code === "Period" && !e.shiftKey) {
  e.preventDefault();
  e.stopPropagation();
  toggleInlineCodeAtSelection(root);
  requestAnimationFrame(() => root.dispatchEvent(new Event("input", { bubbles: true })));
  return;
}

// Code block: Cmd/Ctrl + Shift + .
if (mod && e.code === "Period" && e.shiftKey) {
  e.preventDefault();
  e.stopPropagation();
  toggleCodeBlockAtSelection(root);
  requestAnimationFrame(() => root.dispatchEvent(new Event("input", { bubbles: true })));
  return;
}
  }

  const node = selectionStartNode() || selectionFocusNode();
  const pre = closestTag(node, "PRE", root);
  if (!pre) return;

  // ENTER: newline inside SAME pre (fast path)
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    // Faster than manual Range ops in many browsers
    try {
      document.execCommand("insertLineBreak");
    } catch {
      // fallback if execCommand insertText fails
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode("\n"));
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // Defer the heavy onInput/save work to next frame
    requestAnimationFrame(() => {
      root.dispatchEvent(new Event("input", { bubbles: true }));
    });
    return;
  }

  // TAB: exit pre
  if (e.key === "Tab") {
    e.preventDefault();
    exitPreToOutside(root, pre); 
    requestAnimationFrame(() => {
      root.dispatchEvent(new Event("input", { bubbles: true }));
    });
    return;
  }
}}
            className={[
              "min-h-[240px] w-full",
              "rounded-lg",
              "bg-white",
              "text-sm text-gray-900",
              "leading-relaxed",
              "outline-none",
              "whitespace-pre-wrap",
              "border border-gray-200 p-3",
              "[& code]:font-mono [& code]:text-[0.95em]",
            ].join(" ")}
          />
        </div>
      </div>
    </aside>
  );
}


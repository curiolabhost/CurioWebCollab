"use client";

import * as React from "react";

async function fetchNotebookState() {
  const res = await fetch("/api/notebook-state", { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as {
    ok: boolean;
    notebook?: { title: string; pagesJson: any } | null;
  };
}

async function saveNotebookState(title: string, pagesJson: any) {
  const res = await fetch("/api/notebook-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, pagesJson }),
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    ok: boolean;
    notebook?: { title: string; pagesJson: any } | null;
  };
}

export type RightNoteProps = {
  /**
   * Kept for compatibility with your existing callers.
   * Notes are GLOBAL (Notebook only), not scoped per lesson.
   */
  scopeKey: string;

  className?: string;
  defaultNotesTitle?: string; // default "My Notes"
};

function closestTag(
  node: Node | null,
  tag: string,
  stopAt?: HTMLElement | null
): HTMLElement | null {
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

/**
 * "Turn off" a style without undoing what was already typed:
 * move caret OUT of the nearest matching tag.
 */
function exitNearestTag(root: HTMLElement, tags: string[]): boolean {
  const node = selectionFocusNode();
  if (!node || !root.contains(node)) return false;

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
  const span = document.createElement("span");
  span.style.fontWeight = "normal";
  span.style.fontStyle = "normal";
  span.style.textDecoration = "none";
  span.style.fontFamily = "inherit";
  span.style.fontSize = "inherit";
  span.textContent = breakerText;

  const parent = afterEl.parentNode;
  if (!parent) return;

  parent.insertBefore(span, afterEl.nextSibling);

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
    exitWithBreaker(codeEl);
    return;
  }

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  const hasSelection = !range.collapsed;

  if (!hasSelection) {
    const code = document.createElement("code");
    code.style.fontFamily =
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
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
  code.style.fontFamily =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
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
    // ignore
  }
}

function toggleCodeBlockAtSelection(root: HTMLElement) {
  root.focus();

  const node = selectionFocusNode();
  if (!node || !root.contains(node)) return;

  const preEl = closestTag(node, "PRE", root);
  if (preEl) {
    exitWithBreaker(preEl);
    return;
  }

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  const pre = document.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.style.fontFamily =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
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

    if (!root || !node || !root.contains(node)) {
      setActive((s) => ({
        ...s,
        bold: false,
        italic: false,
        underline: false,
        codeInline: false,
        codeBlock: false,
      }));
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

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const onSelChange = () => computeActive();
    document.addEventListener("selectionchange", onSelChange);

    const root = editorRef.current;
    const onKeyUp = () => computeActive();
    const onMouseUp = () => computeActive();
    root?.addEventListener("keyup", onKeyUp);
    root?.addEventListener("mouseup", onMouseUp);

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
      exitWithBreaker(codeEl);
      root.dispatchEvent(new Event("input", { bubbles: true }));
      computeActive();
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const hasSelection = !range.collapsed;

    if (!hasSelection) {
      const code = document.createElement("code");
      code.style.fontFamily =
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
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

      root.dispatchEvent(new Event("input", { bubbles: true }));
      computeActive();
      return;
    }

    const code = document.createElement("code");
    code.style.fontFamily =
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
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
      exitWithBreaker(preEl);
      root.dispatchEvent(new Event("input", { bubbles: true }));
      computeActive();
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const pre = document.createElement("pre");
    pre.style.whiteSpace = "pre-wrap";
    pre.style.fontFamily =
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
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

    const r2 = document.createRange();
    r2.selectNodeContents(pre);
    r2.collapse(false);
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
      onMouseDown={(e) => e.preventDefault()}
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

      <Btn
        label="Code"
        title="Inline code (toggle)"
        onClick={toggleInlineCode}
        isActive={active.codeInline}
      />
      <Btn
        label="Code Block"
        title="Code block (toggle)"
        onClick={toggleCodeBlock}
        isActive={active.codeBlock}
      />

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <Btn label="↶" title="Undo" onClick={() => run("undo")} />
      <Btn label="↷" title="Redo" onClick={() => run("redo")} />
    </div>
  );
}

function ensureOutsideAnchorAfterPre(pre: HTMLElement) {
  const next = pre.nextSibling;
  if (next instanceof HTMLElement && next.dataset?.preAnchor === "1") return;

  const anchor = document.createElement("div");
  anchor.dataset.preAnchor = "1";
  anchor.innerHTML = "<br>";
  anchor.style.minHeight = "16px";
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

type NotebookJson = {
  pages: NotePageMeta[];
  activePageId: string;
  pageHtmlById: Record<string, string>;
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
  const pageContentKey = React.useCallback(
    (pageId: string) => `${notebookPrefix}:page:${pageId}`,
    []
  );

  const [showShortcuts, setShowShortcuts] = React.useState(false);

  const [title, setTitle] = React.useState(defaultNotesTitle);

  const [pages, setPages] = React.useState<NotePageMeta[]>([]);
  const [activePageId, setActivePageId] = React.useState<string>("");

  const [query, setQuery] = React.useState("");

  const notesRef = React.useRef<HTMLDivElement | null>(null);
  const saveTimer = React.useRef<number | null>(null);

  const [hasNotes, setHasNotes] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved">(
    "idle"
  );

  const hydrateEditorFromHtml = React.useCallback((html: string) => {
    if (notesRef.current) {
      notesRef.current.innerHTML = html || "";
      notesRef.current.querySelectorAll("pre").forEach((p) => {
        ensureOutsideAnchorAfterPre(p as HTMLElement);
      });
    }
    const plain = htmlToPlainText(html || "");
    setHasNotes(!!plain.trim());
    setSaveStatus("idle");
  }, []);

  const buildNotebookPayloadFromLocal = React.useCallback(
    (nextTitle: string, nextPages: NotePageMeta[], nextActiveId: string): NotebookJson => {
      const map: Record<string, string> = {};
      for (const p of nextPages) {
        map[p.id] = safeGetLocalStorage(pageContentKey(p.id)) || "";
      }
      return { pages: nextPages, activePageId: nextActiveId, pageHtmlById: map };
    },
    [pageContentKey]
  );

  const flushNotebookToServer = React.useCallback(
    async (nextTitle: string, nextPages: NotePageMeta[], nextActiveId: string) => {
      try {
        const payload = buildNotebookPayloadFromLocal(nextTitle, nextPages, nextActiveId);
        await saveNotebookState(nextTitle, payload);
      } catch {
        // ignore (local still works)
      }
    },
    [buildNotebookPayloadFromLocal]
  );

    const [syncBusy, setSyncBusy] = React.useState<"idle" | "saving" | "reloading">(
    "idle"
  );

  const cleanEditorHtml = React.useCallback(() => {
    const root = notesRef.current;
    if (!root) return "";
    return (root.innerHTML || "")
      .replace(/\u200B/g, "")
      .replace(/<span[^>]*><\/span>/g, "");
  }, []);

  const applyNotebookFromServer = React.useCallback(
    (serverTitle: string, data: Partial<NotebookJson>) => {
      const serverPages = Array.isArray(data.pages) ? data.pages : [];
      const serverActive = String(data.activePageId || "");
      const serverMap =
        data.pageHtmlById && typeof data.pageHtmlById === "object"
          ? (data.pageHtmlById as Record<string, string>)
          : {};

      let pagesNext = serverPages;
      let activeNext = serverActive;

      if (!pagesNext.length) {
        const firstId = makeId();
        pagesNext = [{ id: firstId, title: "Page 1", updatedAt: Date.now() }];
        activeNext = firstId;
        serverMap[firstId] = "";
      }

      if (!activeNext || !pagesNext.some((p) => p.id === activeNext)) {
        activeNext = pagesNext[0]?.id || "";
      }

      setTitle(serverTitle);
      setPages(pagesNext);
      setActivePageId(activeNext);
      setQuery("");

      const html = serverMap[activeNext] || "";
      hydrateEditorFromHtml(html);

      // keep local cache in sync (offline-friendly)
      safeSetLocalStorage(titleStorageKey, serverTitle);
      safeSetJson(pagesIndexKey, pagesNext);
      safeSetLocalStorage(activePageKey, activeNext);
      for (const p of pagesNext) {
        safeSetLocalStorage(pageContentKey(p.id), serverMap[p.id] || "");
      }
    },
    [
      hydrateEditorFromHtml,
      titleStorageKey,
      pagesIndexKey,
      activePageKey,
      pageContentKey,
    ]
  );

  const saveNow = React.useCallback(async () => {
    if (!activePageId || pages.length === 0) return;

    setSyncBusy("saving");
    setSaveStatus("saving");

    try {
      // ensure latest editor html is captured
      const html = cleanEditorHtml();
      safeSetLocalStorage(pageContentKey(activePageId), html);

      const pagesNext = pages.map((p) =>
        p.id === activePageId ? { ...p, updatedAt: Date.now() } : p
      );
      setPages(pagesNext);
      safeSetJson(pagesIndexKey, pagesNext);
      safeSetLocalStorage(activePageKey, activePageId);
      safeSetLocalStorage(titleStorageKey, title);

      const payload = buildNotebookPayloadFromLocal(title, pagesNext, activePageId);
      payload.pageHtmlById[activePageId] = html;

      const r = await saveNotebookState(title, payload);
      if (!r?.ok) {
        setSaveStatus("idle");
        setSyncBusy("idle");
        return;
      }

      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 800);
    } catch {
      setSaveStatus("idle");
    } finally {
      setSyncBusy("idle");
    }
  }, [
    activePageId,
    pages,
    pagesIndexKey,
    activePageKey,
    titleStorageKey,
    title,
    pageContentKey,
    buildNotebookPayloadFromLocal,
    cleanEditorHtml,
  ]);

  const reloadNow = React.useCallback(async () => {
    setSyncBusy("reloading");
    try {
      const r = await fetchNotebookState();
      const nb = r?.ok ? r.notebook : null;

      if (nb && nb.pagesJson) {
        const serverTitle = String(nb.title || "Notebook");
        const data = nb.pagesJson as Partial<NotebookJson>;
        applyNotebookFromServer(serverTitle, data);
      }
    } catch {
      // ignore (local cache still exists)
    } finally {
      setSyncBusy("idle");
    }
  }, [applyNotebookFromServer]);


  // SERVER-FIRST load on mount, then local fallback
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      // 1) server
      try {
        const r = await fetchNotebookState();
        const nb = r?.ok ? r.notebook : null;

        if (nb && nb.pagesJson) {
          const serverTitle = String(nb.title || "Notebook");
          const data = nb.pagesJson as Partial<NotebookJson>;

          const serverPages = Array.isArray(data.pages) ? data.pages : [];
          const serverActive = String(data.activePageId || "");
          const serverMap =
            data.pageHtmlById && typeof data.pageHtmlById === "object"
              ? (data.pageHtmlById as Record<string, string>)
              : {};

          let pagesNext = serverPages;
          let activeNext = serverActive;

          if (!pagesNext.length) {
            const firstId = makeId();
            pagesNext = [{ id: firstId, title: "Page 1", updatedAt: Date.now() }];
            activeNext = firstId;
            serverMap[firstId] = "";
          }

          if (!activeNext || !pagesNext.some((p) => p.id === activeNext)) {
            activeNext = pagesNext[0]?.id || "";
          }

          setTitle(serverTitle);
          setPages(pagesNext);
          setActivePageId(activeNext);

          const html = serverMap[activeNext] || "";
          hydrateEditorFromHtml(html);

          // keep local cache in sync (nice for offline)
          safeSetLocalStorage(titleStorageKey, serverTitle);
          safeSetJson(pagesIndexKey, pagesNext);
          safeSetLocalStorage(activePageKey, activeNext);
          for (const p of pagesNext) {
            safeSetLocalStorage(pageContentKey(p.id), serverMap[p.id] || "");
          }

          return;
        }
      } catch {
        // ignore -> local fallback
      }

      // 2) local fallback (your old behavior)
      const savedTitle = safeGetLocalStorage(titleStorageKey);
      setTitle(savedTitle || "Notebook");

      const loaded = safeGetJson<NotePageMeta[]>(pagesIndexKey, []);
      let nextPages = loaded;

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

      const html = safeGetLocalStorage(pageContentKey(nextActive));
      hydrateEditorFromHtml(html || "");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist title locally + debounced server flush
  React.useEffect(() => {
    safeSetLocalStorage(titleStorageKey, title);

    // tiny debounce so title typing doesn't spam server
    const t = window.setTimeout(() => {
      if (!activePageId || pages.length === 0) return;
      flushNotebookToServer(title, pages, activePageId);
    }, 400);

    return () => window.clearTimeout(t);
  }, [title, titleStorageKey, flushNotebookToServer, activePageId, pages]);

  // Persist active page id locally, and load its content from local cache
  React.useEffect(() => {
    if (!activePageId) return;
    safeSetLocalStorage(activePageKey, activePageId);

    const html = safeGetLocalStorage(pageContentKey(activePageId));
    hydrateEditorFromHtml(html || "");
  }, [activePageId, activePageKey, pageContentKey, hydrateEditorFromHtml]);

  // Debounced persist active page HTML: local + server
  const scheduleSaveNotes = React.useCallback(
    (html: string) => {
      if (typeof window === "undefined") return;
      if (!activePageId) return;

      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      setSaveStatus("saving");

      saveTimer.current = window.setTimeout(async () => {
        // ---- local first ----
        safeSetLocalStorage(pageContentKey(activePageId), html);

        const pagesNext = pages.map((p) =>
          p.id === activePageId ? { ...p, updatedAt: Date.now() } : p
        );

        setPages(pagesNext);
        safeSetJson(pagesIndexKey, pagesNext);
        safeSetLocalStorage(activePageKey, activePageId);
        safeSetLocalStorage(titleStorageKey, title);

        // ---- server ----
        try {
          const payload = buildNotebookPayloadFromLocal(title, pagesNext, activePageId);
          // make sure the latest html is definitely included
          payload.pageHtmlById[activePageId] = html;

          const r = await saveNotebookState(title, payload);
          if (!r?.ok) {
            setSaveStatus("idle");
            return;
          }

          setSaveStatus("saved");
          window.setTimeout(() => setSaveStatus("idle"), 800);
        } catch {
          // server failed -> still saved locally
          setSaveStatus("idle");
        }
      }, 350);
    },
    [
      activePageId,
      pageContentKey,
      pages,
      pagesIndexKey,
      activePageKey,
      titleStorageKey,
      title,
      buildNotebookPayloadFromLocal,
    ]
  );

  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, []);

  // Page actions
  const createPage = React.useCallback(async () => {
    const id = makeId();
    const newPage: NotePageMeta = {
      id,
      title: `Page ${pages.length + 1}`,
      updatedAt: Date.now(),
    };

    const nextPages = [newPage, ...pages];
    setPages(nextPages);

    safeSetJson(pagesIndexKey, nextPages);
    safeSetLocalStorage(pageContentKey(id), "");
    setActivePageId(id);
    setQuery("");

    await flushNotebookToServer(title, nextPages, id);
  }, [pages, pagesIndexKey, pageContentKey, flushNotebookToServer, title]);

  const renameActivePage = React.useCallback(async () => {
    if (!activePageId) return;
    const current = pages.find((p) => p.id === activePageId);
    const nextTitle = window.prompt("Rename page:", current?.title || "");
    if (!nextTitle) return;

    const nextPages = pages.map((p) =>
      p.id === activePageId ? { ...p, title: nextTitle, updatedAt: Date.now() } : p
    );
    setPages(nextPages);
    safeSetJson(pagesIndexKey, nextPages);

    await flushNotebookToServer(title, nextPages, activePageId);
  }, [activePageId, pages, pagesIndexKey, flushNotebookToServer, title]);

  const deleteActivePage = React.useCallback(async () => {
    if (!activePageId) return;
    if (pages.length <= 1) {
      window.alert("You need at least one page.");
      return;
    }

    const current = pages.find((p) => p.id === activePageId);
    const ok = window.confirm(
      `Delete "${current?.title || "this page"}"? This cannot be undone.`
    );
    if (!ok) return;

    const idx = pages.findIndex((p) => p.id === activePageId);
    const nextId =
      pages[idx + 1]?.id || pages[idx - 1]?.id || pages[0]?.id || "";

    const nextPages = pages.filter((p) => p.id !== activePageId);
    setPages(nextPages);
    safeSetJson(pagesIndexKey, nextPages);

    try {
      window.localStorage.removeItem(pageContentKey(activePageId));
    } catch {}

    setActivePageId(nextId);
    setQuery("");

    await flushNotebookToServer(title, nextPages, nextId);
  }, [activePageId, pages, pageContentKey, pagesIndexKey, flushNotebookToServer, title]);

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
  {syncBusy === "reloading"
    ? "Reloading…"
    : saveStatus === "saving"
    ? "Saving…"
    : saveStatus === "saved"
    ? "Saved ✓"
    : ""}
</div>


          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveNow}
              disabled={syncBusy !== "idle"}
              className={[
                "text-xs px-2 py-1 rounded-md border",
                "border-gray-200 text-gray-700 hover:bg-gray-50",
                syncBusy !== "idle" ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
              title="Save notes to server"
            >
              Save
            </button>

            <button
              type="button"
              onClick={reloadNow}
              disabled={syncBusy !== "idle"}
              className={[
                "text-xs px-2 py-1 rounded-md border",
                "border-gray-200 text-gray-700 hover:bg-gray-50",
                syncBusy !== "idle" ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
              title="Reload notes from server"
            >
              Reload
            </button>

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

        </div>

        {/* Page picker + actions */}
        <div className="flex items-center gap-2">
          <select
            value={activePageId}
            onChange={async (e) => {
              const nextId = e.target.value;
              setActivePageId(nextId);
              // flush so server knows which page is active
              await flushNotebookToServer(title, pages, nextId);
            }}
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
                      <div className="font-semibold text-gray-900">
                        Inside a code block
                      </div>
                      <div className="mt-1 text-gray-700">
                        Press{" "}
                        <span className="font-mono bg-gray-100 px-1 rounded">
                          Tab
                        </span>{" "}
                        to exit the block.
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
                onClick={async () => {
                  setActivePageId(p.id);
                  await flushNotebookToServer(title, pages, p.id);
                }}
                className={[
                  "w-full text-left px-2 py-1 text-xs",
                  p.id === activePageId
                    ? "bg-indigo-50 text-indigo-900"
                    : "hover:bg-gray-50 text-gray-700",
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

              const nextPages = pages.map((p) =>
                p.id === activePageId
                  ? { ...p, title: nextTitle, updatedAt: Date.now() }
                  : p
              );

              setPages(nextPages);
              safeSetJson(pagesIndexKey, nextPages);
            }}
            onBlur={async (e) => {
              const current = (e.currentTarget.value || "").trim();
              const fallback = current ? current : "Untitled";

              const nextPages = pages.map((p) =>
                p.id === activePageId
                  ? { ...p, title: fallback, updatedAt: Date.now() }
                  : p
              );

              setPages(nextPages);
              safeSetJson(pagesIndexKey, nextPages);

              if (activePageId) {
                await flushNotebookToServer(title, nextPages, activePageId);
              }
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

              // Cleaned HTML (remove zws + empty spans)
              const cleaned = (root.innerHTML || "")
                .replace(/\u200B/g, "")
                .replace(/<span[^>]*><\/span>/g, "");

              const plain = root.textContent || "";
              setHasNotes(!!plain.trim());

              scheduleSaveNotes(cleaned);
            }}
            onKeyDown={(e) => {
              const root = notesRef.current;
              if (!root) return;

              const mod = e.metaKey || e.ctrlKey;

              if (mod) {
                const k = e.key.toLowerCase();

                if (k === "b") {
                  e.preventDefault();
                  exec("bold");
                  requestAnimationFrame(() =>
                    root.dispatchEvent(new Event("input", { bubbles: true }))
                  );
                  return;
                }
                if (k === "i") {
                  e.preventDefault();
                  exec("italic");
                  requestAnimationFrame(() =>
                    root.dispatchEvent(new Event("input", { bubbles: true }))
                  );
                  return;
                }
                if (k === "u") {
                  e.preventDefault();
                  exec("underline");
                  requestAnimationFrame(() =>
                    root.dispatchEvent(new Event("input", { bubbles: true }))
                  );
                  return;
                }

                // Inline code: Cmd/Ctrl + .
                if (e.code === "Period" && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleInlineCodeAtSelection(root);
                  requestAnimationFrame(() =>
                    root.dispatchEvent(new Event("input", { bubbles: true }))
                  );
                  return;
                }

                // Code block: Cmd/Ctrl + Shift + .
                if (e.code === "Period" && e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCodeBlockAtSelection(root);
                  requestAnimationFrame(() =>
                    root.dispatchEvent(new Event("input", { bubbles: true }))
                  );
                  return;
                }
              }

              const node = selectionStartNode() || selectionFocusNode();
              const pre = closestTag(node, "PRE", root);
              if (!pre) return;

              // ENTER inside pre
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();

                try {
                  document.execCommand("insertLineBreak");
                } catch {
                  const sel = window.getSelection();
                  if (!sel || sel.rangeCount === 0) return;
                  const range = sel.getRangeAt(0);
                  range.deleteContents();
                  range.insertNode(document.createTextNode("\n"));
                  range.collapse(false);
                  sel.removeAllRanges();
                  sel.addRange(range);
                }

                requestAnimationFrame(() => {
                  root.dispatchEvent(new Event("input", { bubbles: true }));
                });
                return;
              }

              // TAB exits pre
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

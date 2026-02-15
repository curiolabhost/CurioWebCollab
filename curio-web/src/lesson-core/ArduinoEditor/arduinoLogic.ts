// arduinoLogic.ts
import type { Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";

/* =========================
   Types
========================= */

export type VerifyError = {
  line: number;
  column?: number;
  message: string;
};

export type CoachItem = {
  tag: "OK" | "WARN" | "TIP" | "NEXT" | "IDEA";
  line: number | null;
  text: string;
  why: string;
  recommendation: string;
  code: string | null;
};

export type CoachPayload = {
  summary: string;
  hasErrors: boolean;
  sections: { title: string; items: CoachItem[] }[];
};

export type StreamHelpOptions = {
  /**
   * Next.js route that proxies to the model.
   * Defaults to "/api/help" to match your current code.
   */
  endpoint?: string;
  signal?: AbortSignal;
};

export type RateLimitError = Error & { code?: "RATE_LIMIT" };

/* =========================
   Small utils
========================= */

export function makeId() {
  return (globalThis.crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function safeNameFromPath(name: string) {
  const s = String(name || "").trim();
  return s || "ElectricBoard.ino";
}

export function getCodeContext(code: string, lineNumber: number, radius = 3) {
  const lines = String(code || "").split("\n");
  const start = Math.max(0, lineNumber - radius - 1);
  const end = Math.min(lines.length, lineNumber + radius);

  return lines
    .slice(start, end)
    .map((line, i) => {
      const actualLine = start + i + 1;
      const marker = actualLine === lineNumber ? ">> " : "   ";
      return `${marker}${actualLine}: ${line}`;
    })
    .join("\n");
}

// Text formatting (used by popovers)
export function formatAIText(text: string) {
  if (!text) return "";
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

/**
 * Extract first JSON object from a stream that might include extra text.
 * Returns the JSON substring, or null if it doesn't look like a JSON object.
 */
export function extractFirstJsonObject(s: string): string | null {
  const text = String(s || "").trim();
  if (!text.startsWith("{")) return null;

  let depth = 0;
  let inStr = false;
  let esc = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    } else {
      if (ch === '"') {
        inStr = true;
        continue;
      }
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      if (depth === 0) return text.slice(0, i + 1);
    }
  }

  return null;
}

/**
 * Normalize common wrapper shapes your backend might return.
 */
export function normalizeCoachPayload(x: any): CoachPayload | null {
  if (!x) return null;

  if (Array.isArray(x.sections)) return x as CoachPayload;
  if (x.coachJson && Array.isArray(x.coachJson.sections)) return x.coachJson as CoachPayload;
  if (x.payload && Array.isArray(x.payload.sections)) return x.payload as CoachPayload;
  if (x.result && Array.isArray(x.result.sections)) return x.result as CoachPayload;
  if (x.data && Array.isArray(x.data.sections)) return x.data as CoachPayload;

  return null;
}

/* =========================
   Verify helpers
========================= */

function isIdentChar(ch: string) {
  return /[A-Za-z0-9_]/.test(ch);
}

/**
 * Convert verify errors into CodeMirror diagnostics.
 * Pure function: does not touch editor state, only reads view doc.
 */
export function verifyErrorsToDiagnostics(view: EditorView, errors: VerifyError[]): Diagnostic[] {
  const doc = view.state.doc;

  return (errors || []).map((e) => {
    const ln = Math.max(1, Math.min(e.line || 1, doc.lines));
    const line = doc.line(ln);
    const text = line.text;

    const col = Math.max(1, e.column || 1);
    let idx = col - 1;
    idx = Math.max(0, Math.min(idx, text.length));

    let probe = idx;
    while (probe > 0 && probe < text.length && /\s/.test(text[probe])) probe--;
    if (probe === idx) {
      while (probe < text.length && /\s/.test(text[probe])) probe++;
    }
    idx = Math.min(probe, Math.max(0, text.length - 1));

    let start = idx;
    let end = idx + 1;

    if (text.length > 0 && isIdentChar(text[idx])) {
      while (start > 0 && isIdentChar(text[start - 1])) start--;
      end = idx;
      while (end < text.length && isIdentChar(text[end])) end++;
    } else {
      start = Math.max(0, Math.min(idx, Math.max(0, text.length - 1)));
      end = Math.min(text.length, start + 1);
    }

    let from = line.from + start;
    let to = line.from + end;

    const docLen = doc.length;
    from = Math.max(0, Math.min(from, docLen));
    to = Math.max(0, Math.min(to, docLen));

    if (to <= from) {
      from = Math.max(line.from, Math.min(line.to - 1, docLen - 1));
      to = Math.min(from + 1, line.to, docLen);
    }

    return {
      from,
      to,
      severity: "error",
      message: e.message,
    };
  });
}

/**
 * Calls your Arduino verify server and tries to parse JSON.
 * Returns both rawText and parsed JSON (if any).
 */
export async function runArduinoVerify(apiBase: string, code: string, signal?: AbortSignal) {
  const res = await fetch(`${apiBase}/verify-arduino`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    signal,
  });

  const rawText = await res.text().catch(() => "");
  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  return { res, rawText, data };
}

/* =========================
   AI streaming (/api/help)
========================= */

/**
 * Streams from your Next route (/api/help) which may respond as:
 * - application/json (single shot)
 * - text/event-stream (SSE)
 * - plain text stream
 *
 * Calls onToken for incremental output. Throws on error.
 */
export async function streamHelpSSE(payload: any, onToken: (t: string) => void, opts: StreamHelpOptions = {}) {
  const endpoint = opts.endpoint ?? "/api/help";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI route failed (${res.status}): ${t}`);
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();

  // JSON mode (single response)
  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => null);
    if (!data) throw new Error("AI returned invalid JSON.");
    if (data.ok === false) throw new Error(data.error || "AI failed.");

    let out: any =
      data.text ??
      data.coach ??
      data.coachJson ??
      data.payload ??
      data.result ??
      data.data ??
      data;

    if (typeof out !== "string") out = JSON.stringify(out);
    const text = String(out || "");
    if (text) onToken(text);
    return;
  }

  if (!res.body) throw new Error("AI route returned no body.");

  const isSSE = contentType.includes("text/event-stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // Plain streaming text fallback
  if (!isSSE) {
    while (true) {
      const { value: chunk, done } = await reader.read();
      if (done) break;
      const textChunk = decoder.decode(chunk, { stream: true });
      if (textChunk) onToken(textChunk);
    }
    return;
  }

  // SSE mode
  while (true) {
    const { value: chunk, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(chunk, { stream: true });
    buffer = buffer.replace(/\r\n/g, "\n");

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const evt of events) {
      const lines = evt.split("\n");

      let eventType = "message";
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          let d = line.slice(5);
          if (d.startsWith(" ")) d = d.slice(1);
          dataLines.push(d);
        }
      }

      const data = dataLines.join("\n");

      if (eventType === "token") {
        try {
          const parsed = JSON.parse(data || "{}");
          if (typeof parsed?.token === "string" && parsed.token.length) onToken(parsed.token);
        } catch {
          if (data) onToken(data);
        }
      }

      if (eventType === "done") {
        return;
      }

      if (eventType === "error") {
        let msg = "AI request failed.";
        try {
          msg = JSON.parse(data || "{}")?.error || msg;
        } catch {
          if (data) msg = data;
        }

        const isRateLimit = /rate limit/i.test(msg) || /Please try again/i.test(msg);
        const err = new Error(msg) as RateLimitError;
        if (isRateLimit) err.code = "RATE_LIMIT";
        throw err;
      }
    }
  }
}

/* =========================
   Coach stream parsing (optional helper)
   - This keeps state internally, so ArduinoEditor can just feed chunks.
========================= */

function coerceLineToItemTag(line: string): CoachItem["tag"] {
  const m = line.match(/^\[(OK|WARN|TIP|NEXT|IDEA)\]/i);
  if (!m) return "TIP";
  return m[1].toUpperCase() as CoachItem["tag"];
}

function parseLineNumberFromText(s: string): number | null {
  const m = String(s || "").match(/\bline\s*(\d+)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function stripLeadingTag(line: string) {
  return String(line || "")
    .replace(/^\[(OK|WARN|TIP|NEXT|IDEA)\]\s*/i, "")
    .trim();
}

export function makeEmptyCoach(errors: VerifyError[]): CoachPayload {
  return {
    summary: errors?.length
      ? `Reviewing your code (${errors.length} issue${errors.length === 1 ? "" : "s"})…`
      : "Reviewing your code…",
    hasErrors: !!errors?.length,
    sections: [],
  };
}

/**
 * A small parser that turns streamed text lines into a CoachPayload.
 * Usage:
 *   const parser = createCoachStreamParser(makeEmptyCoach(errors), (p) => setCoachLive(p));
 *   parser.ingestChunk(tokenChunk)
 *   parser.flush() // at end
 */
export function createCoachStreamParser(
  initial: CoachPayload,
  onUpdate?: (p: CoachPayload) => void
) {
  let payload: CoachPayload = { ...initial, sections: [...(initial.sections || [])] };
  let lineBuf = "";

  const emit = () => onUpdate?.({ ...payload, sections: [...payload.sections] });

  function ensureSection(title: string) {
    const t = String(title || "Feedback").trim() || "Feedback";
    payload.sections = [...(payload.sections || []), { title: t, items: [] }];
    emit();
  }

  function ensureAtLeastOneSection() {
    if (!Array.isArray(payload.sections) || payload.sections.length === 0) ensureSection("Feedback");
  }

  function appendItem(item: CoachItem, sectionIndex?: number) {
    ensureAtLeastOneSection();
    const idx =
      typeof sectionIndex === "number" && sectionIndex >= 0 && sectionIndex < payload.sections.length
        ? sectionIndex
        : payload.sections.length - 1;

    const sec = payload.sections[idx];
    const nextSec = { ...sec, items: [...(sec.items || []), item] };
    payload.sections = payload.sections.map((s, i) => (i === idx ? nextSec : s));
    emit();
  }

  function ingestLine(rawLine: string) {
    const line = String(rawLine || "").trimEnd();
    if (!line.trim()) return;

    if (/^(OK|WARN|TIP|NEXT|IDEA)\s*$/i.test(line.trim())) return;

    // NDJSON / JSONL structured objects
    if (line.trim().startsWith("{")) {
      try {
        const obj: any = JSON.parse(line);
        const type = String(obj?.type || "").toLowerCase();

        if (type === "summary") {
          payload = {
            ...payload,
            summary: String(obj?.summary ?? payload.summary ?? "Thinking…"),
            hasErrors: typeof obj?.hasErrors === "boolean" ? obj.hasErrors : payload.hasErrors,
          };
          emit();
          return;
        }

        if (type === "section") {
          ensureSection(String(obj?.title || obj?.name || "Feedback"));
          return;
        }

        if (type === "item") {
          const it: any = obj?.item ?? obj;
          const tag = String(it?.tag || "TIP").toUpperCase() as CoachItem["tag"];
          const ln = it?.line == null ? null : Number(it.line);

          appendItem(
            {
              tag: (tag as any) || "TIP",
              line: Number.isFinite(ln) ? ln : null,
              text: String(it?.text ?? ""),
              why: String(it?.why ?? ""),
              recommendation: String(it?.recommendation ?? ""),
              code: it?.code != null ? String(it.code) : null,
            },
            typeof it?.sectionIndex === "number" ? it.sectionIndex : undefined
          );
          return;
        }
      } catch {
        // fall through to text parsing
      }
    }

    // Section markers
    const sec1 = line.match(/^\[SECTION\]\s*(.+)$/i);
    const sec2 = line.match(/^#{1,3}\s+(.+)$/);
    if (sec1 || sec2) {
      ensureSection((sec1 ? sec1[1] : sec2 ? sec2[1] : "Feedback") || "Feedback");
      return;
    }

    // Summary marker
    const sum = line.match(/^\[SUMMARY\]\s*(.+)$/i) || line.match(/^summary\s*:\s*(.+)$/i);
    if (sum) {
      payload = { ...payload, summary: String(sum[1] || payload.summary || "Thinking…") };
      emit();
      return;
    }

    // Item line
    const tag = coerceLineToItemTag(line);
    const body = stripLeadingTag(line);
    const maybeLine = parseLineNumberFromText(body);

    appendItem({
      tag,
      line: maybeLine,
      text: body,
      why: "",
      recommendation: "",
      code: null,
    });
  }

  function ingestChunk(chunk: string) {
    lineBuf += String(chunk || "");
    const buf = lineBuf.replace(/\r\n/g, "\n");
    const parts = buf.split("\n");
    lineBuf = parts.pop() ?? "";
    for (const l of parts) ingestLine(l);
  }

  function flush() {
    if (lineBuf.trim()) ingestLine(lineBuf);
    lineBuf = "";
  }

  function getPayload() {
    return payload;
  }

  return { ingestChunk, flush, getPayload };
}

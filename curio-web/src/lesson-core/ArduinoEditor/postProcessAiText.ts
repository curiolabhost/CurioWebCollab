// postProcessAiText.ts

export type PostProcessMode = "repair" | "reject";

export type PostProcessResult =
  | { ok: true; text: string; warnings: string[] }
  | { ok: false; reason: string; text?: string; warnings?: string[] };

function isStandaloneTokenLine(line: string) {
  const s = line.trim();

  // empty line isn't a violation
  if (!s) return false;

  // a single backticked token, like `;` or `i`
  if (/^`[^`]{1,12}`$/.test(s)) return true;

  // pure punctuation/symbols on their own line
  if (/^[;:,.(){}\[\]<>+\-*/=!?&|%^~]+$/.test(s)) return true;

  return false;
}

/**
 * Inline code spans (`...`) that are too short render like annoying "code pills".
 * We unwrap ONLY bare identifiers (e.g., `rtc`) below a threshold, but we KEEP
 * syntax-y spans like `rtc;`, `()`, `{}`, `0x3C`, `A4`, `i++`, etc.
 *
 * Example: `rtc` -> rtc
 * Keeps: `RTC_DS1307 rtc;` and `rtc;` as code.
 */
function unwrapTinyInlineCodeSpans(text: string, warnings: string[], minLen = 10) {
  return text.replace(/`([^\n`]+)`/g, (_m, inner: string) => {
    const raw = String(inner ?? "");
    const trimmed = raw.trim();

    // 1) Syntax-only spans (never useful as code pills)
    // Examples: `;` `()` `{}` `[]` `,` `:` `->` `==`
    const isPureSyntax = /^[;:,.(){}\[\]<>+\-*/=!?&|%^~]+$/.test(trimmed);

    if (isPureSyntax) {
      warnings.push("Unwrapped inline syntax-only code span.");
      return raw;
    }

    // 2) Bare identifier spans (like `rtc`) below threshold
    const isBareIdentifier = /^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed);

    if (isBareIdentifier && trimmed.length > 0 && trimmed.length < minLen) {
      warnings.push(`Unwrapped short inline identifier (<${minLen} chars).`);
      return raw;
    }

    // 3) Optional: unwrap extremely tiny numeric literals
    // Example: `1` or `0`
    // BUT keep hex like `0x3C` (very meaningful)
    const isTinyNumber = /^[0-9]{1,2}$/.test(trimmed);
    const isHex = /^0x[0-9A-Fa-f]+$/.test(trimmed);

    if (isTinyNumber && !isHex) {
      warnings.push("Unwrapped tiny numeric literal.");
      return raw;
    }

    // Otherwise keep inline code
    return "`" + raw + "`";
  });
}

function escapePipesInLineNumberedLines(text: string, warnings: string[]) {
  // Only escape pipes that look like line-number prefixes: "  6| something"
  return text.replace(/(^|\n)(\s*\d+)\|\s/g, (_m, nl, n) => {
    warnings.push("Escaped '|' in line-numbered text to avoid Markdown tables.");
    return `${nl}${n}: `;
  });
}

function collapseFencedBlocksToInline(text: string, warnings: string[]) {
  // Replace ```lang?\n...\n``` with either inline `...` (if short) or plain text (no fence)
  return text.replace(/```[^\n]*\n([\s\S]*?)\n```/g, (_m, inner: string) => {
    const raw = String(inner ?? "").trim();

    // If it's tiny (single token / short), inline it
    if (raw.length > 0 && raw.length <= 30 && !raw.includes("\n")) {
      warnings.push("Collapsed a fenced code block into inline backticks.");
      return "`" + raw.replace(/`/g, "") + "`";
    }

    // Otherwise, remove fences but keep content
    warnings.push("Removed a fenced code block (kept content without fences).");
    return raw;
  });
}

function collapseIndentedCodeBlocks(text: string, warnings: string[]) {
  // Markdown treats lines starting with 4 spaces or a tab as code blocks.
  const lines = text.split("\n");
  let inIndentedBlock = false;

  const out = lines.map((line) => {
    const isIndented = /^\t| {4,}/.test(line);

    if (isIndented) {
      inIndentedBlock = true;
      warnings.push("Removed indentation that could render as a code block.");
      return line.replace(/^\t|^ {4,}/, "");
    }

    if (inIndentedBlock && line.trim() === "") {
      inIndentedBlock = false;
    }

    return line;
  });

  return out.join("\n");
}

function fixStandaloneTokenLines(text: string, warnings: string[]) {
  // If a line is only a token, append it to the previous non-empty line.
  const lines = text.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isStandaloneTokenLine(line)) {
      const token = line.trim().replace(/^`|`$/g, "");

      // find previous non-empty line
      let j = out.length - 1;
      while (j >= 0 && out[j].trim() === "") j--;

      if (j >= 0) {
        warnings.push("Merged a standalone token line into the previous line.");
        const inline = "`" + token.replace(/`/g, "") + "`";
        out[j] = out[j].replace(/\s+$/, "") + " " + inline;
      } else {
        warnings.push("Rewrote a standalone token line to include context.");
        out.push("Use this symbol: `" + token.replace(/`/g, "") + "`.");
      }

      continue;
    }

    out.push(line);
  }

  return out.join("\n");
}

function containsFencedCode(text: string) {
  return /```/.test(text);
}

function containsIndentedCodeBlock(text: string) {
  return /(^|\n)(\t| {4,})\S/.test(text);
}

/**
 * Post-process assistant output to avoid rendering code blocks.
 * - mode="repair": attempts to fix and returns ok=true.
 * - mode="reject": returns ok=false if any violation is present.
 */
export function postProcessAiText(raw: string, mode: PostProcessMode = "repair"): PostProcessResult {
  const warnings: string[] = [];
  let text = String(raw ?? "").replace(/\r\n/g, "\n");

  const hadFence = containsFencedCode(text);
  const hadIndent = containsIndentedCodeBlock(text);

  if (mode === "reject") {
    if (hadFence) return { ok: false, reason: "Output contains fenced code blocks (```)", text };
    if (hadIndent) return { ok: false, reason: "Output contains indented code blocks (4 spaces/tab)", text };

    if (text.split("\n").some(isStandaloneTokenLine)) {
      return { ok: false, reason: "Output contains standalone token line (e.g., ';' alone)", text };
    }

    return { ok: true, text, warnings };
  }

  // repair mode
  text = collapseFencedBlocksToInline(text, warnings);
  text = collapseIndentedCodeBlocks(text, warnings);
  text = fixStandaloneTokenLines(text, warnings);
  text = escapePipesInLineNumberedLines(text, warnings);


  // Unwrap tiny inline-code spans ONLY when they are bare identifiers (e.g., `rtc`)
  // so we don't "strip code styling" from spans like `rtc;` or `0x3C`.
  text = unwrapTinyInlineCodeSpans(text, warnings, 10);

  // Final safety: remove any lingering fences
  if (containsFencedCode(text)) {
    warnings.push("Removed lingering ``` markers.");
    text = text.replace(/```/g, "");
  }

  return { ok: true, text, warnings };
}

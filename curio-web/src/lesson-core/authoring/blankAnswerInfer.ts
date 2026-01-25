// src/lesson-core/authoring/blankAnswerInfer.ts

export type InferredBlank = {
  name: string;
  value: string;          // inferred filled text
  ok: boolean;
  warning?: string;
};

export function extractBlankNames(templateCode: string): string[] {
  const re = /__BLANK\[\s*([A-Za-z0-9_:-]+)\s*\]__/g;
  const names: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(templateCode)) !== null) {
    const name = m[1];
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

/**
 * Infer blank values by walking the template string and solved string in lockstep.
 * Assumes solved code matches template except blank slots are replaced with content.
 * If mismatches occur, we still try to recover and mark warnings.
 */
export function inferBlankValues(templateCode: string, solvedCode: string): InferredBlank[] {
  const blanks = extractBlankNames(templateCode);
  const results: InferredBlank[] = blanks.map((name) => ({ name, value: "", ok: false }));

  // Pre-split template into segments: text, blank(name), text, blank(name), ...
  const re = /__BLANK\[\s*([A-Za-z0-9_:-]+)\s*\]__/g;
  const parts: Array<{ t: "text"; s: string } | { t: "blank"; name: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(templateCode)) !== null) {
    const start = m.index;
    const end = re.lastIndex;
    const name = m[1];

    if (start > last) parts.push({ t: "text", s: templateCode.slice(last, start) });
    parts.push({ t: "blank", name });
    last = end;
  }
  if (last < templateCode.length) parts.push({ t: "text", s: templateCode.slice(last) });

  // Walk solved string
  let pos = 0;
  const byName: Record<string, InferredBlank> = {};
  for (const r of results) byName[r.name] = r;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];

    if (p.t === "text") {
      const text = p.s;

      // Best effort alignment: if solved at pos starts with this text, consume it
      if (solvedCode.slice(pos, pos + text.length) === text) {
        pos += text.length;
        continue;
      }

      // Otherwise try to find the next occurrence and jump (recovery)
      const idx = solvedCode.indexOf(text, pos);
      if (idx === -1) {
        // cannot align; break out
        // mark remaining blanks as warnings
        for (let j = i + 1; j < parts.length; j++) {
          const pp = parts[j];
          if (pp.t === "blank") {
            const r = byName[pp.name];
            if (r && !r.ok) {
              r.warning = r.warning || "Could not reliably align solved code with template.";
            }
          }
        }
        break;
      } else {
        pos = idx + text.length;
        continue;
      }
    }

    // p.t === "blank"
    const name = p.name;
    const nextText = (() => {
      for (let j = i + 1; j < parts.length; j++) {
        const pp = parts[j];
        if (pp.t === "text" && pp.s.length > 0) return pp.s;
      }
      return null;
    })();

    if (nextText == null) {
      // blank extends to end
      const val = solvedCode.slice(pos);
      byName[name].value = val;
      byName[name].ok = true;
      pos = solvedCode.length;
      continue;
    }

    const nextIdx = solvedCode.indexOf(nextText, pos);
    if (nextIdx === -1) {
      // couldn't find boundary; take rest as best effort
      const val = solvedCode.slice(pos);
      byName[name].value = val;
      byName[name].ok = true;
      byName[name].warning = byName[name].warning || "Could not find next template segment; value may be too long.";
      pos = solvedCode.length;
      continue;
    }

    const val = solvedCode.slice(pos, nextIdx);
    byName[name].value = val;
    byName[name].ok = true;
    pos = nextIdx;
  }

  // Trim inferred values lightly (do NOT normalize aggressively)
  for (const r of results) {
    if (r.ok) r.value = r.value.trim();
    if (!r.ok) r.warning = r.warning || "No value inferred.";
  }

  return results;
}

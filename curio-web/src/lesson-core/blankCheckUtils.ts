/* ============================================================
   blankCheckUtils.ts  (v2 – structured checker, FIXED)
   - Fixes ALL known freeze/hang causes:
     1) tokenize(): infinite loops at end-of-string (RegExp.test(undefined) => "undefined")
     2) tokenize(): unterminated string handling (safe termination)
     3) splitTopLevel(): broken string tracking (toggle bug, escapes, quote char)
     4) applyPolicy(): requireNoSpacesAround regex construction (escaping)
   - Also makes number oneOf robust via getOneOfNumbers() (supports oneOf/values/opts.* and string->number coercion)
   ============================================================ */

/////////////////////////
// Types
/////////////////////////

export type BlankRule = {
  equals?: string;
  oneOf?: string[];
  contains?: string;
  matches?: string;
};

export type CheckPolicy = {
  ignoreWhitespace?: boolean; // default true
  normalizeWhitespace?: boolean; // default true
  allowOuterWrappers?: boolean; // default true
  allowTrailingSemicolon?: boolean; // default true
  allowTrailingComma?: boolean; // default true
  ignoreComments?: boolean; // default true
  caseSensitive?: boolean; // default true
  forbidTokens?: string[]; // e.g. ["{","}","#"]
  requireSingleExpression?: boolean;
  requireNoSpacesAround?: string[]; // e.g. ["."]
};

export type PatternPart =
  | string
  | { p: "sameAs"; target: string }
  | { p: "identifier" }
  | { p: "number" }
  | { p: "string" }
  | { p: "oneOf"; values: string[] }
  | { p: "any"; specs: PatternPart[] };

export type BlankTypedSpec =
  | { type: "identifier"; allowQualified?: boolean; bindAs?: string; policy?: CheckPolicy }
  | { type: "range"; min?: number; max?: number; intOnly?: boolean; oneOf?: number[]; policy?: CheckPolicy }
  | { type: "number"; intOnly?: boolean; tol?: number; oneOf?: number[]; min?: number; max?: number; policy?: CheckPolicy }
  | { type: "string"; regex?: string; requireQuoted?: boolean; oneOf?: string[]; policy?: CheckPolicy }
  | { type: "sameAs"; targets: string[]; policy?: CheckPolicy }
  | { type: "call"; name: string; args?: AnswerSpec[]; policy?: CheckPolicy }
  | { type: "init_list"; elements: AnswerSpec[]; order?: "strict" | "any"; policy?: CheckPolicy }
  | { type: "pattern"; parts: PatternPart[]; policy?: CheckPolicy }
  | { type: "any_of"; options: AnswerSpec[]; policy?: CheckPolicy }
  | { type?: string; values?: any[]; policy?: CheckPolicy };

export type AnswerSpec = BlankRule | BlankTypedSpec | string[] | string;

/////////////////////////
// Utilities
/////////////////////////

export function isValidRegex(re: string) {
  try {
    // eslint-disable-next-line no-new
    new RegExp(re);
    return true;
  } catch {
    return false;
  }
}

export function normalizeWs(s: string) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

export function isPlainObject(x: any) {
  return x != null && typeof x === "object" && !Array.isArray(x);
}

function escapeRegExpLiteral(s: string) {
  // Escape special regex chars: . * + ? ^ $ { } ( ) | [ ] \ /
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Robust extraction of numeric oneOf lists from multiple shapes.
// Supports:
// - { oneOf: [128] }
// - { values: [128] }
// - { oneOf: ["128"] } (coerces to number)
// - { opts: { oneOf: [...] } }, { opts: { values: [...] } }
function getOneOfNumbers(s: any): number[] | null {
  const raw =
    (Array.isArray(s?.oneOf) ? s.oneOf : null) ??
    (Array.isArray(s?.values) ? s.values : null) ??
    (Array.isArray(s?.opts?.oneOf) ? s.opts.oneOf : null) ??
    (Array.isArray(s?.opts?.values) ? s.opts.values : null);

  if (!raw || raw.length === 0) return null;

  const nums = raw
    .map((v: any) => Number(String(v).trim()))
    .filter((n: number) => Number.isFinite(n));

  return nums.length ? nums : null;
}

function stripOuterWrappers(s: string) {
  let t = String(s ?? "").trim();
  // trailing ; and ,
  t = t.replace(/;\s*$/, "").trim();
  for (let i = 0; i < 2; i++) {
    const m = t.match(/^\((.*)\)$/) || t.match(/^\[(.*)\]$/) || t.match(/^\{(.*)\}$/);
    if (m) t = m[1].trim();
  }
  t = t.replace(/,\s*$/, "").trim();
  return t;
}

/////////////////////////
// Numeric parsing
/////////////////////////

function parseNumericLiteral(raw: string): number | null {
  const s = String(raw ?? "").replace(/_/g, "").trim();
  // Accept 0x, 0b, 0o, decimals, scientific, leading-dot decimals
  if (!/^[+\-]?(?:0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?$/.test(s)) {
    return null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/////////////////////////
// Tokenizer
/////////////////////////

type Token = { kind: "id" | "num" | "str" | "op" | "comment"; text: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const src = String(input ?? "");
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // line comment //
    if (ch === "/" && i + 1 < src.length && src[i + 1] === "/") {
      let j = i + 2;
      while (j < src.length && src[j] !== "\n") j++;
      tokens.push({ kind: "comment", text: src.slice(i, j) });
      i = j;
      continue;
    }

    // string literal "..." or '...'
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;

      while (j < src.length) {
        const cj = src[j];
        if (cj === "\\") {
          // skip escaped char (if any)
          j += 2;
          continue;
        }
        if (cj === quote) {
          j++; // include closing quote
          break;
        }
        j++;
      }

      // If unterminated, j will be src.length; slice is still safe.
      tokens.push({ kind: "str", text: src.slice(i, j) });
      i = j;
      continue;
    }

    // identifier
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      // ✅ bounds check prevents RegExp.test(undefined) => "undefined" infinite loop
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      tokens.push({ kind: "id", text: src.slice(i, j) });
      i = j;
      continue;
    }

    // numeric
    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      // ✅ bounds check prevents infinite loop
      while (j < src.length && /[0-9a-fA-FxXbBoOeE+_.-]/.test(src[j])) j++;
      tokens.push({ kind: "num", text: src.slice(i, j) });
      i = j;
      continue;
    }

    // multi-char ops
    const two = src.slice(i, i + 2);
    const ops = ["==", "!=", ">=", "<=", "&&", "||", "++", "--", "::"];
    if (ops.includes(two)) {
      tokens.push({ kind: "op", text: two });
      i += 2;
      continue;
    }

    // single-char op
    tokens.push({ kind: "op", text: ch });
    i++;
  }

  return tokens;
}

/////////////////////////
// Policy preprocessing
/////////////////////////

function applyPolicy(raw: string, policy?: CheckPolicy): { ok: boolean; tokens?: Token[] } {
  let txt = String(raw ?? "");

  const p = policy || {};

  if (p.allowTrailingSemicolon !== false) {
    txt = txt.replace(/;\s*$/, "");
  }

  if (p.allowOuterWrappers !== false) {
    txt = stripOuterWrappers(txt);
  }

  let tokens = tokenize(txt);

  if (p.ignoreComments !== false) {
    tokens = tokens.filter((t) => t.kind !== "comment");
  }

  if (p.forbidTokens?.length) {
    for (const t of tokens) {
      if (p.forbidTokens.includes(t.text)) return { ok: false };
    }
  }

  // ✅ Correct regex: "no spaces around '.'" etc
  if (p.requireNoSpacesAround?.length) {
    for (const op of p.requireNoSpacesAround) {
      const esc = escapeRegExpLiteral(op);
      const re = new RegExp(`\\s${esc}|${esc}\\s`);
      if (re.test(String(raw ?? ""))) return { ok: false };
    }
  }

  return { ok: true, tokens };
}

/////////////////////////
// Parsing helpers
/////////////////////////

function splitTopLevel(src: string) {
  const out: string[] = [];
  let cur = "";
  let depth = 0;

  let inStr = false;
  let quoteChar: '"' | "'" | null = null;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];

    if (inStr) {
      cur += c;
      if (c === "\\") {
        // include escaped char if present
        if (i + 1 < src.length) {
          cur += src[i + 1];
          i++;
        }
        continue;
      }
      if (quoteChar && c === quoteChar) {
        inStr = false;
        quoteChar = null;
      }
      continue;
    }

    // enter string
    if (c === '"' || c === "'") {
      inStr = true;
      quoteChar = c as any;
      cur += c;
      continue;
    }

    if (c === "(" || c === "{" || c === "[") depth++;
    if (c === ")" || c === "}" || c === "]") depth = Math.max(0, depth - 1);

    if (c === "," && depth === 0) {
      const trimmed = cur.trim();
      if (trimmed !== "") out.push(trimmed);
      cur = "";
      continue;
    }

    cur += c;
  }

  const trimmed = cur.trim();
  if (trimmed !== "") out.push(trimmed);
  return out;
}

function parseCall(raw: string) {
  const m = String(raw ?? "").match(/^([A-Za-z_]\w*)\s*\((.*)\)$/);
  if (!m) return null;
  return { name: m[1], args: splitTopLevel(m[2]) };
}

function parseInitList(raw: string) {
  const s = String(raw ?? "").trim();
  if (!s.startsWith("{") || !s.endsWith("}")) return null;
  return { elements: splitTopLevel(s.slice(1, -1)) };
}

/////////////////////////
// Pattern matcher
/////////////////////////

function matchPattern(parts: PatternPart[], tokens: Token[], allValues: Record<string, any>) {
  if (parts.length !== tokens.length) return false;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const t = tokens[i];

    if (typeof p === "string") {
      if (t.text !== p) return false;
      continue;
    }

    if (p.p === "identifier" && t.kind !== "id") return false;
    if (p.p === "number" && t.kind !== "num") return false;
    if (p.p === "string" && t.kind !== "str") return false;

    if (p.p === "oneOf" && !p.values.includes(t.text)) return false;
    if (p.p === "sameAs") {
      const key = String(p.target ?? "").trim();
      const existing = normalizeWs(String(allValues?.[key] ?? ""));
      if (!existing) return true; // nothing to compare yet
      return normalizeWs(t.text) === existing;
    }



    if (p.p === "any") {
      if (!p.specs.some((s) => matchPattern([s], [t], allValues))) return false;
    }
  }

  return true;
}

/////////////////////////
// Legacy BlankRule
/////////////////////////

function evalBlank(rule: BlankRule, value: string): boolean {
  const v = normalizeWs(value);

  if (rule.equals != null) return normalizeWs(rule.equals) === v;
  if (rule.oneOf) return rule.oneOf.some((x) => normalizeWs(x) === v);
  if (rule.contains) return v.includes(normalizeWs(rule.contains));
  if (rule.matches && isValidRegex(rule.matches)) return new RegExp(rule.matches).test(String(value ?? ""));

  return false;
}


/////////////////////////
// Main evaluator
/////////////////////////

export function evalAnswerSpec(spec: AnswerSpec, value: string, allValues: Record<string, any>): boolean {
  const raw = String(value ?? "").trim();

function defineOrEnforceBind(allValues: Record<string, any>, bindAs: any, incoming: string) {
  const key = String(bindAs ?? "").trim();
  if (!key) return true;

  const v = normalizeWs(incoming);
  allValues[key] = v;
  return true;
}




  // OR array
  if (Array.isArray(spec)) {
    return spec.some((s) => evalAnswerSpec(s, raw, allValues));
  }

  // string literal shorthand
  if (typeof spec === "string") {
    return normalizeWs(raw) === normalizeWs(spec);
  }

  // BlankRule (no "type")
  if (isPlainObject(spec) && !("type" in (spec as any))) {
    return evalBlank(spec as BlankRule, raw);
  }

  const s: any = spec;
  const policy = s.policy;
  const prep = applyPolicy(raw, policy);
  if (!prep.ok) return false;
  const tokens = prep.tokens || [];

  switch (s.type) {
    case "identifier": {
      if (!tokens.length) return false;

      // allowQualified: "Foo::bar" or "Foo.Bar" etc (very light support)
      if (s.allowQualified) {
        // join tokens as text for qualified identifiers; still enforce id/op only
        const allowedKinds = tokens.every((t: Token) => t.kind === "id" || (t.kind === "op" && (t.text === "." || t.text === "::")));
        if (!allowedKinds) return false;
        const joined = tokens.map((t: Token) => t.text).join("");
        if (!/^[A-Za-z_]\w*(?:(?:\.)|(?:::))[A-Za-z_]\w*(?:(?:\.)|(?:::)[A-Za-z_]\w*)*$/.test(joined)) return false;

        const key = String(s.bindAs ?? "").trim();
if (key) {
  allValues[key] = tokens[0].text; // ✅ LIVE overwrite
}
return true;
      }

if (tokens.length !== 1 || tokens[0].kind !== "id") return false;

const key = String(s.bindAs ?? "").trim();
if (key) {
  allValues[key] = tokens[0].text; //overwrite to current value
}

return true;

    }

    case "range": {
      const n = parseNumericLiteral(raw);
      if (n == null) return false;
      if (s.intOnly && !Number.isInteger(n)) return false;

      const oneOfNums = getOneOfNumbers(s);
      if (oneOfNums) return oneOfNums.some((x) => x === n);

      if (s.min != null && n < s.min) return false;
      if (s.max != null && n > s.max) return false;
      return true;
    }

    case "number": {
      const n = parseNumericLiteral(raw);
      if (n == null) return false;
      if (s.intOnly && !Number.isInteger(n)) return false;

      const oneOfNums = getOneOfNumbers(s);
      if (oneOfNums) return oneOfNums.some((x) => x === n);

      if (s.min != null && n < s.min) return false;
      if (s.max != null && n > s.max) return false;

      return defineOrEnforceBind(allValues, s.bindAs, raw);
    }

case "string": {
  if (s.requireQuoted && !(raw.startsWith('"') || raw.startsWith("'"))) return false;

  let ok = false;

  if (Array.isArray(s.oneOf) && s.oneOf.length) {
    ok = s.oneOf.some((x: string) => normalizeWs(String(x)) === normalizeWs(raw));
  } else if (s.regex && isValidRegex(s.regex)) {
    ok = new RegExp(s.regex).test(raw);
  } else {
    ok = raw.length > 0;
  }

  if (!ok) return false;

  return defineOrEnforceBind(allValues, (s as any).bindAs, raw);
}
case "sameAs": {
  const targets: string[] = Array.isArray(s.targets) ? s.targets : [];
  const v = normalizeWs(raw);

  let sawAnyExisting = false;

  for (const k of targets) {
    const key = String(k || "").trim();
    if (!key) continue;

    const existingRaw = allValues?.[key];
    const existing = normalizeWs(String(existingRaw ?? ""));

    if (!existing) continue;

    sawAnyExisting = true;

    if (v === existing) return true;
  }

  // If nothing to compare against yet, do NOT mark wrong
  if (!sawAnyExisting) return true;

  return false;
}


    case "call": {
      const parsed = parseCall(raw);
      if (!parsed || parsed.name !== s.name) return false;
      if (!s.args) return true;
      if (parsed.args.length !== s.args.length) return false;
      return parsed.args.every((a: string, i: number) => evalAnswerSpec(s.args[i], a, allValues));
    }

    case "init_list": {
      const parsed = parseInitList(raw);
      if (!parsed) return false;
      if (parsed.elements.length !== s.elements.length) return false;

      if (s.order !== "any") {
        return parsed.elements.every((e: string, i: number) => evalAnswerSpec(s.elements[i], e, allValues));
      }

      const used: boolean[] = [];
      return s.elements.every((exp: any) =>
        parsed.elements.some((g: string, j: number) => {
          if (used[j]) return false;
          const ok = evalAnswerSpec(exp, g, allValues);
          if (ok) used[j] = true;
          return ok;
        })
      );
    }

    case "pattern":
      return matchPattern(s.parts, tokens, allValues);

    case "any_of":
      return s.options.some((o: any) => evalAnswerSpec(o, raw, allValues));

    default: {
      if (Array.isArray(s.values)) {
        return s.values.some((v: any) => normalizeWs(String(v)) === normalizeWs(raw));
      }
      return false;
    }
  }
}

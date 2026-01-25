// blankKeyGenerator.ts

import { AnswerSpec, PatternPart } from "./blankCheckUtils";
import { K } from "./blankKeyBuilder";

// reuse tokenizer logic (simplified)
type Token = { kind: "id" | "num" | "str" | "op"; text: string };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== ch) {
        if (src[j] === "\\") j++;
        j++;
      }
      j++;
      tokens.push({ kind: "str", text: src.slice(i, j) });
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (/[A-Za-z0-9_]/.test(src[j])) j++;
      tokens.push({ kind: "id", text: src.slice(i, j) });
      i = j;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (/[0-9a-fA-FxXbBoOeE+_.-]/.test(src[j])) j++;
      tokens.push({ kind: "num", text: src.slice(i, j) });
      i = j;
      continue;
    }

    const two = src.slice(i, i + 2);
    const ops = ["==", "!=", ">=", "<=", "&&", "||", "++", "--", "::"];
    if (ops.includes(two)) {
      tokens.push({ kind: "op", text: two });
      i += 2;
      continue;
    }

    tokens.push({ kind: "op", text: ch });
    i++;
  }

  return tokens;
}

// ---------------------------
// Generator
// ---------------------------

export function generateKeyFromReference(
  referenceCode: string,
  options?: {
    bind?: Record<string, string>; // mapping from variable name → binding key
  }
): AnswerSpec {
  const bindMap = options?.bind || {};
  const tokens = tokenize(referenceCode);

  const parts: PatternPart[] = tokens.map((t) => {
    if (t.kind === "id") {
      if (bindMap[t.text]) {
        return { p: "sameAs", target: bindMap[t.text] };
      }
      return { p: "identifier" };
    }

    if (t.kind === "num") return { p: "number" };
    if (t.kind === "str") return { p: "string" };

    return t.text;
  });

  return K.pattern(...parts).build();
}

// Convenience for arrays of blanks

export function generateAnswerKeyMap(
  mapping: Record<
    string,
    { code: string; bind?: Record<string, string> }
  >
) {
  const out: Record<string, AnswerSpec> = {};

  for (const [blankName, cfg] of Object.entries(mapping)) {
    out[blankName] = generateKeyFromReference(cfg.code, {
      bind: cfg.bind,
    });
  }

  return out;
}

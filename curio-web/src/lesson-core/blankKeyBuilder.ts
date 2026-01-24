// blankKeyBuilder.ts

import { BlankTypedSpec, AnswerSpec, PatternPart, CheckPolicy } from "./blankCheckUtils";

class KeyBuilder {
  spec: BlankTypedSpec;

  constructor(spec: BlankTypedSpec) {
    this.spec = spec;
  }

  // ---------- modifiers ----------

  bind(name: string) {
    (this.spec as any).bindAs = name;
    return this;
  }

  semi() {
    this.ensurePolicy().allowTrailingSemicolon = true;
    return this;
  }

  strict() {
    this.ensurePolicy().ignoreWhitespace = false;
    return this;
  }

  noOuterWrappers() {
    this.ensurePolicy().allowOuterWrappers = false;
    return this;
  }

  forbid(...tokens: string[]) {
    this.ensurePolicy().forbidTokens = tokens;
    return this;
  }

  noSpacesAround(...ops: string[]) {
    this.ensurePolicy().requireNoSpacesAround = ops;
    return this;
  }

  range(min?: number, max?: number) {
    if (this.spec.type === "number" || this.spec.type === "range") {
      (this.spec as any).type = "range";
      (this.spec as any).min = min;
      (this.spec as any).max = max;
    }
    return this;
  }

  int() {
    (this.spec as any).intOnly = true;
    return this;
  }

  build(): AnswerSpec {
    return this.spec;
  }

  private ensurePolicy(): CheckPolicy {
    if (!(this.spec as any).policy) (this.spec as any).policy = {};
    return (this.spec as any).policy!;
  }
}

type NumOpts = {
  oneOf?: number[];
  min?: number;
  max?: number;
  intOnly?: boolean;
};

type StrOpts = {
  oneOf?: string[];
  regex?: string;
  requireQuoted?: boolean;
};


// ------------------------
// Public DSL
// ------------------------

export const K = {
  id: () => new KeyBuilder({ type: "identifier" }),

    num: (opts?: NumOpts) => {
    const o = opts || {};

    // if min/max specified, prefer "range"
    const isRange = typeof o.min === "number" || typeof o.max === "number";
    const spec: any = isRange
        ? { type: "range", min: o.min, max: o.max }
        : { type: "number" };

    if (Array.isArray(o.oneOf)) spec.oneOf = o.oneOf;
    if (typeof o.intOnly === "boolean") spec.intOnly = o.intOnly;

    return new KeyBuilder(spec);
    },

    str: (opts?: StrOpts) => {
    const o = opts || {};
    const spec: any = { type: "string" };

    if (Array.isArray(o.oneOf)) spec.oneOf = o.oneOf;
    if (typeof o.regex === "string") spec.regex = o.regex;
    if (typeof o.requireQuoted === "boolean") spec.requireQuoted = o.requireQuoted;

    return new KeyBuilder(spec);
    },


  kw: (v: string) => v,

  same: (target: string) =>
    new KeyBuilder({ type: "sameAs", targets: [target] }),

  oneOf: (...vals: string[]) => vals,

  call: (name: string, ...args: AnswerSpec[]) =>
    new KeyBuilder({ type: "call", name, args }),

  array: (...elements: AnswerSpec[]) =>
    new KeyBuilder({ type: "init_list", elements }),

index: (base: PatternPart, idx: PatternPart) =>
  new KeyBuilder({
    type: "pattern",
    parts: [base, "[", idx, "]"],
  }),
  
  pattern: (...parts: PatternPart[]) =>
    new KeyBuilder({ type: "pattern", parts }),

  anyOf: (...options: AnswerSpec[]) =>
    new KeyBuilder({ type: "any_of", options }),

  raw: (spec: BlankTypedSpec) => new KeyBuilder(spec),
};

// Optional helper to finalize object maps cleanly
export function buildAnswerKey(obj: Record<string, KeyBuilder | AnswerSpec>) {
  const out: Record<string, AnswerSpec> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v instanceof KeyBuilder ? v.build() : v;
  }
  return out;
}

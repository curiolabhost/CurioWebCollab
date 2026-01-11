
export type BlankRule = {
  equals?: string;
  oneOf?: string[];
  contains?: string;
  matches?: string; // regex string
};

// ---- Restored "JS-era" typed specs (range / sameAs / etc.) ----
export type BlankTypedSpec =
  | { type: "identifier" }
  | { type: "range"; min?: number; max?: number }
  | { type: "number" }
  | { type: "sameAs"; targets: string[] }
  | { type: "string"; regex?: string }
  | { type?: string; values?: any[] }; // fallback: values list

export type AnswerSpec = BlankRule | BlankTypedSpec | string[] | string;

// =========================
// Helpers
// =========================
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

// =========================
// Blank evaluation
// =========================
export function evalBlank(rule: BlankRule, value: string): boolean {
  const v = String(value ?? "");
  if (!rule) return false;

  if (typeof rule.equals === "string") {
    return normalizeWs(v) === normalizeWs(rule.equals);
  }

  if (Array.isArray(rule.oneOf)) {
    const nv = normalizeWs(v);
    return rule.oneOf.some((x) => normalizeWs(x) === nv);
  }

  if (typeof rule.contains === "string") {
    return normalizeWs(v).includes(normalizeWs(rule.contains));
  }

  if (typeof rule.matches === "string" && isValidRegex(rule.matches)) {
    const re = new RegExp(rule.matches);
    return re.test(v);
  }

  return false;
}

// =========================
// AnswerSpec evaluation
// (typed specs + arrays + sameAs)
// =========================
export function evalAnswerSpec(
  spec: AnswerSpec,
  value: string,
  allValues: Record<string, any>
): boolean {
  const raw = String(value ?? "").trim();

  // arrays: ["begin", "start"]
  if (Array.isArray(spec)) {
    return spec.some((entry) => evalAnswerSpec(entry as any, raw, allValues));
  }

  // string shorthand: "begin"
  if (typeof spec === "string") {
    return raw === spec.trim();
  }

  // typed objects (old JS)
  if (isPlainObject(spec) && typeof (spec as any).type === "string") {
    const t = String((spec as any).type);

    switch (t) {
      case "identifier":
        return /^[A-Za-z_][A-Za-z0-9_]*$/.test(raw);

      case "range": {
        const num = Number(raw);
        if (Number.isNaN(num)) return false;
        const min = (spec as any).min ?? -Infinity;
        const max = (spec as any).max ?? Infinity;
        return num >= min && num <= max;
      }

      case "number": {
        const num = Number(raw);
        return !Number.isNaN(num);
      }

      case "sameAs": {
        const s: any = spec;

        const targets: string[] = Array.isArray(s.targets)
          ? s.targets
          : typeof s.target === "string"
            ? [s.target]
            : [];

        if (targets.length === 0) return false;

        const normalizedUser = normalizeWs(raw);
        if (!normalizedUser) return false;

        return targets.some((t) => {
          const key = String(t ?? "").trim();
          if (!key) return false;

          const otherVal = normalizeWs(String(allValues?.[key] ?? ""));
          return otherVal !== "" && normalizedUser === otherVal;
        });
      }

      case "string": {
        const re = (spec as any).regex;
        if (!raw) return false;
        if (typeof re === "string" && re.length > 0 && isValidRegex(re)) {
          return new RegExp(re).test(raw);
        }
        return true;
      }

      default: {
        const arr = Array.isArray((spec as any).values) ? (spec as any).values : [];
        return arr.some((v: any) => raw === String(v).trim());
      }
    }
  }

  // otherwise treat as BlankRule
  return evalBlank(spec as BlankRule, raw);
}

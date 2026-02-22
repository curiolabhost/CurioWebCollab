// app/tools/lesson-studio/_lib/exportProjectCode.ts
import type { LessonStudioProject } from "./projectTypes";

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function asTemplateString(s: string) {
  // nicer for long paragraphs than "..."
  return "`" + esc(s) + "`";
}

function asStringLiteral(s: string) {
  return JSON.stringify(s ?? "");
}

function asStringArray(input: unknown) {
  let arr: string[] = [];

  if (Array.isArray(input)) {
    // ensure everything becomes string
    arr = input.map((x) =>
      typeof x === "string" ? x : String(x ?? "")
    );
  } else if (typeof input === "string") {
    const raw = input.trim();

    if (!raw) {
      arr = [];
    } else if (raw.includes("\n")) {
      arr = raw.split("\n");
    } else if (raw.includes(",")) {
      arr = raw.split(",");
    } else {
      arr = [raw];
    }
  } else {
    arr = [];
  }

  const cleaned = arr
    .map((x) => x.trim())
    .filter(Boolean);

  return `[${cleaned.map((x) => asStringLiteral(x)).join(", ")}]`;
}

function pickCategory(raw: string): "Electronics" | "Robotics" | "IoT" {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("robot")) return "Robotics";
  if (s.includes("iot")) return "IoT";
  return "Electronics";
}

function normalizeSlug(slug: string) {
  return (slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generates the object you paste inside `withCompat({ ... })`
 * in your PROJECTS array.
 */
export function exportProjectsEntry(project: LessonStudioProject, options?: { idNumber?: number }) {
  const idNumber = options?.idNumber ?? 999;
  const slug = normalizeSlug(project.slug || project.id);

  // your frontend expects "prerequisites" while studio store might be prerequisitesList
  const prerequisites = (project as any).prerequisites ?? (project as any).prerequisitesList ?? [];

  const code = `withCompat({
  id: ${idNumber},
  slug: ${asStringLiteral(slug)},
  title: ${asStringLiteral(project.title || project.name || "Untitled Project")},
  description: ${asTemplateString(project.description || "")},
  fullDescription: ${asTemplateString(project.fullDescription || "")},
  difficulties: ${asStringArray(project.difficulties as any)},
  category: ${asStringLiteral(pickCategory(project.category))},
  available: ${project.available ? "true" : "false"},
  image: ${asStringLiteral(project.image || "")},
  ageRange: ${asStringLiteral(project.ageRange || "")},
  hours: ${asStringLiteral(project.hours || "")},
  materials: ${asStringArray(project.materials)},
  skills: ${asStringArray(project.skills)},
  learningOutcomes: ${asStringArray(project.learningOutcomes)},
  prerequisites: ${asStringArray(prerequisites)},
  projectHighlights: ${asStringArray(project.projectHighlights)},
})`;

  return { slug, code };
}

/**
 * Intro data export: generates a full file content like electricStatusBoardData.ts
 * Icons:
 * - Studio should store iconName string (e.g. "Monitor", "Cpu", "Clock", "Timer")
 * - Exporter writes lucide imports based on those names.
 */
const ALLOWED_LUCIDE = new Set([
  "Monitor",
  "Cpu",
  "Code",
  "Zap",
  "Clock",
  "Timer",
  "Lightbulb",
  "Wrench",
  "Target",
  "Award",
]);

function collectIconImports(project: LessonStudioProject) {
  const feats = project.intro?.features ?? [];
  const names = feats.map((f: any) => String(f.iconName || "").trim()).filter(Boolean);

  // fallback: if none set, pick a few safe ones
  const used = new Set<string>();
  for (const n of names) {
    if (ALLOWED_LUCIDE.has(n)) used.add(n);
  }
  if (used.size === 0) {
    used.add("Monitor");
    used.add("Cpu");
    used.add("Clock");
    used.add("Timer");
  }

  // you also use LucideIcon type in your interface file
  used.add("LucideIcon");

  return Array.from(used).sort((a, b) => a.localeCompare(b));
}

function featureIconExpr(iconName?: string) {
  const n = String(iconName || "").trim();
  if (ALLOWED_LUCIDE.has(n)) return n;
  return "Monitor";
}

export function exportIntroDataFile(project: LessonStudioProject) {
  const slug = normalizeSlug(project.slug || project.id);
  const constName =
    slug
      .split("-")
      .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
      .join("") + "Data";

  const imports = collectIconImports(project);

  const intro = project.intro;

  const file = `import { ${imports.join(", ")} } from "lucide-react";

export interface ProjectFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ProjectLevel {
  id: "beginner" | "intermediate" | "advanced";
  title: string;
  duration: string;
  description: string;
  features: string[];
  color: "green" | "blue" | "purple";
}

export interface WorkflowStep {
  step: number;
  title: string;
  description: string;
}

export interface ProjectData {
  id: string;
  title: string;
  subtitle: string;
  headerInfo: {
    difficulty: string;
    duration: string;
    components: string;
  };
  imageUrl: string;
  features: ProjectFeature[];
  capabilities: string[];
  workflows: {
    beginner: WorkflowStep[];
    intermediate: WorkflowStep[];
    advanced: WorkflowStep[];
  };
  levels: ProjectLevel[];
}

export const ${constName}: ProjectData = {
  id: ${asStringLiteral(slug)},
  title: ${asStringLiteral(project.title || project.name || "Untitled Project")},
  subtitle: ${asTemplateString(intro?.subtitle || "")},
  headerInfo: {
    difficulty: ${asStringLiteral(intro?.headerInfo?.difficulty || "")},
    duration: ${asStringLiteral(intro?.headerInfo?.duration || "")},
    components: ${asStringLiteral(intro?.headerInfo?.components || "")},
  },
  imageUrl: ${asStringLiteral(project.image || "")},

  features: [
${(intro?.features ?? [])
  .map((f: any) => {
    return `    {
      icon: ${featureIconExpr(f.iconName)},
      title: ${asStringLiteral(f.title || "")},
      description: ${asTemplateString(f.description || "")},
    },`;
  })
  .join("\n")}
  ],

  capabilities: ${asStringArray(intro?.capabilities || [])},

  workflows: {
    beginner: [
${(intro?.workflows?.beginner ?? [])
  .map((w: any) => {
    const stepNum = Number(w.step) || 1;
    return `      {
        step: ${stepNum},
        title: ${asStringLiteral(w.title || "")},
        description: ${asTemplateString(w.description || "")},
      },`;
  })
  .join("\n")}
    ],
    intermediate: [
${(intro?.workflows?.intermediate ?? [])
  .map((w: any) => {
    const stepNum = Number(w.step) || 1;
    return `      {
        step: ${stepNum},
        title: ${asStringLiteral(w.title || "")},
        description: ${asTemplateString(w.description || "")},
      },`;
  })
  .join("\n")}
    ],
    advanced: [
${(intro?.workflows?.advanced ?? [])
  .map((w: any) => {
    const stepNum = Number(w.step) || 1;
    return `      {
        step: ${stepNum},
        title: ${asStringLiteral(w.title || "")},
        description: ${asTemplateString(w.description || "")},
      },`;
  })
  .join("\n")}
    ],
  },

  levels: [
${(intro?.levels ?? [])
  .map((lvl: any) => {
    return `    {
      id: ${asStringLiteral(lvl.id)},
      title: ${asStringLiteral(lvl.title || "")},
      duration: ${asStringLiteral(lvl.duration || "")},
      description: ${asTemplateString(lvl.description || "")},
      features: ${asStringArray(lvl.features || [])},
      color: ${asStringLiteral(lvl.color || "green")},
    },`;
  })
  .join("\n")}
  ],
};
`;

  return { slug, constName, file };
}

export function exportIntroRegistrySnippet(project: LessonStudioProject, options?: { levelToLessonSlug?: Record<"beginner"|"intermediate"|"advanced", string> }) {
  const slug = normalizeSlug(project.slug || project.id);
  const levelToLessonSlug = options?.levelToLessonSlug ?? {
    beginner: "code-beg",
    intermediate: "code-int",
    advanced: "code-adv",
  };

  // the const name must match exportIntroDataFile()
  const constName =
    slug
      .split("-")
      .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
      .join("") + "Data";

  const importLine = `import { ${constName} } from "./projects/${slug}/lessons/intro/${constName}";`;

  const registryEntry = `"${slug}": {
    data: ${constName},
    levelToLessonSlug: {
      beginner: ${asStringLiteral(levelToLessonSlug.beginner)},
      intermediate: ${asStringLiteral(levelToLessonSlug.intermediate)},
      advanced: ${asStringLiteral(levelToLessonSlug.advanced)},
    },
  },`;

  return { slug, constName, importLine, registryEntry };
}
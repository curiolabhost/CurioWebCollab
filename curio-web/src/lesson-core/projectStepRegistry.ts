/**
 * Registry of project step data for computing total steps (admin progress, etc.).
 * Uses the same counting logic as CodeLessonBase — excludes optional lessons and optional steps.
 * Add new projects here when they have lesson content.
 */
import {
  countCountedStepsInLessonSteps,
  countCountedStepsInLessonStepsExcludingAdvanced,
} from "./stepCountUtils";

// Electric-status-board: code-beg, code-int, code-adv, circuit-beg, circuit-int
import { LESSON_STEPS_BEGINNER } from "@/src/projects/electric-status-board/lessons/codeBeg";
import { LESSON_STEPS_INTERMEDIATE as LESSON_STEPS_INT } from "@/src/projects/electric-status-board/lessons/codeInt";
import { LESSON_STEPS_INTERMEDIATE as LESSON_STEPS_ADV } from "@/src/projects/electric-status-board/lessons/codeAdv";
import { LESSON_STEPS_CIRCUIT_BEG } from "@/src/projects/electric-status-board/lessons/circuitBeg";
import { LESSON_STEPS_CIRCUIT_BEG as LESSON_STEPS_CIRCUIT_INT } from "@/src/projects/electric-status-board/lessons/circuitInt";

const ELECTRIC_STATUS_BOARD_STEPS = [
  LESSON_STEPS_BEGINNER,
  LESSON_STEPS_INT,
  LESSON_STEPS_ADV,
  LESSON_STEPS_CIRCUIT_BEG,
  LESSON_STEPS_CIRCUIT_INT,
];

const PROJECT_STEP_DATA: Record<string, Record<number, any>[]> = {
  "electric-status-board": ELECTRIC_STATUS_BOARD_STEPS,
};

/** Level slug suffix (beg, int, adv) -> lesson step objects for that level. Matches dashboard. */
const PROJECT_LEVEL_STEPS: Record<string, Record<string, Record<number, any>[]>> = {
  "electric-status-board": {
    beg: [LESSON_STEPS_BEGINNER, LESSON_STEPS_CIRCUIT_BEG],
    int: [LESSON_STEPS_INT, LESSON_STEPS_CIRCUIT_INT],
    adv: [LESSON_STEPS_ADV], // no circuit-adv
  },
};

/** lessonSlug (e.g. code-beg) -> lesson step object for that lesson only */
const LESSON_SLUG_TO_STEPS: Record<string, Record<string, Record<number, any>>> = {
  "electric-status-board": {
    "code-beg": LESSON_STEPS_BEGINNER,
    "circuit-beg": LESSON_STEPS_CIRCUIT_BEG,
    "code-int": LESSON_STEPS_INT,
    "circuit-int": LESSON_STEPS_CIRCUIT_INT,
    "code-adv": LESSON_STEPS_ADV,
  },
};

const FALLBACK_TOTALS: Record<string, number> = {
  "electric-status-board": 283,
};

export function getProjectTotalSteps(projectSlug: string): number {
  try {
    const stepArrays = PROJECT_STEP_DATA[projectSlug];
    if (!stepArrays || stepArrays.length === 0) return FALLBACK_TOTALS[projectSlug] ?? 0;

    let total = 0;
    for (const lessonSteps of stepArrays) {
      total += countCountedStepsInLessonSteps(lessonSteps);
    }
    return total > 0 ? total : FALLBACK_TOTALS[projectSlug] ?? 0;
  } catch {
    return FALLBACK_TOTALS[projectSlug] ?? 0;
  }
}

/**
 * Total steps for a project at a given level (code-{level} + circuit-{level}).
 * Matches the dashboard formula: same totals CodeLessonBase writes to localStorage.
 * level = "beg" | "int" | "adv"
 */
export function getTotalStepsForLevel(projectSlug: string, level: string): number {
  const byLevel = PROJECT_LEVEL_STEPS[projectSlug];
  if (!byLevel) return 0;

  const steps = byLevel[level] ?? byLevel.beg ?? [];
  let total = 0;
  for (const lessonSteps of steps) {
    total += countCountedStepsInLessonSteps(lessonSteps);
  }
  return total;
}

/**
 * Total for level EXCLUDING advanced lessons (matches dashboard when advancedUnlocked=false).
 * Uses same logic as CodeLessonBase.totalNormalStepsAllLessons.
 */
export function getTotalStepsForLevelNormal(projectSlug: string, level: string): number {
  const byLevel = PROJECT_LEVEL_STEPS[projectSlug];
  if (!byLevel) return FALLBACK_TOTALS[projectSlug] ?? 0;

  try {
    const steps = byLevel[level] ?? byLevel.beg ?? [];
    let total = 0;
    for (const lessonSteps of steps) {
      total += countCountedStepsInLessonStepsExcludingAdvanced(lessonSteps);
    }
    return total > 0 ? total : FALLBACK_TOTALS[projectSlug] ?? 0;
  } catch {
    return FALLBACK_TOTALS[projectSlug] ?? 0;
  }
}

/**
 * Total steps for a single lesson slug (e.g. code-beg or circuit-beg).
 * Matches what CodeLessonBase writes to localStorage per lesson.
 */
export function getTotalForLessonSlug(
  projectSlug: string,
  lessonSlug: string
): number {
  const byProject = LESSON_SLUG_TO_STEPS[projectSlug];
  if (!byProject) return 0;
  const lessonSteps = byProject[lessonSlug];
  if (!lessonSteps) return 0;
  return countCountedStepsInLessonStepsExcludingAdvanced(lessonSteps);
}

/** Extract level suffix from lesson slug (code-beg -> beg, circuit-int -> int). */
export function levelFromLessonSlug(lessonSlug: string | null | undefined): string {
  const last = (lessonSlug || "").split("/").pop() || "";
  const parts = last.split(/[-_]/g).filter(Boolean);
  const suffix = (parts[parts.length - 1] || "").toLowerCase();

  if (suffix === "beg" || suffix === "beginner") return "beg";
  if (suffix === "int" || suffix === "intermediate") return "int";
  if (suffix === "adv" || suffix === "advanced") return "adv";
  return "beg";
}

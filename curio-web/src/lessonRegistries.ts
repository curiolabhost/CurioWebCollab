import type { ComponentType } from "react";

// One lesson entry
export type LessonEntry = {
  slug: string;
  title: string;
  component: ComponentType<any>;
};

// One project registry
export type ProjectLessonRegistry = {
  projectSlug: string;
  projectTitle: string;
  lessons: Record<string, LessonEntry>; // key = lessonSlug
};

// -------------------
// Import your lessons
// -------------------
import ElectricLearn from "./projects/electric-status-board/lessons/index";
import ElectricCircuit from "./projects/electric-status-board/lessons/circuit";
import ElectricCodeBeg from "./projects/electric-status-board/lessons/codeBeg";
import ElectricCodeAdv from "./projects/electric-status-board/lessons/codeAdv";

// -------------------
// Registry object
// -------------------
export const LESSON_REGISTRY: Record<string, ProjectLessonRegistry> = {
  "electric-status-board": {
    projectSlug: "electric-status-board",
    projectTitle: "Focus Board",
    lessons: {
      learn: {
        slug: "learn",
        title: "Start Learning",
        component: ElectricLearn,
      },
      circuit: {
        slug: "circuit",
        title: "Circuit",
        component: ElectricCircuit,
      },
      codeBeg: {
        slug: "codeBeg",
        title: "Beginner Coding",
        component: ElectricCodeBeg,
      },
      codeAdv: {
        slug: "codeAdv",
        title: "Advanced Coding",
        component: ElectricCodeAdv,
      },
    },
  },
};

export function getLessonComponent(projectSlug: string, lessonSlug: string) {
  const project = LESSON_REGISTRY[projectSlug];
  if (!project) return null;
  const lesson = project.lessons[lessonSlug];
  if (!lesson) return null;
  return lesson;
}

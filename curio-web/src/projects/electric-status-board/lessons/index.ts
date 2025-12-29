import CodeBegLesson from "./codeBeg";
import CircuitBegLesson from "./circuitBeg";

export const ESB_LESSONS = {
  "code-beg": {
    Component: CodeBegLesson,
    meta: {
      title: "Focus Board",
      subtitle: "Beginner Coding",
      description: "Learn by completing each step below.",
    },
  },

  "circuit-beg": {
    Component: CircuitBegLesson,
    meta: {
      title: "Focus Board",
      subtitle: "Beginner Circuits",
      description: "Learn the hardware setup step by step.",
    },
  },
} as const;

export type ESBLessonSlug = keyof typeof ESB_LESSONS;

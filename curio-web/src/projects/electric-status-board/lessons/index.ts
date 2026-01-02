import CodeBegLesson from "./codeBeg";
import CircuitBegLesson from "./circuitBeg";
import CodeAdvLesson from "./codeAdv";

export const ESB_LESSONS = {
  "code-beg": {
    Component: CodeBegLesson,
    meta: {
      title: "Focus Board",
      subtitle: "Beginner Coding",
      description: "Learn by completing each step below.",
    },
  },

  "code-adv": {
    Component: CodeAdvLesson,
    meta: {
        title: "Focus Board",
        subtitle: "Advanced Coding",
        description: "Take your code further with these advanced lessons.",
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

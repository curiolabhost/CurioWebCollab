import CodeBegLesson from "./codeBeg";

export const ESB_LESSONS = {
  "code-beg": {
    Component: CodeBegLesson,
    meta: {
      title: "Focus Board",
      subtitle: "Beginner Coding",
      description: "Learn by completing each step below.",
    },
  }, 
} as const;

export type ESBLessonSlug = keyof typeof ESB_LESSONS;

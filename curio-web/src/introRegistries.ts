import { electricStatusBoardData } from "./projects/electric-status-board/lessons/intro/electricStatusBoardData";

export type Level = "beginner" | "intermediate" | "advanced";

// infer data type from the constant (no extra files)
export type ProjectData = typeof electricStatusBoardData;

export const INTRO_REGISTRIES: Record<
  string,
  {
    data: ProjectData;
    levelToLessonSlug: Record<Level, string>;
  }
> = {
  "electric-status-board": {
    data: electricStatusBoardData,
    levelToLessonSlug: {
      beginner: "code-beg",
      intermediate: "code-int",
      advanced: "code-adv",
    },
  },
};

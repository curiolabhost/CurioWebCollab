// app/tools/lessonStudio/lessonFactory.ts
import { LessonDraft, LessonPage, LessonBlock } from "./lessonSchema";

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyLessonDraft(): LessonDraft {
  return {
    id: makeId("lesson"),
    title: "New Lesson",
    slug: "new-lesson",
    pages: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyPage(title = "New Page"): LessonPage {
  return {
    id: makeId("page"),
    title,
    blocks: [],
  };
}

export function createBlock(type: LessonBlock["type"]): LessonBlock {
  const id = makeId("block");

  switch (type) {
    case "richText":
      return { type: "richText", id, text: "Write your explanation here..." };
    case "image":
      return { type: "image", id, src: "", caption: "", width: 480, align: "center" };
    case "code":
      return { type: "code", id, language: "cpp", title: "Code", code: "// code here" };
    case "hint":
      return { type: "hint", id, title: "Hint", text: "Hint text...", defaultOpen: false };
  }
}
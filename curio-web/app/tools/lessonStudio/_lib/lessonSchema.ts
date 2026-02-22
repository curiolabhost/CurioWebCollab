// app/tools/lessonStudio/lessonSchema.ts
// This file defines the TypeScript types for our lesson schema, which is used by both the editor and the renderer.

export type LessonId = string;
export type PageId = string;
export type BlockId = string;

export type LessonDraft = {
  id: LessonId;
  title: string;
  slug: string;
  pages: LessonPage[];
  updatedAt: string; // ISO
};

export type LessonPage = {
  id: PageId;
  title: string;
  blocks: LessonBlock[];
};

export type LessonBlock =
  | RichTextBlock
  | ImageBlock
  | CodeBlock
  | HintBlock;

export type RichTextBlock = {
  type: "richText";
  id: BlockId;
  // For v1: plain text. (We’ll upgrade to TipTap JSON in Step 2)
  text: string;
};

export type ImageBlock = {
  type: "image";
  id: BlockId;
  src: string; // for v1: just a URL string
  caption?: string;
  width?: number;
  align?: "left" | "center" | "right";
};

export type CodeBlock = {
  type: "code";
  id: BlockId;
  language: "cpp" | "ts" | "js" | "txt";
  title?: string;
  code: string;
};

export type HintBlock = {
  type: "hint";
  id: BlockId;
  title: string;
  text: string;
  defaultOpen?: boolean;
};
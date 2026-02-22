// app/tools/lessonStudio/LessonPageRenderer.tsx
// what it does: renders a lesson page based on the schema; used in the preview and in the actual lesson view
"use client";

import * as React from "react";
import type { LessonPage, LessonBlock } from "../_lib/lessonSchema";

export default function LessonPageRenderer({ page }: { page: LessonPage }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        {/* back button (you prefer this by default) */}
        <button
          type="button"
          onClick={() => history.back()}
          className="px-3 py-1 rounded-md border text-sm"
        >
          Back
        </button>
        <h2 className="text-xl font-semibold">{page.title}</h2>
      </div>

      {page.blocks.map((b) => (
        <BlockRenderer key={b.id} block={b} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "richText":
      return <p className="text-base leading-relaxed whitespace-pre-wrap">{block.text}</p>;

    case "image": {
      const align =
        block.align === "left"
          ? "items-start"
          : block.align === "right"
          ? "items-end"
          : "items-center";

      return (
        <div className={`flex flex-col ${align} gap-2`}>
          {block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.src}
              alt={block.caption || "Lesson image"}
              style={{ width: block.width ?? 480 }}
              className="rounded-lg border"
            />
          ) : (
            <div className="w-[480px] h-[240px] rounded-lg border flex items-center justify-center text-sm text-gray-500">
              Image src is empty
            </div>
          )}
          {block.caption ? <div className="text-sm text-gray-600">{block.caption}</div> : null}
        </div>
      );
    }

    case "code":
      return (
        <div className="rounded-lg border p-3 bg-white">
          {block.title ? <div className="font-medium mb-2">{block.title}</div> : null}
          <pre className="text-sm overflow-auto p-3 rounded-md bg-gray-50">
            <code>{block.code}</code>
          </pre>
          <div className="text-xs text-gray-500 mt-2">Language: {block.language}</div>
        </div>
      );

    case "hint":
      return (
        <details className="rounded-lg border p-3" open={!!block.defaultOpen}>
          <summary className="cursor-pointer font-medium">{block.title}</summary>
          <div className="mt-2 text-sm whitespace-pre-wrap">{block.text}</div>
        </details>
      );
  }
}
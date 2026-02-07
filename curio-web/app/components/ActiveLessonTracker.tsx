// app/components/ActiveLessonTracker.tsx
"use client";

import { useEffect } from "react";

type Props = {
  slug: string;
  lessonSlug: string;
};

export default function ActiveLessonTracker({ slug, lessonSlug }: Props) {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Optional legacy local cache (safe to keep during migration)
      try {
        localStorage.setItem("curio:activeLesson", JSON.stringify({ slug, lessonSlug }));
        window.dispatchEvent(new Event("curio:activeLesson"));
      } catch {}

      // Backend pointer (cross-device truth)
      try {
        await fetch("/api/active-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectSlug: slug, lessonSlug }),
          cache: "no-store",
        });
      } catch {
        // swallow
      }
    }

    if (!cancelled) void run();

    return () => {
      cancelled = true;
    };
  }, [slug, lessonSlug]);

  return null;
}

"use client";

import { useRouter } from "next/navigation";
import CodeLessonBase from "@/src/lesson-core/CodeLessonBase";

export default function LessonClient({
  projectSlug,
  lessonSlug,
  lesson,
}: {
  projectSlug: string;
  lessonSlug: string;
  lesson: any;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* You already have SmartBackButton if you want to reuse it */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
        <button
          onClick={() => router.push(`/projects/${projectSlug}`)}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      <div className="px-4 py-6">
        <CodeLessonBase lesson={lesson} />
      </div>
    </div>
  );
}

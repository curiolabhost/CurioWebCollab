import * as React from "react";
import Link from "next/link";
import { PROJECT_LESSONS } from "@/src/lessonRegistries";

type PageProps = {
  params: Promise<{
    slug: string;
    lessonSlug: string;
  }>;
};

export default async function LessonSlugPage({ params }: PageProps) {
  const { slug, lessonSlug } = await params;

  const registry = PROJECT_LESSONS as Record<
    string,
    Record<string, React.ComponentType<any>>
  >;

  const projectLessons = registry[slug];
  const Lesson = projectLessons?.[lessonSlug];

  // Always-visible header with Back link (no client router needed)
  const Header = (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid #e5e7eb",
        background: "white",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link
          href={`/projects/${slug}`}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 14,
            background: "white",
            display: "inline-block",
          }}
        >
          Back
        </Link>

        <div style={{ fontSize: 13, color: "#374151" }}>
          <span style={{ fontWeight: 600 }}>{slug}</span>
          <span style={{ margin: "0 8px", color: "#9ca3af" }}>/</span>
          <span>{lessonSlug}</span>
        </div>
      </div>
    </div>
  );

  if (!projectLessons) {
    return (
      <div style={{ minHeight: "100vh", background: "white" }}>
        {Header}
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>
            Project not found
          </h1>
          <p style={{ color: "#374151", marginTop: 8 }}>
            Unknown project: <code>{slug}</code>
          </p>
        </main>
      </div>
    );
  }

  if (!Lesson) {
    return (
      <div style={{ minHeight: "100vh", background: "white" }}>
        {Header}
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>
            Lesson not found
          </h1>
          <p style={{ color: "#374151", marginTop: 8 }}>
            Unknown lesson: <code>{lessonSlug}</code>
          </p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "white" }}>
      {Header}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
        <Lesson />
      </main>
    </div>
  );
}

import * as React from "react";
import Link from "next/link";
import LessonHeaderControls from "./LessonHeaderControls";
import { PROJECT_LESSONS } from "@/src/lessonRegistries";

type PageProps = {
  params: Promise<{
    slug: string;
    lessonSlug: string;
  }>;
};

function titleizeSlug(s: string) {
  return (
    (s || "")
      .split("/")
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ?? ""
  );
}

type LessonMeta = {
  title?: string;
  subtitle?: string; // ✅ add subtitle support
  description?: string;
};

type LessonEntry =
  | React.ComponentType<any>
  | { Component: React.ComponentType<any>; meta?: LessonMeta };

function getLessonEntry(
  projectSlug: string,
  lessonSlug: string
): { Lesson: React.ComponentType<any> | null; meta: LessonMeta | null } {
  const proj: unknown = (PROJECT_LESSONS as any)[projectSlug];
  if (!proj || typeof proj !== "object") return { Lesson: null, meta: null };

  const entry: unknown = (proj as any)[lessonSlug];
  if (!entry) return { Lesson: null, meta: null };

  // Shape A: lessonSlug -> Component
  if (typeof entry === "function") {
    return { Lesson: entry as React.ComponentType<any>, meta: null };
  }

  // Shape B: lessonSlug -> { Component, meta }
  if (typeof entry === "object" && entry !== null && "Component" in entry) {
    const Component = (entry as any).Component;
    const meta = (entry as any).meta ?? null;
    if (typeof Component === "function") {
      return { Lesson: Component as React.ComponentType<any>, meta };
    }
  }

  return { Lesson: null, meta: null };
}

export default async function LessonSlugPage({ params }: PageProps) {
  const { slug, lessonSlug } = await params;

  const { Lesson, meta } = getLessonEntry(slug, lessonSlug);

  const projectTitle = titleizeSlug(slug);

  // Use meta.title + meta.subtitle for header, fallback to slug titleization
  const lessonTitle = meta?.title ?? titleizeSlug(lessonSlug);
  const lessonSubtitle = meta?.subtitle ?? "";

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
          maxWidth: 1600,
          margin: "0 auto",
          padding: "5px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link
            href={`/projects/${slug}/intro`}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "6px 12px",
              fontSize: 14,
              background: "white",
              display: "inline-block",
              textDecoration: "none",
              color: "#111827",
            }}
          >
            Back
          </Link>

          <div style={{ display: "flex", flexDirection: "row", gap: 13 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              {lessonTitle}
            </div>

            {/* show subtitle if present, else fallback to project title */}
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {lessonSubtitle || projectTitle}
            </div>
          </div>
        </div>

        <LessonHeaderControls
  viewModeKey={`curio:${slug}:${lessonSlug}:viewMode`}
/>
      </div>
    </div>
  );

  // project missing is equivalent to “no lessons object”
  const projectExists = !!(PROJECT_LESSONS as any)[slug];

  if (!projectExists) {
    return (
      <div style={{ minHeight: "100vh", background: "white" }}>
        {Header}
        <main style={{ maxWidth: 1600, margin: "0 auto", padding: "24px 16px" }}>
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
        <main style={{ maxWidth: 1600, margin: "0 auto", padding: "24px 16px" }}>
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
  <div
    style={{
      height: "100vh",
      background: "white",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}
  >
    {Header}

    <main
      style={{
        flex: 1,
        minHeight: 0, // critical for nested scrolling
        overflow: "hidden", // prevents the document from scrolling
        maxWidth: 1600,
        margin: "0 auto",
        width: "100%",
        padding: "0px", // let CodeLessonBase handle padding
      }}
    >
      <Lesson slug={slug} lessonSlug={lessonSlug}/>
    </main>
  </div>
);
}

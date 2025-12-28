import { notFound } from "next/navigation";
import { PROJECT_LESSONS } from "@/src/projects/lessonRegistries";
import LessonClient from "./LessonClient";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;

  const projectLessons = (PROJECT_LESSONS as any)[slug];
  if (!projectLessons) return notFound();

  const lesson = projectLessons[lessonSlug];
  if (!lesson) return notFound();

  return (
    <LessonClient
      projectSlug={slug}
      lessonSlug={lessonSlug}
      lesson={lesson}
    />
  );
}

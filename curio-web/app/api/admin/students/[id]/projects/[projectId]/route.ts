// app/api/admin/students/[id]/projects/[projectId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { fetchClerkIdentity } from "@/lib/clerkBackfill";

function prettySlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

function initials(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const a = (firstName?.[0] ?? "").toUpperCase();
  const b = (lastName?.[0] ?? "").toUpperCase();
  if (a || b) return `${a}${b}`;
  return (email?.[0] ?? "U").toUpperCase();
}

/** Arduino editor stores in editor-{level} (e.g. editor-beg for code-beginner) */
function toEditorLessonSlug(lessonSlug: string) {
  const m = String(lessonSlug || "").match(/^(code|circuit)-(.+)$/);
  const level = m?.[2] || lessonSlug || "";
  return level ? `editor-${level}` : "";
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; projectId: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: "forbidden" }, { status: gate.status });

  const { id, projectId } = await ctx.params;
  const studentId = id;          // Clerk userId (string)
  const projectSlug = projectId; // use slug in URL

  let student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      role: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      profile: { select: { grade: true, school: true } },
      activeLesson: { select: { projectSlug: true, lessonSlug: true, updatedAt: true } },
    },
  });

  if (!student || student.role !== "STUDENT") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Backfill missing name/email from Clerk (so project mirror header shows identity even if DB row was created blank).
  const needsBackfill =
    !String(student.email ?? "").trim() ||
    (!String(student.firstName ?? "").trim() && !String(student.lastName ?? "").trim());

  if (needsBackfill) {
    const identity = await fetchClerkIdentity(studentId);
    if (identity && (identity.email || identity.firstName || identity.lastName)) {
      try {
        await prisma.user.update({
          where: { id: studentId },
          data: {
            email: identity.email ?? undefined,
            firstName: identity.firstName,
            lastName: identity.lastName,
          },
        });

        student = {
          ...student,
          email: identity.email ?? student.email,
          firstName: identity.firstName,
          lastName: identity.lastName,
        };
      } catch {
        // best-effort; keep DB values
      }
    }
  }

  // pick best "current lesson"
  const location = await prisma.lessonLocation.findFirst({
    where: { userId: studentId, projectSlug },
    orderBy: { updatedAt: "desc" },
    select: { lessonSlug: true, lessonIndex: true, stepIndex: true, updatedAt: true },
  });

  const currentLessonSlug =
    student.activeLesson?.projectSlug === projectSlug
      ? student.activeLesson.lessonSlug
      : location?.lessonSlug ?? null;

  // pull blanks for the current lesson
  const lessonState = currentLessonSlug
    ? await prisma.lessonState.findUnique({
        where: {
          userId_projectSlug_lessonSlug: {
            userId: studentId,
            projectSlug,
            lessonSlug: currentLessonSlug,
          },
        },
        select: { blanks: true, updatedAt: true },
      })
    : null;

  // pull stepKeys that are DONE for this project
  // Filter by currentLessonSlug so progress matches the lesson being viewed (avoids L1-S0 from different lessons colliding)
  const doneRows = await prisma.lessonProgress.findMany({
    where: {
      userId: studentId,
      projectSlug,
      status: "done",
      ...(currentLessonSlug ? { lessonSlug: currentLessonSlug } : {}),
    },
    select: { stepKey: true },
  });
  const doneStepKeys = doneRows.map((r) => r.stepKey);

  const circuitState = currentLessonSlug
    ? await prisma.circuitState.findUnique({
        where: {
          userId_projectSlug_lessonSlug: { userId: studentId, projectSlug, lessonSlug: currentLessonSlug },
        },
        select: { wokwiUrl: true, diagramJson: true, updatedAt: true },
      })
    : null;

  const notebookState = await prisma.notebookState.findUnique({
    where: { userId: studentId },
    select: { title: true, pagesJson: true, updatedAt: true },
  });

  // Arduino sketch is stored in LessonState with lessonSlug = editor-{level}
  const editorLessonSlug = currentLessonSlug ? toEditorLessonSlug(currentLessonSlug) : "";
  const arduinoState = editorLessonSlug
    ? await prisma.lessonState.findUnique({
        where: {
          userId_projectSlug_lessonSlug: {
            userId: studentId,
            projectSlug,
            lessonSlug: editorLessonSlug,
          },
        },
        select: { blanks: true },
      })
    : null;
  const arduinoCode =
    arduinoState?.blanks && typeof arduinoState.blanks === "object"
      ? (arduinoState.blanks as any)?.arduino?.code ?? null
      : null;

  return NextResponse.json({
    student: {
      id: student.id,
      name: [student.firstName, student.lastName].filter(Boolean).join(" ") || student.email || "Student",
      email: student.email ?? "",
      avatar: initials(student.firstName, student.lastName, student.email),
      createdAt: student.createdAt.toISOString(),
      grade: student.profile?.grade ?? null,
      school: student.profile?.school ?? null,
    },
    project: {
      slug: projectSlug,
      title: prettySlug(projectSlug),
    },
    view: {
      studentId,
      projectSlug,
      currentLessonSlug,
      lessonIndex: location?.lessonIndex ?? null,
      stepIndex: location?.stepIndex ?? null,
      blanks: (lessonState?.blanks as any) ?? null,
      doneStepKeys,
      circuitState: circuitState
        ? { wokwiUrl: circuitState.wokwiUrl, diagramJson: circuitState.diagramJson }
        : null,
      notebookState: notebookState
        ? { title: notebookState.title, pagesJson: notebookState.pagesJson }
        : null,
      arduinoCode: typeof arduinoCode === "string" ? arduinoCode : null,
    },
  });
}

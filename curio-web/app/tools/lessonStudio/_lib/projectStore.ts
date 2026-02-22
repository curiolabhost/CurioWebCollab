// app/tools/lesson-studio/_lib/projectStore.ts
import type { LessonStudioProject } from "./projectTypes";

const KEY = "curio_admin_lesson_studio_projects_v1";

function readAll(): LessonStudioProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LessonStudioProject[]) : [];
  } catch {
    return [];
  }
}

function writeAll(projects: LessonStudioProject[]) {
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function getProject(projectId: string): LessonStudioProject | null {
  return readAll().find((p) => p.id === projectId) ?? null;
}

export function upsertProject(project: LessonStudioProject): LessonStudioProject {
  const projects = readAll();
  const idx = projects.findIndex((p) => p.id === project.id);

  if (idx === -1) {
    projects.push(project);
  } else {
    projects[idx] = project;
  }

  writeAll(projects);
  return project;
}

export function listProjects(): LessonStudioProject[] {
  return readAll().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

// Optional helper: create a blank project quickly from the projects list page
export function createBlankProject(id: string): LessonStudioProject {
  const now = new Date().toISOString();

  const p: LessonStudioProject = {
    id,

    // Core identity
    name: "Untitled Project",
    slug: `project-${id.slice(-6)}`,

    // Identity page 1 (public)
    title: "Untitled Project",
    category: "General",
    available: false,

    image: "",
    description: "",
    fullDescription: "",

    difficulties: ["Beginner"],
    ageRange: "10–18",
    hours: "4–6 hours",

    learningOutcomes: [],
    projectHighlights: [],
    prerequisitesList: [],

    // ✅ merged canonical materials list
    materials: [],

    skills: [],

    // Identity page 2 (intro)
    intro: {
      subtitle: "",

      headerInfo: {
        difficulty: "Beginner → Advanced",
        duration: "4–6 hours",
        components: "",
      },

      features: [],
      capabilities: [],

      workflows: {
        beginner: [],
        intermediate: [],
        advanced: [],
      },

      levels: [
        {
          id: "beginner",
          title: "Beginner",
          duration: "",
          description: "",
          color: "green",
          features: [],
        },
        {
          id: "intermediate",
          title: "Intermediate",
          duration: "",
          description: "",
          color: "blue",
          features: [],
        },
        {
          id: "advanced",
          title: "Advanced",
          duration: "",
          description: "",
          color: "purple",
          features: [],
        },
      ],
    },

    // Existing lesson-studio fields (kept for now)
    coverImageUrl: "",
    shortDescription: "",

    minAge: 10,
    maxAge: 18,
    estimatedTotalMinutes: 240,

    prerequisites: "",

    hardwareRequired: [],
    softwareRequired: [],

    teacherNotes: "",

    levels: {
      beginner: { enabled: true, description: "", estimatedMinutes: 120, prerequisites: "" },
      intermediate: { enabled: false, description: "", estimatedMinutes: 120, prerequisites: "" },
      advanced: { enabled: false, description: "", estimatedMinutes: 120, prerequisites: "" },
    },

    createdAt: now,
    updatedAt: now,
  };

  return upsertProject(p);
}
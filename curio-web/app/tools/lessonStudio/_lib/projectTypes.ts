// app/tools/lesson-studio/_lib/projectTypes.ts
// This file defines the TypeScript types for projects in Lesson Studio, including both the core identity fields and the additional configuration for the intro page and levels. These types are used throughout the Lesson Studio admin interface to ensure type safety and consistency when working with project data.

/* ============================================================
   Level + Intro Identity Types
============================================================ */

export type ProjectDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type ProjectIntroLevelId = "beginner" | "intermediate" | "advanced";

export type ProjectLevelSlug = "beginner" | "intermediate" | "advanced";

export type ProjectLevelConfig = {
  enabled: boolean;
  description: string;
  estimatedMinutes: number;
  prerequisites: string;
};

/* ============================================================
   Intro Page Configuration ( /projects/[slug]/intro )
============================================================ */

export type ProjectIntroConfig = {
  subtitle: string;

  headerInfo: {
    difficulty: string;   // ex: "Beginner → Advanced"
    duration: string;     // ex: "4–6 hours"
    components: string;   // ex: "OLED, RTC, Buttons"
  };

  features: Array<{
    title: string;
    description: string;
    iconName?: string;
  }>;

  capabilities: string[];

  workflows: Record<
    ProjectIntroLevelId,
    Array<{
      step: string;
      title: string;
      description: string;
    }>
  >;

  levels: Array<{
    id: ProjectIntroLevelId;
    title: string;
    duration: string;
    description: string;
    color: "green" | "blue" | "purple";
    features: string[];
  }>;
};

export type LessonStudioProject = {
  id: string;

  /* ------------------------------------------------------------
     Core Identity
  ------------------------------------------------------------ */

  name: string;        // internal name
  slug: string;

  // Identity Page 1 fields (mirrors /projects/[slug])
  title: string;       // public display title
  category: string;
  available: boolean;

  image: string;       // hero cover image URL
  description: string; // short hero paragraph
  fullDescription: string; // extended overview paragraph

  difficulties: ProjectDifficulty[];
  ageRange: string;      // "10–18"
  hours: string;         // "4–6 hours"

  learningOutcomes: string[];
  projectHighlights: string[];
  prerequisitesList: string[];

  materials: string[];

  skills: string[];

  // Identity Page 2 fields
  intro: ProjectIntroConfig;

  /* ------------------------------------------------------------
     Existing Lesson Studio Fields
  ------------------------------------------------------------ */

  coverImageUrl: string;
  shortDescription: string;

  minAge: number;
  maxAge: number;
  estimatedTotalMinutes: number;

  prerequisites: string;

  hardwareRequired: string[];

  softwareRequired: string[];

  teacherNotes: string;

  levels: Record<ProjectLevelSlug, ProjectLevelConfig>;

  createdAt: string;
  updatedAt: string;
};
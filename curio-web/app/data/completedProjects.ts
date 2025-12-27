// app/data/completedProjects.ts
import type { Project } from "@/app/data/projects";
import { PROJECTS } from "@/app/data/projects";

export type CompletedProject = {
  project: Project;
  startedDate: Date;
  completedDate: Date;
  totalHours: number;
};

export const completedProjects: CompletedProject[] = [
  {
    project: PROJECTS[1],
    startedDate: new Date("2024-11-01"),
    completedDate: new Date("2024-11-28"),
    totalHours: 15,
  },
  {
    project: PROJECTS[2],
    startedDate: new Date("2024-10-15"),
    completedDate: new Date("2024-11-02"),
    totalHours: 10,
  },
  {
    project: PROJECTS[5],
    startedDate: new Date("2024-09-10"),
    completedDate: new Date("2024-10-05"),
    totalHours: 12,
  },
];

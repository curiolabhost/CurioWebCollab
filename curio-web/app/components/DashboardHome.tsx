// app/components/DashboardHome.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completedProjects } from "@/app/data/completedProjects";

import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Play,
  Menu,
  X,
  User as UserIcon,
  Settings,
  LogOut,
  FileText,
  BarChart,
  MessageSquare,
  Compass,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";

import type { Project } from "@/app/data/projects";
import { PROJECTS } from "@/app/data/projects";

/** Dashboard-only model (per-user state) */
type ProjectSchedule = {
  daysPerWeek: number;
  hoursPerDay: number;
  targetDate?: Date;
};

type ActiveProject = {
  project: Project;
  hoursCompleted: number; // numeric time logged by the user
  schedule: ProjectSchedule;
  startedDate: Date;
  currentLesson: string;
  nextLesson: string;
};

type CompletedProject = {
  project: Project;
  totalHours: number;
  startedDate: Date;
  completedDate: Date;
};

/**
 * Your Project.hours is a string like "8-10 hours" or "15-20 hours".
 * For calculations, convert to a single number.
 * Strategy: midpoint for ranges; otherwise first number found.
 */
function parseHoursToNumber(hoursText: string): number {
  if (!hoursText) return 10;
  const nums = hoursText.match(/\d+(\.\d+)?/g)?.map((n) => parseFloat(n)) ?? [];
  if (nums.length === 0) return 10;
  if (nums.length === 1) return nums[0];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return (min + max) / 2;
}

function daysBetween(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((b.getTime() - a.getTime()) / msPerDay);
}

export function DashboardHome() {
  const router = useRouter();
  const projects = PROJECTS;
  const availableProjects = projects.filter((p) => p.available);
  const unavailableProjects = projects.filter((p) => !p.available);


  const [activeProject, setActiveProject] = useState<ActiveProject>({
    project: projects[0],
    hoursCompleted: 8,
    schedule: {
      daysPerWeek: 3,
      hoursPerDay: 2,
      targetDate: new Date("2026-01-15"),
    },
    startedDate: new Date("2025-12-20"),
    currentLesson: "Lesson 4: Sensor Calibration",
    nextLesson: "Lesson 5: Motor Control Programming",
  });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [tempSchedule, setTempSchedule] = useState<ProjectSchedule>(activeProject.schedule);

  const [activeTab, setActiveTab] = useState<"current" | "completed">("current");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const estimatedHoursNumber = useMemo(() => {
    return Math.max(1, parseHoursToNumber(activeProject.project.hours));
  }, [activeProject.project.hours]);

  const progressPercent = useMemo(() => {
    return Math.min(100, Math.max(0, (activeProject.hoursCompleted / estimatedHoursNumber) * 100));
  }, [activeProject.hoursCompleted, estimatedHoursNumber]);

  const calculateCompletionDate = () => {
    const remainingHours = Math.max(0, estimatedHoursNumber - activeProject.hoursCompleted);
    const hoursPerWeek = Math.max(0.5, activeProject.schedule.daysPerWeek * activeProject.schedule.hoursPerDay);
    const weeksNeeded = Math.ceil(remainingHours / hoursPerWeek);

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + weeksNeeded * 7);
    return completionDate.toLocaleDateString();
  };

  const calculateHoursDue = () => {
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    const daysSinceStart = Math.floor((now.getTime() - activeProject.startedDate.getTime()) / msPerDay);
    const weeksSinceStart = Math.max(0, daysSinceStart / 7);

    const expectedHours =
      weeksSinceStart * activeProject.schedule.daysPerWeek * activeProject.schedule.hoursPerDay;

    const hoursDue = Math.max(0, Math.round(expectedHours - activeProject.hoursCompleted));

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

    return { hours: hoursDue, dueDate: endOfWeek.toLocaleDateString() };
  };

  const handleSaveSchedule = () => {
    setActiveProject((prev) => ({ ...prev, schedule: tempSchedule }));
    setShowScheduleModal(false);
  };

  const handleStartProject = (project: Project) => {
    setActiveProject({
      project,
      hoursCompleted: 0,
      schedule: { daysPerWeek: 3, hoursPerDay: 2 },
      startedDate: new Date(),
      currentLesson: "Lesson 1: Getting Started",
      nextLesson: "Lesson 2: Build & Test",
    });
    setActiveTab("current");
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/account-setup/login");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <div
        className={[
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50",
          "transform transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                setActiveTab("current");
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-sky-50 text-sky-600 rounded-lg"
            >
              <FolderOpen className="w-5 h-5" />
              <span>My Projects</span>
            </button>

            <button
              onClick={() => {
                // placeholder for future route
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            >
              <Compass className="w-5 h-5" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => {
                // placeholder for future route
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            >
              <BarChart className="w-5 h-5" />
              <span>Performance</span>
            </button>

            <button
              onClick={() => {
                // placeholder for future route
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Tasks</span>
            </button>

            <button
              onClick={() => {
                // placeholder for future route
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
              {/* Back button (default for every page) */}
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-sky-600 hover:text-sky-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1" />

              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>

              <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>

              <h1 className="text-lg font-semibold text-gray-900">STEM Project Lab</h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, Student!</span>

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center hover:bg-sky-200 transition-colors"
                  aria-label="Open profile menu"
                >
                  <span className="text-sky-700 font-medium">S</span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                      <span>User Information</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <span>Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <BarChart className="w-5 h-5 text-gray-600" />
                      <span>My Progress</span>
                    </button>
                    <div className="border-t border-gray-200 my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Close profile menu when clicking anywhere else in header area */}
          {profileMenuOpen && (
            <button
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setProfileMenuOpen(false)}
              aria-hidden
            />
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-4">
            <button
              onClick={() => setActiveTab("current")}
              className={[
                "pb-2 border-b-2 transition-colors",
                activeTab === "current"
                  ? "border-sky-700 text-sky-800"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              <h2 className="text-xl font-semibold">Your Current Project</h2>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={[
                "pb-2 border-b-2 transition-colors",
                activeTab === "completed"
                  ? "border-sky-700 text-sky-800"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              <h2 className="text-xl font-semibold">Completed Projects</h2>
            </button>
          </div>

          {/* CURRENT TAB */}
          {activeTab === "current" ? (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left Side */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Continue Learning</h3>

                  <div className="relative mb-4 rounded-xl overflow-hidden group cursor-pointer">
                    <img
                      src={activeProject.project.image}
                      alt={activeProject.project.title}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-sky-600 ml-1" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-sky-50 rounded-lg p-4">
                      <div className="text-sm text-sky-600 mb-1">Last Watched</div>
                      <div className="text-gray-900 font-medium">{activeProject.currentLesson}</div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600 mb-1">Up Next</div>
                      <div className="text-gray-900 font-medium">{activeProject.nextLesson}</div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                      <div className="text-sm text-orange-700">
                        <strong>{calculateHoursDue().hours} hours due</strong> by{" "}
                        {calculateHoursDue().dueDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div>
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {activeProject.project.title}
                      </h3>
                      <p className="text-gray-600">{activeProject.project.description}</p>
                    </div>

                    <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm whitespace-nowrap">
                      {activeProject.project.category}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Overall Progress</span>
                      <span className="text-sm">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-sky-800 to-sky-600 h-3 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-sky-600" />
                        <span className="text-sm text-gray-600">Time Logged</span>
                      </div>
                      <div className="text-xl">
                        {activeProject.hoursCompleted}h{" "}
                        <span className="text-gray-500">/ {activeProject.project.estimatedHours}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-sky-600" />
                        <span className="text-sm text-gray-600">Study Schedule</span>
                      </div>
                      <div className="text-xl">{activeProject.schedule.daysPerWeek} days/week</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-sky-600" />
                        <span className="text-sm text-gray-600">Target Date</span>
                      </div>
                      <div className="text-sm">{calculateCompletionDate()}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-sky-600" />
                        <span className="text-sm text-gray-600">Daily Hours</span>
                      </div>
                      <div className="text-xl">{activeProject.schedule.hoursPerDay}h/day</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTempSchedule(activeProject.schedule);
                      setShowScheduleModal(true);
                    }}
                    className="w-full px-4 py-2 bg-sky-300 text-white rounded-lg hover:bg-sky-700 transition-colors"
                  >
                    Edit Schedule
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* COMPLETED TAB */
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="space-y-4">
                {completedProjects.length === 0 ? (
                  <div className="text-gray-600">No completed projects yet.</div>
                ) : (
                  completedProjects.map((completed, index) => {
                    const daysTaken = daysBetween(completed.startedDate, completed.completedDate);

                    return (
                      <div
                        key={`${completed.project.id}-${index}`}
                        className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4 border border-gray-200 rounded-xl hover:border-sky-300 hover:bg-sky-50 transition-all cursor-pointer"
                      >
                        <img
                          src={completed.project.image}
                          alt={completed.project.title}
                          className="w-full md:w-32 h-48 md:h-32 object-cover rounded-lg"
                        />

                        <div className="flex-1 w-full">
                          <div className="flex items-start justify-between mb-2 gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">{completed.project.title}</h3>

                            <div className="flex flex-wrap gap-2 justify-end">
                                {(completed.project.difficulties ?? []).map((level) => (
                                    <span
                                    key={level}
                                    className={[
                                        "px-3 py-1 rounded-full text-sm whitespace-nowrap",
                                        level === "Beginner"
                                        ? "bg-green-100 text-green-700"
                                        : level === "Intermediate"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700",
                                    ].join(" ")}
                                    >
                                    {level}
                                    </span>
                                ))}
                                </div>
                          </div>

                          <p className="text-gray-600 text-sm mb-4">{completed.project.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Time Spent</div>
                              <div className="text-sm">{completed.totalHours} hours</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Duration</div>
                              <div className="text-sm">{daysTaken} days</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Started</div>
                              <div className="text-sm">{completed.startedDate.toLocaleDateString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Completed</div>
                              <div className="text-sm">{completed.completedDate.toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Available Projects */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Projects</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <h3 className="flex-1 text-gray-900 font-semibold">{project.title}</h3>

                    <div className="flex flex-wrap gap-1 justify-end">
                        {(project.difficulties ?? []).map((level) => (
                            <span
                            key={level}
                            className={[
                                "px-2 py-1 rounded text-xs whitespace-nowrap",
                                level === "Beginner"
                                ? "bg-green-100 text-green-700"
                                : level === "Intermediate"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700",
                            ].join(" ")}
                            >
                            {level}
                            </span>
                        ))}
                        </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{project.hours}</span>
                    </div>

                    <Link
                    href={`/projects/${project.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 py-2 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors inline-flex items-center"
                    >
                    Learn more
                    </Link>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
 <div className="mt-12">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">
    Projects Coming Soon
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {unavailableProjects.map((project) => (
      <div
        key={project.id}
        className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-48 object-cover"
        />

        <div className="p-5">
          <div className="flex items-start justify-between mb-2 gap-3">
            <h3 className="flex-1 text-gray-900 font-semibold">
              {project.title}
            </h3>

            <div className="flex flex-wrap gap-1 justify-end">
              {(project.difficulties ?? []).map((level) => (
                <span
                  key={level}
                  className={[
                    "px-2 py-1 rounded text-xs whitespace-nowrap",
                    level === "Beginner"
                      ? "bg-green-100 text-green-700"
                      : level === "Intermediate"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700",
                  ].join(" ")}
                >
                  {level}
                </span>
              ))}
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{project.hours}</span>
            </div>

            <Link
              href={`/projects/${project.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors inline-flex items-center"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>





      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Project Schedule</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Days per week</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={tempSchedule.daysPerWeek}
                  onChange={(e) =>
                    setTempSchedule({
                      ...tempSchedule,
                      daysPerWeek: parseInt(e.target.value || "1", 10),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Hours per day</label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={tempSchedule.hoursPerDay}
                  onChange={(e) =>
                    setTempSchedule({
                      ...tempSchedule,
                      hoursPerDay: parseFloat(e.target.value || "0.5"),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="bg-sky-50 p-4 rounded-lg">
                <div className="text-sm text-sky-700">
                  With this schedule, you’ll complete the project by approximately{" "}
                  <strong>
                    {(() => {
                      const remaining = Math.max(0, estimatedHoursNumber - activeProject.hoursCompleted);
                      const perWeek = Math.max(0.5, tempSchedule.daysPerWeek * tempSchedule.hoursPerDay);
                      const weeks = Math.ceil(remaining / perWeek);
                      const d = new Date();
                      d.setDate(d.getDate() + weeks * 7);
                      return d.toLocaleDateString();
                    })()}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

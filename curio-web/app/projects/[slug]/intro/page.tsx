"use client";

import { useParams, useRouter } from "next/navigation";
import { INTRO_REGISTRIES } from "@/src/introRegistries";
import { useState } from "react";
import { ChevronLeft, CheckCircle2, ArrowRight } from "lucide-react";
import type { ProjectData } from "@/src/introRegistries";

interface ProjectOverviewUIProps {
  projectData: ProjectData;
  onStartLearning?: (level: "beginner" | "intermediate" | "advanced") => void;
  onBack?: () => void;
}

function ProjectOverviewUI({
  projectData,
  onStartLearning,
  onBack,
}: ProjectOverviewUIProps) {
  const [selectedLevel, setSelectedLevel] = useState<
    "beginner" | "intermediate" | "advanced" | null
  >(null);
  const [workflowLevel, setWorkflowLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-800 to-indigo-500 text-white">
        <div className="max-w-7xl mx-auto px-12 py-12">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back to Projects</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-white mb-4">{projectData.title}</h1>
              <p className="text-m text-indigo-100 mb-6 max-w-3xl">
                {projectData.subtitle}
              </p>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="text-indigo-200 mb-1">Difficulty</div>
                  <div className="text-white">
                    {projectData.headerInfo.difficulty}
                  </div>
                </div>
                <div>
                  <div className="text-indigo-200 mb-1">Duration</div>
                  <div className="text-white">
                    {projectData.headerInfo.duration}
                  </div>
                </div>
                <div>
                  <div className="text-indigo-200 mb-1">Components</div>
                  <div className="text-white">
                    {projectData.headerInfo.components}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <img
                src={projectData.imageUrl}
                alt={projectData.title}
                className="w-64 h-48 object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-12 py-12">
        {/* What You'll Build */}
        <section className="mb-16">
          <h2 className="mb-8">What You'll Build</h2>
          <div className="grid grid-cols-2 gap-6">
            {projectData.features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Capabilities */}
        <section className="mb-16">
          <h2 className="mb-8">What You'll Be Able to Do</h2>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-100">
            <div className="grid grid-cols-2 gap-4">
              {projectData.capabilities.map((capability, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{capability}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2>How Your Prototype Works</h2>

            {/* Level Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setWorkflowLevel("beginner")}
                className={`px-6 py-2 rounded-md transition-all ${
                  workflowLevel === "beginner"
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Beginner
              </button>
              <button
                onClick={() => setWorkflowLevel("intermediate")}
                className={`px-6 py-2 rounded-md transition-all ${
                  workflowLevel === "intermediate"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Intermediate
              </button>
              <button
                onClick={() => setWorkflowLevel("advanced")}
                className={`px-6 py-2 rounded-md transition-all ${
                  workflowLevel === "advanced"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Advanced
              </button>
            </div>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div
              className={`absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b ${
                workflowLevel === "beginner"
                  ? "from-green-200 via-green-300 to-green-200"
                  : workflowLevel === "intermediate"
                  ? "from-blue-200 via-blue-300 to-blue-200"
                  : "from-purple-200 via-purple-300 to-purple-200"
              }`}
            />

            <div className="space-y-6">
              {projectData.workflows[workflowLevel].map((item, index) => (
                <div key={index} className="relative flex items-start gap-6">
                  <div
                    className={`relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0 border-4 ${
                      workflowLevel === "beginner"
                        ? "border-green-600"
                        : workflowLevel === "intermediate"
                        ? "border-blue-600"
                        : "border-purple-600"
                    }`}
                  >
                    <span
                      className={
                        workflowLevel === "beginner"
                          ? "text-green-600"
                          : workflowLevel === "intermediate"
                          ? "text-blue-600"
                          : "text-purple-600"
                      }
                    >
                      {item.step}
                    </span>
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Choose Your Level */}
        <section className="mb-12">
          <h2 className="mb-8 text-center">Choose Your Learning Path</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Select the difficulty level that matches your experience. You can
            always switch levels later.
          </p>

          <div className="grid grid-cols-3 gap-6 mb-8">
            {projectData.levels.map((level) => (
              <div
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`bg-white rounded-xl p-8 border-2 cursor-pointer transition-all ${
                  selectedLevel === level.id
                    ? level.color === "green"
                      ? "border-green-500 shadow-lg shadow-green-100"
                      : level.color === "blue"
                      ? "border-blue-500 shadow-lg shadow-blue-100"
                      : "border-purple-500 shadow-lg shadow-purple-100"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-xl ${
                      selectedLevel === level.id
                        ? level.color === "green"
                          ? "text-green-600"
                          : level.color === "blue"
                          ? "text-blue-600"
                          : "text-purple-600"
                        : "text-gray-900"
                    }`}
                  >
                    {level.title}
                  </h3>
                  {selectedLevel === level.id && (
                    <CheckCircle2
                      className={`w-6 h-6 ${
                        level.color === "green"
                          ? "text-green-500"
                          : level.color === "blue"
                          ? "text-blue-500"
                          : "text-purple-500"
                      }`}
                    />
                  )}
                </div>

                <div
                  className={`text-sm mb-4 ${
                    selectedLevel === level.id
                      ? level.color === "green"
                        ? "text-green-600"
                        : level.color === "blue"
                        ? "text-blue-600"
                        : "text-purple-600"
                      : "text-gray-500"
                  }`}
                >
                  {level.duration}
                </div>

                <p className="text-gray-600 text-sm mb-6">{level.description}</p>

                <div className="space-y-2">
                  {level.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-2 ${
                          level.color === "green"
                            ? "bg-green-500"
                            : level.color === "blue"
                            ? "bg-blue-500"
                            : "bg-purple-500"
                        }`}
                      />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Start Learning Button */}
          <div className="flex justify-center">
            <button
              onClick={() => selectedLevel && onStartLearning?.(selectedLevel)}
              disabled={!selectedLevel}
              className={`flex items-center gap-3 px-12 py-4 rounded-xl text-lg transition-all ${
                selectedLevel
                  ? selectedLevel === "beginner"
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl"
                    : selectedLevel === "intermediate"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Start Learning
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}


export default function IntroPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params?.slug ?? "");

  const entry = slug ? INTRO_REGISTRIES[slug] : undefined;

  if (!slug || !entry) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-5xl mx-auto text-gray-700">
          No intro data for slug: <b>{slug || "(missing slug)"}</b>
        </div>
      </div>
    );
  }

  return (
    <ProjectOverviewUI
      projectData={entry.data}
      onBack={() => router.push(`/projects/${slug}`)}
      onStartLearning={(level) =>
        router.push(`/projects/${slug}/lessons/${entry.levelToLessonSlug[level]}`)
      }
    />
  );
}

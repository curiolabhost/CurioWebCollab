// app/projects/[slug]/page.tsx

import Link from "next/link";
import {
  ChevronLeft,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  Wrench,
  Lightbulb,
  Target,
  Award,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { ImageWithFallback } from "../../components/ui/ImageWithFallback";
import { PROJECTS } from "../../data/projects";
import SmartBackButton from "./SmartBackButton";

type AnyProject = any;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project: AnyProject | undefined = PROJECTS.find(
    (p: AnyProject) => p.slug === slug
  );

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-gray-700">Project not found.</div>
      </div>
    );
  }

  const description: string =
    project.description ?? project.shortDescription ?? "";

  const fullDescription: string =
    project.fullDescription ?? project.overview ?? "";

  const hours: string = project.hours ?? project.estimatedHours ?? "";

  const learningOutcomes: string[] = Array.isArray(project.learningOutcomes)
    ? project.learningOutcomes
    : [];

  const projectHighlights: string[] = Array.isArray(project.projectHighlights)
    ? project.projectHighlights
    : [];

  const prerequisites: string[] = Array.isArray(project.prerequisites)
    ? project.prerequisites
    : [];

  const materials: string[] = Array.isArray(project.materials)
    ? project.materials
    : [];

  const skills: string[] = Array.isArray(project.skills)
    ? project.skills
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SmartBackButton label="Back to Projects" />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-sky-800 to-indigo-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-3 py-1 bg-white/20 rounded-full">
                  {project.difficulty}
                </span>
                <span className="text-xs px-3 py-1 bg-white/20 rounded-full">
                  {project.category}
                </span>
              </div>

              <h1 className="text-4xl font-semibold mb-4">
                {project.title}
              </h1>

              <p className="text-lg text-indigo-100 mb-6">
                {description}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href={`/lessons/${project.slug}`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white text-indigo-900 hover:bg-gray-100"
                  >
                    Start Learning
                  </Button>
                </Link>

                <Link href="#preview">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-indigo-900 hover:bg-white/10 hover:text-white"
                  >
                    Preview Lessons
                  </Button>
                </Link>
              </div>
            </div>

            <div>
              <ImageWithFallback
                src={project.image}
                alt={project.title}
                className="rounded-xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <BarChart3 className="w-8 h-8 text-indigo-800 mx-auto mb-2" />
              <div className="font-medium">Level</div>
              <div className="text-sm text-gray-600">
                {project.difficulty}
              </div>
            </div>

            <div>
              <Users className="w-8 h-8 text-indigo-800 mx-auto mb-2" />
              <div className="font-medium">Age Range</div>
              <div className="text-sm text-gray-600">
                {project.ageRange}
              </div>
            </div>

            <div>
              <Clock className="w-8 h-8 text-indigo-800 mx-auto mb-2" />
              <div className="font-medium">Duration</div>
              <div className="text-sm text-gray-600">{hours}</div>
            </div>

            <div>
              <Award className="w-8 h-8 text-indigo-800 mx-auto mb-2" />
              <div className="font-medium">Certificate</div>
              <div className="text-sm text-gray-600">
                Upon completion
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">
                Project Overview
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {fullDescription}
              </p>
            </div>

            {learningOutcomes.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-xl font-semibold">
                    What You’ll Learn
                  </h3>
                </div>
                <ul className="space-y-3">
                  {learningOutcomes.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {projectHighlights.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-xl font-semibold">
                    Project Highlights
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {projectHighlights.map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 bg-indigo-50 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prerequisites.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">
                  Prerequisites
                </h3>
                <ul className="space-y-2">
                  {prerequisites.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div
              id="preview"
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-2">
                Preview Lessons
              </h3>
              <p className="text-gray-700">
                Preview coming soon — sample steps and code will appear here.
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Wrench className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-semibold">
                  Materials Needed
                </h3>
              </div>
              <ul className="space-y-2">
                {materials.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">
                Skills You’ll Use
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-sky-600 to-purple-700 rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">
                Ready to Start?
              </h3>
              <p className="text-sm text-indigo-100 mb-4">
                Join thousands of students building amazing projects.
              </p>
              <Link href={`/lessons/${project.slug}`}>
                <Button
                  variant="outline"
                  className="w-full bg-white text-indigo-600 hover:bg-gray-100"
                >
                  Start Learning Now
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <SmartBackButton label="Back" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

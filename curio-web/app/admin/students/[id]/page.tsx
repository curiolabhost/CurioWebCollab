// app/admin/students/[id]/page.tsx
"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Sparkles, Code, FileText, BarChart3, ChevronRight, Eye } from "lucide-react";
import { getStudentById } from "@/app/lib/adminMockData";
import type { Student } from "@/app/lib/adminMockData";
import router from "next/dist/shared/lib/router/router";

function ProgressBar({ progress, showLabel = false, size = "lg" }: { progress: number; showLabel?: boolean; size?: "sm" | "lg" }) {
  const height = size === "lg" ? "h-3" : "h-2";

  const getColor = () => {
    if (progress >= 70) return "bg-green-500";
    if (progress >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 ${height} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${getColor()} rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-gray-700 min-w-[40px]">
          {progress}%
        </span>
      )}
    </div>
  );
}

function ProjectDetailsTab({ student }: { student: Student }) {

  const router = useRouter();
  const handleViewAsAdmin = (projectName: string) => {
    // convert project name to URL-friendly format
    const projectId = projectName.toLowerCase().replace(/\s+/g, '-');
    router.push(`/admin/students/${student.id}/projects/${projectId}`);
  };

  return (
    <div className="space-y-4">
      {student.projects.map((project, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5">
          {/* Project Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-sky-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500">Last active: {project.lastActive}</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                project.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {project.status === "completed" ? "Completed" : "In Progress"}
            </span>
          </div>

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {project.progress}%
              </span>
            </div>
            <ProgressBar progress={project.progress} showLabel={false} size="lg" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button 
              onClick={() => handleViewAsAdmin(project.name)}
              className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">View as Admin</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Solutions</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Analytics</span>
            </button>
          </div>

          {/* Code Preview for Completed Projects */}
          {project.status === "completed" && project.submissions && project.submissions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Latest Submission
              </h4>
              <div className="bg-slate-800 rounded-lg p-3 overflow-x-auto">
                <pre className="text-xs text-slate-200 leading-relaxed">
                  <code>{project.submissions[0].code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AIAnalysisTab({ student }: { student: Student }) {
  const performanceLevel =
    student.progress >= 70 ? "excellent" :
    student.progress >= 40 ? "good" :
    "developing";

  const strengthLevel = student.progress >= 70 ? "strong" : "growing";

  return (
    <div className="space-y-4">
      {/* AI Header */}
      <div className="flex items-center gap-4 bg-purple-50 rounded-xl border border-purple-200 p-5">
        <Sparkles className="w-8 h-8 text-purple-600 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-bold text-purple-900">AI-Powered Insights</h3>
          <p className="text-sm text-purple-700 mt-1">
            Analysis generated by Claude AI based on {student.name}'s progress and submissions
          </p>
        </div>
      </div>

      {/* Overall Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          📊 Overall Performance
        </h4>
        <p className="text-sm text-gray-700 leading-relaxed">
          {student.name} is showing {performanceLevel} progress with {student.progress}%
          completion across {student.projectsStarted} projects. They have successfully
          completed {student.projectsCompleted} project{student.projectsCompleted !== 1 ? "s" : ""},
          demonstrating {strengthLevel} understanding of Arduino fundamentals.
        </p>
      </div>

      {/* Strengths */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          💪 Strengths
        </h4>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">
              Consistent code structure and commenting practices
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">
              Good understanding of digital I/O operations
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">
              Creative problem-solving approach in project implementations
            </p>
          </div>
        </div>
      </div>

      {/* Areas for Improvement */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          🎯 Areas for Growth
        </h4>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">
              Could benefit from more practice with analog sensors
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">
              Consider exploring more advanced loop structures
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-sky-600 rounded-full mt-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">
              Opportunity to optimize code for better performance
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          💡 Personalized Recommendations
        </h4>
        <p className="text-sm text-gray-700 mb-3">
          Based on current progress, {student.name} would benefit from:
        </p>
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-sky-50 p-3 rounded-lg">
            <ChevronRight className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-sky-900">
              Attempting the "Digital Clock" project to reinforce timing concepts
            </p>
          </div>
          <div className="flex items-start gap-2 bg-sky-50 p-3 rounded-lg">
            <ChevronRight className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-sky-900">
              Reviewing sensor integration before moving to advanced projects
            </p>
          </div>
          <div className="flex items-start gap-2 bg-sky-50 p-3 rounded-lg">
            <ChevronRight className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-sky-900">
              Collaborating with peers in {student.group} for knowledge sharing
            </p>
          </div>
        </div>
      </div>

      {/* Learning Patterns */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          📈 Learning Patterns
        </h4>
        <p className="text-sm text-gray-700 leading-relaxed">
          {student.name} typically works on projects during afternoon hours and shows
          higher engagement when tackling hands-on circuit building activities. Average
          session duration: 45 minutes. Most productive: Tuesdays and Thursdays.
        </p>
      </div>
    </div>
  );
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"projects" | "ai-analysis">("projects");

  const student = getStudentById(parseInt(resolvedParams.id));

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Student not found.</p>
          <button
            onClick={() => router.push("/admin")}
            className="mt-4 text-sky-600 hover:text-sky-700"
          >
            Return to Students List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/admin")}
        className="flex items-center gap-2 mb-5 text-gray-700 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-base font-medium">Back to Students</span>
      </button>

      {/* Student Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-sky-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-white">
              {student.avatar}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {student.name}
            </h1>
            <p className="text-sm text-gray-500 mb-2">{student.email}</p>
            <div className="inline-flex items-center gap-1.5 bg-purple-100 px-3 py-1.5 rounded-xl">
              <Users className="w-3.5 h-3.5 text-purple-700" />
              <span className="text-xs font-medium text-purple-800">
                {student.group}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {student.projectsStarted}
            </p>
            <p className="text-xs text-gray-500 mt-1">Projects Started</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {student.projectsCompleted}
            </p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{student.progress}%</p>
            <p className="text-xs text-gray-500 mt-1">Overall Progress</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === "projects"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className={`text-sm ${activeTab === "projects" ? "font-semibold" : "font-medium"}`}>
            Project Details
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ai-analysis")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === "ai-analysis"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${activeTab === "ai-analysis" ? "text-sky-600" : "text-gray-600"}`} />
          <span className={`text-sm ${activeTab === "ai-analysis" ? "font-semibold" : "font-medium"}`}>
            AI Analysis
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "projects" ? (
          <ProjectDetailsTab student={student} />
        ) : (
          <AIAnalysisTab student={student} />
        )}
      </div>
    </div>
  );
}
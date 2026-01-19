// app/components/admin/ProjectsView.tsx
"use client";

import Link from "next/link";
import { Eye, Info } from "lucide-react";
import { availableProjects } from "../../lib/adminMockData";

export function ProjectsView() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects View</h1>
          <p className="text-sm text-gray-500 mt-1">Student-facing project library</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-semibold">View as Student</span>
        </Link>
      </div>

      {/* Preview Note */}
      <div className="flex items-center gap-2 bg-sky-50 px-3 py-3 rounded-lg mb-4">
        <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />
        <p className="text-sm text-sky-900">
          This is what students see when they access the Arduino Projects page
        </p>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Projects</h2>

        <div className="space-y-0">
          {availableProjects.map((project, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-sky-600"
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
                  <p className="text-sm text-gray-500">
                    {project.level} • Age {project.age}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-sky-600">
                  {project.studentCount} students
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
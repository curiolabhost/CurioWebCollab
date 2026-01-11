// app/components/admin/StudentsView.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ArrowRight, Search, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { students, getStudentStats } from "@/app/lib/adminMockData";

function ProgressBar({ progress }: { progress: number }) {
  const getColor = () => {
    if (progress >= 70) return "bg-green-500";
    if (progress >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-2 ${getColor()} rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 min-w-[40px]">
        {progress}%
      </span>
    </div>
  );
}

export function StudentsView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const stats = getStudentStats();

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStudentClick = (studentId: number) => {
    router.push(`/admin/students/${studentId}`);
  };

  const statsCards = [
    {
      icon: Users,
      number: stats.total,
      label: "Total Students",
      color: "text-sky-600",
    },
    {
      icon: CheckCircle,
      number: stats.onTrack,
      label: "On Track",
      color: "text-green-600",
    },
    {
      icon: Clock,
      number: stats.inProgress,
      label: "In Progress",
      color: "text-amber-600",
    },
    {
      icon: AlertCircle,
      number: stats.needHelp,
      label: "Need Help",
      color: "text-red-600",
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor student progress
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Export</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 mb-6">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          className="flex-1 py-2.5 text-sm text-gray-900 outline-none"
          placeholder="Search students by name, email, or group..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center"
            >
              <Icon className={`w-6 h-6 ${card.color} mb-2`} />
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.number}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Student
          </div>
          <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Group
          </div>
          <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Projects
          </div>
          <div className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Progress
          </div>
          <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
            Actions
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => handleStudentClick(student.id)}
              className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* Student */}
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-white">
                    {student.avatar}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {student.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{student.email}</p>
                </div>
              </div>

              {/* Group */}
              <div className="col-span-2 flex items-center">
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium bg-purple-100 text-purple-800">
                  {student.group}
                </span>
              </div>

              {/* Projects */}
              <div className="col-span-2 flex items-center">
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {student.projectsCompleted}/{student.projectsStarted}
                  </p>
                  <p className="text-xs text-gray-500">completed</p>
                </div>
              </div>

              {/* Progress */}
              <div className="col-span-4 flex items-center">
                <ProgressBar progress={student.progress} />
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowRight className="w-4 h-4 text-sky-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No students found matching your search.</p>
        </div>
      )}
    </div>
  );
}
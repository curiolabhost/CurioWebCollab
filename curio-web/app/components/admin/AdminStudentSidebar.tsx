// app/components/admin/AdminStudentSidebar.tsx
// Pure (deterministic) admin sidebar. No context, no window globals.
// Parent provides adminLocation + responses for that location.

"use client";

import React, { useMemo, useState } from "react";
import {
  MessageSquare,
  Code,
  FileText,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

import type { AdminLessonLocation, AdminReadOnlyState } from "@/src/lesson-core/types/adminReadOnlyState";
import type { StudentResponse } from "@/app/contexts/StudentResponseContext";

type AdminStudentSidebarProps = {
  student: {
    id: string;
    name: string;
    email?: string | null;
    avatar?: string | null; // can be initial(s) or null
  };
  project: {
    slug: string;
    title: string;
  };

  adminLocation: AdminLessonLocation;

  // If you already filtered these in the parent to "current location", pass that here.
  responses: StudentResponse[];

  // Optional extra info
  adminReadOnlyState?: AdminReadOnlyState;
  difficulty?: "beginner" | "intermediate" | "advanced";
};

function ResponseIcon({ type }: { type: StudentResponse["responseType"] }) {
  switch (type) {
    case "code":
      return <Code className="w-4 h-4 text-blue-600" />;
    case "ai_chat":
      return <MessageSquare className="w-4 h-4 text-purple-600" />;
    case "text":
      return <FileText className="w-4 h-4 text-green-600" />;
    case "multiple_choice":
      return <CheckCircle2 className="w-4 h-4 text-amber-600" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-600" />;
  }
}

function CodeResponseDisplay({ response }: { response: StudentResponse }) {
  const [expanded, setExpanded] = useState(false);
  const blanks = (response as any)?.data?.blanks || {};
  const blankEntries = Object.entries(blanks as Record<string, any>);
  const blankCount = blankEntries.length;

  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full text-left">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-900">
            Code Response ({blankCount} blank{blankCount !== 1 ? "s" : ""})
          </span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {blankEntries.map(([key, value]) => (
            <div key={key} className="bg-white rounded p-2 border border-slate-200">
              <div className="text-xs font-mono text-slate-500 mb-1">{key}</div>
              <div className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded break-words whitespace-pre-wrap">
                {String(value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AIChatResponseDisplay({ response }: { response: StudentResponse }) {
  const userMessage = (response as any)?.data?.userMessage;
  const aiResponse = (response as any)?.data?.aiResponse;

  return (
    <div className="space-y-3">
      {/* Student Message */}
      <div className="flex gap-2">
        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-xs font-medium text-blue-900 mb-1">Student</div>
          <div className="text-sm text-blue-800 whitespace-pre-wrap break-words">
            {userMessage ?? <span className="text-blue-600/70">(no message)</span>}
          </div>
        </div>
      </div>

      {/* AI Response */}
      {aiResponse && (
        <div className="flex gap-2">
          <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="flex-1 bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-xs font-medium text-purple-900 mb-1">AI Assistant</div>
            <div className="text-sm text-purple-800 leading-relaxed whitespace-pre-wrap break-words">{aiResponse}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextResponseDisplay({ response }: { response: StudentResponse }) {
  const text = (response as any)?.data?.text;

  return (
    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-green-600" />
        <span className="text-xs font-medium text-green-900">Student Note</span>
      </div>
      <div className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap break-words">
        {text ?? <span className="text-green-700/70">(empty)</span>}
      </div>
    </div>
  );
}

function ResponseCard({ response, index }: { response: StudentResponse; index: number }) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ResponseIcon type={response.responseType} />
          <span className="text-xs font-medium text-gray-500">Response #{index + 1}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          {formatTime(response.timestamp)}
        </div>
      </div>

      {/* Response Content */}
      {response.responseType === "code" && <CodeResponseDisplay response={response} />}
      {response.responseType === "ai_chat" && <AIChatResponseDisplay response={response} />}
      {response.responseType === "text" && <TextResponseDisplay response={response} />}
      {response.responseType === "multiple_choice" && (
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-sm text-amber-900">
          Multiple choice response (rendering coming soon)
        </div>
      )}
    </div>
  );
}

export function AdminStudentSidebar(props: AdminStudentSidebarProps) {
  const { student, project, adminLocation, responses, difficulty } = props;

  const difficultyConfig = {
    beginner: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      label: "Beginner",
    },
    intermediate: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-200",
      label: "Intermediate",
    },
    advanced: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-200",
      label: "Advanced",
    },
  } as const;

  const difficultyStyle = difficulty ? difficultyConfig[difficulty] : null;

  const headerSubtitle = useMemo(() => {
    const stepHuman = adminLocation.stepIndex + 1;
    const block = adminLocation.codeBlockIndex != null ? ` · Block ${adminLocation.codeBlockIndex + 1}` : "";
    return `${adminLocation.lessonSlug} · Step ${stepHuman}${block}`;
  }, [adminLocation]);

  const avatarLabel = useMemo(() => {
    if (student.avatar && student.avatar.trim()) return student.avatar.trim();
    const first = (student.name || "").trim().slice(0, 1).toUpperCase();
    return first || "S";
  }, [student.avatar, student.name]);

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{avatarLabel}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{student.name || "Student"}</h3>
            <p className="text-xs text-gray-500 truncate">ID: {student.id}</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200 mb-2">
          <p className="text-xs font-medium text-blue-900 truncate">{project.title}</p>
          <p className="text-xs text-blue-700 mt-1 truncate">{headerSubtitle}</p>
        </div>

        {difficultyStyle && (
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${difficultyStyle.bg} ${difficultyStyle.border}`}>
            <GraduationCap className={`w-3.5 h-3.5 ${difficultyStyle.text}`} />
            <span className={`text-xs font-semibold ${difficultyStyle.text}`}>{difficultyStyle.label} Level</span>
          </div>
        )}
      </div>

      {/* Responses */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {responses.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No responses for this section</p>
            <p className="text-xs text-gray-400 mt-1">Responses will appear as the student progresses</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 sticky top-0 z-10 shadow-sm">
              <p className="text-xs font-medium text-gray-700">
                {responses.length} response{responses.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {responses.map((response, index) => (
              <ResponseCard key={response.id} response={response} index={index} />
            ))}

            <div className="h-4" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3">
        <p className="text-xs text-gray-500 text-center">Admin View · Response Tracking</p>
      </div>
    </div>
  );
}

// app/admin/students/[id]/projects/[projectId]/page.tsx
"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { getStudentById } from "@/app/lib/adminMockData";
import { getStudentResponseData } from "@/app/lib/studentResponseMockData";
import { StudentResponseProvider, useStudentResponses} from "@/app/contexts/StudentResponseContext";
import { ProjectViewWrapper } from "@/app/components/admin/ProjectViewWrapper";

import ElectricStatusBoardBeginner from "@/src/projects/electric-status-board/lessons/codeBeg";
import ElectricStatusBoardIntermediate from "@/src/projects/electric-status-board/lessons/codeInt";
import ElectricStatusBoardAdvanced from "@/src/projects/electric-status-board/lessons/codeAdv";


// Component that renders the correct difficulty lesson
function LessonRenderer({ 
  projectName, 
  difficulty 
}: { 
  projectName: string; 
  difficulty?: "beginner" | "intermediate" | "advanced";
}) {
  // For Electric Status Board, load the correct difficulty
  if (projectName.toLowerCase().includes("electric status board")) {
    const slug = "electric-status-board";
    
    switch (difficulty) {
      case "beginner":
        return <ElectricStatusBoardBeginner slug={slug} lessonSlug="code-beginner" />;
      
      case "intermediate":
        return <ElectricStatusBoardIntermediate slug={slug} lessonSlug="code-intermediate" />;
      
      case "advanced":
        return <ElectricStatusBoardAdvanced slug={slug} lessonSlug="code-advanced" />;
      
      default:
        // Fallback to beginner if no difficulty specified
        return <ElectricStatusBoardBeginner slug={slug} lessonSlug="code-beginner" />;
    }
  }
  
  // Add other projects here as needed
  // if (projectName.toLowerCase().includes("remote control car")) { ... }
  
  // Default fallback
  return (
    <div className="p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900 font-medium mb-2">
          Project lesson not configured
        </p>
        <p className="text-sm text-yellow-800">
          Add the lesson component for "{projectName}" to the LessonRenderer.
        </p>
      </div>
    </div>
  );
}

// Difficulty badge component
function DifficultyBadge({ difficulty }: { difficulty?: "beginner" | "intermediate" | "advanced" }) {
  if (!difficulty) return null;
  
  const config = {
    beginner: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300",
      label: "Beginner",
    },
    intermediate: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-300",
      label: "Intermediate",
    },
    advanced: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-300",
      label: "Advanced",
    },
  };
  
  const style = config[difficulty];
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${style.bg} ${style.border}`}>
      <GraduationCap className={`w-3.5 h-3.5 ${style.text}`} />
      <span className={`text-xs font-semibold ${style.text}`}>
        {style.label} Level
      </span>
    </div>
  );
}

// Inner component that uses the context
function AdminProjectViewContent({ 
  studentResponses,
  student,
  project,
  router,
  studentId
}: { 
  studentResponses: any;
  student: any;
  project: any;
  router: any;
  studentId: number;
}) {
  const { setStudentData } = useStudentResponses();
  
  useEffect(() => {
    console.log("Setting student data:", studentResponses);
    if (studentResponses) {
      setStudentData(studentResponses);
    }
    
    return () => {
      setStudentData(null);
    };
  }, [studentResponses, setStudentData]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => router.push(`/admin/students/${studentId}`)}
          className="flex items-center gap-2 mb-3 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Student</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              {/* Show difficulty badge */}
              <DifficultyBadge difficulty={project.difficulty} />
            </div>
            <p className="text-sm text-gray-500">
              Viewing as admin · {student.name}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                Progress: {project.progress}%
              </p>
              <p className="text-xs text-gray-500">
                {project.status === "completed" ? "Completed" : "In Progress"}
              </p>
            </div>
            <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {student.avatar}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Content with Admin Sidebar */}
      <div className="flex-1 overflow-hidden">
        <ProjectViewWrapper 
          isAdminView={true}
          onLessonChange={(lessonId, stepId, codeBlockIndex) => {
            console.log(`Admin viewing: Lesson ${lessonId}, Step ${stepId}, Block ${codeBlockIndex}`);
          }}
        >
          {/* Render the correct difficulty level */}
          <LessonRenderer 
            projectName={project.name}
            difficulty={project.difficulty}
          />
        </ProjectViewWrapper>
      </div>
    </div>
  );
}

// Outer component that creates the provider
export default function AdminProjectViewPage({ 
  params 
}: { 
  params: Promise<{ id: string; projectId: string }> 
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const studentId = parseInt(resolvedParams.id);
  const projectId = resolvedParams.projectId;
  
  const student = getStudentById(studentId);
  const studentResponses = getStudentResponseData(studentId);

  console.log("=== ADMIN VIEW DEBUG ===");
  console.log("Student ID:", studentId);
  console.log("Student:", student);
  console.log("Student Responses:", studentResponses);

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Student not found.</p>
          <button
            onClick={() => router.push("/admin")}
            className="mt-4 text-sky-600 hover:text-sky-700"
          >
            Return to Students
          </button>
        </div>
      </div>
    );
  }

  const project = student.projects.find(p => 
    p.name.toLowerCase().replace(/\s+/g, '-') === projectId
  );

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Project not found.</p>
          <button
            onClick={() => router.push(`/admin/students/${studentId}`)}
            className="mt-4 text-sky-600 hover:text-sky-700"
          >
            Return to Student Details
          </button>
        </div>
      </div>
    );
  }

  if (!studentResponses) {
    console.warn(`No response data found for student ${studentId}`);
  }

  return (
    <StudentResponseProvider>
      <AdminProjectViewContent 
        studentResponses={studentResponses}
        student={student}
        project={project}
        router={router}
        studentId={studentId}
      />
    </StudentResponseProvider>
  );
}

// app/admin/students/[id]/projects/[projectId]/page.tsx
"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStudentById } from "@/app/lib/adminMockData";
import { getStudentResponseData } from "@/app/lib/studentResponseMockData";
import { StudentResponseProvider, useStudentResponses} from "@/app/contexts/StudentResponseContext";
import { ProjectViewWrapper } from "@/app/components/admin/ProjectViewWrapper";

// Import lesson component
import ElectricStatusBoardLesson from "@/src/projects/electric-status-board/lessons/codeBeg";

// ========================================
// ✅ INNER COMPONENT (uses the hook)
// This component is INSIDE the provider, so it can use useStudentResponses
// ========================================
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
  // ✅ NOW this works because we're inside the provider
  const { setStudentData } = useStudentResponses();
  
  useEffect(() => {
    console.log("Setting student data:", studentResponses);
    if (studentResponses) {
      setStudentData(studentResponses);
    }
    
    // Cleanup when component unmounts
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
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
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
            // Optional: Handle lesson changes for analytics or logging
            console.log(`Admin viewing: Lesson ${lessonId}, Step ${stepId}, Block ${codeBlockIndex}`);
          }}
        >
          <ElectricStatusBoardLesson slug="electric-status-board" lessonSlug="code-beginner" />
        </ProjectViewWrapper>
      </div>
    </div>
  );
}

// ========================================
// ✅ OUTER COMPONENT (creates the provider)
// This is the main page export
// ========================================
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

  // Handle missing student
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

  // Find the project
  const project = student.projects.find(p => 
    p.name.toLowerCase().replace(/\s+/g, '-') === projectId
  );

  // Handle missing project
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

  // Handle missing response data (optional - sidebar will just show "no responses")
  if (!studentResponses) {
    console.warn(`No response data found for student ${studentId}`);
  }

  // ✅ CRITICAL: Wrap with provider, then render inner component
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
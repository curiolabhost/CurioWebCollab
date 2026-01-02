// app/admin.js
// Admin Dashboard with Canvas-style layout

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState("students"); // "students" or "projects"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Mock student data
  const students = [
    {
      id: 1,
      name: "Emma Johnson",
      email: "emma.j@school.edu",
      group: "Group A - Morning",
      avatar: "EJ",
      projectsStarted: 2,
      projectsCompleted: 1,
      progress: 65,
      projects: [
        {
          name: "Electric Status Board",
          status: "completed",
          progress: 100,
          lastActive: "2 days ago",
        },
        {
          name: "Remote Control Car",
          status: "in-progress",
          progress: 45,
          lastActive: "1 hour ago",
        },
      ],
    },
    {
      id: 2,
      name: "Liam Chen",
      email: "liam.c@school.edu",
      group: "Group B - Afternoon",
      avatar: "LC",
      projectsStarted: 3,
      projectsCompleted: 2,
      progress: 82,
      projects: [
        {
          name: "Electric Status Board",
          status: "completed",
          progress: 100,
          lastActive: "1 week ago",
        },
        {
          name: "Digital Clock",
          status: "completed",
          progress: 100,
          lastActive: "3 days ago",
        },
        {
          name: "Electronic Safe",
          status: "in-progress",
          progress: 30,
          lastActive: "4 hours ago",
        },
      ],
    },
    {
      id: 3,
      name: "Sophia Martinez",
      email: "sophia.m@school.edu",
      group: "Group A - Morning",
      avatar: "SM",
      projectsStarted: 1,
      projectsCompleted: 0,
      progress: 25,
      projects: [
        {
          name: "Electric Status Board",
          status: "in-progress",
          progress: 25,
          lastActive: "30 minutes ago",
        },
      ],
    },
    {
      id: 4,
      name: "Noah Williams",
      email: "noah.w@school.edu",
      group: "Group C - Advanced",
      avatar: "NW",
      projectsStarted: 4,
      projectsCompleted: 3,
      progress: 90,
      projects: [
        {
          name: "Electric Status Board",
          status: "completed",
          progress: 100,
          lastActive: "2 weeks ago",
        },
        {
          name: "Remote Control Car",
          status: "completed",
          progress: 100,
          lastActive: "1 week ago",
        },
        {
          name: "Digital Clock",
          status: "completed",
          progress: 100,
          lastActive: "5 days ago",
        },
        {
          name: "Alarm Clock",
          status: "in-progress",
          progress: 55,
          lastActive: "2 hours ago",
        },
      ],
    },
    {
      id: 5,
      name: "Ava Thompson",
      email: "ava.t@school.edu",
      group: "Group B - Afternoon",
      avatar: "AT",
      projectsStarted: 2,
      projectsCompleted: 1,
      progress: 58,
      projects: [
        {
          name: "Electric Status Board",
          status: "completed",
          progress: 100,
          lastActive: "4 days ago",
        },
        {
          name: "Digital Clock",
          status: "in-progress",
          progress: 40,
          lastActive: "1 day ago",
        },
      ],
    },
  ];

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedStudent) {
    return <StudentDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.mainLayout}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>
              <Text style={styles.logoCurio}>CURIO</Text>
              <Text style={styles.logoLab}>LAB</Text>
            </Text>
            <Text style={styles.sidebarSubtitle}>Admin Portal</Text>
          </View>

          <View style={styles.sidebarNav}>
            <TouchableOpacity
              style={[
                styles.navButton,
                activeView === "students" && styles.navButtonActive,
              ]}
              onPress={() => setActiveView("students")}
            >
              <Ionicons
                name="people-outline"
                size={20}
                color={activeView === "students" ? "#0d9488" : "#6b7280"}
              />
              <Text
                style={[
                  styles.navButtonText,
                  activeView === "students" && styles.navButtonTextActive,
                ]}
              >
                Students View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                activeView === "projects" && styles.navButtonActive,
              ]}
              onPress={() => setActiveView("projects")}
            >
              <MaterialCommunityIcons
                name="view-grid-outline"
                size={20}
                color={activeView === "projects" ? "#0d9488" : "#6b7280"}
              />
              <Text
                style={[
                  styles.navButtonText,
                  activeView === "projects" && styles.navButtonTextActive,
                ]}
              >
                Projects View
              </Text>
            </TouchableOpacity>

            <View style={styles.navDivider} />

            <TouchableOpacity style={styles.navButton}>
              <Ionicons name="stats-chart-outline" size={20} color="#6b7280" />
              <Text style={styles.navButtonText}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton}>
              <Ionicons name="settings-outline" size={20} color="#6b7280" />
              <Text style={styles.navButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarFooter}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => router.replace("/")}
            >
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {activeView === "students" ? (
            <StudentsView
              students={filteredStudents}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectStudent={setSelectedStudent}
            />
          ) : (
            <ProjectsView router={router} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Students View Component
function StudentsView({ students, searchQuery, setSearchQuery, onSelectStudent }) {
  return (
    <View style={styles.contentWrapper}>
      {/* Header */}
      <View style={styles.contentHeader}>
        <View>
          <Text style={styles.contentTitle}>Students</Text>
          <Text style={styles.contentSubtitle}>
            Manage and monitor student progress
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="download-outline" size={18} color="#6b7280" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#9ca3af"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students by name, email, or group..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#0d9488" />
          <Text style={styles.statNumber}>{students.length}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          <Text style={styles.statNumber}>
            {students.filter((s) => s.progress >= 70).length}
          </Text>
          <Text style={styles.statLabel}>On Track</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>
            {students.filter((s) => s.progress < 70 && s.progress > 30).length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
          <Text style={styles.statNumber}>
            {students.filter((s) => s.progress <= 30).length}
          </Text>
          <Text style={styles.statLabel}>Need Help</Text>
        </View>
      </View>

      {/* Students Table */}
      <ScrollView style={styles.tableContainer}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2.5 }]}>Student</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Group</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Projects</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Progress</Text>
            <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Actions</Text>
          </View>

          {/* Table Rows */}
          {students.map((student) => (
            <TouchableOpacity
              key={student.id}
              style={styles.tableRow}
              onPress={() => onSelectStudent(student)}
              activeOpacity={0.7}
            >
              <View style={[styles.tableCell, { flex: 2.5 }]}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>{student.avatar}</Text>
                </View>
                <View>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentEmail}>{student.email}</Text>
                </View>
              </View>

              <View style={[styles.tableCell, { flex: 1.5 }]}>
                <View style={styles.groupBadge}>
                  <Text style={styles.groupBadgeText}>{student.group}</Text>
                </View>
              </View>

              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.projectsText}>
                  {student.projectsCompleted}/{student.projectsStarted}
                </Text>
                <Text style={styles.projectsLabel}>completed</Text>
              </View>

              <View style={[styles.tableCell, { flex: 1.5 }]}>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${student.progress}%`,
                        backgroundColor:
                          student.progress >= 70
                            ? "#22c55e"
                            : student.progress >= 40
                            ? "#f59e0b"
                            : "#ef4444",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{student.progress}%</Text>
              </View>

              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => onSelectStudent(student)}
                >
                  <Ionicons name="arrow-forward" size={18} color="#0d9488" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Projects View Component (shows what students see)
function ProjectsView({ router }) {
  return (
    <View style={styles.contentWrapper}>
      <View style={styles.contentHeader}>
        <View>
          <Text style={styles.contentTitle}>Projects View</Text>
          <Text style={styles.contentSubtitle}>
            Student-facing project library
          </Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/second")}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>View as Student</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewContainer}>
        <View style={styles.previewNote}>
          <Ionicons name="information-circle" size={20} color="#0d9488" />
          <Text style={styles.previewNoteText}>
            This is what students see when they access the Arduino Projects page
          </Text>
        </View>

        <ScrollView style={styles.previewScroll}>
          <View style={styles.projectPreviewCard}>
            <Text style={styles.previewSectionTitle}>Available Projects</Text>

            {[
              {
                name: "Electric Status Board",
                level: "Beginner",
                age: "10+",
                students: 12,
              },
              {
                name: "Remote Control Car",
                level: "Intermediate",
                age: "12+",
                students: 8,
              },
              {
                name: "Digital Clock",
                level: "Intermediate",
                age: "12+",
                students: 6,
              },
              {
                name: "Alarm Clock",
                level: "Intermediate",
                age: "13+",
                students: 3,
              },
              {
                name: "Electronic Safe",
                level: "Intermediate",
                age: "13+",
                students: 2,
              },
            ].map((project, idx) => (
              <View key={idx} style={styles.projectPreviewItem}>
                <View style={styles.projectPreviewLeft}>
                  <MaterialCommunityIcons
                    name="chip"
                    size={32}
                    color="#0d9488"
                  />
                  <View style={styles.projectPreviewInfo}>
                    <Text style={styles.projectPreviewName}>{project.name}</Text>
                    <Text style={styles.projectPreviewMeta}>
                      {project.level} • Age {project.age}
                    </Text>
                  </View>
                </View>
                <View style={styles.projectPreviewRight}>
                  <Text style={styles.projectStudentCount}>
                    {project.students} students
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// Student Detail View Component
function StudentDetailView({ student, onBack }) {
  const [activeTab, setActiveTab] = useState("projects"); // "projects" or "ai-analysis"

  return (
    <View style={styles.detailContainer}>
      {/* Back Button & Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
          <Text style={styles.backButtonText}>Back to Students</Text>
        </TouchableOpacity>
      </View>

      {/* Student Info Card */}
      <View style={styles.studentInfoCard}>
        <View style={styles.studentInfoLeft}>
          <View style={styles.studentAvatarLarge}>
            <Text style={styles.avatarTextLarge}>{student.avatar}</Text>
          </View>
          <View>
            <Text style={styles.studentNameLarge}>{student.name}</Text>
            <Text style={styles.studentEmailLarge}>{student.email}</Text>
            <View style={styles.groupBadgeLarge}>
              <Ionicons name="people" size={14} color="#0d9488" />
              <Text style={styles.groupBadgeTextLarge}>{student.group}</Text>
            </View>
          </View>
        </View>

        <View style={styles.studentInfoStats}>
          <View style={styles.infoStatItem}>
            <Text style={styles.infoStatNumber}>{student.projectsStarted}</Text>
            <Text style={styles.infoStatLabel}>Projects Started</Text>
          </View>
          <View style={styles.infoStatItem}>
            <Text style={styles.infoStatNumber}>{student.projectsCompleted}</Text>
            <Text style={styles.infoStatLabel}>Completed</Text>
          </View>
          <View style={styles.infoStatItem}>
            <Text style={styles.infoStatNumber}>{student.progress}%</Text>
            <Text style={styles.infoStatLabel}>Overall Progress</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "projects" && styles.tabActive]}
          onPress={() => setActiveTab("projects")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "projects" && styles.tabTextActive,
            ]}
          >
            Project Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "ai-analysis" && styles.tabActive]}
          onPress={() => setActiveTab("ai-analysis")}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={activeTab === "ai-analysis" ? "#0d9488" : "#6b7280"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "ai-analysis" && styles.tabTextActive,
            ]}
          >
            AI Analysis
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.tabContent}>
        {activeTab === "projects" ? (
          <ProjectDetailsTab student={student} />
        ) : (
          <AIAnalysisTab student={student} />
        )}
      </ScrollView>
    </View>
  );
}

// Project Details Tab
function ProjectDetailsTab({ student }) {
  return (
    <View style={styles.projectDetailsContainer}>
      {student.projects.map((project, idx) => (
        <View key={idx} style={styles.projectDetailCard}>
          <View style={styles.projectDetailHeader}>
            <View style={styles.projectDetailLeft}>
              <MaterialCommunityIcons name="chip" size={28} color="#0d9488" />
              <View>
                <Text style={styles.projectDetailName}>{project.name}</Text>
                <Text style={styles.projectDetailMeta}>
                  Last active: {project.lastActive}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.projectStatusBadge,
                {
                  backgroundColor:
                    project.status === "completed" ? "#dcfce7" : "#fef3c7",
                },
              ]}
            >
              <Text
                style={[
                  styles.projectStatusText,
                  {
                    color: project.status === "completed" ? "#15803d" : "#b45309",
                  },
                ]}
              >
                {project.status === "completed" ? "Completed" : "In Progress"}
              </Text>
            </View>
          </View>

          <View style={styles.projectProgressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercentage}>{project.progress}%</Text>
            </View>
            <View style={styles.progressBarLarge}>
              <View
                style={[
                  styles.progressBarFillLarge,
                  {
                    width: `${project.progress}%`,
                    backgroundColor:
                      project.status === "completed" ? "#22c55e" : "#f59e0b",
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.projectActions}>
            <TouchableOpacity style={styles.projectActionButton}>
              <Ionicons name="code-slash" size={18} color="#0d9488" />
              <Text style={styles.projectActionText}>View Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.projectActionButton}>
              <Ionicons name="document-text" size={18} color="#0d9488" />
              <Text style={styles.projectActionText}>Solutions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.projectActionButton}>
              <Ionicons name="stats-chart" size={18} color="#0d9488" />
              <Text style={styles.projectActionText}>Analytics</Text>
            </TouchableOpacity>
          </View>

          {/* Mock Solution Preview */}
          {project.status === "completed" && (
            <View style={styles.solutionPreview}>
              <Text style={styles.solutionPreviewTitle}>Latest Submission</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  {`void setup() {\n  pinMode(LED_PIN, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  // Student solution...\n}`}
                </Text>
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// AI Analysis Tab
function AIAnalysisTab({ student }) {
  return (
    <View style={styles.aiAnalysisContainer}>
      <View style={styles.aiHeaderCard}>
        <Ionicons name="sparkles" size={32} color="#8b5cf6" />
        <View style={styles.aiHeaderText}>
          <Text style={styles.aiHeaderTitle}>AI-Powered Insights</Text>
          <Text style={styles.aiHeaderSubtitle}>
            Analysis generated by Claude AI based on {student.name}'s progress and
            submissions
          </Text>
        </View>
      </View>

      {/* Overall Performance */}
      <View style={styles.aiCard}>
        <Text style={styles.aiCardTitle}>📊 Overall Performance</Text>
        <Text style={styles.aiCardContent}>
          {student.name} is showing {student.progress >= 70 ? "excellent" : student.progress >= 40 ? "good" : "developing"} progress
          with {student.progress}% completion across {student.projectsStarted}{" "}
          projects. They have successfully completed {student.projectsCompleted}{" "}
          project{student.projectsCompleted !== 1 ? "s" : ""}, demonstrating{" "}
          {student.progress >= 70 ? "strong" : "growing"} understanding of Arduino
          fundamentals.
        </Text>
      </View>

      {/* Strengths */}
      <View style={styles.aiCard}>
        <Text style={styles.aiCardTitle}>💪 Strengths</Text>
        <View style={styles.aiListItem}>
          <View style={styles.aiBullet} />
          <Text style={styles.aiListText}>
            Consistent code structure and commenting practices
          </Text>
        </View>
        <View style={styles.aiListItem}>
          <View style={styles.aiBullet} />
          <Text style={styles.aiListText}>
            Good understanding of digital I/O operations
          </Text>
        </View>
        <View style={styles.aiListItem}>
          <View style={styles.aiBullet} />
          <Text style={styles.aiListText}>
            Creative problem-solving approach in project implementations
          </Text>
        </View>
      </View>

      {/* Areas for Improvement */}
      <View style={styles.aiCard}>
        <Text style={styles.aiCardTitle}>🎯 Areas for Growth</Text>
        <View style={styles.aiListItem}>
          <View style={styles.aiBullet} />
          <Text style={styles.aiListText}>
            Could benefit from more practice with analog sensors
          </Text>
        </View>
        <View style={styles.aiListItem}>
          <View style={styles.aiBullet} />
          <Text style={styles.aiListText}>
            Consider exploring more advanced loop structures
          </Text>
        </View>
        <View style={styles.aiListItem}>
          <View style={styles.aiBullet} />
          <Text style={styles.aiListText}>
            Opportunity to optimize code for better performance
          </Text>
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.aiCard}>
        <Text style={styles.aiCardTitle}>💡 Personalized Recommendations</Text>
        <Text style={styles.aiCardContent}>
          Based on current progress, {student.name} would benefit from:
        </Text>
        <View style={styles.aiRecommendation}>
          <Ionicons name="chevron-forward" size={16} color="#0d9488" />
          <Text style={styles.aiRecommendationText}>
            Attempting the "Digital Clock" project to reinforce timing concepts
          </Text>
        </View>
        <View style={styles.aiRecommendation}>
          <Ionicons name="chevron-forward" size={16} color="#0d9488" />
          <Text style={styles.aiRecommendationText}>
            Reviewing sensor integration before moving to advanced projects
          </Text>
        </View>
        <View style={styles.aiRecommendation}>
          <Ionicons name="chevron-forward" size={16} color="#0d9488" />
          <Text style={styles.aiRecommendationText}>
            Collaborating with peers in {student.group} for knowledge sharing
          </Text>
        </View>
      </View>

      {/* Learning Patterns */}
      <View style={styles.aiCard}>
        <Text style={styles.aiCardTitle}>📈 Learning Patterns</Text>
        <Text style={styles.aiCardContent}>
          {student.name} typically works on projects during afternoon hours and shows
          higher engagement when tackling hands-on circuit building activities. Average
          session duration: 45 minutes. Most productive: Tuesdays and Thursdays.
        </Text>
      </View>
    </View>
  );
}

// -------------------- STYLES --------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  mainLayout: {
    flex: 1,
    flexDirection: "row",
  },

  // Sidebar
  sidebar: {
    width: 260,
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    paddingVertical: 20,
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  logoCurio: {
    color: "#0d9488",
    fontWeight: "900",
  },
  logoLab: {
    color: "#f97316",
    fontWeight: "400",
  },
  sidebarSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },

  sidebarNav: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  navButtonActive: {
    backgroundColor: "#f0fdfa",
  },
  navButtonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  navButtonTextActive: {
    color: "#0d9488",
    fontWeight: "600",
  },

  navDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },

  sidebarFooter: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },

  // Main Content
  mainContent: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  contentWrapper: {
    flex: 1,
    padding: 24,
  },

  contentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  contentTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  contentSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },

  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  exportButtonText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0d9488",
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },

  // Stats Cards
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },

  // Table
  tableContainer: {
    flex: 1,
  },
  table: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableCell: {
    flexDirection: "row",
    alignItems: "center",
  },

  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0d9488",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  studentEmail: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  groupBadge: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  groupBadgeText: {
    fontSize: 12,
    color: "#6d28d9",
    fontWeight: "500",
  },

  projectsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  projectsLabel: {
    fontSize: 11,
    color: "#6b7280",
  },

  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    minWidth: 40,
  },

  viewButton: {
    padding: 8,
  },

  // Projects Preview
  previewContainer: {
    flex: 1,
  },
  previewNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdfa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewNoteText: {
    fontSize: 13,
    color: "#0f766e",
  },

  previewScroll: {
    flex: 1,
  },
  projectPreviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  projectPreviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  projectPreviewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  projectPreviewInfo: {
    gap: 4,
  },
  projectPreviewName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  projectPreviewMeta: {
    fontSize: 13,
    color: "#6b7280",
  },
  projectPreviewRight: {
    alignItems: "flex-end",
  },
  projectStudentCount: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0d9488",
  },

  // Student Detail View
  detailContainer: {
    flex: 1,
    padding: 24,
  },
  detailHeader: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },

  studentInfoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 24,
    marginBottom: 24,
  },
  studentInfoLeft: {
    flexDirection: "row",
    gap: 16,
  },
  studentAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0d9488",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTextLarge: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
  },
  studentNameLarge: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  studentEmailLarge: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  groupBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ede9fe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  groupBadgeTextLarge: {
    fontSize: 13,
    color: "#6d28d9",
    fontWeight: "500",
  },

  studentInfoStats: {
    flexDirection: "row",
    gap: 32,
  },
  infoStatItem: {
    alignItems: "center",
  },
  infoStatNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  infoStatLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -2,
  },
  tabActive: {
    borderBottomColor: "#0d9488",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#0d9488",
    fontWeight: "600",
  },

  tabContent: {
    flex: 1,
  },

  // Project Details
  projectDetailsContainer: {
    gap: 16,
  },
  projectDetailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
    marginBottom: 16,
  },
  projectDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  projectDetailLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  projectDetailName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  projectDetailMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },

  projectStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  projectStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  projectProgressSection: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  progressBarLarge: {
    height: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFillLarge: {
    height: "100%",
    borderRadius: 6,
  },

  projectActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  projectActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
  },
  projectActionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0d9488",
  },

  solutionPreview: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  solutionPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#e2e8f0",
    lineHeight: 18,
  },

  // AI Analysis
  aiAnalysisContainer: {
    gap: 16,
  },
  aiHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#faf5ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9d5ff",
    padding: 20,
    marginBottom: 8,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6b21a8",
    marginBottom: 4,
  },
  aiHeaderSubtitle: {
    fontSize: 13,
    color: "#7c3aed",
  },

  aiCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
    marginBottom: 16,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  aiCardContent: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },

  aiListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  aiBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0d9488",
    marginTop: 8,
  },
  aiListText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },

  aiRecommendation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f0fdfa",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  aiRecommendationText: {
    flex: 1,
    fontSize: 14,
    color: "#0f766e",
    lineHeight: 20,
  },
});
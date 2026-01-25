// app/lib/adminMockData.ts
// Mock student data for the admin dashboard

export type StudentProject = {
  name: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  status: "completed" | "in-progress";
  progress: number;
  lastActive: string;
  submissions?: Array<{
    date: string;
    code: string;
  }>;
};

export type Student = {
  id: number;
  name: string;
  email: string;
  group: string;
  avatar: string;
  projectsStarted: number;
  projectsCompleted: number;
  progress: number;
  projects: StudentProject[];
};

export type AvailableProject = {
  name: string;
  level: string;
  age: string;
  studentCount: number;
};

export const students: Student[] = [
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
        difficulty: "beginner",
        status: "completed",
        progress: 100,
        lastActive: "2 days ago",
        submissions: [
          {
            date: "2024-01-05",
            code: `void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  display.begin();
}

void loop() {
  if (buttonPressed()) {
    updateStatus();
  }
  display.show();
}`,
          },
        ],
      },
      {
        name: "Remote Control Car",
        difficulty: "intermediate",
        status: "in-progress",
        progress: 45,
        lastActive: "1 hour ago",
        submissions: [],
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
        difficulty: "intermediate",
        status: "completed",
        progress: 100,
        lastActive: "1 week ago",
        submissions: [
          {
            date: "2024-01-01",
            code: `void setup() {
  initializeDisplay();
  setupButtons();
}

void loop() {
  handleInput();
  updateDisplay();
}`,
          },
        ],
      },
      {
        name: "Digital Clock",
        difficulty: "intermediate",
        status: "completed",
        progress: 100,
        lastActive: "3 days ago",
        submissions: [
          {
            date: "2024-01-03",
            code: `void setup() {
  rtc.begin();
  display.begin();
}

void loop() {
  displayTime();
  delay(1000);
}`,
          },
        ],
      },
      {
        name: "Electronic Safe",
        difficulty: "advanced",
        status: "in-progress",
        progress: 30,
        lastActive: "4 hours ago",
        submissions: [],
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
        difficulty: "beginner",
        status: "in-progress",
        progress: 25,
        lastActive: "30 minutes ago",
        submissions: [],
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
        difficulty: "advanced",
        status: "completed",
        progress: 100,
        lastActive: "2 weeks ago",
        submissions: [
          {
            date: "2023-12-20",
            code: `void setup() {
  initializeSystem();
}

void loop() {
  processCommands();
}`,
          },
        ],
      },
      {
        name: "Remote Control Car",
        difficulty: "advanced",
        status: "completed",
        progress: 100,
        lastActive: "1 week ago",
        submissions: [
          {
            date: "2023-12-28",
            code: `void setup() {
  motorSetup();
  radioSetup();
}

void loop() {
  readCommands();
  driveMotors();
}`,
          },
        ],
      },
      {
        name: "Digital Clock",
        difficulty: "intermediate",
        status: "completed",
        progress: 100,
        lastActive: "5 days ago",
        submissions: [
          {
            date: "2024-01-02",
            code: `void setup() {
  clockInit();
}

void loop() {
  updateTime();
}`,
          },
        ],
      },
      {
        name: "Alarm Clock",
        difficulty: "intermediate",
        status: "in-progress",
        progress: 55,
        lastActive: "2 hours ago",
        submissions: [],
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
        difficulty: "beginner",
        status: "completed",
        progress: 100,
        lastActive: "4 days ago",
        submissions: [
          {
            date: "2024-01-01",
            code: `void setup() {
  setupPins();
  initDisplay();
}

void loop() {
  checkButtons();
  updateScreen();
}`,
          },
        ],
      },
      {
        name: "Digital Clock",
        difficulty: "intermediate",
        status: "in-progress",
        progress: 40,
        lastActive: "1 day ago",
        submissions: [],
      },
    ],
  },
];

export const availableProjects: AvailableProject[] = [
  {
    name: "Electric Status Board",
    level: "Beginner",
    age: "10+",
    studentCount: 12,
  },
  {
    name: "Remote Control Car",
    level: "Intermediate",
    age: "12+",
    studentCount: 8,
  },
  {
    name: "Digital Clock",
    level: "Intermediate",
    age: "12+",
    studentCount: 6,
  },
  {
    name: "Alarm Clock",
    level: "Intermediate",
    age: "13+",
    studentCount: 3,
  },
  {
    name: "Electronic Safe",
    level: "Intermediate",
    age: "13+",
    studentCount: 2,
  },
];

export function getStudentById(id: number): Student | undefined {
  return students.find((student) => student.id === id);
}

export function getStudentStats() {
  return {
    total: students.length,
    onTrack: students.filter((s) => s.progress >= 70).length,
    inProgress: students.filter((s) => s.progress < 70 && s.progress > 30).length,
    needHelp: students.filter((s) => s.progress <= 30).length,
  };
}

import { Monitor, Cpu, Code, Zap, LucideIcon } from "lucide-react";

export interface ProjectFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ProjectLevel {
  id: "beginner" | "intermediate" | "advanced";
  title: string;
  duration: string;
  description: string;
  features: string[];
  color: "green" | "blue" | "purple";
}

export interface WorkflowStep {
  step: number;
  title: string;
  description: string;
}

export interface ProjectData {
  id: string;
  title: string;
  subtitle: string;
  headerInfo: {
    difficulty: string;
    duration: string;
    components: string;
  };
  imageUrl: string;
  features: ProjectFeature[];
  capabilities: string[];
  workflows: {
    beginner: WorkflowStep[];
    intermediate: WorkflowStep[];
    advanced: WorkflowStep[];
  };
  levels: ProjectLevel[];
}

export const electricStatusBoardData: ProjectData = {
  id: "electric-status-board",
  title: "FocusBoard",
  subtitle:
    "Build an interactive status display that shows your current availability using an OLED screen and Arduino. Perfect for your desk or workspace!",
  headerInfo: {
    difficulty: "Beginner - Advanced",
    duration: "4-10 hours",
    components: "Arduino, OLED, Buttons",
  },
  imageUrl:
    "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&h=300&fit=crop",
  features: [
    {
      icon: Monitor,
      title: "OLED Display Integration",
      description:
        "Learn to control a 128x64 OLED screen to display custom graphics and text",
    },
    {
      icon: Cpu,
      title: "Button Controls",
      description:
        "Program interactive buttons to navigate through different status options",
    },
    {
      icon: Code,
      title: "Menu System",
      description:
        "Build a dynamic menu system with multiple selectable status options",
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description:
        "Display and update your current status in real-time on the OLED screen",
    },
  ],
  capabilities: [
    "Display custom status messages on OLED screen",
    "Navigate through menu options using physical buttons",
    "Select from 10+ pre-programmed status options",
    "Create a personalized status indicator for your workspace",
    "Learn fundamental programming concepts through hands-on building",
    "Understand how displays, buttons, and microcontrollers work together",
  ],
  workflows: {
    beginner: [
      {
        step: 1,
        title: "Setup Arduino IDE",
        description:
          "Install Arduino IDE and learn the basic interface with detailed tutorials",
      },
      {
        step: 2,
        title: "Connect Hardware",
        description:
          "Follow step-by-step diagrams to connect OLED display and buttons to Arduino",
      },
      {
        step: 3,
        title: "Upload Example Code",
        description:
          "Load pre-written example code to test your hardware connections",
      },
      {
        step: 4,
        title: "Understand the Code",
        description:
          "Learn how each line of code works with detailed explanations and comments",
      },
      {
        step: 5,
        title: "Customize Welcome Screen",
        description: "Modify the welcome message to display your own text",
      },
      {
        step: 6,
        title: "Add Status Options",
        description: "Add your personalized status messages to the menu system",
      },
      {
        step: 7,
        title: "Test & Debug",
        description:
          "Test all buttons and menu navigation, fix any issues with guided help",
      },
    ],
    intermediate: [
      {
        step: 1,
        title: "Hardware Assembly",
        description: "Connect OLED display and buttons using circuit diagrams",
      },
      {
        step: 2,
        title: "Initialize Display",
        description:
          "Write code to initialize the OLED display with proper libraries",
      },
      {
        step: 3,
        title: "Create Menu System",
        description: "Build a dynamic menu array and navigation logic",
      },
      {
        step: 4,
        title: "Implement Button Controls",
        description:
          "Program button inputs with debouncing and state management",
      },
      {
        step: 5,
        title: "Design UI Elements",
        description:
          "Create custom graphics and text layouts for different screens",
      },
      {
        step: 6,
        title: "Add Animations",
        description: "Implement smooth transitions between menu screens",
      },
      {
        step: 7,
        title: "Optimize Performance",
        description: "Refine code for better responsiveness and memory usage",
      },
    ],
    advanced: [
      {
        step: 1,
        title: "Custom Circuit Design",
        description:
          "Design and implement your own button configuration and power management",
      },
      {
        step: 2,
        title: "Advanced Display Control",
        description:
          "Create custom animations, icons, and advanced graphics rendering",
      },
      {
        step: 3,
        title: "State Machine Implementation",
        description:
          "Build a robust state machine for complex menu navigation and modes",
      },
      {
        step: 4,
        title: "Add WiFi Integration",
        description: "Connect to WiFi and sync status with online calendar or API",
      },
      {
        step: 5,
        title: "Create Custom Features",
        description:
          "Add features like timer modes, notifications, or sensor integration",
      },
      {
        step: 6,
        title: "Design Enclosure",
        description: "3D design and print a custom case for your status board",
      },
    ],
  },
  levels: [
    {
      id: "beginner",
      title: "Beginner",
      duration: "8-10 hours",
      description:
        "Perfect for first-time builders. Step-by-step guidance with detailed explanations.",
      features: [
        "Basic Arduino programming concepts",
        "Simple display control",
        "Button input basics",
        "Pre-written code examples",
      ],
      color: "green",
    },
    {
      id: "intermediate",
      title: "Intermediate",
      duration: "6-8 hours",
      description:
        "For those with some programming experience. More independence in implementation.",
      features: [
        "Advanced display techniques",
        "Custom menu creation",
        "Debugging practice",
        "Code optimization",
      ],
      color: "blue",
    },
    {
      id: "advanced",
      title: "Advanced",
      duration: "4-6 hours",
      description:
        "Challenge yourself with minimal guidance. Add custom features and modifications.",
      features: [
        "Custom animations",
        "Advanced state management",
        "Hardware modifications",
        "Feature extensions",
      ],
      color: "purple",
    },
  ],
};

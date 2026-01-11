import { Monitor, Cpu, Code, Zap, LucideIcon, Clock, Timer } from "lucide-react";

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
    "Build a small desk display with an OLED screen and Arduino. Start with a status display + clock, then level up into a built-in focus timer.",
  headerInfo: {
    difficulty: "Beginner - Advanced",
    duration: "25-35 hours",
    components: "Arduino, OLED, Buttons, Real-Time Clock Module",
  },
  imageUrl:
    "https://cdn.thewirecutter.com/wp-content/media/2025/09/BEST-ALARM-CLOCKS-2048px-DREAMSKY-INLINE-V1.jpg?auto=webp&quality=75&width=768&dpr=1.5",

  features: [
    {
      icon: Monitor,
      title: "OLED Display Integration",
      description:
        "Learn how to show clear text and simple screens on a small OLED display",
    },
    {
      icon: Cpu,
      title: "Button Interaction",
      description:
        "Use physical buttons to move through options and select what the screen should show",
    },
    {
      icon: Clock,
      title: "Clock Mode",
      description:
        "Display the current time accurately using a real-time clock module",
    },
    {
      icon: Timer,
      title: "Focus Timer Mode",
      description:
        "Add a focus timer with work and break cycles shown as a countdown",
    },
  ],

  capabilities: [
    "Show different status messages on a small screen",
    "Scroll through options and choose one using buttons",
    "Display the current time using a real-time clock module",
    "Run a focus timer with a countdown and repeating cycles (Intermediate/Advanced)",
    "Learn clean code organization with readable structure",
    "Practice troubleshooting common wiring and logic issues",
  ],

  workflows: {
    beginner: [
      {
        step: 1,
        title: "Set Up the Screen and Time Module",
        description:
          "Connect the OLED screen, buttons, and a time-keeping module, then run startup code so the device can read the current time",
      },
      {
        step: 2,
        title: "Create a Main Menu",
        description:
          "Build a simple home screen where you can switch between the status display and the clock display",
      },
      {
        step: 3,
        title: "Create the Status Display",
        description:
          "Make a screen that lets you scroll through different status messages and choose the one you want to show",
      },
      {
        step: 4,
        title: "Create the Clock Display",
        description:
          "Make a screen that shows the current time clearly and updates automatically",
      },
    ],

    // Intermediate flow remains:
    // hardware → init (time module) → menu → clock → focus timer
    intermediate: [
      {
        step: 1,
        title: "Initialize the Screen and Time Module",
        description:
          "Write the startup code so the screen turns on and the device can read the current time correctly",
      },
      {
        step: 2,
        title: "Create the Main Menu",
        description:
          "Build a home screen where the user can choose between viewing the clock or starting a focus timer",
      },
      {
        step: 3,
        title: "Add the Clock Screen",
        description:
          "Create a clear clock display that updates automatically",
      },
      {
        step: 4,
        title: "Add the Timer and Pomodoro Setup",
        description:
          "Let the user choose focus length, break length, and how many rounds to run",
      },
      {
        step: 5,
        title: "Run the Countdown",
        description:
          "Show the countdown on screen and automatically move between focus and break periods",
      },
    ],

    advanced: [
      {
        step: 1,
        title: "Organize Like a Real Project",
        description:
          "Restructure the code into clean sections that are easy to expand",
      },
      {
        step: 2,
        title: "Upgrade the Features",
        description:
          "Add custom improvements such as pause, presets, or extra display modes",
      },
      {
        step: 3,
        title: "Build a Strong Screen System",
        description:
          "Make screen changes foolproof so the device never gets stuck",
      },
      {
        step: 4,
        title: "Use Debugging Tools",
        description:
          "Apply a repeatable process to diagnose wiring and logic problems",
      },
      {
        step: 5,
        title: "Polish Performance",
        description:
          "Reduce flicker, keep updates smooth, and improve responsiveness",
      },
      {
        step: 6,
        title: "Free-Style Build with Support",
        description:
          "Design your own layout and logic with guidance instead of step-by-step instructions",
      },
    ],
  },

  levels: [
    {
      id: "beginner",
      title: "Beginner",
      duration: "20-25 hours",
      description:
        "Best for first-time builders. You’ll build a status display and a clock, and learn how to switch between screens using a simple menu.",
      features: [
        "A main menu that switches between screens",
        "Status screen with selectable messages",
        "Clock screen that updates automatically",
        "Step-by-step guidance with starter code",
      ],
      color: "green",
    },
    {
      id: "intermediate",
      title: "Intermediate",
      duration: "25-30 hours",
      description:
        "For builders with some experience. You’ll build a menu-driven device that includes a clock and a focus timer.",
      features: [
        "Menu that switches between modes",
        "Clock screen that updates automatically",
        "Focus timer with work and break cycles",
        "A clear multi-screen flow with reliability practice",
      ],
      color: "blue",
    },
    {
      id: "advanced",
      title: "Advanced",
      duration: "20-30 hours",
      description:
        "Same features as Intermediate, but with more freedom. You design the structure and extend the logic with guidance.",
      features: [
        "Clock mode",
        "Focus timer mode with repeating cycles",
        "Greater freedom in code organization",
        "Stronger logic and structure support",
        "Debugging guidance and best practices",
      ],
      color: "purple",
    },
  ],
};

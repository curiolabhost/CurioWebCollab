import { Monitor, Clock, Timer, List, CheckCircle, AlarmClock } from "lucide-react";

/* ============================================================
   Types
============================================================ */

export type MindmapNodeType = "start" | "hub" | "selection" | "display" | "action" | "end";

export interface MindmapNode {
  id: string;
  title: string;
  description: string;
  type: MindmapNodeType;
  icon?: any; // lucide icon component
  color: string; // tailwind classes like "bg-indigo-100 border-indigo-400"
  connections: string[];
}

export interface ButtonBehavior {
  screen: string;
  buttons: {
    name: string;
    action: string;
  }[];
}

export interface ProjectOverview {
  title: string;
  subtitle?: string;
  description: string;
  keyFeatures: {
    title: string;
    description: string;
  }[];
}

export type NodePosition = { x: number; y: number };
export type NodePositions = Record<string, NodePosition>;

/* ============================================================
   Beginner Project Overview (Status + Clock ONLY)
============================================================ */

export const projectOverview: ProjectOverview = {
  title: "Beginner Status + Clock Project",
  subtitle: "Main Menu → Status Screen or Clock Screen",
  description:
    "Build an OLED project with a simple Main Menu that lets the user switch between a Status screen and a Clock screen. You’ll learn how to initialize the display and RTC module, navigate with buttons, and redraw screens cleanly.",
  keyFeatures: [
    {
      title: "Menu Navigation",
      description: "Use buttons to move through menu options and open a screen.",
    },
    {
      title: "Status Screen",
      description: "Show basic device info in a clear, readable layout.",
    },
    {
      title: "Clock Screen",
      description: "Read time from an RTC module and display it on the OLED.",
    },
  ],
};

/* ============================================================
   Beginner Mindmap Nodes (Status + Clock ONLY)
   - NO Timer
   - NO Pomodoro
============================================================ */

export const mindmapNodes: MindmapNode[] = [
  {
    id: "start",
    title: "Start",
    description: "Power on → the board begins running your code.",
    type: "start",
    icon: CheckCircle,
    color: "bg-emerald-50 border-emerald-300 text-emerald-900",
    connections: ["setup"],
  },
  {
    id: "setup",
    title: "Setup / Initialize",
    description:
      "Initialize the OLED display, initialize the RTC module, and set button pins. Then go to the Main Menu.",
    type: "action",
    icon: List,
    color: "bg-slate-50 border-slate-300 text-slate-900",
    connections: ["main-menu"],
  },
  {
    id: "main-menu",
    title: "Main Menu (Hub)",
    description:
      "Two options only: Status and Clock. PREV/NEXT changes the highlight. SELECT opens the chosen screen.",
    type: "hub",
    icon: List,
    color: "bg-indigo-50 border-indigo-300 text-indigo-900",
    connections: ["status-screen", "clock-screen"],
  },
  {
    id: "status-screen",
    title: "Status Screen",
    description:
      "Displays basic device status information. Includes a Back action to return to Main Menu.",
    type: "display",
    icon: Monitor,
    color: "bg-purple-50 border-purple-300 text-purple-900",
    connections: ["main-menu"],
  },
  {
    id: "clock-screen",
    title: "Clock Screen",
    description:
      "Reads current time from the RTC and displays it on the OLED. Includes a Back action to return to Main Menu.",
    type: "display",
    icon: Clock,
    color: "bg-pink-50 border-pink-300 text-pink-900",
    connections: ["main-menu"],
  },
  {
    id: "end",
    title: "End (Loop Continues)",
    description:
      "There is no true end — the program keeps running and updating screens as needed.",
    type: "end",
    icon: CheckCircle,
    color: "bg-gray-50 border-gray-200 text-gray-900",
    connections: [],
  },
];

/* ============================================================
   Node Positions (Beginner layout)
============================================================ */

export const nodePositions: NodePositions = {
  start: { x: 50, y: 12 },
  setup: { x: 50, y: 26 },
  "main-menu": { x: 50, y: 42 },

  // two branches only
  "status-screen": { x: 30, y: 70 },
  "clock-screen": { x: 70, y: 70 },

  // optional “end” node (you can remove it if you don’t render it)
  end: { x: 50, y: 90 },
};

/* ============================================================
   Button Behaviors (Beginner)
   NOTE: If your actual code uses PREV as “Back” inside screens,
   rename BACK -> PREV here. Otherwise keep BACK.
============================================================ */

export const buttonBehaviors: ButtonBehavior[] = [
  {
    screen: "Main Menu",
    buttons: [
      { name: "PREV", action: "Moves the highlight up (wraps around)." },
      { name: "NEXT", action: "Moves the highlight down (wraps around)." },
      { name: "SELECT", action: "Opens the highlighted screen." },
    ],
  },
  {
    screen: "Status Screen",
    buttons: [{ name: "BACK", action: "Returns to the Main Menu." }],
  },
  {
    screen: "Clock Screen",
    buttons: [{ name: "BACK", action: "Returns to the Main Menu." }],
  },
];

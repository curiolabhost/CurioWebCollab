import { Monitor, Clock, List, CheckCircle } from "lucide-react";

/* ============================================================
   Types
============================================================ */

export type MindmapNodeType =
  | "start"
  | "hub"
  | "selection"
  | "display"
  | "action";

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
   Beginner Project Overview (Status Menu → Status Display + Clock)
============================================================ */

export const projectOverview: ProjectOverview = {
  title: "Beginner Status + Clock Project",
  subtitle: "Main Menu → Status Menu → Status Display, or Clock Screen",
  description:
    "Build an OLED project with a Main Menu that lets the user switch between a Status flow and a Clock screen. In the Status flow, the user first picks a status in a Status Menu, then the device shows that chosen status on a Status Display screen. You’ll learn how to initialize the display and RTC module, navigate with buttons, and redraw screens cleanly.",
  keyFeatures: [
    {
      title: "Menu Navigation",
      description: "Use buttons to move through menu options and open a screen.",
    },
    {
      title: "Status Menu + Status Display",
      description:
        "Pick a status from a list, then show the selected status clearly on the OLED.",
    },
    {
      title: "Clock Screen",
      description: "Read time from an RTC module and display it on the OLED.",
    },
  ],
};

/* ============================================================
   Beginner Mindmap Nodes (Status Menu → Status Display + Clock)
   - NO Timer
   - NO Pomodoro
============================================================ */

export const mindmapNodes: MindmapNode[] = [
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
      "Two options only: Status and Clock. PREV/NEXT changes the highlight. SELECT opens the chosen option.",
    type: "hub",
    icon: List,
    color: "bg-indigo-50 border-indigo-300 text-indigo-900",
    connections: ["status-menu", "clock-screen"],
  },

  {
    id: "status-menu",
    title: "Status Menu (Pick a Status)",
    description:
      "Shows a list of status options. PREV/NEXT scrolls through the list. SELECT confirms a choice and opens the Status Display screen. Includes a Back action to return to Main Menu.",
    type: "selection",
    icon: List,
    color: "bg-purple-50 border-purple-300 text-purple-900",
    connections: ["status-display"],
  },
  {
    id: "status-display",
    title: "Status Display (Show Selected Status)",
    description:
      "Displays the chosen status in a clear layout. Includes a Back action to return to the Status Menu (so the user can pick a new status).",
    type: "display",
    icon: Monitor,
    color: "bg-fuchsia-50 border-fuchsia-300 text-fuchsia-900",
    connections: ["status-menu"],
  },

  {
    id: "clock-screen",
    title: "Clock Screen",
    description:
      "Reads current time from the RTC and displays it on the OLED. Includes a Back action to return to Main Menu.",
    type: "display",
    icon: Clock,
    color: "bg-pink-50 border-pink-300 text-pink-900",
    connections: [],
  },
];

/* ============================================================
   Node Positions (Beginner layout)
============================================================ */

export const nodePositions: NodePositions = {
  setup: { x: 50, y: 12 },
  "main-menu": { x: 50, y: 36 },

  // branches from main menu
  "status-menu": { x: 30, y: 66 },

  "clock-screen": { x: 70, y: 70 },
  // status flow continuation
  "status-display": { x: 30, y: 86 },
};

/* ============================================================
   Button Behaviors (Beginner)
============================================================ */

export const buttonBehaviors: ButtonBehavior[] = [
  {
    screen: "Main Menu",
    buttons: [
      { name: "PREVIOUS", action: "Moves the highlight up (wraps around)." },
      { name: "NEXT", action: "Moves the highlight down (wraps around)." },
      { name: "SELECT", action: "Opens the highlighted option." },
    ],
  },
  {
    screen: "Status Menu",
    buttons: [
      { name: "PREVIOUS", action: "Moves the highlight up (wraps around)." },
      { name: "NEXT", action: "Moves the highlight down (wraps around)." },
      { name: "SELECT", action: "Confirms the highlighted status and opens Status Display." },
    ],
  },
  {
    screen: "Status Display",
    buttons: [{ name: "PREVIOUS", action: "Returns to the Main Menu." }],
  },
  {
    screen: "Clock Screen",
    buttons: [{ name: "PREVIOUS", action: "Returns to the Main Menu." }],
  },
];

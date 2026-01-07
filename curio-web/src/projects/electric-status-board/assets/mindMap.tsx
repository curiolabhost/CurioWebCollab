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
   Data (Electric Status Board)
============================================================ */

export const mindmapNodes: MindmapNode[] = [
  {
    id: "welcome",
    title: "Welcome Screen",
    description: "Brief startup screen shown when the board powers on",
    type: "start",
    color: "bg-indigo-100 border-indigo-400",
    connections: ["main-menu"],
  },
  {
    id: "main-menu",
    title: "Main Menu",
    description: "Central hub with three options: Status, Clock, or Timer",
    type: "hub",
    icon: List,
    color: "bg-purple-100 border-purple-500",
    connections: ["status-selection", "clock-display", "timer-preset"],
  },
  {
    id: "status-selection",
    title: "Status Selection",
    description:
      "Scroll through predefined status options (Available, Busy, In a Meeting, etc.)",
    type: "selection",
    icon: CheckCircle,
    color: "bg-green-100 border-green-500",
    connections: ["status-display"],
  },
  {
    id: "status-display",
    title: "Status Display",
    description: "Shows chosen status prominently with current time",
    type: "display",
    icon: Monitor,
    color: "bg-green-100 border-green-400",
    connections: [],
  },
  {
    id: "clock-display",
    title: "Clock Display",
    description: "Continuously displays current time until back button is pressed",
    type: "display",
    icon: Clock,
    color: "bg-blue-100 border-blue-400",
    connections: ["main-menu"],
  },
  {
    id: "timer-preset",
    title: "Timer Preset Selection",
    description:
      "Choose countdown duration from a fixed list (5, 10, 15, 20, 25 minutes)",
    type: "selection",
    icon: Timer,
    color: "bg-orange-100 border-orange-500",
    connections: ["countdown-screen"],
  },
  {
    id: "countdown-screen",
    title: "Countdown Display",
    description: "Shows remaining time in minutes and seconds, counting down to zero",
    type: "display",
    icon: Timer,
    color: "bg-orange-100 border-orange-400",
    connections: ["times-up"],
  },
  {
    id: "times-up",
    title: "Time's Up!",
    description:
      "Buzzer rings 3 times as alert. User can start new timer or return to menu",
    type: "end",
    icon: AlarmClock,
    color: "bg-red-100 border-red-400",
    connections: ["timer-preset"],
  },
];

export const buttonBehaviors: ButtonBehavior[] = [
  {
    screen: "Main Menu",
    buttons: [
      { name: "Up/Down", action: "Navigate through menu options" },
      { name: "Select", action: "Choose highlighted option (Status/Clock/Timer)" },
    ],
  },
  {
    screen: "Status Selection",
    buttons: [
      { name: "Up/Down", action: "Scroll through status options" },
      { name: "Select", action: "Confirm chosen status" },
      { name: "Back", action: "Return to Main Menu" },
    ],
  },
  {
    screen: "Status Display",
    buttons: [{ name: "Back", action: "Return to Main Menu" }],
  },
  {
    screen: "Clock Display",
    buttons: [{ name: "Back", action: "Return to Main Menu" }],
  },
  {
    screen: "Timer Preset Selection",
    buttons: [
      { name: "Up/Down", action: "Scroll through preset durations" },
      { name: "Select", action: "Start countdown with chosen duration" },
      { name: "Back", action: "Return to Main Menu" },
    ],
  },
  {
    screen: "Countdown Display",
    buttons: [{ name: "Back", action: "Cancel timer and return to Main Menu" }],
  },
  {
    screen: "Time's Up",
    buttons: [
      { name: "Select", action: "Start new timer" },
      { name: "Back", action: "Return to Main Menu" },
    ],
  },
];

export const projectOverview: ProjectOverview = {
  title: "Status Board Project Structure",
  subtitle: "A Multi-Screen Navigation System",
  description:
    "The Status Board is organized as a set of connected screens that the user moves through one at a time, similar to navigating menus on a smartwatch or appliance. The same three buttons are reused throughout, but their behavior changes depending on which screen is active.",
  keyFeatures: [
    {
      title: "Screen-Based Navigation",
      description:
        "Move through different screens one at a time, just like a smartwatch interface",
    },
    {
      title: "Context-Aware Buttons",
      description: "Three buttons that change behavior based on the current screen",
    },
    {
      title: "Multi-Feature Hub",
      description:
        "Main Menu serves as central hub to access Status, Clock, and Timer features",
    },
    {
      title: "State Management",
      description: "Track which screen is active and handle transitions between screens",
    },
  ],
};

/* ============================================================
   Layout (node positions)
   - Used by the generic ProjectMindMap component via props
============================================================ */

export const nodePositions: NodePositions = {
  welcome: { x: 50, y: 5 },
  "main-menu": { x: 50, y: 25 },
  "status-selection": { x: 15, y: 45 },
  "status-display": { x: 15, y: 65 },
  "clock-display": { x: 50, y: 45 },
  "timer-preset": { x: 85, y: 45 },
  "countdown-screen": { x: 85, y: 65 },
  "times-up": { x: 85, y: 85 },
};

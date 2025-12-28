import { ESB_LESSONS } from "./projects/electric-status-board/lessons";

// Add other projects later, e.g.
// import { ARDUINO_BASICS_LESSONS } from "./arduino-basics/lessons";

export const PROJECT_LESSONS = {
  "electric-status-board": ESB_LESSONS,
  // "arduino-basics": ARDUINO_BASICS_LESSONS,
} as const;

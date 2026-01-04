// circuit.tsx
"use client";

import * as React from "react";
import CodeLessonBase from "@/src/lesson-core/CodeLessonBase";

/**
 * Notes (matching codeBeg conventions):
 * - lessonSteps is: Record<number, { phrase: string; steps: any[] }>
 * - Any local images should be served from /public/lesson-assets/
 *   Example: "/lesson-assets/arduino_uno.png"
 */

// ------------------------------------------------------------
// Helper: Converts @ lines into bullets
// ------------------------------------------------------------
function processDesc(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("@")) return "• " + trimmed.substring(1).trim();
      return line;
    })
    .join("\n");
}

// ------------------------------------------------------------
// CIRCUIT LESSON CONTENT (CodeBeg-style shape)
// ------------------------------------------------------------
export const LESSON_STEPS_CIRCUIT_BEG: Record<number, { phrase: string; steps: any[] }> = {
  1: {
    phrase: "Circuit setup: parts, OLED wiring, libraries, and button inputs",
    steps: [
      {
        id: "circuit-1",
        title: "Step 1: Materials & OLED Wiring (Power + I²C)",
    codes: [
        {
          topicTitle: "Materials",
          imageGridBeforeCode: {
            columns: 4,
            width: 170,
            height: 170,
            items: [
              {
                label: "Arduino UNO (or Nano)",
                imageSrc: "/electric-status-board/circuit/arduino_uno.png",
              },
              {
                label: "SSD1306 OLED Display",
                imageSrc: "/electric-status-board/circuit/ssd1306.jpg",
              },
              {
                label: "Push Buttons ×3",
                imageSrc: "/electric-status-board/circuit/pushbuttons.png",
              },
              {
                label: "Breadboard",
                imageSrc: "/electric-status-board/circuit/breadboard.jpg",
              },
              {
                label: "Jumper Wires",
                imageSrc: "/electric-status-board/circuit/jumper_wires.jpg",
              },
            ],
          },
        },

        {
          topicTitle: "Connect OLED to Arduino",
          descAfterImage: processDesc(`
            
@**Step 1**: Open your wokwi page and add the arduino uno, breadboard, and SSD1306 OLED
@**Step 2**: Connect VCC on OLED to 5V on arduino 
@**Step 3**: Connect GND on OLED to GND on arduino
@**Step 4**: Connect SDA on OLED to A4 on arduino
@**Step 5**: Connect SCL on OLED to A5 on arduino

Once this is done, your OLED has power + data connection.
          `),

          imageGridAfterCode: {
            columns: 1,
            width: 800,
            height: 400,
            items: [
              {
                label: "OLED Wiring Reference",
                imageSrc: "/electric-status-board/circuit/OLEDwiringreference.png",
              },
            ],
          },
        },
      ],
    },

      {
        id: "circuit-2",
        title: "Step 2: Install OLED Libraries",
        codes: [
          {
            topicTitle: "Install the Libraries",
            descBeforeCode: processDesc(`
@Open Arduino IDE → Tools → Manage Libraries
@Search and install "Adafruit SSD1306"
@Search and install "Adafruit GFX Library"
            `),

            imageGridAfterCode: {
              columns: 1,
              width: 800,
             height: 400,
              items: [{ label: "Library Manager Search", imageSrc: "/electric-status-board/circuit/adafruitssd1306.png" }],
            },
          },
          
          {
            topicTitle: "Connect OLED to Arduino",
            descAfterImage: processDesc(`
**Common Issues**:
@“SSD1306 allocation failed” → wrong display size example
@Blank screen → wrong SDA/SCL wiring or incorrect address (0x3C/0x3D)
@Upload stalls → reset Arduino and try again
            `),
          },
        ],
      },

      {
        id: "circuit-3",
        title: "Step 3: Run an Example Sketch",
        codes: [
          {
            topicTitle: "Confirm the OLED Works",
            descBeforeCode: processDesc(`
Before building your own menu, run a known working test.

Step 1: Open the example sketch:
@File → Examples → Adafruit SSD1306 → ssd1306_128x64.i2c
@ If trying this on wokwi, change the line #define SCREEN_ADDRESS 0x3D into #define SCREEN_ADDRESS 0x3C to make it work

Step 2: Upload the sketch to your Arduino:
@Tools → Port → Select the correct COM port for your Arduino
@Tools → Board → Select correct board type (e.g., Arduino Uno)
@Sketch → Upload

Step 3: Observe the OLED display:
@You should see a series of test patterns and graphics on the OLED
@If not displaying correctly, double-check wiring and library installation

Once this is done, you are good to proceed to building your own menu system!
             `),

            imageGridAfterCode: {
              columns: 1,
              items: [
                {
                  label: "Expected OLED Output",
                  video: {
                    src: "https://www.youtube.com/embed/4Yc1gkXoHkI",
                  controls: true,
                loop: false,
                  },
                   },
              ],
            },
          },
        ],
      },

      {
        id: "circuit-4",
        title: "Step 4: PushButtons with Internal Pull-Ups",
        codes: [
          {
            topicTitle: "Button Wiring (INPUT_PULLUP)",
            descBeforeCode: processDesc(`
In this project, we will have 3 push buttons for controling the status board menu:
@Button 1: go to Previous Item
@Button 2: go to Next Item
@Button 3: Select Item

4-leg push buttons wiring:
Step 1: Inside wokwi, add 3 push buttons to your breadboard and place them across breadboard center gap
Step 2: Wire each button:
@Choose one side of the button and connect it to one of the pin (D2/D3/D4) for all 3 buttons
@Opposite side goes to GND for all three buttons
Step 3: Configure pins in code as INPUT_PULLUP:
@ pinMode(buttonPin, INPUT_PULLUP);

Button State Logic:
@Press = LOW, Release = HIGH (via pull-up).

2-leg button wiring (similar to 4-leg button):
@One leg → Arduino D2 / D3 / D4
@Other leg → GND
            `),

            imageGridAfterCode: {
              columns: 1,
              items: [
                {
                  label: "Buttons with Internal Pull-Ups",
                  imageSrc:
                    "https://dummyimage.com/1200x500/ffffff/000000.png&text=Buttons+with+Internal+Pull-Ups",
                },
              ],
            },
          },
        ],
      },
    ],
  },
};

// ------------------------------------------------------------
// Screen Wrapper
// ------------------------------------------------------------
export default function CircuitBegLesson({
  slug,
  lessonSlug,
}: {
  slug: string;
  lessonSlug: string;
}) {
  return (
    <CodeLessonBase
      lessonSteps={LESSON_STEPS_CIRCUIT_BEG}
      storagePrefix={`curio:${slug}:${lessonSlug}`}
      apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}
    />
  );
}

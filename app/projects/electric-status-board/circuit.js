// circuit.js
import React from "react";
import CodeLessonBase from "./components/CodeLessonBase";

// ------------------------------------------------------------
// Helper: Converts @ lines into bullets
// ------------------------------------------------------------
function processDesc(text) {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      // Bulleted lines starting with "@"
      if (trimmed.startsWith("@")) {
        const content = trimmed.substring(1).trim();
        // Match "1. ..." or "Step 1: ..." inside the bullet
        const stepMatch =
          content.match(/^(\d+\.)\s*(.*)/) || content.match(/^(Step\s+\d+:)\s*(.*)/i);
        if (stepMatch) {
          const label = stepMatch[1];
          const rest = stepMatch[2];
          // Bold only the label inside the bullet
          return "• **" + label + "**" + (rest ? " " + rest : "");
        }
        return "• " + content;
      }

      // Bold only the numeric step label like "1." or "Step 1:"
      const match =
        trimmed.match(/^(\d+\.)\s*(.*)/) || trimmed.match(/^(Step\s+\d+:)\s*(.*)/i);
      if (match) {
        return "**" + match[1] + "**" + (match[2] ? " " + match[2] : "");
      }
      return line;
    })
    .join("\n");
}

// ------------------------------------------------------------
// CIRCUIT LESSON CONTENT
// ------------------------------------------------------------

const LESSON_STEPS_CIRCUIT = {
  1: [
    {
      id: "circuit-1",
      title: "Step 1: Materials & OLED Wiring (Power + I²C)",

      // Put everything into the CodeLessonBase "block" layout:
      // - images => imageGridBeforeCode / imageGridAfterCode
      // - text   => descBeforeCode / descAfterCode / descAfterImage
      // - no code box needed, so block.code is omitted
      codes: [
        {
          topicTitle: "Materials",
          imageGridBeforeCode: {
            columns: 4,
            width: 180,
            height: 180,
            items: [
              {
                label: "Arduino UNO (or Nano)",
                image: require("../../../assets/circuit/arduino_uno.png"),
              },
              {
                label: "SSD1306 OLED",
                image: require("../../../assets/circuit/ssd1306_oled.png"),
              },
              {
                label: "Push Buttons ×3",
                image: require("../../../assets/circuit/pushbuttons.png"),
              },
              {
                label: "Breadboard",
                image: require("../../../assets/circuit/breadboard.jpg"),
              },
              {
                label: "Jumper Wires",
                image: require("../../../assets/circuit/jumper_wires.jpg"),
              },
            ],
          },
        },

        {
          topicTitle: "Connect OLED to Arduino",
          descAfterImage: processDesc(`
            
@Step 1: Open your wokwi page and add the arduino uno, breadboard, and SSD1306 OLED
@Step 2: Connect VCC on OLED to 5V on arduino 
@Step 3: Connect GND on OLED to GND on arduino
@Step 4: Connect SDA on OLED to A4 on arduino
@Step 5: Connect SCL on OLED to A5 on arduino

Once this is done, your OLED has power + data connection.
          `),

          // If you want a single “big photo” here, convert it into an image grid (1 column).
          imageGridAfterCode: {
            columns: 1,
             width: 600,
            height: 400,
            items: [
              {
                label: "OLED Wiring Reference",
                video: {
                 
                src: require("../../../assets/videos/addcomponenttowokwipage.mp4"),
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
      id: "circuit-2",
      title: "Step 2: Install OLED Libraries",

      codes: [
        {
          topicTitle: "Install the Libraries",
          descBeforeCode: processDesc(`
We’ll use the Adafruit SSD1306 + GFX drivers.

Install the display libraries:
@Open Arduino IDE → Tools → Manage Libraries
@Search and install "Adafruit SSD1306"
@Search and install "Adafruit GFX Library"
@Restart IDE if examples do not appear
          `),

          imageGridAfterCode: {
            columns: 1,
            width: 800,
            height: 400,
            items: [
              {
                label: "Library Manager Search",
                image: require("../../../assets/circuit/adafruitssd1306.png"),
              },
            ],
          },

          descAfterImage: processDesc(`
Common Issues:
@“SSD1306 allocation failed” → wrong display size example
@Blank screen → wrong SDA/SCL wiring or incorrect address (0x3C/0x3D)
@Upload stalls → reset Arduino and try again
          `),
        },
      ],
    },
    {
      id: "circuit-3",
      title: "Step 3: Run an Example (Sanity Check)",

      codes: [
        {
          topicTitle: "Confirm the OLED Works First",
          descBeforeCode: processDesc(`
Before building your own menu, run a known working test.

Open the example sketch:
@File → Examples → Adafruit SSD1306 → ssd1306_128x64
@If using 128×32, choose the matching example

Upload the sketch:
@Select correct board + COM port
@Click Upload

Expected output:
@Adafruit splash screen
@Scrolling or drawing test shapes

If the OLED works here, wiring + libraries are correct.
          `),

          imageGridAfterCode: {
            columns: 1,
            items: [
              {
                label: "Expected OLED Output",
                image:
                  "https://dummyimage.com/1200x700/ddd/000.png&text=OLED+Test+Output",
              },
            ],
          },
        },
      ],
    },
    {
      id: "circuit-4",
      title: "Step 4: Buttons with Internal Pull-Ups",

      codes: [
        {
          topicTitle: "Button Wiring (INPUT_PULLUP)",
          descBeforeCode: processDesc(`
We will use INPUT_PULLUP so the button reads LOW when pressed.

2-leg button wiring:
@One leg → Arduino D2 / D3 / D4
@Other leg → GND
@pinMode(pin, INPUT_PULLUP)

Typical mapping:
@Prev → D2
@Next → D3
@Select → D4

4-leg buttons:
@Place across breadboard center gap
@One side goes to D2/D3/D4
@Opposite side goes to GND

Press = LOW, Release = HIGH (via pull-up).
          `),

          imageGridAfterCode: {
            columns: 1,
            items: [
              {
                label: "Buttons with Internal Pull-Ups",
                image:
                  "https://dummyimage.com/1200x500/ffffff/000000.png&text=Buttons+with+Internal+Pull-Ups",
              },
            ],
          },
        },
      ],
    },
  ],
};


// ------------------------------------------------------------
// Screen Wrapper
// ------------------------------------------------------------

export default function Circuit() {
  return (
    <CodeLessonBase
      screenTitle="Circuitry Lessons"
      lessonSteps={LESSON_STEPS_CIRCUIT}
      storagePrefix="esb:circuit"
      doneSetKey="esb:circuit:doneSet"
      overallProgressKey="esb:circuit:overallProgress"
      analyticsTag="circuit"
    />
  );
}

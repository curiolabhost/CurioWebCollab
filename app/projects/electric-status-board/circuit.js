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
      if (trimmed.startsWith("@")) {
        return "• " + trimmed.substring(1).trim();
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

      imageGrid: {
  columns: 3,
  rows: 2,
  items: [
    { label: "Arduino UNO (or Nano)", image: require("../../../assets/circuit/arduino_uno.png") },
    { label: "SSD1306 OLED",         image: require("../../../assets/circuit/ssd1306_oled.png") },
    { label: "Push Buttons ×3",      image: require("../../../assets/circuit/pushbuttons.png") },
    { label: "Breadboard",           image: require("../../../assets/circuit/breadboard.jpg") },
    { label: "Jumper Wires",         image: require("../../../assets/circuit/jumper_wires.jpg") },
  ],
},

      descAfterCircuit: processDesc(`
Gather these parts first:

@Arduino UNO (or Nano)
@SSD1306 OLED (I²C, 128×64 or 128×32)
@3× momentary pushbuttons
@Breadboard
@Jumper wires

Power the OLED:
@OLED VCC → 5V (or 3.3V on some boards)
@OLED GND → GND
@Raw OLED panels (no breakout) usually require 3.3V only

I²C lines (OLED ↔ Arduino):
@OLED SDA → A4
@OLED SCL → A5
@Typical I²C address is 0x3C (sometimes 0x3D)

Once this is wired, your OLED has power + data connection.
      `),
      circuitImage: {
        uri: "https://dummyimage.com/1200x700/ddd/000.png&text=OLED+Circuit+Photo+Placeholder",
      },
    },
  ],

  2: [
    {
            id: "circuit-2",
      title: "Step 2: Install OLED Libraries",
      desc: processDesc(`
We’ll use the Adafruit SSD1306 + GFX drivers.

Install the display libraries:
@Open Arduino IDE → Tools → Manage Libraries
@Search and install "Adafruit SSD1306"
@Search and install "Adafruit GFX Library"
@Restart IDE if examples do not appear
      `),

      circuitImage: {
        image: require("../../../assets/circuit/adafruitssd1306.png"),
        
      },
      
      descAfterCircuit: processDesc(`
Common Issues:
@“SSD1306 allocation failed” → wrong display size example
@Blank screen → wrong SDA/SCL wiring or incorrect address (0x3C/0x3D)
@Upload stalls → reset Arduino and try again
      `),
    },
  ],

  3: [
    {
      id: "circuit-3",
      title: "Step 3: Run an Example (Sanity Check)",
      desc: processDesc(`
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
      circuitImage: {
        uri: "https://dummyimage.com/1200x700/ddd/000.png&text=OLED+Test+Output",
      },
    },
  ],

  4: [
    {
      id: "circuit-4",
      title: "Step 4: Buttons with Internal Pull-Ups",
      desc: processDesc(`
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
      circuitImage: {
        uri: "https://dummyimage.com/1200x500/ffffff/000000.png&text=Buttons+with+Internal+Pull-Ups",
      },
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

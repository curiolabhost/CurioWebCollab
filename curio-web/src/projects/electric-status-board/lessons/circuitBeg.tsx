// circuit.tsx
"use client";

import * as React from "react";
import CodeLessonBase from "@/src/lesson-core/CodeLessonBase";


// ------------------------------------------------------------
// CIRCUIT LESSON CONTENT (CodeBeg-style shape)
// ------------------------------------------------------------
export const LESSON_STEPS_CIRCUIT_BEG: Record<number, { phrase: string; steps: any[] }> = {
    1:{
    phrase: "What is a Breadboard",
    steps: [
      {
        id: 1,
        title: "Regular Breadboard",
        codes: [
        {
          topicTitle: "How to use Breadboard",
          descAfterImage: `**A breadboard is a practice board that lets us build electronic circuits without soldering.**
 1. Each holes is where you can insert a wire or component lead to make connections.
 2. In the middle, holes in a row of 5 are connected together horizontally.
 3. The two long rows on the sides are used for power (VCC) and ground (GND) connections.
         `,

          imageGridAfterCode: {
            columns: 1,
            width: 600,
            height: 400,
            items: [
              {
                label: "Breadboard connections",
                imageSrc: "/electric-status-board/circuit/breadBoardConnections.png",
              },
            ],
          },
        },{
          topicTitle: "How Current works",
          descBeforeCode:`**What is electric current?**
Electric current is the movement of tiny particles called electrons through a wire.
When electrons move, electricity is flowing.

**What direction does current flow?**
Current is said to flow from positive (+) to negative (−). The (+) indicates higher voltage, so current flows from high to low voltage. Think of it as electrical pressure: things naturally flow from high pressure to low pressure.`,
          imageGridAfterCode: {
            columns: 1,
            width: 500,
            height: 600,
            items: [
              {
                label: "Current flow",
                imageSrc: "/electric-status-board/circuit/LEDbasics.png",
              },
            ],
          },
        },
        {
          topicTitle: "Exercises with Breadboard",
          descBeforeCode: `For each question, pick the circuit setup that would allow the LED to light up.
**Problem 1:**`,
          imageGridBeforeCode: {
            columns: 1,
            width: 800,
            height: 450,
            items: [
              {
                imageSrc: "/electric-status-board/circuit/breadBoardQ1.png",
              },
            ],
          },
          descAfterCode: `**Problem 2:**`,
          imageGridAfterCode: {
            columns: 1,
            width: 800,
            height: 450,
            items: [
              {
                imageSrc: "/electric-status-board/circuit/breadBoardQ2.png",
              },
            ],
          },


        },
        ],
      },
      {
        id: 2,
        title: "Breadboard Mini",
        codes: [
          {
            topicTitle: "How is Breadboard Mini different?",
            descBeforeCode: `Breadboard Mini works exactly the same but it has just a few differences:
**Key Differences**:
@ Holes only in a row are connected
@ No long connection for (+) and (-). 

You will try both the regular and mini breadboards to get used to using both. For the actual prototype, you may want to use the Beadboard Mini because it is much more cost-efficient.`,
          imageGridBeforeCode: {
            columns: 1,
            width: 800,
            height: 350,
            items: [
              {
                label: "Breadboard Mini",
                imageSrc: "/electric-status-board/circuit/miniBreadBoard.png",
              },
            ],
          },
          descAfterCode:`Because there are no long column connections in Breadboard Mini, the wiring can be slightly different. In this example below, the red and blue LEDs would light up for both boards. Make sure you understand how!`,
          imageGridAfterCode: {
            columns: 1,
            width: 800,
            height: 560,
            items: [
              {
                label: "Regular vs Mini Breadboard",
                imageSrc: "/electric-status-board/circuit/miniBreadBoard2.png",
              },
            ],
          },
          },
          {
            topicTitle:"Try wiring in simulator",
            descBeforeCode:`Open up Wokwi Simulator, grab an Arduino Nano, and place LEDs at these locations. Try to wire from the black and red wire end points to light all the LEDs up!
**RULE**: Do not wire directly into the LED pins, meaning do not let the wires touch the pins.`,
            imageGridAfterCode: {
            columns: 1,
            width: 1000,
            height: 480,
            items: [
              {
                label: "Mini Breadboard Exercise",
                imageSrc: "/electric-status-board/circuit/miniBreadBoard3.png",
              },
            ],
          },
          },
        ],
      },
    ]
  },
  
  
  2: {
    phrase: "Circuit setup: parts, OLED wiring, libraries, and button inputs",
    steps: [
      {
        id: "circuit-intro",
        title: "Introduction to Circuit Setup",
        codes: [
          {
            topicTitle: "Overview",
            descBeforeCode: `In this lesson, we will set up the hardware components needed for the Electric Status Board project.

**Key Steps**:
@Gather materials including Arduino, OLED display, buttons, breadboard, and wires
@Wire the OLED display to the Arduino using I²C protocol
@Install necessary libraries in Arduino IDE for OLED functionality
@Test the OLED with an example sketch to ensure proper operation
@Wire push buttons with internal pull-up resistors for menu navigation
@Set up the RTC module for timekeeping

By the end of this lesson, you will have a functioning OLED display and buttons ready for programming the status board menu system.
            `,
          },
        ],
      },
      {
        id: "circuit-1",
        title: "Step 1: Circuit Materials Overview",
    codes: [
        {
          topicTitle: "Materials",
          imageGridBeforeCode: {
            columns: 4,
            width: 180,
            height: 180,
            items: [
              {
                label: "Arduino UNO",
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
              {
                label: "RTC DS1307 Module",
                imageSrc: "/electric-status-board/circuit/RTC_DS1307.jpg",
              },

            ],
          },
        },
      ],
    },

    {
        id: "arduino-setup",
        title: "Step 1: Arduino UNO Setup",
        codes: [
          {
            topicTitle: "Arduino UNO Overview",
            descBeforeCode: `@Arduino connects the hardware and software. 
              @It sends and receives signals from your hardware and the computer or vice versa. 
              @Download **Arduino IDE** from arduino.cc to program your board.
            `,
            imageGridAfterCode: {
            columns: 1,
            width: 900,
            height: 400,
            items: [
              {
                imageSrc: "/electric-status-board/circuit/ardunio_demo.png",
              },
            ],
          },
          },
          {
            topicTitle: "Digital and Analog Signals",
            descBeforeCode: `@Analog signal is a **range** and is **continuous**. 
              @Digital signal represents only **two binary state** (like 0/1, yes/no) that are read as high or low states in the program.
            `,
            imageGridAfterCode: {
              columns: 1,
              width: 800,
              height: 300,
              items: [
                {
                  imageSrc: "/electric-status-board/circuit/analog_digital.png",
                },
              ],
            },
        },
        // Place the quiz as a separate codes entry so it renders after the picture
        {
          topicTitle: "Quick Quiz — Analog or Digital?",
          customComponent: AnalogDigitalQuiz,
        },
        ],
      },
      {
        id: "circuit-2",
        title: "Step 2: Install OLED Libraries",
        codes: [
          {
            topicTitle: "Install the Libraries",
            descBeforeCode: `An Arduino library is a collection of ready-made code that reduces the need to write complex code from scratch.
              @Open Arduino IDE → Tools → Manage Libraries
              @Search and install "Adafruit SSD1306"
              @Search and install "Adafruit GFX Library"`,
              
            imageGridBeforeCode: {
              columns: 1,
              width: 600,
             height: 390,
              items: [{ label: "Library Manager Search", imageSrc: "/electric-status-board/circuit/adafruitssd1306.png" }],
            },
          },
          {
            descBeforeCode:`**Warning**: 
The simulator Wokwi only has SSD1306 OLED implemented, if trying to use a different OLED model, please install the corresponding library in your local Arduino IDE.
In this lesson, we will use SSD1306 OLED as an example on wokwi first. Later when building the physical circuit, you can choose a larger OLED screen which is SH1106 model that require Adafruit_SH110X library instead of SSD1306. 
@ Be careful, as the model is different, part of the code will need to be adjusted accordingly.
            `,            
            imageGridAfterCode: {
              columns: 1,
              width: 600,
             height: 330,
              items: [{ label: "OLED types and their libraries", imageSrc: "/electric-status-board/circuit/adafruitlibraries.png" }],
            },
          },
          {
          topicTitle: "Connect OLED to Arduino",
          descBeforeCode: `**Step 1**: Open your wokwi page through **wokwi.com** and add the arduino uno, breadboard, and SSD1306 OLED
**Step 2**: Connect the OLED pins to the Arduino pins this way: `,
          imageGridBeforeCode: {
              columns: 1,
              width: 600,
             height: 330,
              items: [{ label: "OLED connections", imageSrc: "/electric-status-board/circuit/oledwiring.png" }],
            },
descAfterImage:`**Now your OLED has power and data connection.**

**Common Issues**:
@“SSD1306 allocation failed” → wrong display size example
@Blank screen → wrong SDA/SCL wiring or incorrect address (0x3C/0x3D)
@Upload stalls → reset Arduino and try again
          `,
          imageGridAfterCode: {
            columns: 1,
            width: 800,
            height: 500,
            items: [
              {
                label: "Wokwi Page Demoenstration",
                imageSrc: "/electric-status-board/circuit/wokwipage.png",
              },
            ],
          },
        },
        ],
      },

      {
        id: "circuit-3",
        title: "Step 3: Run an Example Sketch",
        codes: [
          {
            topicTitle: "Confirm the OLED Works",
            descBeforeCode: `Before building your own menu, run a known working test.
**Step 1:** Open the example sketch:
@File → Examples → Adafruit SSD1306 → ssd1306_128x64.i2c
@ If trying this on wokwi, change the line #define SCREEN_ADDRESS 0x3D into #define SCREEN_ADDRESS 0x3C to make it work

**Step 2:** Upload the sketch to your Arduino:
@Tools → Port → Select the correct COM port for your Arduino
@Tools → Board → Select correct board type (e.g., Arduino Uno)
@Sketch → Upload

**Step 3:** Observe the OLED display:
@You should see a series of test patterns and graphics on the OLED
@If not displaying correctly, double-check wiring and library installation

Once this is done, you are good to proceed to building your own menu system!
             `,

            imageGridAfterCode: {
              columns: 1,
              width: 500,
              height:510,
              items: [
                {
                  label: "Expected OLED Output",
                  video: {
                    src: "/electric-status-board/videos/exampleOLED_demestration.mp4",
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
            descBeforeCode: `In this project, we will have 3 push buttons for controling the status board menu:
@Button 1: go to Previous Item
@Button 2: go to Next Item
@Button 3: Select Item

**4-leg push buttons wiring:**
**Step 1:** Inside wokwi, add 3 push buttons to your breadboard and place them across breadboard center gap
**Step 2:** Wire each button:
@Choose one side of the button and connect it to one of the pin (D2/D3/D4) for all 3 buttons
@Choose another side that is not connected with the previous pins and connect it to GND for all three buttons
**Step 3:** Configure pins in code as INPUT_PULLUP:
@ pinMode(buttonPin, INPUT_PULLUP);

Button State Logic:
@Press = LOW, Release = HIGH (via pull-up).

**2-leg button wiring** (similar to 4-leg button):
@One leg → Arduino D2 / D3 / D4
@Other leg → GND
            `,

            imageGridAfterCode: {
              columns: 1,
              width: 850,
              height:400,
              items: [
                {
                  label: "Pushbuttons connection",
                  imageSrc:
                    "/electric-status-board/circuit/pushbutton_circuit.png",
                },
                {
                  label: "Pushbutton circuit flow",
                  imageSrc:
                    "/electric-status-board/circuit/pushbutton_demo.gif",
                }
              ],
            },
          },
        ],
      },
      {
        id: "RTC-setup",
        title: "Step 5: RTC Module Setup",
        codes: [
          {
            topicTitle: "RTC DS1307 Wiring",
            descBeforeCode: `The Real-Time Clock (RTC) module keeps track of the current time even when the Arduino is powered off. This is essential for displaying accurate time on the status board.

**Wiring Steps**:
@**Step1:** Connect the RTC module (SDA and SCL) to your Arduino using the same port that you use for the OLED (A4 and A5) 
@**Step2:** Connect VCC to 5V and GND to Ground
            `,

            imageGridAfterCode: {
              columns: 1,
              width: 700,
              height: 550,
              items: [
                {
                  label: "Final Wiring Diagram with RTC DS1307",
                  imageSrc: "/electric-status-board/circuit/final_wiring.png",
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

// Quiz component: students choose Analog or Digital for each item and check answers
function AnalogDigitalQuiz() {
  const questions = [
    {
      id: "temp",
      text: "Reading temperature from a temperature sensor",
      answer: "Analog",
      explanation: "Temperature sensors usually output a continuous voltage proportional to temperature, not just on/off.",
    },
    {
      id: "led",
      text: "Turning on/off an LED light",
      answer: "Digital",
      explanation: "Turning an LED on or off is a discrete action (high/low), representing a digital state.",
    },
    {
      id: "button",
      text: "Pressing a push button",
      answer: "Digital",
      explanation: "A push button produces a binary state: pressed or not pressed (LOW/HIGH with pull-up).",
    },
    {
      id: "ultra",
      text: "Measuring distance using an ultrasonic sensor",
      answer: "Analog",
      explanation: "Many ultrasonic sensors report distance as a measured value across a range (continuous).",
    },
  ];

  const [choices, setChoices] = React.useState<Record<string, string>>({});
  const [checked, setChecked] = React.useState<boolean>(false);

  function handleChange(id: string, value: string) {
    setChoices((s) => ({ ...s, [id]: value }));
  }

  function handleCheck() {
    setChecked(true);
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, marginTop: 12 }}>
      {questions.map((q) => (
        <div key={q.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>{q.text}</div>
            <select
              value={choices[q.id] ?? ""}
              onChange={(e) => handleChange(q.id, e.target.value)}
              aria-label={q.text}
              style={{
                padding: "6px 10px",
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#fff",
                borderRadius: 6,
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                minWidth: 120,
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
              }}
            >
               <option value="">Choose...</option>
               <option value="Analog">Analog</option>
               <option value="Digital">Digital</option>
             </select>
            {checked && (
              <div style={{ minWidth: 140 }}>
                {choices[q.id] === q.answer ? (
                  <span style={{ color: "green" }}>Correct</span>
                ) : (
                  <span style={{ color: "red" }}>Wrong</span>
                )}
              </div>
            )}
          </div>

          {checked && (
            <div style={{ marginTop: 6, fontSize: 13, color: "#444", background: "#f9f9f9", padding: 8, borderRadius: 4 }}>
              {q.explanation}
            </div>
          )}
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <button
          onClick={handleCheck}
          style={{
            padding: "6px 10px",
            border: "1px solid rgba(0,0,0,0.12)",
            background: "#fff",
            borderRadius: 6,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
          aria-label="Check Answers"
        >
          Check Answers
        </button>
      </div>
    </div>
  );
}

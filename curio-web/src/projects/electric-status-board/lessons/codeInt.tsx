//https://wokwi.com/projects/452254262742865921

"use client";

import * as React from "react";
import CodeLessonBase from "@/src/lesson-core/CodeLessonBase";
import ESBProjectMindMapLesson from "./ProjectMindMapLesson";
import InputPullupCircuitInteractive from "./InputPullupCircuitInteractive";
import { buildAnswerKey, K } from "@/src/lesson-core/BlankChecks/blankKeyBuilder";
import { generateKeyFromReference } from "@/src/lesson-core/BlankChecks/blankKeyGenerator";

export const LESSON_STEPS_INTERMEDIATE: Record<
  number,
  { phrase: string; advanced?: boolean; optional?: boolean; steps: any[] }
> = {
  // =========================================================
  // LESSON 1
  // =========================================================

  1: {
    phrase: "Understand Project Logic",
    advanced: false,
    steps: [
      {
        title: "Understand Project Logic",
        customComponent: ESBProjectMindMapLesson, // wrapper
      },
    ],
  },

  2: {
    phrase: "OLED setup: libraries, screen dimensions, and button pins",
    advanced: false,
    steps: [
      {
        id: 1,
        title: "Step 1: Setting Libraries",
        codes: [
          {
            topicTitle: "Include Libraries",
            descBeforeCode:
              "Coding libraries are collections of prewritten code that help you perform common tasks. Using libraries saves time and prevents you from having to write everything from scratch. For our FocusBoard, we need the correct libraries to communicate with the SSD1306 OLED display over I²C and to draw text and shapes on the screen.",
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `^^#include <Wire.h>
#include __BLANK[1]__ //load Adafruit's graphics library
#include __BLANK[2]__ //driver for the OLED controller
#include __BLANK[3]__ //clock module

__BLANK[4]__ __BLANK[5]__; //create clock object^^

void setup(){
}

void loop(){
}`,
            answerKey: buildAnswerKey({
              1: K.str({ oneOf: ["<Adafruit_GFX.h>"] }),
              2: K.str({ oneOf: ["<Adafruit_SSD1306.h>","<Adafruit_SH1106.h>","<Adafruit_SSD1309.h>","<Adafruit_SSD1327.h>","<Adafruit_SSD1351.h>","<Adafruit_SSD1331.h>","<Adafruit_SSD1305.h>","<U8g2lib.h>"]  }),
              3: K.str({ oneOf: ["<RTClib.h>"] }),
            4: K.id(),
            5: K.id(),
                        }),

            blankExplanations: {
              1: "This is the graphics helper library that gives you drawing tools (text, shapes, cursor control) for the OLED.",
              2: "This is the OLED driver library for the SSD1306 chip. It handles sending pixel data to the screen.",
              3: "This is a real-time clock (RTC) library. Use the one that matches your clock module (the module type matters).",
              4: "Type the clock device type here. Potential types you could be using are: RTC_DS1307 and RTC_PCD8523",
              5: "Type the clock object here. This object can be named anything (banana, rtc, clock, myClock, etc.) ",
            },
            blankDifficulties: {
              1: "easy",
              2: "easy",
              3: "medium",
            },
            descAfterCode: `This step adds important libraries used for communicating with the OLED screen (and a clock module if you have one):

\`#include <Wire.h>\`  
Enables I²C communication so the Arduino can talk to devices using just two wires: **SDA** (data) and **SCL** (clock).  
The SSD1306 OLED uses I²C, so this library is required.

\`#include <Adafruit_GFX.h>\`
Loads Adafruit’s graphics library. This provides drawing tools like printing text, drawing shapes, and setting cursor positions.

\`#include <Adafruit_SSD1306.h>\`  
Loads the driver for the SSD1306 OLED controller so the display can render what you draw.
@ **Note:** If you have a different OLED model, you may need a different driver library (e.g., SH1106, SSD1309, etc.). Make sure to include the correct one for your screen.

\`#include <RTClib.h>\`  
This is for a real-time clock module. The exact header depends on which clock module you are using.

**Together, these libraries allow the Arduino to communicate with the OLED and render text/graphics (and optionally read time from a clock module).**`,
          },{
            topicTitle: "Clock Object",
            descBeforeCode: 
`\`(device type) (object)\`
The last line in the code box above creates an object that lets your code talk to a real-time clock chip. For example, if you are using DS3231 clock module and you want to name its object as "rtc" then it would be:
\`RTC_DS3231 rtc\`. 
The object name does not need to be "rtc", it is just a variable name so you can call it anything you want like "clock", "myRTC", or "banana". 
**The clock device types vary and you need make sure you are writing the correct type in this line. Types include: "RTC_DS1307", "RTC_PCD8523", etc. Look at the table below.**
`,
            imageGridAfterCode: {
              columns: 1,
              width: 850,
              height: 660,
              items: [
                {
                  imageSrc: "/electric-status-board/rtcObjects.png",
                  label: "Common RTC Module Types",
                }
              ]
            } ,
            descAfterImage: null,
            hint: "Wire handles I²C. GFX draws. SSD1306 drives the OLED. Clock libs depend on the RTC module.",
          },
        ],
      },

      {
        id: 2,
        title: "Step 2: Defining Screen",
        codes: [
          {
            topicTitle: "Define the OLED dimensions",
            descBeforeCode: `Define the OLED dimensions and create the display object. This allows the libaray to know the correct dimensions of the screen and to send data to the correct pixels. Many modules are 128×64; slim ones are 128×32. So now for the OLED screen in the Wokwi simulator, we have to define the width to be 128 and height to be 64. 

**Fill in the blanks.**`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `##include <Wire.h>
#include __BLANK[1]__ 
#include __BLANK[2]__
#include __BLANK[3]__

__BLANK[4]__ __BLANK[5]__; 
^^
#define __BLANK[6]__  __BLANK[7]__ // define width pixels (constant name followed by value)
#define __BLANK[8]__ __BLANK[9]__ // define height pixels
#define RESET  -1
Adafruit_SSD1306 display(__BLANK[10]__, __BLANK[11]__, &Wire, RESET);// call the display object's width and height in this order^^ 

void setup(){
}

void loop(){
}`,
            answerKey: buildAnswerKey({
              6: K.id().bind("WIDTH"),
              7: K.num({ oneOf: [128] }),
              8: K.id().bind("HEIGHT"),
              9: K.num({ oneOf: [64, 32] }),
              10: K.same("WIDTH"),
              11: K.same("HEIGHT"),
            }),
            blankExplanations: {
              6: "Pick a clear constant name for the display width (any valid identifier). You’ll reuse this same name later.",
              8: "Pick a clear constant name for the display height (any valid identifier). You’ll reuse this same name later.",
              7: "This is the horizontal pixel width of your OLED display. Most SSD1306 modules are 128 pixels wide.",
              9: "This is the vertical pixel height of your OLED. Common values are 32 or 64 pixels depending on the screen size.",
              11: "Use the variable for height you defined above so the constructor matches your screen’s height.",
              10: "Use the variable for width you defined above so the constructor matches your screen’s width.",
            },
            blankDifficulties: {
              6: "easy",
              8: "easy",
              7: "easy",
              9: "easy",
              10: "easy",
              11: "easy",
            },
            descAfterCode: `Here’s what the blanks represent:
- WIDTH is the **screen width** in pixels.
- HEIGHT is the **screen height** in pixels.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "If your board has no RESET pin wired, keep RESET at -1.",
          },
        ],
      },

      {
        id: 3,
        title: "Step 3: Button Pins",
        codes: [
          {
            topicTitle: "Define button pins",
            descBeforeCode:
              "Next, we create names for the three buttons so the code knows which Arduino pins they are connected to, and so the program is easier to read and understand than if we used raw pin numbers. For this project, we need one button to move the cursor to the **next** option, one button to move to the **previous** option, and one button to **select** the option. If you want more practice working with buttons, review Lesson 1. \n**Fill in the blanks using the pin numbers from your circuit design.**",
            descBetweenBeforeAndCode: null,
            code: `##include <Wire.h>
#include __BLANK[1]__
#include __BLANK[2]__
#include __BLANK[3]__

__BLANK[4]__ __BLANK[5]__; 

#define __BLANK[6]__  __BLANK[7]__ 
#define __BLANK[8]__ __BLANK[9]__ 
#define RESET  -1
Adafruit_SSD1306 display(__BLANK[10]__, __BLANK[11]__, &Wire, RESET);
^^
#define PREV __BLANK[12]__
#define __BLANK[13]__ __BLANK[14]__
#define __BLANK[15]__  __BLANK[16]__^^  

void setup(){
}

void loop(){
}`,
            answerKey: buildAnswerKey({
              12: K.num({ min: 0, max: 13 }),
              13: K.id().bind("NEXT"),
              14: K.num({ min: 0, max: 13 }),
              15: K.id().bind("SELECT"),
              16: K.num({ min: 0, max: 13 }),
            }),

            blankExplanations: {
              12: "Enter the Arduino digital pin number connected to your PREV button (0–13). This must match your wiring.",
              13: "Pick a clear constant name for the NEXT button (any valid identifier). You’ll use this name later in your code.",
              14: "Enter the Arduino digital pin number connected to your NEXT button (0–13). This must match your wiring.",
              15: "Pick a clear constant name for the Select button (any valid identifier). You’ll use this name later in your code.",
              16: "Enter the Arduino digital pin number connected to your Select button (0–13). This must match your wiring.",
            },

            blankDifficulties: {
              12: "easy",
              13: "easy",
              14: "easy",
              15: "easy",
              16: "easy",
            },

             imageGridAfterCode: {
              columns: 1,
              width: 600,
              height: 480,
              items: [
                {
                  imageSrc: "/electric-status-board/circuit/final_wiring.png",
                  label: "Example Circuit Image Reference",
                },
              ],
            },
            descAfterCode: `Use the digital pin numbers from **your circuit design** (the pins you actually wired for PREV, NEXT, and SELECT).

Example: If your PREV button is connected to digital pin 3 like in the circuit image above, then PREV would be 3. Fill the rest based on your wiring.`,
            descAfterImage: null,
            hint: "Later, we'll set these pins to INPUT_PULLUP, which means the button will read LOW when pressed and HIGH when released.",
          },
        ],
      },

      {
        id: 4,
        title: "Step 4: Initialize Display & Buttons",
        codes: [
          {
            topicTitle: "Initialize OLED + Buttons in setup()",
            descBeforeCode:
              "Now we need to start I²C, initialize the OLED display at address 0x3C, clear the screen, and set the button pins to INPUT_PULLUP. All of these actions are placed inside void setup() because they only need to run once at the beginning of the program.",
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `##include <Wire.h>
#include __BLANK[1]__
#include __BLANK[2]__
#include __BLANK[3]__

__BLANK[4]__ __BLANK[5]__; 

#define __BLANK[6]__  __BLANK[7]__ 
#define __BLANK[8]__ __BLANK[9]__ 
#define RESET  -1
Adafruit_SSD1306 display(__BLANK[10]__, __BLANK[11]__, &Wire, RESET);

#define PREV __BLANK[12]__
#define __BLANK[13]__ __BLANK[14]__
#define __BLANK[15]__  __BLANK[16]__
^^
void setup() {
  Wire.begin();
  __BLANK[17]__;      // Initialize OLED

  //<< set the modes for the buttons you are using 
  pinMode(PREV, INPUT_PULLUP);                 // PREV button
  __BLANK[18]__; // NEXT button
  __BLANK[19]__;^^      // SELECT button
}`,
            answerKey: buildAnswerKey({

            17: {
              type: "pattern",
              parts: [
                "display",
                ".",
                "begin",
                "(",
                "SSD1306_SWITCHCAPVCC",
                ",",
                {
                  p: "oneOf",
                  values: [
                    "0x3C"
                  ]
                },
                ")"
              ],
              policy: {
                requireNoSpacesAround: [
                  "."
                ]
              },
            } as const,
              18: {
                type: "pattern",
                parts: [
                  "pinMode",
                  "(",
                  {
                    p: "sameAs",
                    target: "NEXT",
                  },
                  ",",
                  "INPUT_PULLUP",
                  ")",
                ],
              } as const,
              19: {
                type: "pattern",
                parts: [
                  "pinMode",
                  "(",
                  {
                    p: "sameAs",
                    target: "SELECT",
                  },
                  ",",
                  "INPUT_PULLUP",
                  ")",
                ],
              } as const,
            }),
            blankExplanations: {
              17: "This line initializes the OLED display (power setting + I²C address).",
              18: "This sets the 'Next' button pin as an input and enables the Arduino’s internal pull-up resistor, so the pin reads HIGH by default and LOW when the button is pressed. This prevents floating inputs and allows the button to be wired safely without an external resistor.",

              19: "This configures the 'Select' button pin as an input with an internal pull-up resistor, ensuring stable readings. When the button is not pressed the pin reads HIGH, and when pressed it reads LOW, which is required for reliable button detection in the menu system.",
            },
            blankDifficulties: {
              17: "easy",
              18: "easy",
              19: "easy",
            },
            descAfterCode: `Reminder:
- With \`INPUT_PULLUP\`: released = HIGH, pressed = LOW.
- You must call the OLED update line after drawing if you want changes to show.`,
          },
          {
            topicTitle: "Useful functions for OLED module",
            descBeforeCode: `\`Wire.begin();\`  
Starts the I²C communication bus so the Arduino can talk to devices like the OLED display using SDA (data) and SCL (clock). This must be called before using any I²C device.

\`display.begin(A, B);\`  
Initializes the OLED and prepares it for drawing.  
@ **A**: usually **SSD1306_SWITCHCAPVCC**, which tells the display how to power its internal circuits. If you are not using SSD1306 OLED display, then this would be slightly different. 
@ **B**: the OLED’s I²C address, most commonly **0x3C**.

\`pinMode(A,B);\`  
Configures the button pins as inputs with internal pull-up resistors.  
@ **A**: the button pin (e.g., \`PREV\`)  
@ **B**: \`INPUT_PULLUP\`, meaning:  
      - Button not pressed → reads **HIGH**  
      - Button pressed → reads **LOW**
`,
              imageGridAfterCode: {
              columns: 1,
              height: 420,
              width: 700,
              items: [
                {
                  imageSrc: "/electric-status-board/oledbegin().png",
                  label: "OLED Types and their Initialization Calls",
                },
              ],
            },
            descAfterImage: null,
            hint: "INPUT_PULLUP ties the pin internally to Vcc, so a button to GND reads LOW when pressed.",
          },
        ],
      },
    ],
  },

  // =========================================================
  // LESSON 3
  // =========================================================
  3: {
    phrase: "Screen: Welcome message",
    advanced: false,
    steps: [
      {
        id: 1,
        title: "Step 1: Draw First (Welcome) Page",
        codes: [
          {
            topicTitle: "Welcome Screen Function",
            descBeforeCode: `**Clear the screen, print a big greeting.**
You will create a welcome message by calling it in the setup(). As a reminder, functions are reusable blocks of code that perform a specific task. 
Since we want the welcome page to show up only **ONCE when we turn the device on**, we will place that function in the **setup()**. Recall the important display functions from Lesson 2 Step 4. Use those functions to fill each blank in the code.`,
          },
          {
            topicTitle: "Understanding How to Print Text",
            imageGridBeforeCode: {
              columns: 1,
              height: 300,
              width: 600,
              items: [
                {
                  imageSrc: "/electric-status-board/printvsprintln.png",
                  label: "Tiny Example: print() vs println()",
                },
              ],
            },
            descBetweenBeforeAndCode: `
**Difference between** \`println()\` **and** \`print()\`
@\`print()\` writes text (or a value) **without** moving to a new line afterward.
@If you call print() again, the next text continues on the same line.
@\`println()\` writes text (or a value) and then **moves the cursor to the start of the next line**.
@The next print() / println() will begin on a new line.
`,
          },
          {
            code: `#include <Wire.h>
#include __BLANK[1]__
#include __BLANK[2]__
#include __BLANK[3]__

__BLANK[4]__ __BLANK[5]__; 

//<< OLED
#define __BLANK[6]__  __BLANK[7]__
#define __BLANK[8]__ __BLANK[9]__
#define RESET  -1
Adafruit_SSD1306 display(__BLANK[10]__, __BLANK[11]__, &Wire, RESET);

//<< Buttons 
#define PREV __BLANK[12]__
#define __BLANK[13]__ __BLANK[14]__
#define __BLANK[15]__  __BLANK[16]__

^^
void setup() {
  Wire.begin();
  __BLANK[17]__; 
//<< Produce welcome message upon starting the board   
  __BLANK[WELCOMEFUNCTION]__(); 

//<<buttons being used
  pinMode(PREV, INPUT_PULLUP);                 
  __BLANK[18]__;
  __BLANK[19]__;
}

void loop(){
}

void showWelcome() {
  __BLANK[29]__; //clear display  
  __BLANK[20]__; //set text size to 1
  __BLANK[21]__; //set display color to white

  __BLANK[22]__; //set cursor to (0,0)
  __BLANK[23]__; //print "Welcome to"

  __BLANK[24]__; //set text size to 2
  __BLANK[25]__; //set cursor (0,16)
  __BLANK[26]__; //print "FocusBoard"

  __BLANK[27]__; //send display to the screen
  __BLANK[28]__; //short delay
}
^^`,
            answerKey: buildAnswerKey({
              WELCOMEFUNCTION: K.str({ oneOf: ["showWelcome"] }),
              21: {
                type: "pattern",
                parts: [
                  "display",
                  ".",
                  {
                    p: "oneOf",
                    values: ["setTextColor"],
                  },
                  "(",
                  {
                    p: "identifier",
                  },
                  ")",
                ],
                policy: {
                  requireNoSpacesAround: ["."],
                },
              } as const,
              20: {
                type: "pattern",
                parts: [
                  "display",
                  ".",
                  {
                    p: "oneOf",
                    values: ["setTextSize"],
                  },
                  "(",
                  "1",
                  ")",
                ],
                policy: {
                  requireNoSpacesAround: ["."],
                },
              } as const,
              22: {
                type: "pattern",
                parts: [
                  "display",
                  ".",
                  {
                    p: "oneOf",
                    values: ["setCursor"],
                  },
                  "(",
                  "0",
                  ",",
                  "0",
                  ")",
                ],
                policy: {
                  requireNoSpacesAround: ["."],
                },
              } as const,
              23: {
                type: "pattern",
                parts: [
                  "display",
                  ".",
                  {
                    p: "oneOf",
                    values: ["println", "print"],
                  },
                  "(",
                  '"Welcome to"',
                  ")",
                ],
                policy: {
                  requireNoSpacesAround: ["."],
                },
              } as const,
              24: {
                type: "pattern",
                parts: [
                  "display",
                  ".",
                  {
                    p: "oneOf",
                    values: ["setTextSize"],
                  },
                  "(",
                  "2",
                  ")",
                ],
                policy: {
                  requireNoSpacesAround: ["."],
                },
              } as const,
              25: {
                type: "pattern",
                parts: [
                  "display",
                  ".",
                  {
                    p: "oneOf",
                    values: ["setCursor"],
                  },
                  "(",
                  "0",
                  ",",
                  "16",
                  ")",
                ],
                policy: {
                  requireNoSpacesAround: ["."],
                },
              } as const,
              26: {
                type: "pattern",
                parts: [
                  "display",
                  ".",
                  {
                    p: "oneOf",
                    values: ["println", "print"],
                  },
                  "(",
                  "\"FocusBoard\"",
                  ")",
                ],
                policy: {
                  requireNoSpacesAround: ["."],
                },
              } as const,
              27: {
                type: "pattern",
                parts: ["display", ".", "display", "(", ")",],
                policy: {
                  requireNoSpacesAround: ["."],
                },
              } as const,
              28: {
                type: "pattern",
                parts: [
                  "delay",
                  "(",
                  {
                    p: "number",
                  },
                  ")",
                ],
              } as const,
              29: {
                type: "pattern",
                parts: ["display", ".", "clearDisplay", "(",")" ],
              } as const,
            }),
            blankExplanations: {
              29: "Clear the OLED buffer first.",
              20: "Set a text size to be '1' for the 'Welcome to' phrase.",
              21: "Set the text color mode to be white so text shows clearly. Every display type uses its own color type scheme.",
              22: "set the cursor to be at (0,0)",
              23: "print or println 'Welcome to'. Make sure to place double quotations around words in the print command.",
              24: "Set the text size to be '2'",
              25: "Set cursor to be at (0,16)",
              26: "print or println 'Timer'",
            },
            blankDifficulties: {
              20: "easy",
              21: "easy",
              22: "easy",
              23: "easy",
              24: "easy",
              25: "easy",
              26: "easy",
              27: "easy",
              28: "easy",
            },
            descAfterCode: `You call the Welcome Function you made in the void setup() so that it displays in the screen as soon as you turn the board on.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Call display() after drawing to push the buffer to the screen.",
          },
          {
            topicTitle: "Useful function for OLED module",
            descBeforeCode: `\`display.clearDisplay();\`  
Clears the display’s internal pixel buffer. The screen becomes blank after the next call to **display.display();**.

\`display.setTextSize(A);\`  
Sets the size (scale) of the text.  
- **A**: any integer >= 1
  - 1 = smallest, 2 = medium, 3 = large, etc.

\`display.setTextColor(A);\`  
Sets how text pixels are drawn.  
- **A** can be:  
  - \`SSD1306_WHITE\`: pixels ON (bright text)  
  - \`SSD1306_BLACK\`: pixels OFF (used to erase)  
  - \`SSD1306_INVERSE\`: invert black/white for highlighting

\`display.setCursor(A,B);\`  
Moves the text cursor to a new position on the screen.  
- **A**: x-position in pixels from the left  
- **B**: y-position in pixels from the top

\`display.display();\`  
Updates the physical OLED screen by sending the entire buffer to the display hardware.`,
          },

          {
            topicTitle: "Try Simulation",
            descBeforeCode: `Paste the code into simaulator and run it to check if the welcome message displays as intended. Here is an example of a welcome message. 
  You can set cursor for certain texts to position your welcome messages in a more organized manner!`,
            imageGridBeforeCode: {
              columns: 1,
              width: 400,
              height: 350,
              items: [
                {
                  imageSrc: "/electric-status-board/welcomeFunc2.png",
                  label: "Example: welcome function",
                },
              ],
            },
          },
        ],
      },
      {
        id: 2,
        title: "Step 2: Personalize your Welcome Page",
        codes: [
          {
            descBeforeCode: `Now that you have created an example \`showWelcome()\` function, it's your time to create your own to display an opening message that you want to see.
Type your code in the editor box below. You can reference the \`showWelcome()\` code but that example code will no longer be rendered in our following lessons.`,
            editorPlaceholders: {
              WELCOME: `Type your Welcome Function here. Rename the function and remember to call the function by that name in the setup() or loop().`,
            },
            code: `^^//<< Example welcome page function (for reference only)
void showWelcome() {
  __BLANK[29]__; //clear display  
  __BLANK[20]__; //set text size to 1
  __BLANK[21]__; //set display color to white

  __BLANK[22]__; //set cursor to (0,0)
  __BLANK[23]__; //print "Welcome to"

  __BLANK[24]__; //set text size to 2
  __BLANK[25]__; //set cursor (0,16)
  __BLANK[26]__; //print "FocusBoard"

  __BLANK[27]__; //send display to the screen
  __BLANK[28]__; //short delay
}

//<< Create your own welcome function to be used for your project
__EDITOR[WELCOME]__

^^`,
            descAfterCode:`What is your new Welcome Function called?   __BLANK[WELCOMEFUNC]__`,
            answerKey: buildAnswerKey({
              WELCOMEFUNC: K.id(),
            }),
          },{
            topicTitle: "Try Simulation",
            descBeforeCode: `Paste your new code into the simulator and run it to see your personalized welcome message come to life on the OLED screen!`,
code:
`^^#include <Wire.h>
#include __BLANK[1]__
#include __BLANK[2]__
#include __BLANK[3]__

__BLANK[4]__ __BLANK[5]__; //clock object

//<< OLED
#define __BLANK[6]__  __BLANK[7]__
#define __BLANK[8]__ __BLANK[9]__
#define RESET  -1
Adafruit_SSD1306 display(__BLANK[10]__, __BLANK[11]__, &Wire, RESET);

//<< Buttons 
#define PREV __BLANK[12]__
#define __BLANK[13]__ __BLANK[14]__
#define __BLANK[15]__  __BLANK[16]__

void setup() {
  Wire.begin();
  __BLANK[17]__; 
//<< Produce welcome message upon starting the board   
  __BLANK[WELCOMENAME]__(); 

//<<buttons being used
  pinMode(PREV, INPUT_PULLUP);                 
  __BLANK[18]__;
  __BLANK[19]__;
}

void loop(){
}

__EDITOR[WELCOME]__
}
^^`,
            answerKey: buildAnswerKey({
              WELCOMENAME: K.id().bind("WELCOMENAME"),
            }),

          },
        ],
      },
    ],
  },

  // =========================================================
  // LESSON 4
  // =========================================================

  4: {
    phrase: "Variables + lists (arrays) for Main Menu",
    advanced: false,
    steps: [
      {
        id: 1,
        optional: true,
        title: "Step 1: What Is a Variable?",
        codes: [
          {
            topicTitle: "Practice: Variables",
            descBeforeCode:
              "Variables act like labeled boxes in the Arduino’s memory where values are stored. Each variable has a type, a name, and a value.",
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `^^int x = 5;          ^^// integer variable^^
bool ready = true;  ^^// true/false variable^^
float speed = 3.5;  ^^// decimal number^^`,
            descAfterCode: `Here's what each line does:
\`int x = 5;\`  
  - \`int\` means a whole number.  
  - \`x\` is the variable name.  
  - \`5\` is the value it stores.

\`bool ready = true;\`  
  - \`bool\` stores either \`true\` or \`false\`.  
  - Useful when something can be “on/off” or “yes/no”.  

\`float speed = 3.5;\`  
  - \`float\` stores decimal numbers.

**Why we use variables:**  
Variables let the Arduino remember things like button states, menu positions, or whether the user is on the welcome screen or not.

**Common variable types:**
- \`int\` : whole numbers
- \`bool\` : true or false
- \`char\` : a single character (Ex: 'A', 1', '5')
- \`String\` : text (Ex: "Emily", "1234")
- \`float\` : decimal numbers`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "A variable stores exactly one piece of information.",
          },
        ],
      },

    {
      id: 2,
      optional:true,
      title: "Step 2: Practice with Variables",
      desc: "Fill in the blanks to practice different variable types.",

      codes: [
        {
          descBeforeCode: `**Naming Variables**:
Here you will fill in the blanks to define variables in a correct syntax. Try to use the real information so it feels personal!`,
          title: "Practice: Basic Variables",
          code: `^^__BLANK[NAMETYPE]__ name = "__BLANK[NAME1]__";
int year = __BLANK[YEAR]__;
String month = "__BLANK[MONTH]__";
bool ready = __BLANK[READY]__;  
float temperature = __BLANK[TEMP]__;
__BLANK[DATETYPE]__ date = "12/25/2025";
__BLANK[BUTTONTYPE]__ buttonState = false;
int __BLANK[NAME2]__ = 365^^;`,
        answerKey: {
          NAMETYPE: ["String", "char"],
          NAME1: { type: "string", regex: "^[^\\n\\r]+$" }, // allow anything non-empty inside quotes
          YEAR: { type: "range", min: 1900, max: 2100 },
          MONTH: { type: "string", regex: "^[A-Za-z]+$" },
          READY: ["true", "false"],
          TEMP: { type: "range" },
          DATETYPE: ["String"],
          BUTTONTYPE: ["bool"],
          NAME2: { type: "identifier" },
        },

        blankExplanations: {
          NAMETYPE:
            "This blank is the variable TYPE. If you want text in quotes, use String. If you want one character, use char.",
          NAME1:
            "A name inside quotes. Example: Emily. (You can type any word here; it’s just practice.)",
          YEAR:
            "A year number (no quotes). Example: 2026.",
          MONTH:
            "A month written as a word inside quotes. Example: January.",
          READY:
            "A boolean value. Only true or false (no quotes).",
          TEMP:
            "A number that can be decimal. Example: 72.5.",
          DATETYPE:
            "Because you’re storing the date in quotes (\"12/25/2025\"), the type must be String.",
          BUTTONTYPE:
            "buttonState stores true/false, so the type should be bool.",
          NAME2:
            "A valid variable name for the last line. Example: daysInYear. Must start with a letter/underscore and contain no spaces.",
        },

        blankDifficulties: {
          NAMETYPE: "easy",
          NAME1: "easy",
          YEAR: "easy",
          MONTH: "easy",
          READY: "easy",
          TEMP: "easy",
          DATETYPE: "easy",
          BUTTONTYPE: "easy",
          NAME2: "easy",
        },

          descAfterCode: `String uses double quotation \`"" ""\`.
Char uses single quotation \`' '\`.
Integer does not need anything surrounding the numbers. 
Boolean only allows true or false. `,
        },
        {
          descBeforeCode: `**Understanding changes in Variables:**`,
          title: "Practice: Counter",
          code: `^^int counter = 0;

counter = counter + 1;
counter = counter + 1;
counter = counter + 1;^^`,
          descAfterCode: `What does the counter now read?    __BLANK[COUNTER]__`,
          answerKey: {
            COUNTER: ["3"],
          },
          blankExplanations: {
            COUNTER:
              "Counter starts at 0 and you add 1 three times (0→1→2→3). Final value is 3.",
          },
          blankDifficulties: {
            COUNTER: "easy",
          },},
        {
          title: "Practice: Level",
          code: `^^int level = 1;

level = level + 1;
level = level + 2;^^`,
          answerKey: {
            LEVEL: ["4"],
          },
          blankExplanations: {
            LEVEL:
              "Level starts at 1, then +1 makes 2, then +2 makes 4. Final value is 4.",
          },
          blankDifficulties: {
            LEVEL: "easy",
          },
          descAfterCode: `What does the level now read?    __BLANK[LEVEL]__`,
        },
      ],
    },

    {
      id: 3,
      optional:true,
      title: "Step 3: What Is a List (Array)?",
      desc:
        "A list (array) stores many values under one variable name. This is perfect for storing multiple menu options.",
      hint: "Arrays are 0-indexed: the first item is at index 0.",

      codes: [
        {
          // imageGrid
          imageGridBeforeCode: {
            columns: 1,
            rows: 1,
            items: [{ imageSrc: "/electric-status-board/array.png", label: "Array example" }],
          },},{
          topicTitle: "Practice 1: Arrays",
          descBetweenBeforeAndCode: `Here we practice creating arrays of strings and accessing items by index. Fill the blanks below to complete the examples.`,

          title: `Practice: Arrays`,
          code: `//<< List of four numbers^^
int numbers[] = {1, 2, 3, 4};
int select = numbers [1];^^

//<< List of five chars. ^^
char favLetters[] = {'A', 'D', 'F', 'H', 'K', 'M'};
char best = favLetters[3];^^

//<< Create an array of String of four different colors. ^^
__BLANK[ARRAYTYPE]__  __BLANK[ARRAYNAME]__ = __BLANK[ARRAY]__;

//<< Assign a variable named favoriteColor that calls your favorite color within the array. 
//<< Use your array variable to call using an index. 
__BLANK[VARRAYTYPE]__  __BLANK[VARRAYNAME]__ = __BLANK[CALL]__;^^`,
          answerKey: {
            ARRAYTYPE: ["String"],
            ARRAYNAME: {
              type: "string",
              regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\[\\s*\\]$",
            },
            ARRAY: { type: "string", regex: "^\\{.*\\}$" },
            VARRAYTYPE: ["String"],
            VARRAYNAME: { type: "identifier" },
            CALL: {
              type: "string",
              regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\[\\s*\\d+\\s*\\]$",
            },
          },

          blankExplanations: {
            ARRAYTYPE: "The data type for a text array is usually String.",
            ARRAYNAME:
              "Write a valid array name ending with [], like colors[] or favColors[].",
            ARRAY:
              "Write the array initializer in curly braces, like {\"Red\", \"Blue\", \"Green\", \"Yellow\"}.",
            VARRAYTYPE:
              "The variable that stores one color from the array should also be a String.",
            VARRAYNAME: "Pick a variable name like favoriteColor.",
            CALL:
              "Call one element from your array using an index, like colors[2].",
          },

          descAfterCode: `Arrays group related data together:
  - \`numbers[0]\` gives the **first** item → \`1\`  
  - \`numbers[1]\` gives the second item → \`2\`  
  - \`numbers[3]\` gives the last item → \`4\`

Arrays are extremely useful when you want your code to handle lots of similar values without writing dozens of separate variables.`,
        },{
          descAfterCode: `**Problems:** 
What does the integer variable \`select\` read after the code runs?    __BLANK[SELECTPRACTICE]__
What does the char variable \`best\` read after the code runs?    __BLANK[BEST]__`,
          answerKey: {
            SELECTPRACTICE: ["2"],
            BEST: ["H"],
          },
        },
        {
          topicTitle: "Practice 2: Array Index",
          title: `More Practice:`,
          code: `^^String days[] = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};

//Fill in the blanks:
days[3] =  __BLANK[DAY]__
days[1] =  __BLANK[DAY2]__
days[__BLANK[DAY3]__] = "Monday"
days[__BLANK[DAY4]__] = "Sunday"^^`,

          answerKey: {
            DAY: ["\"Thursday\""],
            DAY2: ["\"Tuesday\""],
            DAY3: ["0"],
            DAY4: ["6"],
          },
          blankExplanations: {
            DAY: "day at the 3rd index in list",
            DAY2: "day at the 1st index in list",
            DAY3: "index of Monday in list",
            DAY4: "index of Sunday in list",
          },
        },
        {
          topicTitle: "Practice 3: Using Varaibles for Arrays",
          title: `More Practice:`,
          code: `^^int index = 3;
String menu[] = {"pasta", "pizza", "salad", "soup", "sandwich"};
String todaySpecial = menu[index];^^`,
          descAfterCode: `What does the variable \`todaySpecial\` read after the code runs?    __BLANK[TODAYSPECIAL]__`,
          answerKey: {
            TODAYSPECIAL: ["soup","\"soup\""],
          },
        },{
        title: `More Practice:`,
        code:
`^^__BLANK[FOOD1]__ __BLANK[FOOD2]__ = __BLANK[FOOD3]__; // create an index variable and assign it as 1

__BLANK[FOOD4]__ __BLANK[FOOD5]__ = {"charger", "headphones", "laptop", "mouse", "keyboard"};
String __BLANK[FOOD6]__ = __BLANK[FOOD8]__[__BLANK[FOOD7]__]; // create a variable to store the item indexed by the index variable you created right above
^^`,
        descAfterCode: `What does the variable  __BLANK[FOOD6]__ read after the code runs?    __BLANK[FOOD6ANSWER]__`,
        answerKey: buildAnswerKey({
          FOOD1: ["int"],
          FOOD2: K.id().bind("deviceIndex"),
          FOOD3: ["1"],
          FOOD4: ["const char*", "String"],
          FOOD5: { type: "pattern", parts: [{ p: "identifier", bindAs: "deviceList" }, "[", "]"] } as const,
          FOOD6: { type: "pattern", parts: [{ p: "identifier", bindAs: "selectedDevice" }] } as const,
          FOOD7: K.same("deviceIndex"),
          FOOD8: K.same("deviceList"),
          FOOD6ANSWER: ['"headphones"',"headphones"],
        }),
      }
      ],
    },

      {
        id: 4,
        title: "Step 4: Establishing Screens",
        codes: [
          {
            topicTitle: "Create Variables for Screens",
            descBeforeCode: `We need to create variables to keep track of which screen we are currently on. This will help us know what to display and how to respond to button presses. So when we press SELECT on an option in the Main Menu, we can change the screen variable to indicate we are now on the Clock screen or Timer/Pomodoro screen. We will use an integer variable to represent the different screens.`,
            imageGridBeforeCode: {
              columns: 1,
              width: 900,
              height: 450,
              items: [
                {
                  imageSrc: "/electric-status-board/screenChange.png",
                  label: "Screen variable visual",
                },
              ],
            },
            descBetweenBeforeAndCode: null,
            code: `^^__BLANK[30]__ __BLANK[31]__ = __BLANK[32]__; //variable for screen modes`,
            answerKey: buildAnswerKey({
              30: K.str({ oneOf: ["int"] }),
              31: K.id().bind("screenMode"),
              32: K.num({ oneOf: [0] }),
            }),
            blankExplanations: {
              31: "Pick a variable name to track the current screen (valid identifier).",
              32: "Use 0 here for initial number to begin with.",
              30: "What is the type of variable used for this data? (bool, String, int, etc.)",
            },
            blankDifficulties: {
              30: "easy",
              31: "easy",
              32: "easy",
            },
          },
        ],
      },

      {
        id: 5,
        title: "Step 5: Create Lists for Main Menu Options",
        codes: [
          {
            topicTitle: "Create your main options array",
            descBeforeCode: `Instead of making many separate variables for each options, we store them all in a single array so the menu can move through them easily.
Before we can display a menu, we need to **store the menu options** somewhere. In this project, we keep the top-level menu labels (\`Clock\`, \`Timer\` or \`Pomodoro\`) inside a \`const char*\` array. We are not using \`String\` here because we want to keep it memory-efficient. String type arrays take up a lot of memory and can cause instability on microcontrollers with limited RAM.  

\`Clock\` : for displaying time 
\`Timer\` : for starting a timer and Pomodoro
`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `^^
//<< List of main menu options
__BLANK[33]__  __BLANK[34]__[] = { //define array name
  __BLANK[36]__, //menu option 1 ("Clock" or "Timer" etc.)
  __BLANK[35]__, //menu option 2
};^^
`,
            answerKey: buildAnswerKey({
              33: K.str({ oneOf: ["String", "const char*"] }),
              34: {
                type: "pattern",
                parts: [
                  {
                    p: "identifier",
                    bindAs: "mainMenu",
                  },
                ],
              } as const,
              35: K.str({ requireQuoted: true }),
              36: K.str({ requireQuoted: true }).bind("mainMenuOption1"),
            }),

            blankExplanations: {
              33: "Choose a valid text type for a list of menu labels. Most commonly this is `const char*` (C-style strings), but `String` can also work depending on your codebase.",
              34: "Name your menu array and include `[]` to show it’s an array (example: `mainMenu[]`).",
              35: 'Write the second menu option as text inside quotes (example: "Clock"). This will be the label shown in the menu.',
              36: 'Write the third menu option as text inside quotes (example: "Timer"). This will be the label shown in the menu.',
            },

            blankDifficulties: {
              33: "easy",
              34: "easy",
              35: "easy",
              36: "easy",
            },

            descAfterCode: `Now your program has a **top-level menu list** stored in an array. Each item can be accessed by its index:
  - __BLANK[34]__[0] → __BLANK[36]__
  - __BLANK[34]__[1] → __BLANK[35]__`,

            imageGridAfterCode: null,
            descAfterImage: null,
          },
          {
            topicTitle: "Using the Main Menu Array",
            descBeforeCode: `Arrays don’t automatically know how many items they contain, so we store the total count in a variable.
Create a variable that stores the total **number** of main menu options in the array.
`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `
__BLANK[33]__ __BLANK[34]__ = {
  __BLANK[36]__,
  __BLANK[35]__
};^^

__BLANK[37]__ __BLANK[38]__ = __BLANK[39]__;   //total number of items in the main menu array
__BLANK[40]__ __BLANK[41]__ = __BLANK[42]__; //counter index for the main menu array. Assign 0.
^^`,
            descAfterCode:`These two variables let the menu scroll correctly. In our code we can check the value of the index variable to know which menu option we are currently on and we can **check our index against the total number of menu options** to know when to wrap around the menu:
@ If it is past the last item → wrap back to the first  
@ If it is before the first → wrap to the last.`,
            answerKey: buildAnswerKey({
              37: K.str({ oneOf: ["int"] }),
              38: K.id().bind("totalMain"),
              39: K.num({ oneOf: [2] }),
              40: K.str({ oneOf: ["int"] }),
              41: K.id().bind("mainIndex"),
              42: K.num({ oneOf: [0] }),
            }),
            blankExplanations: {
              TOTMAIN:
                "Name the variable that stores how many items exist in the main menu array.",
              TOTMAINNUM:
                "Set this to the exact number of options in your main menu array. With Clock and Timer → this should be **2**.",
              MINDEXTYPE:
                "Choose a numeric type for the menu index. Most commonly this is `int` (an integer counter).",
              MINDEX:
                "Name the variable that tracks which main menu item is currently selected (example: `mainIndex`).",
              MINDEXNUM:
                "Start the selected index at **0** so the first menu item (index 0) is highlighted by default.",
            },

            blankDifficulties: {
              TOTMAIN: "easy",
              TOTMAINNUM: "easy",
              MINDEXTYPE: "easy",
              MINDEX: "easy",
              MINDEXNUM: "easy",
            },
          },
          {
            title: `Practice: Calling array item`,
            code: `//<< Practice how you can use the array using the index counter variable you just made. ^^
  String practice = __BLANK[MMENUNAME1]__ [__BLANK[MINDEX1]__];^^`,
            answerKey: buildAnswerKey({
              MMENUNAME1: K.same("mainMenu"),
              MINDEX1: K.same("mainIndex"),
              MENULIST2: K.same("mainMenuOption1"),
            }),

            descAfterCode: `What would the String \`practice\` read?   __BLANK[MENULIST2]__`,
          },
        ],
      },
    ],
  },

  // =========================================================
  // LESSON 5
  // =========================================================

  5: {
    phrase: "Looping Main Menu options",
    advanced: false,
    steps: [
      {
        id: 1,
        title: "Step 1: What is a Loop?",
        optional: true,
        codes: [
          {
            topicTitle: "Why loops matter",
            descBeforeCode:
              "We have an array of items. Now we want to print ALL of them without writing many repeated lines of code.",
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `^^
display.println(options[0]); // Without a loop (not flexible)
display.println(options[1]); // Better idea: use a loop to repeat the same pattern for each item.
display.println(options[2]);
display.println(options[3]);
^^`,
            answerKey: {},
            blankExplanations: {},
            blankDifficulties: {},
            descAfterCode: `Without a loop, you have to write a separate line for every item in the array. If you add or remove items, you must rewrite the code.

Loops fix this problem by repeating the same code for each index in the array. In the next steps, we will use a **while loop** to walk through the list of options automatically.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Imagine you had 10 or 20 items. You wouldn’t want to copy-paste the same line 20 times.",
          },
        ],
      },

      {
        id: 2,
        title: "Step 2: Basic While Loop",
        optional: true,
        codes: [
          {
            topicTitle: "Warm-up: The while-loop pattern",
            descBeforeCode:
              "A while loop repeats a block of code as long as its condition is true. Study this pattern: start value → condition → update.",
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `^^// Warm-up example: prints 0,1,2,3 then stops^^
^^int i = 0;                      ^^// 1) start value^^
while (i < 4) {                 ^^// 2) condition^^
  Serial.println(i);
  i = i + 1;                    ^^// 3) update (moves i forward)^^
}^^`,
            answerKey: {
              ANSWER_I: ["4"],
            },
            blankExplanations: {
              ANSWER_I:
                "After the loop stops, i has just reached the first value that makes the condition false.",
            },
            blankDifficulties: {
              ANSWER_I: "easy",
            },
            descAfterCode: `The loop stops when \`i < 4\` becomes false.

What does the \`i\` read after while loop ends?    __BLANK[ANSWER_I]__`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "If the update line is missing, the loop may never end.",
          },

          {
            topicTitle: "Loop Practices",
            title: `Loop Practice 1`,
            descBeforeCode: `**Practice 1: Print Even Numbers**
Start at 2 and keep printing even numbers by adding the same step each time until 10.`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `^^int num = 2;
while (num < __BLANK[P1_LIMIT]__) {
  Serial.println(__BLANK[P1_PRINT]__);
  num = num + __BLANK[P1_STEP]__;
}^^`,
            answerKey: {
              P1_LIMIT: ["10"],
              P1_PRINT: ["num"],
              P1_STEP: ["2"],
            },
            blankExplanations: {
              P1_LIMIT:
                "Pick a number that makes the loop stop after a few prints. The loop should stop when num reaches the limit.",
              P1_PRINT:
                "Print the variable that changes each loop iteration (not a fixed number).",
              P1_STEP:
                "Even numbers increase by a constant step. Choose the amount num should increase each time.",
            },
            blankDifficulties: {
              P1_LIMIT: "easy",
              P1_PRINT: "easy",
              P1_STEP: "easy",
            },
            descAfterCode:
              "If your step is 2, the output should be even numbers: 2, 4, 6, ... until the condition becomes false.",
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Even numbers go up by 2 each time.",
          },

          {
            descBeforeCode: `**Loop Practice 2: Print Multiples of Three**
Pick a starting value for x, then update x by 3 each loop.`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            title: `Loop Practice 2`,
            code: `^^int x = __BLANK[P2_START]__;
while (__BLANK[P2_CONDVAR]__ < __BLANK[P2_LIMIT]__) {
  Serial.println(__BLANK[P2_PRINT]__);
  __BLANK[P2_UPDATE]__;
}^^`,
            answerKey: {
              P2_START: { type: "range", min: 0, max: 30 },
              P2_CONDVAR: ["x"],
              P2_LIMIT: { type: "range", min: 10, max: 100 },
              P2_PRINT: ["x"],
              P2_UPDATE: ["x=x+3", "x+=3"],
            },
            blankExplanations: {
              P2_START:
                "Choose a starting number for x. It should make sense for counting by 3.",
              P2_CONDVAR:
                "Use the same variable you’re updating inside the loop for the condition check.",
              P2_LIMIT: "Pick a stopping limit so the loop eventually ends.",
              P2_PRINT: "Print the changing variable for each loop iteration.",
              P2_UPDATE:
                "Update x so it moves forward by 3 each time (otherwise the loop may never end).",
            },
            blankDifficulties: {
              P2_START: "easy",
              P2_CONDVAR: "easy",
              P2_LIMIT: "easy",
              P2_PRINT: "easy",
              P2_UPDATE: "medium",
            },
            descAfterCode:
              "As long as x increases by 3 each time, the loop will eventually reach the limit and stop.",
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Make sure the update changes x by 3 (no space needed).",
          },

          {
            descBeforeCode: `**Loop Practice 3: Stop when a Number Reaches a Limit**
Create a counter variable, print it, and increase it by 1 each loop until it reaches your limit.`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            title: `Loop Practice 3`,
            code: `^^int __BLANK[P3_VAR]__ = 5;
while (__BLANK[P3_CONDVAR]__ < __BLANK[P3_LIMIT]__) {
  Serial.println(__BLANK[P3_PRINT]__);
  __BLANK[P3_VAR]__ = __BLANK[P3_NEXT]__ + __BLANK[P3_NUM]__;
}^^`,
            answerKey: {
              P3_VAR: { type: "identifier" },
              P3_CONDVAR: { type: "sameAs", target: "P3_VAR" },
              P3_LIMIT: { type: "range", min: 6, max: 200 },
              P3_PRINT: { type: "sameAs", target: "P3_VAR" },
              P3_NEXT: { type: "sameAs", target: "P3_VAR" },
              P3_NUM: ["1"],
            },
            blankExplanations: {
              P3_VAR:
                "Choose a variable name for your counter (any valid identifier).",
              P3_CONDVAR:
                "Use the same variable name you created for the counter in the while condition.",
              P3_LIMIT:
                "Pick a limit bigger than the start value so the loop can run at least once.",
              P3_PRINT:
                "Print the counter variable each time so you can see it change.",
              P3_NEXT:
                "Update the counter to the next value by adding 1 to it.",
            },
            blankDifficulties: {
              P3_VAR: "easy",
              P3_CONDVAR: "easy",
              P3_LIMIT: "easy",
              P3_PRINT: "easy",
              P3_NEXT: "easy",
            },
            descAfterCode:
              "This is the same pattern: start value → condition → update. The update must move the counter forward.",
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Your update should increase the counter by exactly 1 (no space needed).",
          },

          {
            descBeforeCode: `**Loop Practice 4: Loop Until Button Press (concept)**
This is concept practice: loop while a true/false flag is false. In a real project, the flag would change when you read a button.`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            title: `Loop Practice 4`,
            code: `^^__BLANK[P4_TYPE]__ __BLANK[P4_FLAG]__ = __BLANK[P4_VALUE]__;
while (__BLANK[P4_FLAG]__ == false) {
  Serial.println(__BLANK[P4_PRINT]__);
  // In a real project, you'd update the flag based on a button read.
}^^`,
            answerKey: {
              P4_TYPE: ["bool"],
              P4_VALUE: ["true", "false"],
              P4_FLAG: { type: "identifier" },
              P4_PRINT: {
                type: "string",
                regex: '^".*"$',
              },
            },
            blankExplanations: {
              P4_TYPE: "Choose the correct type for a true/false variable.",
              P4_FLAG:
                "Pick a variable name to represent whether you’re ready or not.",
              P4_VALUE:
                "Choose the starting true/false value for the variable.",
              P4_PRINT:
                "Print a short message string while waiting in the loop (any message is fine).",
            },
            blankDifficulties: {
              P4_TYPE: "easy",
              P4_FLAG: "easy",
              P4_VALUE: "easy",
              P4_PRINT: "easy",
            },
            descAfterCode:
              "If the flag never changes inside the loop, this would run forever. In real code, you’d update the flag by reading a button.",
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "True/false variables use the type bool.",
          },

          {
            descBeforeCode: `**Loop Practice 5: Loop through Array 1 (search)**
Walk through an array and stop early when you find the target value.`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            title: `Loop Practice 5`,
            code: `^^int nums[] = {2, 4, 7, 9, 11, 14};
int total = __BLANK[P5_TOTAL]__;     ^^// total number of items in the array^^
int desiredNum = __BLANK[P5_TARGET]__;

int j = 0;
while (j < total) {
  if (nums[j] == __BLANK[P5_IFCOMPARE]__) {
    Serial.println("Target reached!");
    Serial.println(desiredNum);      ^^// print the desired number^^
    break;                           ^^// stop the loop^^
  }
  j = j + 1;                         ^^// increment to the next index^^
}^^`,
            answerKey: {
              P5_TOTAL: ["6"],
              P5_TARGET: { type: "range", min: 0, max: 100 },
              P5_IFCOMPARE: ["desiredNum"],
            },
            blankExplanations: {
              P5_TOTAL:
                "This is how many items are in the nums array. Count them.",
              P5_TARGET: "Pick a number you want to search for in the array.",
              P5_IFCOMPARE:
                "Compare nums[j] to the variable holding the target value.",
            },
            blankDifficulties: {
              P5_TOTAL: "easy",
              P5_TARGET: "easy",
              P5_IFCOMPARE: "easy",
            },
            descAfterCode:
              "The keyword break stops the loop immediately once the target is found.",
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "If you don’t break, the loop keeps checking the rest of the array.",
          },

          {
            descBeforeCode: `**Loop Practice 6: Loop through Array 2 (search)**
Same idea, but you choose your own array name, target variable name, and indexing variable.`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            title: `Loop Practice 6`,
            code: `^^int __BLANK[P6_ARRNAME]__[] = {4, 3, 2, 10, 1, 6};
int total2 = __BLANK[P6_TOTAL]__;    ^^// total number of items in the array^^
int __BLANK[P6_DESNAME]__ = __BLANK[P6_DESVAL]__;   ^^// desired number^^

int __BLANK[P6_IDXVAR]__ = __BLANK[P6_STARTIDX]__;
while (__BLANK[P6_IDXVAR]__ < total2) {
  if (__BLANK[P6_READ]__ == __BLANK[P6_COMPARE]__) {
    Serial.println("Here is the number:");
    Serial.println(__BLANK[P6_PRINT]__);
    break;
  }
  __BLANK[P6_INCLEFT]__ = __BLANK[P6_INCRIGHT]__ + 1;  ^^// increment index^^
}^^`,
            answerKey: {
              P6_ARRNAME: { type: "identifier" },
              P6_TOTAL: ["6"],
              P6_DESNAME: { type: "identifier" },
              P6_DESVAL: { type: "range", min: 0, max: 20 },
              P6_IDXVAR: { type: "identifier" },
              P6_STARTIDX: ["0"],
              P6_READ: { type: "expression" }, // array[index]
              P6_COMPARE: { type: "sameAs", target: "P6_DESNAME" },
              P6_PRINT: { type: "sameAs", target: "P6_DESNAME" },
              P6_INCLEFT: { type: "sameAs", target: "P6_IDXVAR" },
              P6_INCRIGHT: { type: "sameAs", target: "P6_IDXVAR" },
            },
            blankExplanations: {
              P6_ARRNAME: "Pick a valid array name for the list of numbers.",
              P6_TOTAL:
                "This is the number of items in your array. Count how many values you put in it.",
              P6_DESNAME:
                "Pick a variable name for the number you want to find.",
              P6_DESVAL:
                "Pick a number that exists in your array so the condition can become true.",
              P6_IDXVAR:
                "This is your index variable that moves through the array.",
              P6_STARTIDX: "Start at the first index of the array.",
              P6_READ:
                "Access the current array element using the index variable (array[index]).",
              P6_COMPARE:
                "Compare the current array value to your target variable.",
              P6_PRINT: "Print the target variable once it is found.",
              P6_INCLEFT:
                "Update the same index variable you’re using in the while condition.",
              P6_INCRIGHT:
                "Increment the index variable so it moves to the next index.",
            },
            blankDifficulties: {
              P6_ARRNAME: "easy",
              P6_TOTAL: "easy",
              P6_DESNAME: "easy",
              P6_DESVAL: "easy",
              P6_IDXVAR: "easy",
              P6_STARTIDX: "easy",
              P6_READ: "medium",
              P6_COMPARE: "easy",
              P6_PRINT: "easy",
              P6_INCLEFT: "easy",
              P6_INCRIGHT: "easy",
            },
            descAfterCode:
              "If your target number exists in the array, the loop will eventually find it and stop.",
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Make sure P6_READ uses your array name and your index variable.",
          },
        ],
      },

      {
        id: 3,
        title: "Step 3: Show the Main Menu",
        codes: [
          {
            topicTitle: "Print the menu + highlight the selected option",
            descBeforeCode: `**Here is the idea:**
When you press a navigation button (Next or Previous), the value of __BLANK[MINDEX]__ is increased or decreased to change which menu option is selected (0 → 1 → 2).
For example, if the Next button is pressed once, __BLANK[MINDEX]__ becomes 1.
As the program loops through the menu array, it checks each option’s index. When the loop index equals __BLANK[MINDEX]__, that option is marked as selected and highlighted on the screen. In this example, the selected item is shown with an arrow \`>\`, but you can use any symbol or indicator you prefer.

This new function draws the **Main Menu screen** on the OLED.
**Here is what your new function would need to do step-by-step:**
@ Clears the screen and sets up text styling
@ Prints a title ("Main Menu:") and a divider line
@ Uses a while loop to print every menu item in the main menu array __BLANK[MMENUNAME]__.
@ Adds a highlight indicator (like ">") next to the selected item (when i == __BLANK[MINDEX]__)
@ All other menu items print normally (with spaces so everything stays aligned)
@ Other indicators you can use instead of \`">\` include: \`*\`, \`→\`, \`#\`, and any others. 
    
You will fill in a few key blanks to make the loop and highlighting work.`,
            descBetweenBeforeAndCode: null,

            code: `^^
//<< ---------------- TOP-LEVEL MENU ----------------
void __BLANK[43]__() {                 // Function that draws the main menu on the OLED screen
// ##EDIT:SHOWMAINMENU:INDENT=1##
  __BLANK[44]__                       // Clears the display so previous screens are erased
  __BLANK[45]__                       // Sets the size of the text shown on the screen
  __BLANK[46]__                       // Sets the color of the text for the OLED display
  __BLANK[47]__                       // Moves the cursor to the top-left corner of the screen

  display.println("Main Menu:");       // Prints the menu title
  display.println("----------");       // Prints a divider line under the title

  int i = __BLANK[48]__;               // Initializes the menu index starting at the first item

  while (__BLANK[49]__) {              // Loops through all menu items
    if (__BLANK[50]__) {               // Checks if this menu item is currently selected
      display.print("> ");             // Shows an arrow next to the selected item
    }
    else {
      display.print("  ");             // Keeps spacing aligned for unselected items
    }

    __BLANK[51]__;                     // Prints the current menu item text
    __BLANK[52]__;                     // Moves to the next menu item
  }
}
//##END:SHOWMAINMENU##
^^`,
            imageGridBeforeCode: {
              columns: 1,
              rows: 1,
              width: 500,
              height: 420,
              items: [
                {
                  imageSrc: "/electric-status-board/mainMenuButton.gif",
                  label: "Main menu loop",
                },
              ],
            },
            answerKey: buildAnswerKey({
              43: K.id().bind("showMainMenu"),
              44: {
                type: "pattern",
                parts: ["display", ".", "clearDisplay", "(", ")"],
              } as const,
              45: {
                type: "pattern",
                parts: ["display", ".", "setTextSize", "(", "1", ")"],
              } as const,
              46: {
                type: "pattern",
                parts: [
                  "display",
                  ".",
                  "setTextColor",
                  "(",
                  {
                    p: "string",
                  },
                  ")",
                ],

              } as const,
              47: {
                type: "pattern",
                parts: ["display", ".", "setCursor", "(", "0", ",", "0", ")"],
              } as const,
              48: K.num({ oneOf: [0] }),
              51: {
                type: "pattern",
                parts: [
                  "display",
                  ".",
                  {
                    p: "oneOf",
                    values: ["println", "print"],
                  },
                  "(",
                  {
                    p: "sameAs",
                    target: "mainMenu",
                  },
                  "[",
                  "i",
                  "]",
                  ")",
                ],
              } as const,
              49: {
                type: "pattern",
                parts: [
                  "i",
                  "<",
                  {
                    p: "sameAs",
                    target: "totalMain",
                  },
                ],
              } as const,
              50: {
                type: "pattern",
                parts: [
                  "i",
                  "==",
                  {
                    p: "sameAs",
                    target: "mainIndex",
                  },
                ],
              } as const,
              52: {
                type: "pattern",
                parts: [
                  "i",
                  {
                    p: "oneOf",
                    values: ["++", "="],
                  },
                  "i",
                  "+",
                  "1",
                ],
              } as const,
            }),

              blankExplanations: {
                43: "Name the function that draws the main menu on the OLED screen.",
                44: "Clear the OLED display so previous content is removed.",
                45: "Set the size of the text before printing anything.",
                46: "Set the color used for text on the OLED display.",
                47: "Position the cursor where the menu text should start printing.",
                48: "Initialize the counter so the menu starts from the first item.",
                49: "Write a condition that keeps the loop running while menu items remain.",
                50: "Check whether the current menu item is the selected one.",
                51: "Print the menu label corresponding to the current index.",
                52: "Move to the next menu item so the loop continues correctly.",
              },

            blankDifficulties: {
                43: "easy",
                44: "easy",
                45: "easy",
                46: "easy",
                47: "easy",
                48: "easy",
                49: "easy",
                50: "easy",
                51: "easy",
                52: "easy",
            },
          },
          {
            topicTitle:
              "Checkpoint: Test your code so far on Simulator (Welcome → Main Menu)",
            descBeforeCode: `Now that you’ve built the Welcome screen function and the Main Menu function, you can test everything so far in the simulator.
**What should happen:**
@ Welcome screen shows once at startup
@ Then the Main Menu displays
@ No button navigation yet (we add that next)`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            title: "Codes Put Together",
            code: `^^
#include <Wire.h>
#include __BLANK[1]__
#include __BLANK[2]__
#include __BLANK[3]__

__BLANK[4]__ __BLANK[5]__;

//<< OLED definitions
#define __BLANK[6]__  __BLANK[7]__
#define __BLANK[8]__ __BLANK[9]__
#define RESET  -1
Adafruit_SSD1306 display(__BLANK[10]__, __BLANK[11]__, &Wire, RESET);

#define PREV __BLANK[12]__
#define __BLANK[13]__ __BLANK[14]__
#define __BLANK[15]__  __BLANK[16]__

//<< ------------------------------
//<< MAIN MENU DATA (from Lesson 4)
//<< ------------------------------
__BLANK[33]__ __BLANK[34]__ = {
  __BLANK[36]__,
  __BLANK[35]__
};
__BLANK[37]__ __BLANK[38]__ = __BLANK[39]__;
__BLANK[40]__ __BLANK[41]__ = __BLANK[42]__;

//<< ------------------------------
//<< SETUP + LOOP (run so far)
//<< ------------------------------
void setup() {
  Wire.begin();
  __BLANK[17]__;

  pinMode(PREV, INPUT_PULLUP);
  __BLANK[18]__;
  __BLANK[19]__;

  //<< 1) Call Welcome Function once
  __BLANK[WELCOMENAME]__();

  //<< 2) A short delay before the main menu so you can see the welcome function
  delay(__BLANK[DELAY_MS]__);

  //<< 3) Then call the main menu Function 
  __BLANK[43]__();
}

void loop() {
  //<< No navigation yet — we add button logic next lesson/step.
}

//<< ------------------------------
//<< FUNCTIONS (from Lesson 3 + 5)
//<< ------------------------------

//<< Welcome screen (from Lesson 3)
__EDITOR[WELCOME]__

//<< Main menu screen (from Lesson 5 Step 3)
void __BLANK[43]__() {
// ##EDIT:SHOWMAINMENU:INDENT=1##
  __BLANK[44]__
  __BLANK[45]__
  __BLANK[46]__
  __BLANK[47]__

  display.println("Main Menu:");
  display.println("----------");

  int i = __BLANK[48]__;

  while (__BLANK[49]__) {
    if (__BLANK[50]__) {
      display.print("> ");
    }
    else {
      display.print("  ");
    }

    __BLANK[51]__;
    __BLANK[52]__;
  }
}
// ##END:SHOWMAINMENU##
^^`,
            answerKey: {
              DELAY_MS: {
                type: "range",
                min: 300,
                max: 10000,
              },
            },

            blankExplanations: {
              DELAY_MS:
                "Choose how long (in milliseconds) the welcome screen stays visible before switching to the main menu. If the value is very small (i.e.10-200 ms), it may disappear too quickly for you to see.",
              MAINMENUNAME:
                "This function is one you made that draws the main menu screen. Check the functions you made so far.",
            },
            descAfterCode: `**If your simulator shows a blank screen:**
@ Double-check your OLED I²C address (many are \`0x3C\`, some are \`0x3D\`)
@ If your display is 128×32, change \`SCREEN_HEIGHT\` from 64 to 32
@ Make sure you called \`display.display()\` after drawing

**What you just proved:**
You successfully built:
@ Libraries + display object
@ setup() initialization
@ a welcome screen function
@ a main menu drawing function`,
          },
        ],
      },
    ],
  },

  // =========================================================
  // LESSON 6
  // =========================================================
  6: {
    phrase: "Putting it all together: full sketch structure",
    advanced: false,
    steps: [
      {
        id: 1,
        title: "Step 1: Where each piece of code belongs",
        codes: [
          {
            topicTitle: "Arduino sketch layout (important!)",
            descBeforeCode: `Students often get stuck because the code is correct, but it’s placed in the wrong spot.

Use this simple rule:
@ **Libraries** go at the very top (they must be first).
@ **Constants (button pin, screen height) + global variables** (index, counters) go next (pins, arrays, counters, totals).
@ **setup()** is for one-time initialization when the Arduino turns on. (Wire, OLED begin, pinMode, welcome screen).
@ **loop()** runs forever to interact with users and to create dynamic content (later we will read buttons and decide which screen to show).
@ **Functions** can go below loop() (or above setup()) — but they must be **outside** setup() and loop().

Below is a “skeleton” that shows the correct order.`,
            imageGridBeforeCode: {
              columns: 1,
              rows: 1,
              width: 800,
              height: 500,
              items: [
                {
                  imageSrc: "/electric-status-board/arduinoStructure.png",
                  label: "Sketch structure",
                },
              ],
            },
            descBetweenBeforeAndCode: null,
            title: "Arduino Sketch Structure",
            code: `^^//<< ===== 1) Libraries (top of file) =====
#include <Wire.h> 
#include ...

//<< ===== 2) Constants + global variables (menus, pins, counters, display object) =====
#define width 128
....
Adafruit_SSD1306 display(...);

#define button 3
#define ...

String menu[] = {...};
int ...

//<< ===== 3) setup() runs ONCE =====
void setup() {
  Wire.begin();
  display.begin(...);
  pinMode(...);
}

//<< ===== 4) loop() runs FOREVER =====
void loop() {
  //<< later: read buttons, update indexes, call menus/screens
}

//<< ===== 5) Functions go OUTSIDE setup/loop =====
void __BLANK[WELCOMENAME]__() { ... }
void __BLANK[43]__() { ... }
^^`,
            answerKey: {},
            blankExplanations: {},
            blankDifficulties: {},
            descAfterCode: `If your code compiles but “does nothing,” the most common cause is that a function exists but is never called (usually in setup() or loop()).`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Functions must be outside setup() and loop(). Call them from setup() or loop() to make them run.",
          },
        ],
      },

      {
        id: 2,
        title: "Step 2: Here is what you have so far (with your blanks)",
        codes: [
          {
            topicTitle: "Full sketch so far",
            descBeforeCode: `This code box shows everything you have built so far, in the correct order.

As a reminder:
@ Anything at the top (libraries/defines/arrays/counters) is **global** — every function can use it.
@ setup() is where you initialize the OLED + buttons and show the welcome screen once.
@ The menu functions are defined at the bottom and can be called later from loop().

This is a “checkpoint” — you are not adding new logic yet, just organizing what you already wrote.`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            title: "Full Sketch Structure So Far",

            code: `^^
//<< ===================== 1) LIBRARIES =======================================
#include <Wire.h>
#include __BLANK[1]__
#include __BLANK[2]__
#include __BLANK[3]__

//<< ===================== 2) CONSTANTS + GLOBAL VARIABLES =====================

__BLANK[4]__ __BLANK[5]__;

//<< OLED definitions
#define __BLANK[6]__  __BLANK[7]__
#define __BLANK[8]__  __BLANK[9]__
#define RESET  -1
Adafruit_SSD1306 display(__BLANK[10]__, __BLANK[11]__, &Wire, RESET);

//<< Button pin definitions
#define PREV __BLANK[12]__
#define __BLANK[13]__ __BLANK[14]__
#define __BLANK[15]__ __BLANK[16]__


//<< MAIN MENU DATA (from Lesson 4)
__BLANK[33]__ __BLANK[34]__ = {
  __BLANK[36]__,
  __BLANK[35]__
};
__BLANK[37]__ __BLANK[38]__ = __BLANK[39]__;
__BLANK[40]__ __BLANK[41]__ = __BLANK[42]__;

//<< ===================== 3) SETUP (RUNS ONCE) ===============================
void setup() {
  Wire.begin();
  __BLANK[17]__;

  pinMode(PREV, INPUT_PULLUP);
  __BLANK[18]__;
  __BLANK[19]__;

  __BLANK[WELCOMENAME]__();

  delay(__BLANK[DELAY_MS]__);

  __BLANK[43]__();
}
//<< ===================== 4) LOOP (RUNS FOREVER) ============================
void loop() {
  //<< later: display screens in logical order based on button presses
  //<< and decide which screen function to call.
}

//<< ===================== 5) FUNCTIONS (OUTSIDE setup/loop) =================

//<< Welcome screen (from Lesson 3)
__EDITOR[WELCOME]__

//<< Main menu screen (from Lesson 5 Step 3)
void __BLANK[43]__() {
// ##EDIT:SHOWMAINMENU:INDENT=1##
  __BLANK[44]__
  __BLANK[45]__
  __BLANK[46]__
  __BLANK[47]__

  display.println("Main Menu:");
  display.println("----------");

  int i = __BLANK[48]__;

  while (__BLANK[49]__) {
    if (__BLANK[50]__) {
      display.print("> ");
    }
    else {
      display.print("  ");
    }

    __BLANK[51]__;
    __BLANK[52]__;
  }
}
// ##END:SHOWMAINMENU##
^^`,

            // This is a checkpoint view only—no new blanks introduced here.
            // So we keep keys empty to avoid confusing grading in this “review” step.
            answerKey: {},
            blankExplanations: {},
            blankDifficulties: {},

            descAfterCode: `**Common placement mistakes (quick check):**
@ If you put arrays or counters **inside setup()**, other functions may not be able to use them.
@ If you put a function **inside loop()**, Arduino will error (functions must be outside).
@ If your menu function prints but nothing shows, make sure the function is actually **called** and that you eventually do a \`display.display()\` after drawing.

**What comes next:**
Next lesson, you’ll connect buttons to:
@ change __BLANK[41]__ to scroll the main menu
@ call the correct screen function based on the selection`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Use this as your checkpoint sketch. If something is missing, it’s usually because it was placed in the wrong section.",
          },
          {
            topicTitle: "Try Simulating Main menu",
            descBeforeCode: `Now that you have the full sketch structure, keep confirming it in the Curio simulator to see the displays working properly (without button navigation yet).`,
          },
        ],
      },
    ],
  },

  7: {
    phrase: "Using buttons for Menu",
    advanced: false,
    steps: [
      {
        id: 1,
        optional: true,
        title: "Step 1: How Buttons Work & INPUT_PULLUP",
        desc: `Buttons are simple switches. When you press a button, it closes the circuit so current can flow. When you release it, the circuit opens again, and current stops.
On the Arduino, we use buttons as **digital inputs** that read either \`HIGH\` or \`LOW\`. However, if a pin is not connected to anything, it can "float" and randomly jump between \`HIGH\` and \`LOW\`. This is why we use **pull-up** (or pull-down) resistors.`,
        codes: [
          {
            topicTitle: "How Input Pullup works",
            descBetweenBeforeAndCode: `**With** \`INPUT_PULLUP\`**:**
@ The Arduino turns on an internal resistor that pulls the pin up to \`HIGH\` when the button is not pressed.
@ The button is wired so that one side connects to the digital pin and the other side connects to GND. When the button is not pressed, the circuit is open, so the pin is not connected to ground. Because of the internal pull-up resistor, the pin stays at HIGH.
@ When the button is pressed, the switch closes and directly connects the pin to GND. This pulls the pin \`LOW\`, overpowering the weak internal pull-up resistor.

So the logic becomes:
@ **Not pressed → \`digitalRead(pin)\` is** __BLANK[INPUTHIGHLOW1]__
@ **Pressed → \`digitalRead(pin)\` is** __BLANK[INPUTHIGHLOW]__
We'll use this pattern for all the buttons in the FocusBoard project.`,

            customComponent: InputPullupCircuitInteractive,

            hint: "Remember: with INPUT_PULLUP, a pressed button reads LOW, and a released button reads HIGH.",
            answerKey: {
              INPUTHIGHLOW1: ["HIGH"],
              INPUTHIGHLOW: ["LOW"],
            },
            blankExplanations: {
              INPUTHIGHLOW1:
                "Fill in whether the pin reads HIGH or LOW when the button is not pressed using INPUT_PULLUP logic.",
              INPUTHIGHLOW:
                "Fill in whether the pin reads HIGH or LOW when the button is pressed using INPUT_PULLUP logic.",
            },
            blankDifficulties: {
              INPUTHIGHLOW1: "easy",
              INPUTHIGHLOW: "easy",
            },
          },
        ],
      },

      {
        id: 2,
        optional: true,
        title: "Step 2: Basic Button Code",
        desc: "Here is a minimal example that reads a single button wired from pin 2 to GND, using `INPUT_PULLUP`.",
        hint: "Notice that we print 'pressed' when the state is LOW, not HIGH.",
        codes: [
          {
            code: `^^#define BUTTON 2^^                          // button is connected to digital pin 2

^^void setup() {^^
^^  pinMode(BUTTON, INPUT_PULLUP);^^           // button is defined as an INPUT with internal pull-up
^^  Serial.begin(9600);^^
^^}^^

^^void loop() {^^
^^  int state = digitalRead(BUTTON);^^         // read HIGH (1) or LOW (0)

^^  if (state == LOW) {^^
^^    Serial.println("Button pressed!");^^
^^  } else {^^
^^    Serial.println("Not pressed");^^
^^  }^^

^^  delay(100);^^                              // slow down the prints a bit
^^}^^`,
            descAfterCode: `Here's what is happening:

- \`pinMode(BUTTON, INPUT_PULLUP);\` enables the internal pull-up resistor and expects the button to be wired to GND.
- \`digitalRead(BUTTON)\` returns:
  - \`LOW\` when the button is **pressed** (connected to GND),
  - \`HIGH\` when the button is **not pressed**.
- The \`if\` statement checks for \`LOW\` to detect the press and prints out the correct message.`,
          },
        ],
      },

      {
        id: 3,
        optional: true,
        title: "Step 3: Button Practice Exercises",
        desc: "Now try a few different ways of using buttons so you’re ready for the menu page logic in the FocusBoard project.",
        hint: "All of these still use INPUT_PULLUP and treat LOW as 'pressed'.",
        codes: [
          {
            title: "Practice 1: Count Button Presses",
            descBeforeCode:
              "Each time you press the button, increase a counter by 1 and print it to the Serial Monitor.",
            code: `^^#define BUTTON 2^^
^^int counter = 0;^^

^^void setup() {^^
^^  pinMode(BUTTON, __BLANK[BUTTON1]__);^^     // set button as INPUT_PULLUP
^^  Serial.begin(9600);^^
^^}^^

^^void loop() {^^
^^  if (digitalRead(BUTTON) == __BLANK[BUTTON2]__) {^^
^^    counter = counter + __BLANK[BUTTON3]__;^^
^^    Serial.println(counter);^^
^^    delay(250);^^                            // small pause so one press doesn’t count many times
^^  }^^
^^}^^`,
            answerKey: {
              BUTTON1: ["INPUT_PULLUP"],
              BUTTON2: ["LOW"],
              BUTTON3: ["1"],
            },
            blankExplanations: {
              BUTTON1:
                "Choose the pin mode that enables the internal pull-up resistor for a button wired to GND.",
              BUTTON2:
                "With INPUT_PULLUP, choose the value that indicates the button is pressed.",
              BUTTON3:
                "Choose how much the counter should increase by for each press.",
            },
            blankDifficulties: {
              BUTTON1: "easy",
              BUTTON2: "easy",
              BUTTON3: "easy",
            },
            descAfterCode:
              "Try pressing the button multiple times and watch the numbers go up. This is similar to how we move through menu items with each press.",
          },

          {
            title: "Practice 2: Toggle an LED On/Off",
            descBeforeCode:
              "Use the button to turn an LED on and off, switching state each time you press.",
            code: `^^__BLANK[BUTTON4]__ BUTTON 2^^
^^#define LED 13^^

^^bool ledState = false;^^

^^void setup() {^^
^^  pinMode(__BLANK[BUTTON5]__, __BLANK[BUTTON6]__);^^   // pin mode for button
^^  pinMode(LED, OUTPUT);^^                              // pin mode for LED which is an output
^^}^^

^^void loop() {^^
^^  if (__BLANK[BUTTON7]__ == __BLANK[BUTTON8]__) {^^    // if button is pressed
^^    ledState = !ledState;^^                            // flip true ↔ false
^^    digitalWrite(LED, ledState);^^                     // write true/false to LED
^^    delay(250);^^                                      // simple debounce
^^  }^^
^^}^^`,
            answerKey: {
              BUTTON4: ["#define"],
              BUTTON5: ["BUTTON"],
              BUTTON6: ["INPUT_PULLUP"],
              BUTTON7: ["digitalRead(BUTTON)"],
              BUTTON8: ["LOW"],
            },
            blankExplanations: {
              BUTTON4:
                "Write the preprocessor keyword used to define constants like pin labels.",
              BUTTON5: "Use the constant name you defined for the button pin.",
              BUTTON6:
                "Choose the button pin mode that uses the internal pull-up resistor.",
              BUTTON7:
                "Read the button pin so you can compare it to pressed/not-pressed.",
              BUTTON8:
                "With INPUT_PULLUP, choose the value that indicates a press.",
            },
            blankDifficulties: {
              BUTTON4: "easy",
              BUTTON5: "easy",
              BUTTON6: "easy",
              BUTTON7: "easy",
              BUTTON8: "easy",
            },
            descAfterCode:
              "First press turns the LED **on**, second press turns it **off**, and so on. This idea of flipping a state is exactly how we’ll switch screens or modes later.",
          },

          {
            title: "Practice 3: Cycle Through Options in an Array",
            descBeforeCode:
              "This practice is similar to your menu page. Each press moves to the next item in the list and wraps around when it reaches the end.",
            code: `^^#define BUTTON 2^^

^^String options[] = {"Red", "Blue", "Green", "Yellow"};^^
^^int totalOptions = 4;^^
^^int index = 0;^^

^^void setup() {^^
^^  pinMode(__BLANK[BUTTON9]__, __BLANK[BUTTON10]__);^^   // pin mode for button
^^  Serial.begin(9600);^^
^^  Serial.println(options[index]);^^
^^}^^

^^void loop() {^^
^^  if (__BLANK[BUTTON12]__ == __BLANK[BUTTON13]__) {^^
^^    index = index + 1;^^

^^    if (index >= totalOptions) {^^
^^      index = 0;^^
^^    }^^

^^    Serial.println(options[index]);^^
^^    delay(250);^^
^^  }^^
^^}^^`,
            answerKey: {
              BUTTON9: ["BUTTON"],
              BUTTON10: ["INPUT_PULLUP"],
              BUTTON12: ["digitalRead(BUTTON)"],
              BUTTON13: ["LOW"],
            },
            blankExplanations: {
              BUTTON9: "Use the constant name you defined for the button pin.",
              BUTTON10:
                "Choose the button pin mode that uses the internal pull-up resistor.",
              BUTTON12: "Read the button pin so you can check if it’s pressed.",
              BUTTON13:
                "With INPUT_PULLUP, choose the value that means pressed.",
            },
            blankDifficulties: {
              BUTTON9: "easy",
              BUTTON10: "easy",
              BUTTON11: "easy",
              BUTTON12: "easy",
              BUTTON13: "easy",
            },
            descAfterCode:
              "This is very close to how the focusBoard scrolls through different options. The variable `index` is like a menu cursor that moves and wraps around.",
          },

          {
            title: "Practice 4: Only React to a Long Press",
            descBeforeCode:
              "Make your code respond only if the button is held down for about 2 seconds, not just tapped.",
            code: `^^__BLANK[BUTTON14]__  __BLANK[BUTTON15]__  __BLANK[BUTTON16]__^^   // define button pin number

^^void setup() {^^
^^  pinMode(BUTTON, INPUT_PULLUP);^^
^^  Serial.begin(9600);^^
^^}^^

^^void loop() {^^
^^  if (digitalRead(BUTTON) == __BLANK[BUTTON17]__) {^^
^^    delay(2000);^^

^^    if (digitalRead(BUTTON) == __BLANK[BUTTON18]__) {^^
^^      Serial.println("You held the button!");^^
^^      delay(500);^^
^^    }^^
^^  }^^
^^}^^`,
            answerKey: {
              BUTTON14: ["#define"],
              BUTTON15: ["BUTTON"],
              BUTTON16: { type: "range", min: 0, max: 13 },
              BUTTON17: ["LOW"],
              BUTTON18: ["LOW"],
            },
            blankExplanations: {
              BUTTON14:
                "Write the preprocessor keyword used to define constants.",
              BUTTON15: "Use the same constant name for the button pin.",
              BUTTON16:
                "Choose a valid digital pin number for the button connection.",
              BUTTON17:
                "With INPUT_PULLUP, choose the value that indicates the button is currently pressed.",
              BUTTON18:
                "If still pressed after waiting, this should match the pressed value again.",
            },
            blankDifficulties: {
              BUTTON14: "easy",
              BUTTON15: "easy",
              BUTTON16: "easy",
              BUTTON17: "easy",
              BUTTON18: "easy",
            },
            descAfterCode:
              "This pattern is useful for features like a 'long-press to reset' or special settings mode, where you don’t want a quick tap to trigger the action.",
          },
        ],
      },

      {
        id: 4,
        title: "Step 4: Create a Helper Function for Button",
        desc: "Real buttons can be noisy. When you press them, they may rapidly flicker between HIGH and LOW for a few milliseconds. This is called 'bouncing'. A **debounce helper function** makes sure we only react to a clean, stable press.",
        hint: "The helper checks the pin, waits a bit, and checks again to confirm the press. Make sure variable names match in this example.",
        codes: [
          {
            title: "Practice Code: Debouncing Function",
            code: `^^#define button 4

//<< Example of how this function can be used in the void loop() 
void loop() {
  if (__BLANK[53]__(__BLANK[BUTTONPINEX]__) == __BLANK[TRUEFALSE1]__) { //if the button helper function is (true/false)
    Serial.println("Clean press detected!");
    delay(200);
  }
}

//<< Button Helper Function
bool __BLANK[53]__(int myPin) { //boolean function because it returns true or false. Not a void type. 
  if (__BLANK[54]__(myPin) == __BLANK[55]__) { //if high or low
    __BLANK[56]__; //create a short delay
    if (__BLANK[57]__) {//if hight or low
      return __BLANK[58]__; //if the button is still pressed after a delay, return (true/false)
    }
    return __BLANK[59]__; //if not, return (true/false)
  }
}^^

`,
            answerKey: buildAnswerKey({
              53: K.id().bind("isPressed"),
              54: K.str({ oneOf: ["digitalRead"] }),
              55: K.str({ oneOf: ["LOW"] }),
              56: ({
              "type": "pattern",
              "parts": [
                "delay",
                "(",
                {
                  "p": "number"
                },
                ")"
              ],
            } as const),
              57: ({
              "type": "pattern",
              "parts": [
                "if",
                "(",
                "digitalRead",
                "(",
                "myPin",
                ")",
                "==",
                "LOW",
                ")"
              ],
            } as const),
              58: K.str({ oneOf: ["true"] }),
              59: K.str({ oneOf: ["false"] }),
            }),

            blankExplanations: {
              53: "Use the name of your button helper function that checks if a button press is real (debounced) and returns true/false.",
              BUTTONPINEX: "Use the pin variable/constant for the button you want to test (the one you wired to the Arduino).",
              TRUEFALSE1: "Choose the boolean value that should trigger the message when a clean press is detected.",

              54: "Use the Arduino function that reads the current HIGH/LOW state of a digital pin.",
              55: "Use the pin state that represents a pressed button when using INPUT_PULLUP wiring.",
              56: "Add a short wait to debounce the button (a quick pause to filter out bounce).",
              57: "Check the pin state again after the debounce delay to confirm the press is still happening.",
              58: "Return the boolean value that means 'yes, this was a real button press'.",
              59: "Return the boolean value that means 'no, it was not a stable press'.",
            },
            blankDifficulties: {
              53: "intermediate",   // naming and using a custom helper function consistently
              BUTTONPINEX: "easy",  // selecting the correct button pin variable
              TRUEFALSE1: "easy",   // choosing the correct boolean value

              54: "easy",           // using a standard Arduino digital input function
              55: "intermediate",   // understanding INPUT_PULLUP logic (pressed = LOW)
              56: "easy",           // adding a simple debounce delay
              57: "hard",           // writing a full conditional check with function + comparison
              58: "easy",           // returning the correct boolean for a valid press
              59: "easy",           // returning the opposite boolean when press is invalid
            },

            descAfterCode: `The helper reads the pin, waits briefly, and checks again. If the pin is still in the pressed state, it returns true. This reduces false triggers from button bounce.
**Place this boolean function** __BLANK[53]__ **into your current code draft with the rest of your functions.**`,
          },
        ],
      },
      {
        id: 5,
        title: "Step 5: Toggling around the MAIN menu (Prev / Next / Select)",
        hint: "Wrap-around rule: if index < 0 → go to last item. If index > last item → go back to 0.",

        codes: [
          {
            topicTitle: `Navigation Logic Overview`,
            descBeforeCode: `Now we will add the **navigation logic** for your **Main Menu**.

You already have a function called __BLANK[SHOWMAIN_FN]__() that *draws* the menu screen using:
- an index variable __BLANK[INDEX_USE]__ to decide which item is highlighted (the arrow)
- a total variable __BLANK[TOTALMAIN_USE]__ for how many menu items exist

So now our job is to:
1) Change __BLANK[INDEX_USE]__ when PREV / NEXT is pressed  
2) Wrap-around (so it loops from top to bottom and bottom to top)  
3) Use SELECT to enter the page that is currently highlighted

**Example (wrap-around idea):**
- If __BLANK[INDEX_USE]__ is 0 and you press PREV, it should jump to the last menu item.
- If __BLANK[INDEX_USE]__ is the last item and you press NEXT, it should jump back to 0.

Every time the index changes, we call __BLANK[SHOWMAIN_FN]__() again so the OLED redraws with the arrow on the new item.`,
          },
          {
            imageGridBeforeCode: {
              columns: 1,
              rows: 1,
              width: 800,
              height: 400,
              items: [
                {
                  imageSrc: "/electric-status-board/buttonNEXPREVLogic.png",
                  label: "Main menu loop concept",
                },
              ],
            },

            topicTitle: `Using PREV button to toggle upward (Main Menu)`,
            descBeforeCode: `When the PREV button is pressed, we move **up** in the Main Menu.

**Here’s what this code should do:**
- Use your debouncing helper function __BLANK[53]__ to check PREV.
- Decrease __BLANK[41]__ by 1.
- If the index goes below 0, wrap it to the last menu item:
  last index = __BLANK[38]__ - 1
- Call __BLANK[SHOWMAINMENU]__() to redraw the menu with the new highlight.
- Add a short delay so it doesn’t scroll too fast.`,
            code: `^^
if (isPressed(PREV)) {                 // Check if the PREV button was pressed
  __BLANK[60]__;                       // Move the menu selection one position downward (decrease the main index counter by 1)
  if (__BLANK[61]__) {                 // Check if the selection has gone past the first item (if the index counter is less than 0)
    __BLANK[62]__;                     // Wrap the selection to the last menu item (move the counter to be the last)
  }
  __BLANK[63]__;                       // Add a short delay to prevent multiple rapid presses
}
^^`,
            // Block 1 (PREV) — add to this code block object
            blankDifficulties: {
              60: "easy",          // simple index change (move selection backward)
              61: "intermediate",  // reasoning about boundary conditions and out-of-range checks
              62: "intermediate",  // wrapping logic using total menu size
              63: "easy",          // adding a debounce delay after a button press
            },

            blankExplanations: {
              60: "Update the variable that tracks which main menu option is selected so it moves one step BACKWARD (toward the previous item). This line should change the index by exactly one position, not jump multiple steps.",

              61: "Write a condition that detects when the menu index has moved past the beginning of the list. This should catch the 'out of range' case that happens right after moving backward, so you can wrap around instead of letting the index stay invalid.",

              62: "Fix the out-of-range situation by setting the menu index to a valid value that points to the LAST menu item. This creates wrap-around behavior: when the user goes backward from the first item, they end up on the last item. How can you call the last item number using the variable that defines the number of total items?",

              63: "Add a short pause after handling the button press so one press does not register multiple times due to button bounce or a long press. Keep it short so the menu still feels responsive.",
            },

            answerKey: buildAnswerKey({
              60: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "mainIndex"
                },
                {
                  "p": "oneOf",
                  "values": [
                    "--",
                    "="
                  ]
                },
                {
                  "p": "sameAs",
                  "target": "mainIndex"
                },
                "-",
                "1"
              ],
            } as const),
              61: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "mainIndex"
                },
                "<",
                "0"
              ],
            } as const),
              62: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "mainIndex"
                },
                {
                  "p": "oneOf",
                  "values": [
                    "="
                  ]
                },
                {
                  "p": "sameAs",
                  "target": "totalMain"
                },
                "-",
                "1"
              ],
            } as const),
            }),
          },

          {
            topicTitle: `Using NEXT button to toggle downward (Main Menu)`,
            descBeforeCode: `When the NEXT button is pressed, we move **down** in the Main Menu.

**Here’s what this code should do:**
- Use your debouncing helper function __BLANK[53]__ to check NEXT.
- Increase __BLANK[41]__ by 1.
- If the index goes past the last item, wrap it back to 0.
- Call __BLANK[SHOWMAINMENU]__() to redraw the menu.
- Add a short delay so it doesn’t scroll too fast.`,
            code: `^^
if (__BLANK[64]__) {                   // Check if the NEXT button was pressed
  __BLANK[65]__;                       // Move the menu selection one position forward
  if (__BLANK[66]__) {                 // Check if the selection has gone past the last menu item
    __BLANK[67]__;                     // Wrap the selection back to the first menu item
  }
  __BLANK[68]__;                       // Add a short delay to prevent multiple rapid presses
}
^^`, // Block 2 (NEXT) — add to this code block object
            blankExplanations: {
              64: "Write the condition that checks whether the NEXT button has been pressed using your button helper logic. This condition should only be true when a clean, intentional press is detected.",

              65: "Update the variable that tracks the currently selected menu option so it moves one step FORWARD in the menu list. This should change the index by exactly one.",

              66: "Write a condition that detects when the menu index has gone beyond the last valid menu item. This handles the case where the user presses NEXT while already on the final option.",

              67: "Correct the out-of-range index by resetting it to a valid value that points to the FIRST menu item. This creates wrap-around behavior from bottom to top.",

              68: "Add a short pause after processing the button press to prevent the action from triggering multiple times from a single press.",
            },

            blankDifficulties: {
              64: "easy",          // reusing the button helper condition
              65: "easy",          // simple forward index update
              66: "intermediate",  // boundary reasoning at the top end of the menu
              67: "intermediate",  // wrap-around logic using menu size
              68: "easy",          // debounce delay
            },
            answerKey: buildAnswerKey({
              64: generateKeyFromReference("isPressed(NEXT)", { bind: {"arr":"arrVar","scores":"arrVar","happy":"arrVar","i":"idxVar","idx":"idxVar","counter":"idxVar"} }),
              65: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "mainIndex"
                },
                {
                  "p": "oneOf",
                  "values": [
                    "++",
                    "="
                  ]
                },
                {
                  "p": "sameAs",
                  "target": "mainIndex"
                },
                "+",
                "1"
              ],
            } as const),
              66: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "mainIndex"
                },
                {
                  "p": "oneOf",
                  "values": [
                    ">"
                  ]
                },
                {
                  "p": "sameAs",
                  "target": "totalMain"
                },
                "-",
                "1"
              ],
            } as const),
              67: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "mainIndex"
                },
                "=",
                "0"
              ],
            } as const),
              68: ({
              "type": "pattern",
              "parts": [
                "delay",
                "(",
                {
                  "p": "number"
                },
                ")"
              ],
            } as const),
            }),
          },

          {
            topicTitle: `Using SELECT button to enter the highlighted page`,
            descBeforeCode: `When the SELECT button is pressed, we want to **enter** the page that is currently highlighted in the Main Menu.

**What this code should do:**
- Use your debouncing helper function __BLANK[53]__ to check SELECT.
- Look at __BLANK[41]__ to see which menu item is chosen.
- Change a screen variable (example: \`screenMode\`) so the program knows which screen to show next.
- Add a small delay so one press doesn’t count multiple times.`,
            code: `^^
if (__BLANK[69]__) {                  // Check if the SELECT button was pressed
  if (__BLANK[70]__) {                // Check which menu option is currently selected
    screenMode = 1;                   // Switch to the Clock or Pomodoro screen
  }
  else {
    __BLANK[71]__;                    // Switch to the other screen
  }
  __BLANK[72]__;                      // Add a short delay to prevent multiple selections
}
^^`,
            //Block 3 (SELECT) — add to this code block object
            blankDifficulties: {
              69: "easy",          // reusing the button helper function
              70: "intermediate",  // reasoning about menu state and branching logic
              71: "easy",          // assigning a screen mode value
              72: "easy",          // debounce delay
            },

            blankExplanations: {
              69: "Write the condition that checks whether the SELECT button was pressed using your button helper function. This should only trigger once per clean press.",

              70: "Write a condition that checks which menu option is currently highlighted. This determines which screen the program should switch to.",

              71: "Assign the screen mode variable to the value that represents the Pomodoro screen.",

              72: "Add a short pause after the selection so one press does not register multiple times.",
            },
            answerKey: buildAnswerKey({
              69: ({
              "type": "pattern",
              "parts": [
                "isPressed",
                "(",
                {
                  "p": "sameAs",
                  "target": "SELECT"
                },
                ")"
              ],
            } as const),
              70: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "mainIndex"
                },
                "==",
                "0"
              ],
            } as const),
              71: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "screenMode"
                },
                "=",
                {
                  "p": "sameAs",
                  "target": "2"
                }
              ],
            } as const),
              72: ({
              "type": "pattern",
              "parts": [
                "delay",
                "(",
                {
                  "p": "number"
                },
                ")"
              ],
            } as const),
            }),
          },
        ],
      },
      {
        id: 6,
        title:
          "Step 6: Place the button toggle logic into the show main function",
        desc: `Now that you have the three button logic blocks for (PREVIOUS / NEXT / SELECT), it's time to place them into your current code draft into the __BLANK[SHOWMAIN_FN]__ function. Placing the button navigation logic into the main menu function keeps your code organized and ensures that the menu responds correctly to user input every time the main menu screen is called.`,
        codes: [
          {
            topicTitle: `Warning and Tips for Placement`,
            descBeforeCode: `Make sure to place the button logic blocks **after** the the initial drawing, so the screen is drawn first before checking for button presses. 
@ This way, the user sees the menu before interacting with it.
Make sure to place the code blocks in the **correct order**: PREV first, then NEXT, then SELECT last. 
@ This way, the user can navigate properly through the menu options.`,
          },
          {
            topicTitle: `Run Void Loop() to test`,
            descBeforeCode: `After placing the button logic into your main menu function, ensure that your \`void loop()\` is able to call the main menu function repeatedly at appropriate times.
Just insert the following line into your currently empty main loop. Everything else remains the same.`,
            code: `^^
void loop() {
  __BLANK[SHOWMAINMENU1]__(); // Call the main menu function to display and interact with the menu
}
^^`,
            answerKey: {
              SHOWMAINMENU1: { type: "sameAs", target: "SHOWMAINMENU" },
            },
            blankExplanations: {
              SHOWMAINMENU1:
                "This should be the SAME main menu function name you used earlier. This ensures your loop calls the main menu function to display and interact with the menu.",
            },
            blankDifficulties: {
              SHOWMAINMENU1: "easy",
            },
          },
          {
            topicTitle: `Simulation with buttons`,
            descBeforeCode: `After placing the button logic into your main menu function, test your code using the simulator.
@ This allows you to verify that the menu navigation works as expected without needing physical hardware.
@ Remember, all functions go to the bottom of your code draft, so ensure your main loop calls the main menu function appropriately to see the button interactions in action (see Lesson 6).`,
          },
        ],
      },
    ],
  },

  8: {
    phrase: "Clock screen: printing time",
    advanced: false,
    steps: [
      {
        id: 1,
        title: "Step 1: Print the Time as HH:MM:SS",
        codes: [
          {
            topicTitle: "Extracting and Printing Time",
            descBeforeCode:
              "**Goal:** Write a helper function that prints the current RTC time as `HH:MM:SS` onto the OLED (with leading zeros).",
            imageGridBeforeCode: {
              columns: 1,
              items: [
                {
                  imageSrc:
                    "/electric-status-board/images/clockHelperDiagram.png",
                  label: "Time formatting idea: HH:MM:SS with leading zeros",
                },
              ],
            },
            descBetweenBeforeAndCode: `This helper function does **not** clear the screen and it does **not** call \`display.display()\`. 
It only prints the time **at the current cursor position**. That makes it reusable: you can call it from the status screen and the clock screen.

You will:
1) Read current time from the RTC
2) Print hours with a leading 0 if hour is less than 10
3) Print minutes with a leading 0 if minutes is less than 10
4) Print seconds with a leading 0 if needed seconds is less than 10`,
            code: `
^^static void __BLANK[73]__() {                 // Function that prints the current time in HH:MM:SS format
// ##EDIT:HMSTIME:INDENT=1##
  DateTime now = __BLANK[5]__.now();           // Get the current date and time from the RTC object

  int hour = now.hour();                      // Extract the hour value from the current time
  __BLANK[75]__ = __BLANK[74]__;               // Store the current "minute" value in a variable
  __BLANK[77]__ = __BLANK[76]__;               // Store the current "second" value in a variable

  if (__BLANK[78]__) {                        // Check if the hour is a single digit (or less than 10)
    __BLANK[79]__;                            // Print a leading zero so the time stays aligned
  }
  display.print(__BLANK[80]__);               // Print the hour value
  display.print(":");                         // Print the colon (":") separator between time units

  if (__BLANK[81]__) {                        // Check if the minute is a single digit
    __BLANK[82]__;                            // Print a leading zero for the minute
  }
  __BLANK[83]__;                              // Print the minute value
  __BLANK[84]__;                              // Print the colon separator before seconds

  if (__BLANK[85]__) {                        // Check if the second is a single digit
    __BLANK[86]__;                            // Print a leading zero for the second
  }
  __BLANK[87]__;                              // Print the second value
}^^
// ##END:HMSTIME##
`,

            answerKey: buildAnswerKey({
              73: K.id().bind("printClockHHMMSS"),
              74: ({
              "type": "pattern",
              "parts": [
                "now",
                ".",
                "minute",
                "(",
                ")"
              ],
            } as const),
              75: ({
              "type": "pattern",
              "parts": [
                "int",
                {
                  "p": "identifier",
                  "bindAs": "minute"
                }
              ],
            } as const),
              77: ({
              "type": "pattern",
              "parts": [
                "int",
                {
                  "p": "identifier",
                  "bindAs": "second"
                }
              ],
            } as const),
              76: ({
              "type": "pattern",
              "parts": [
                "now",
                ".",
                "second",
                "(",
                ")"
              ],
            } as const),
              78: ({
              "type": "pattern",
              "parts": [
                "hour",
                "<",
                "10"
              ],
            } as const),
              81: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "minute"
                },
                "<",
                "10"
              ],
            } as const),
              85: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "second"
                },
                "<",
                "10"
              ],
            } as const),
              79: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "print",
                "(",
                "\"",
                "0",
                "\"",
                ")"
              ],
            } as const),
              80: K.str({ oneOf: ["hour"] }),
              82: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "print",
                "(",
                "\"",
                "0",
                "\"",
                ")"
              ],
            } as const),
              86: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "print",
                "(",
                "\"",
                "0",
                "\"",
                ")"
              ],
            } as const),
              83: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "print",
                "(",
                {
                  "p": "sameAs",
                  "target": "minute"
                },
                ")"
              ],
            } as const),
              87: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "print",
                "(",
                {
                  "p": "sameAs",
                  "target": "second"
                },
                ")"
              ],
            } as const),
              84: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "print",
                "(",
                {
                  "p": "sameAs",
                  "target": "\""
                },
                ":",
                "\"",
                ")"
              ],
            } as const),
            }),
            blankExplanations: {
              73: "Name the function that prints the current time to the display in a specific format. This function does not return anything and is used only for output.",
              74: "Access the method that retrieves the current minute value from the time object.",
              75: "Declare or use a variable that will store the minute portion of the current time.",
              76: "Access the method that retrieves the current second value from the time object.",
              77: "Declare or use a variable that will store the second portion of the current time.",
              78: "Write a condition that checks whether the hour value is a single digit so formatting stays consistent.",
              79: "Print a leading character to keep the hour display aligned when the value is less than two digits.",
              80: "Print the variable that holds the hour value.",
              81: "Write a condition that checks whether the minute value is a single digit.",
              82: "Print a leading character so minutes always appear as two digits.",
              83: "Print the variable that holds the minute value.",
              84: "Print the separator character that appears between minutes and seconds.",
              85: "Write a condition that checks whether the second value is a single digit.",
              86: "Print a leading character so seconds always appear as two digits.",
              87: "Print the variable that holds the second value.",
            },
              blankDifficulties: {
                73: "easy",
                74: "easy",
                75: "easy",
                76: "easy",
                77: "easy",
                78: "intermediate",
                79: "easy",
                80: "easy",
                81: "intermediate",
                82: "easy",
                83: "easy",
                84: "easy",
                85: "intermediate",
                86: "easy",
                87: "easy",
              },

            descAfterCode: `As an example, imagine the real-time clock currently reads **March 8, 2026 at 14:07:03 (2:07:03 PM)**. When the line __BLANK[5]__.now() runs, it does not return just one number. 
Instead, it returns a \`DateTime\` object that contains the entire timestamp all at once: the year, month, day, hour, minute, and second. 
This full snapshot of the current moment is stored in the variable \`now\`, allowing the program to work with a single, consistent time reading.

From that snapshot, the program then extracts individual pieces of time. Calling \`now.hour()\` returns 14, \`now.minute()\` returns 7, and \`now.second()\` returns 3.
`,
            imageGridAfterCode: null,
            descAfterImage: `When you’re done, this function should print something like \`09:07:03\` or \`14:25:56\` depending on the time.
**Important:** This function only prints to the OLED's buffer at the current cursor location. It does not clear the screen and does not call \`display.display()\`.`,
            hint: "Use display.print(...) not display.println(...) so the time stays on one line.",
          },
        ],
      },

      {
        id: 2,
        title: "Step 2: Design the Clock Screen",
        codes: [
          {
            topicTitle: "Function to set the look of the clock",
            descBeforeCode:
              "**Goal:** Clear the OLED, show the label `Clock:`, then print the current time using your time function.",
            imageGridBeforeCode: {
              columns: 1,
              items: [
                {
                  imageSrc: "/electric-status-board/images/clockScreenMock.png",
                  label: "Example layout: label + big time",
                },
              ],
            },
            descBetweenBeforeAndCode: `Now we make a full screen for the clock:
- clear the display
- set text color
- set text sizes
- call \`display.display()\` at the end`,
            code: `^^
void __BLANK[88]__() {                 // Function that draws the clock screen and handles navigation
// ##EDIT:SHOWTIME:INDENT=1##
  __BLANK[89]__;                       // Clear the OLED screen before drawing the clock
  __BLANK[90]__;                       // Set the text color used for all clock text

  __BLANK[91]__;                       // Set a small text size for the clock title
  __BLANK[92]__;                       // Position the cursor at the top-left corner
  display.println("Clock:");           // Print the clock screen title

  __BLANK[93]__;                       // Increase the text size for displaying the time
  __BLANK[94]__;                       // Move the cursor to where the time should appear
  __BLANK[95]__;                       // Call the function that prints the current time (HH:MM:SS)

  display.setTextSize(1);              // Switch back to small text for footer instructions
  display.setCursor(0, 56);            // Position the cursor near the bottom of the screen
  display.println("PREV: Menu");       // Show instruction for returning to the main menu

  __BLANK[96]__;                       // Push all drawn content to the OLED display
}
// ##END:SHOWTIME##
^^`,

            answerKey: buildAnswerKey({
              88: K.id().bind("showClockScreen"),
              89: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "clearDisplay",
                "(",
                {
                  "p": "sameAs",
                  "target": ")"
                }
              ],
            } as const),
              90: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "setTextColor",
                "(",
                {
                  "p": "string"
                },
                ")"
              ],
            } as const),
              91: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "setTextSize",
                "(",
                "1",
                ")"
              ],
            } as const),
              92: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "setCursor",
                "(",
                "0",
                ",",
                "0",
                ")"
              ],
            } as const),
              93: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "setTextSize",
                "(",
                "2",
                ")"
              ],
            } as const),
              94: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "setCursor",
                "(",
                "0",
                ",",
                "20",
                ")"
              ],
            } as const),
              95: K.same("printClockHHMMSS"),
              96: ({
              "type": "pattern",
              "parts": [
                "display",
                ".",
                "display",
                "(",
                ")"
              ],
            } as const),
            }),

            blankExplanations: {
              88: "Name the function responsible for drawing the clock screen and handling its button interactions.",
              89: "Clear the OLED display so the previous screen does not remain visible.",
              90: "Set the color that will be used for all text drawn on the clock screen.",
              91: "Set a smaller text size for the clock screen title.",
              92: "Move the cursor to the top-left position before printing the title text.",
              93: "Change the text size to a larger value so the time is easy to read.",
              94: "Position the cursor at the location where the time should be displayed.",
              95: "Call the helper function that prints the current time in HH:MM:SS format.",
              96: "Send everything that was drawn in memory to the OLED so it becomes visible on the screen.",
            },

            blankDifficulties: {
              88: "easy",
              89: "easy",
              90: "easy",
              91: "easy",
              92: "easy",
              93: "easy",
              94: "easy",
              95: "intermediate",
              96: "easy",
            },


            descAfterCode: `After you fill this in, calling \`__BLANK[88]__\` should display:
1) A label that says "Clock:" or anything you want. 
2) A large time in HH:MM:SS
3) A small hint at the bottom that instructs what button to press to go back to Main Menu. 

This is a complete screen function because it clears the display and calls \`display.display()\` at the end.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Remember: your helper function prints time at the cursor, so setCursor(...) before calling it.",
          },
        ],
      },

      {
        id: 3,
        title:
          "Step 3: Make the clock screen show when selected from the Main Menu",
        codes: [
          {
            topicTitle: "Linking Clock Screen to Main Menu",
            descBeforeCode: `**Goal:** Update your main loop or screen management logic so that when the user selects the Clock option from the Main Menu, it calls your clock screen function.
We will use an if statement format like: \`if (screen_mode) == X\`, then show the clock screen.`,
            code: `^^
void loop() {
  if (__BLANK[97]__ == __BLANK[98]__) {     // Check if the program is currently in the main menu screen state. The screen mode variable equals what value?
    __BLANK[99]__;                          // Call the function that draws and handles the main menu
  }
  else if (__BLANK[100]__) {                // Check if the program is in the clock screen state
    __BLANK[102]__();                      // Draw and update the clock screen
  }
  else if (__BLANK[101]__) {                // Check if the program is in the Pomodoro selection screen state               
  //<< Draw and handle the Pomodoro selection screen (coming soon)
  }
}^^`,
            answerKey: buildAnswerKey({
              97: K.same("screenMode"),
              98: K.num({ oneOf: [0] }),
              99: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "showMainMenu"
                },
                "(",
                ")"
              ],
              "policy": {
                "requireNoSpacesAround": [
                  "."
                ]
              },
            } as const),
              100: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "screenMode"
                },
                "==",
                "1"
              ],
              "policy": {
                "requireNoSpacesAround": [
                  "."
                ]
              },
            } as const),
              101: ({
              "type": "pattern",
              "parts": [
                {
                  "p": "sameAs",
                  "target": "screenMode"
                },
                "==",
                "2"
              ],
              "policy": {
                "requireNoSpacesAround": [
                  "."
                ]
              },
            } as const),
              102: K.same("showClockScreen"),
            }),
            blankExplanations: {
              97: "Use the variable that tracks which screen or mode the program is currently in.",
              98: "Use the value that represents the main menu screen state.",
              99: "Call the function that draws and handles the main menu when this state is active.",
              100: "Write a condition that checks whether the program is in the clock screen state.",
              101: "Write a condition that checks whether the program is in the Pomodoro selection screen state.",
            },
            blankDifficulties: {
              97: "easy",
              98: "easy",
              99: "easy",
              100: "intermediate",
              101: "intermediate",
            },
            descAfterCode: `After adding this code, when the user selects the Clock option from the Main Menu, your program should call the clock screen function you created earlier. This will display the current time in HH:MM:SS format on the OLED.
Recall that in the Main Menu Function, when the user presses SELECT on the Clock option, you have set a screen mode variable to the corresponding screen type number for the Clock screen. So, after the screen mode is changed, the main loop will check this "if statement" and call your clock screen function accordingly.`,
          },
        ],
      },
      {
        id: 4,
        title: "Step 4: Test the Clock Screen in the Simulator",
        codes: [
          {
            topicTitle: "Testing the Clock Screen",
            descBeforeCode: `After implementing the clock screen and linking it to the Main Menu, it's time to test your code using the simulator.
**What to Test:**
1) Run the simulator and navigate to the Main Menu.
2) Use the PREV and NEXT buttons to highlight the Clock option.
3) Press the SELECT button to enter the Clock screen.
4) Verify that the current time is displayed correctly in HH:MM:SS format.
5) Check that the hint at the bottom instructs how to return to the Main Menu.
`,
            imageGridBeforeCode: {
              columns: 1,
              height: 430,
              width: 500,
              items: [
                {
                  imageSrc: "/electric-status-board/maintoClock2.gif",
                  label:
                    "Simulator showing Main Menu with Clock option highlighted",
                },
              ],
            },
          },
          {
            topicTitle: `Tips`,
            descBeforeCode: `Recall how to structure your Arduino codes (see Lesson 6). Make sure your \`void loop()\` calls the main menu function and then the clock screen function as needed based on the screen mode variable. 
@ Add the new clock helper functions __BLANK[88]__() and __BLANK[73]__() at the bottom of your code draft with the rest of the helper functions. 
@ Place the constants, variables, and definitions at the top of the code draft, before setup(). 
@ The rest of the code should remain the same from Lesson 6.`,
          },
        ],
      },
    ],
  },

  9: {
    phrase: "Pomodoro screen: printing timer",
    advanced: false,
    steps: [
      {
        id: 1, 
        title: "Step 1: Pomodoro Function Mind Map",
        descBeforeCode: `This Pomodoro feature is like a game with “screens” (rooms). Each screen has its own handler function. Buttons (PREV / NEXT / SEL) let you change settings or move to the next screen. The timer itself uses a real clock module (RTC) to count down. The mind map below is based on the assumption that your screen mode for Pomodoro is 2. It does not need to be the same, and you will code accordingly.`,
        codes:[{
          imageGridBeforeCode: {
              columns: 1,
              height: 700,
              width: 700,
              items: [
                {
                  imageSrc: "/electric-status-board/pomodoroSetup.png",
                  label:
                    "Pomodoro mind map",
                },
              ],
            }},{
            topicTitle:"Important UI Helpers",
            descAfterCode:
`**1) Timer Drawing Screen**
@ This draws the screen for the pomodoro timer block set up
@ Works similar to the function that draws the clock screen

**2) Time's Up! Drawing Screen**
@ Draw the "Time's up" screen once the active or break sessions are over. 

**3) Time Safety Lock**
@ Ensures that the user does not choose extreme minutes for the timer. 
@ Set the minimum and maximum number of minutes for the timer blocks.`,
          },{
            topicTitle: "Pomodoro Screen Functions",
            descBeforeCode:
`**1) Button Helper: isPressed(int myPin)**
@ This is the “button detector.”
@ It checks if a button is really pressed (not a fake tap).
@ It waits a tiny moment (debounce), checks again, then returns true/false.
@ Every screen uses this helper to read PREV/NEXT/SEL.

**2) Setup Screen A (screen mode = 2):**
**Goal: choose how many minutes to WORK/BE ACTIVE (Time Block 1).**
@ If NEXT is pressed: increase work minutes by 5.
@ If PREV is pressed: decrease work minutes by 5.
@ Use Safety lock to keep the minutes between 5 and 120 so it can’t go too low/high.
@ Use Timer Drawing Screen that draws the setup screen (title + label + time + hint).
@ If SEL is pressed: go to the next setup screen (screen mode becomes 3).

**3) Setup Screen B (screen mode = 3):**
**Goal: choose how many minutes to BREAK/REST (Time Block 2).**
@ NEXT adds 5 minutes, PREV subtracts 5 minutes.
@ Safety lock again keeps it between 5 and 120.
@ Timer Drawing Screen draws the break setup screen.
@ SEL moves forward (screen mode becomes 4).

**4) Setup Screen C (screen mode = 4):**
**Goal: choose how many WORK sessions to do (0 to 5).**
@ NEXT increases Active Sessions by 1 (max 5).
@ PREV decreases Active Sessions by 1 (min 0).
@ Important Notes:
        - Active Session = 0 → “Timer mode” (only one work block, no breaks).
        - Active Session > 0 → “Pomodoro mode” (work and break blocks alternate).
@ Timer Drawing Screen draws the repeats setup screen.
@ SEL starts the run:
        - Calls function that sets everything up and runs.
        - Switches to countdown mode (screen mode becomes 5).`
        }
        ]
      },
      {
        id: 2,
        title: "Step 2: Pomodoro Timer UI Functions",
        codes: [
          {
            topicTitle: "Formatting Pomodoro's Show-Timer Display",
            descBeforeCode: `For our Pomodoro screens, some parts of the display—like text size, layout, and positioning—should stay the same every time, while other parts—such as the title, timer value, and instructions—need to change depending on the screen. To keep our code clean and organized, we use a function to handle this display logic.
**This function is responsible for:**
  1) Setting up a consistent screen layout for all timer selection and countdown screens (Work, Break, etc.)
  2) Showing the timer on the OLED screen in MM:SS format
  3) Displaying a short hint at the bottom that tells the user how to navigate using the buttons

**This function will take input commands to display those inputs.**
These are called **parameters** (title text, timer values, and hint text) that the function will grab and use. By changing these inputs, we can reuse the same function to display different Pomodoro timer screens without rewriting the layout code each time.`,
          },{
            topicTitle:`Code "ShowTimerScreen" Function`,
            descBeforeCode:`Click \`Edit\` in your Example Code Editor below to code the function from scratch. You have already coded similar features in the prior lessons!`,
            code: `^^ 
void showTimerScreen(const char* title, const char* label, int minutes, int seconds, const char* hint) {
// ##EDIT:SHOWTIMERSCREEN:INDENT=1##
//<< clear old pixels/text
//<< set text color (white)

//<< small text for title
//<< cursor for title
//<< print title (input parameter)

//<< cursor for label
//<< print label (input parameter)

//<< bigger text for timer
//<< cursor for timer

//<< if minutes is 0-9 or less than 10, display.print("0") to print leading 0
//<< print minutes (input parameter)
//<< display.print(":") to print ":"

//<< if seconds is 0-9 or less than 10, display.print("0") to print leading 0
//<< print seconds (input parameter)

//<< small text for hint
//<< cursor near bottom
//<< print hint (input parameter)

//<< display.display()
// ##END:SHOWTIMERSCREEN##
}^^`,
          },
          {
            topicTitle: `Code "Time's Up!" Function`,
            descBeforeCode: `You will also need to create a function that displays a message when the Pomodoro timer completes.
    
**This function should:**
    1) Display a message indicating that the timer has completed (e.g., "Time's Up!").
    2) Provide a hint on what to do next (e.g., "Press SELECT to return to Menu").
The logic for writing this function is very similar to the previous function we just did above.

**Parameters:**
@ First message (const char* instead of String)
@ Second message (const char*)
@ Hint message for navigation
`,
            code: `^^
void showTimeUpScreen(__BLANK[103]__, __BLANK[104]__, __BLANK[105]__){
// ##EDIT:TIMEUP:INDENT=1##
//<< Clear the screen so the previous content is removed
//<< Set the text color for everything drawn on this screen

//<< Use larger text for the main message
//<< Position the cursor near the top of the screen
//<< Display the first main line of text
//<< Move the cursor down for the second line
//<< Display the second main line of text

//<< Switch to smaller text for instructions or hints
//<< Position the cursor near the bottom of the screen
//<< Display a hint or instruction for the user

//<< Push everything to the OLED so it becomes visible
// ##END:TIMEUP##
}^^`,

            answerKey: buildAnswerKey({
                103: ({
                "type": "pattern",
                "parts": [
                  "const char*",
                  {
                    "p": "string"
                  }
                ],
                "policy": {
                  "requireNoSpacesAround": [
                    "."
                  ]
                },
              } as const),
                104: ({
                "type": "pattern",
                "parts": [
                  "const char*",
                  {
                    "p": "string"
                  }
                ],
                "policy": {
                  "requireNoSpacesAround": [
                    "."
                  ]
                },
              } as const),
                105: ({
                "type": "pattern",
                "parts": [
                  "const char*",
                  {
                    "p": "string"
                  }
                ],
              } as const),
              }),
            blankExplanations: {
              103: "Define the data type for the first line of text that will be displayed on the screen. This parameter represents a short message shown near the top of the display.",
              104: "Define the data type for the second line of text that will be displayed below the first line. This allows the screen to show a multi-line message.",
              105: "Define the data type for a smaller hint or instruction message that appears at the bottom of the screen to guide the user.",
            },
          },{
            topicTitle: "Simulate and Check",
            descBeforeCode: `Call the UI functions in \`void setup()\` or \`void loop()\` to ensure they are being displayed correctly.
To use those functions, you would have to fill the parameters in. 
For example:\`showTimeUpScreen ("Timer","Done!","SEL: Again PREV: Menu")\``,
             imageGridBeforeCode: {
              columns: 1,
              height: 300,
              width: 700,
              items: [
                {
                  imageSrc: "/electric-status-board/pomodoroUItest.png",
                  label:
                    "Pomodoro UI screen examples",
                },
              ],
            }
          },
        ],
      },
      {
        id:3,
        title: "Step 3: Timer Safety Lock",
        desc:`Sometimes in our Pomodoro timer, numbers can go too low or too high.
To prevent bugs and weird behavior, we use a helper function that keeps numbers within a safe range.`,
        codes:[{
          topicTitle: "Safety Lock Function",
          descBeforeCode:`**What the function should do:**
@ Takes a number input and checks if it is too small or too big
@ If the number is greater than maximum allowed, then the number is assigned the maximum value.
@ If the numbe ris lower than the minimum allowed, then the number is assigned the minimum value.

**Parameters:**
1) integer input 
2) integer minimum allowed
3) integer maximum allowed`,
          code:`^^//<<Parameters: (1) integer, (2) minimum, (3) maximum
static int __BLANK[106]__(__BLANK[107]__, __BLANK[108]__, __BLANK[109]__) {   // Function that forces a value to stay inside a minimum and maximum range
  if (__BLANK[110]__) {                                                      // Check if the value is smaller (<) than the allowed minimum
    __BLANK[111]__ = __BLANK[112]__;                                          // If it is too small, replace it with the minimum allowed value
  }
  if (__BLANK[113]__) {                                                      // Check if the value is larger (>) than the allowed maximum
    __BLANK[114]__ = __BLANK[115]__;                                          // If it is too large, replace it with the maximum allowed value
  }
  return __BLANK[116]__;                                                     // Return the final value (now guaranteed to be inside the range).
}
^^
`,
        answerKey: buildAnswerKey({
          106: K.id().bind("clampRange"),
          107: ({
          "type": "pattern",
          "parts": [
            "int",
            {
              "p": "string",
              "bindAs": "v"
            }
          ],
        } as const),
          108: ({
          "type": "pattern",
          "parts": [
            "int",
            {
              "p": "string",
              "bindAs": "vmin"
            }
          ],
        } as const),
          109: ({
          "type": "pattern",
          "parts": [
            "int",
            {
              "p": "string",
              "bindAs": "vmax"
            }
          ],
        } as const),
          110: ({
          "type": "pattern",
          "parts": [
            {
              "p": "sameAs",
              "target": "v"
            },
            "<",
            {
              "p": "sameAs",
              "target": "vmin"
            }
          ],
        } as const),
          111: K.same("v"),
          112: K.same("vmin"),
          113: ({
          "type": "pattern",
          "parts": [
            {
              "p": "sameAs",
              "target": "v"
            },
            ">",
            {
              "p": "sameAs",
              "target": "vmax"
            }
          ],
        } as const),
          114: K.same("v"),
          115: K.same("vmax"),
          116: K.same("v"),
        }),
        blankExplanations: {
          106: "Name the function that limits a number so it stays within a minimum and maximum range.",
          107: "Define the parameter that represents the value you want to constrain.",
          108: "Define the parameter that represents the smallest allowed value.",
          109: "Define the parameter that represents the largest allowed value.",
          110: "Write a condition that checks whether the value is smaller than the allowed minimum (so, 'value' < minimum). Remember to use the parameter names you defined above in the parenthesis.",
          111: "Use the parameter that stores the value being checked so it can be updated.",
          112: "Use the parameter that represents the minimum allowed limit.",
          113: "Write a condition that checks whether the value is larger than the allowed maximum.",
          114: "Use the parameter that stores the value being checked so it can be updated.",
          115: "Use the parameter that represents the maximum allowed limit.",
          116: "Return the final value (parameter variable) after it has been constrained to the valid range.",
        },
        blankDifficulties: {
          106: "easy",
          107: "easy",
          108: "easy",
          109: "easy",
          110: "intermediate",
          111: "easy",
          112: "easy",
          113: "intermediate",
          114: "easy",
          115: "easy",
          116: "easy",
        },
        },{
        title: "Trying out",
        code: `^^__BLANK[106]__ (30,5,25);^^`,
        descAfterCode: `What happens? 30 is bigger than 25, so the function will output \`25\``,
        }]
      },
      {
        id: 4,
        title: "Step 4: Set up for Pomodoro Active and Rest blocks",
        codes:[{
          topicTitle:"Setting Active/Work Promodoro Block",
          descBeforeCode:`In this lesson, you will build the screen that lets the user set the length of a Pomodoro work timer.
**This function listens for button presses and updates the timer value on the screen:**
@ Pressing \`NEXT\` increases the number of minutes.
@ Pressing \`PREV\` decreases the number of minutes.
@ The value is kept within a **safe range**, so it never becomes too small or too large.
@ The screen updates every time the value changes using the UI Helper function (**showTimerScreen**) so the user can see it immediately.
@ Pressing \`SELECT\` confirms the choice and moves to the next step of the Pomodoro setup.

Think of this function like a settings page on a device: you use buttons to adjust a number, see the change on the screen, and then press a button to move on once you’re happy with your choice.`,
          code:`^^//<< ---------------- POMODORO STATE ----------------
//<< Create a variable for minutes of the active session. Set it as 5 for now.  
//<< PREV, NEXT buttons will decrease/increase this variable value. 
int __BLANK[143]__ = __BLANK[144]__;        
^^`,
        },{
          code:`^^
void __BLANK[117]__() {                         // Function that handles selecting the first Pomodoro timer duration for active session

  const int __BLANK[118]__ = __BLANK[119]__;    // Define the minimum allowed value for the timer 
  const int __BLANK[120]__ = __BLANK[121]__;    // Define the maximum allowed value for the timer

  if (__BLANK[122]__) {                         // Check if the NEXT button was pressed (use the button helper function)
    __BLANK[123]__;                             // Increase the "active" timer variable by a fixed step (+5 minutes)
    __BLANK[143]__ = __BLANK[126]__(__BLANK[124]__); // Keep the timer value within the allowed min/max range (use the safety lock function)
    __BLANK[127]__;                             // Add a short delay to prevent multiple presses
  }

  if (__BLANK[128]__) {                         // Check if the PREV button was pressed
    __BLANK[129]__;                             // Decrease the timer value by a fixed step
    __BLANK[130]__ = __BLANK[131]__(__BLANK[132]__); // Keep the timer value within the allowed min/max range
    __BLANK[133]__;                             // Add a short delay to prevent multiple presses
  }

  showTimerScreen(__BLANK[134]__, __BLANK[135]__, __BLANK[136]__, __BLANK[137]__, __BLANK[138]__); 
                                                // Display the timer setup screen with title, label, current value, seconds = 0, and hint text

  if (__BLANK[139]__) {                         // Check if the SELECT button was pressed
    __BLANK[140]__ = __BLANK[141]__;             // Move to the next screen mode (Rest Timer Session) in the Pomodoro 
    __BLANK[142]__;                             // Add a short delay to prevent multiple selections
  }

  // optional: PREV could return to menu from setup screens
  // if (isPressed(PREV)) { 
  // screen mode = 0 for Main Menu, followed by a longer delay so a long PREV press means go back to Main Menu}
}^^`
        ,blankExplanations: {
          117: "Name the function that manages the first Pomodoro timer selection screen and its button interactions.",
          118: "Define a constant that represents the minimum allowed value for the timer setting.",
          119: "Provide the numeric value used as the lower bound for the timer.",
          120: "Define a constant that represents the maximum allowed value for the timer setting.",
          121: "Provide the numeric value used as the upper bound for the timer.",
          122: "Write the condition that detects a clean press of the NEXT button.",
          123: "Increase the current timer value by a fixed step amount.",
          124: "Use the variable that stores the current timer value as input to the range-limiting function.",
          125: "Store the corrected timer value back into the variable after range checking.",
          126: "Call the helper function that constrains a value to stay within a minimum and maximum.",
          127: "Add a short pause to debounce the button press.",
          128: "Write the condition that detects a clean press of the PREV button.",
          129: "Decrease the current timer value by a fixed step amount.",
          130: "Store the corrected timer value back into the variable after range checking.",
          131: "Call the helper function that constrains a value to stay within a minimum and maximum.",
          132: "Use the variable that stores the current timer value as input to the range-limiting function.",
          133: "Add a short pause to debounce the button press.",
          134: "Provide the title text shown at the top of the timer setup screen.",
          135: "Provide the label text that explains what value the user is adjusting.",
          136: "Pass the current timer value so it can be displayed on screen.",
          137: "Provide the seconds value to display alongside the minutes.",
          138: "Provide hint text that explains how to change the value using buttons.",
          139: "Write the condition that detects a clean press of the SELECT button.",
          140: "Use the variable that tracks which screen or mode the program is in.",
          141: "Assign the value that represents advancing to the next Pomodoro setup screen.",
          142: "Add a short pause to debounce the SELECT button press."
        },
        blankDifficulties: {
          117: "easy",
          118: "easy",
          119: "easy",
          120: "easy",
          121: "easy",
          122: "easy",
          123: "easy",
          124: "easy",
          125: "easy",
          126: "intermediate",
          127: "easy",
          128: "easy",
          129: "easy",
          130: "easy",
          131: "intermediate",
          132: "easy",
          133: "easy",
          134: "easy",
          135: "easy",
          136: "easy",
          137: "easy",
          138: "easy",
          139: "easy",
          140: "easy",
          141: "intermediate",
          142: "easy"
        },



        }]
      },
      {
        id: 5,
        title: "Step 5: Run Structure and State Machine",
        codes: [
          {
            topicTitle: "What does a Pomodoro run mean in code?",
            descBeforeCode: `
Before any countdown begins, we must define what kind of session is being run, how long it will last, and how progress will be tracked. To do this, we will create a function that initiliazes a Pomodoro session and ensures the system starts in a clean, predictable state.

We also want the function to determine whether to run a simple timer or a pomodoro session based on the user's input. To manage both modes cleanly, we will utilize a block model, where a block represents one continuous countdown period. This can either be a work block or a break block. In timer mode, there is only one block, whereas in pomodoro mode, there can be multiple alternating blocks of work and break.

We want to:
- Distinguish between Timer mode and Pomodoro Mode
- Reset state variables
- Call \`startCurrentBlock()\` function to begin the first block countdown
`,
            code: `^^
void startPomodoroRun() {
  if (__BLANK[TIMERCOND]__) { // check condition for timer mode
    __BLANK[TIMERBLOCK]__;  // set total block count for timer mode
  }
  else {  // else, pomodoro mode
    totalBlocks = __BLANK[POMBLOCK]__;  // set total block count for pomodoro mode
  }
  __BLANK[BLOCKRES]__;     // reset finished block counter to 0
  __BLANK[WORKCHECK]__;      // reset block status to work block
  __BLANK[STARTFUNC]__; // call function to start the first block
}
^^`,
            answerKey: {
              TIMERCOND: { type: "string", regex: "^repeatT1\\s*==\\s*0$" },
              POMBLOCK: { type: "string", regex: "^repeatT1\\s**\\s*2$" },
              BLOCKRES: { type: "string", regex: "^blocksDone\\s*=\\s*0$" },
              WORKCHECK: { type: "string", regex: "^isWork\\s*=\\s*true$" },
              STARTFUNC: {
                type: "string",
                regex: "^startCurrentBlock\\s*\\(\\s*\\)\\s*;?$",
              },
              TIMERBLOCK: {
                type: "string",
                regex: "^totalBlocks\\s*=\\s*1\\s*;?$",
              },
            },
            blankExplanations: {
              TIMERCOND:
                "The condition to check if the timer is in single-block mode.",
              POMBLOCK: "The total number of blocks in a pomodoro session.",
              BLOCKRES: "Reset the finished block counter to 0.",
              WORKCHECK: "Reset the current block to a work session.",
              STARTFUNC:
                "The name of the function that starts the current block.",
              TIMERBLOCK: "The total number of blocks in a single-block timer.",
            },
            blankDifficulties: {
              TIMERCOND: "easy",
              POMBLOCK: "medium",
              BLOCKRES: "easy",
              WORKCHECK: "easy",
              STARTFUNC: "easy",
              TIMERBLOCK: "easy",
            },
            descAfterCode: `
Once you fill in the blanks, you have completed the function that initializes a Pomodoro run. The next lesson will cover the function that begins the actual countdown block.
`,
          },
        ],
      },

      {
        id: 6,
        title: "Step 6: Understanding the Timer Engine",
        codes: [
          {
            topicTitle: "Choosing Block Duration and Setting endTime",
            descBeforeCode: `
Unlike simple timers that count seconds using delay(), this Pomodoro timer uses a Real-Time Clock (RTC) to measure time accurately.

In this timer, a **block** is a single period of time:
- A **work block** is a focused work session (e.g., 25 minutes)
- A **break block** is a short rest period (e.g., 5 minutes)

Instead of counting down, we:
1) Ask the RTC for the current time
2) Decide how long the current block should run
3) Calculate the exact clock time when the block should end
4) Store that future time in a variable
`,
            code: `^^
void startCurrentBlock() {
  int mins = 0;

  // Decide how long this block should run
  // Check if the timer is in single-block mode
  if (__BLANK[POMOTIMERMODE]__) {
    // Use work block duration for single-block mode
    mins = __BLANK[POMOT1]__;
  } else {
    // Determine if current block is work or break
    if (__BLANK[POMOWORKCHECK]__) 
      mins = __BLANK[POMOT1]__; // work duration
    else
      mins = __BLANK[POMOT2]__; // break duration
  }

  // Get current time from RTC
  DateTime __BLANK[POMONOW]__ = rtc.now();

  // Set the block end time by adding a TimeSpan to now
  endTime = __BLANK[POMOTIMESPAN]__ + __BLANK[POMONOW]__;
}
^^`,
            answerKey: {
              POMOTIMERMODE: { type: "string", regex: "^repeatT1\\s*==\\s*0$" },
              POMOT1: { type: "string" },
              POMOT2: { type: "string" },
              POMOWORKCHECK: {
                type: "string",
                regex: "^isWork\\s*==\\s*true$",
              },
              POMONOW: { type: "string" },
              POMOTIMESPAN: {
                type: "string",
                regex:
                  "^TimeSpan\\(\\s*0\\s*,\\s*0\\s*,\\s*mins\\s*,\\s*0\\s*\\)$",
              },
            },
            blankExplanations: {
              POMOTIMERMODE: "Check if the timer is in single-block mode.",
              POMOT1: "The duration of a work block in minutes.",
              POMOT2: "The duration of a break block in minutes.",
              POMOWORKCHECK:
                "Check whether the current block is a work session.",
              POMONOW: "The current time retrieved from the RTC.",
              POMOTIMESPAN:
                "A TimeSpan representing the length of this block. Use the minutes variable in the middle parameter (hours, minutes, seconds, ms).",
            },
            blankDifficulties: {
              POMOTIMERMODE: "easy",
              POMOT1: "easy",
              POMOT2: "easy",
              POMOWORKCHECK: "easy",
              POMONOW: "easy",
              POMOTIMESPAN: "medium",
            },
            descAfterCode: `
**Understanding the Logic:**
- A **block** is either a work session or a break. This function sets how long that block lasts and when it ends.
- The variable \`mins\` stores the duration of the current block.
- The function checks the timer mode and whether this block is work or break to decide which duration to use.
- The RTC gives the current time, which is combined with a **TimeSpan** to calculate the exact end time.
- Use the mins variable to create the TimeSpan so the block lasts the right amount of time — you don’t need to type in a fixed number

**Key Takeaways:**
- Using RTC + TimeSpan ensures accurate timing even if the microcontroller is busy with other tasks.
- The global variable \`endTime\` is updated so other functions can check remaining time.
- This function is called at the start of each block to initialize its duration and end time.
`,
          },
        ],
      },
      {
        id: 7,
        title: "Step 7: Checking if the Timer is Finished",
        codes: [
          {
            topicTitle: "How the Timer Knows When Time Is Up",
            descBeforeCode: `
Once a block starts, we want to know exactly when it ends without pausing the microcontroller.  
Instead of using delay(), we repeatedly check the current time against the block’s end time.  

This approach allows:
- Buttons to remain responsive
- Screens to update smoothly
- Accurate timing without drifting
`,
            code: `^^
DateTime now = rtc.now();
TimeSpan remaining = endTime - now;

// Calculate how many seconds remain
long secondsLeft = remaining.totalseconds();

// Check if block has finished
if (secondsLeft __BLANK[POMOTIMEUP]__) {
  // Block has finished
}
^^`,
            answerKey: {
              POMOTIMEUP: { type: "string", regex: "^<=\\s*0$" },
            },
            blankExplanations: {
              POMOTIMEUP:
                "Condition to detect whether the block is finished (i.e., time has reached or passed endTime).",
            },
            blankDifficulties: {
              POMOTIMEUP: "easy",
            },
            descAfterCode: `
**Understanding the Logic:**
- \`now\` gets the current time from the RTC.
- \`remaining\` is the difference between the block’s end time and now.
- \`secondsLeft\` converts that difference into seconds for easier comparison.
- Check if secondsLeft has reached zero or below.
- This allows the program to know when the block is done and move on to the next block without stopping the microcontroller.

**Key Takeaways:**
- Avoid using delay() so that the display and buttons remain responsive.
- \`endTime\` is the reference point for when a block ends.
- This check is typically called repeatedly inside the loop while the timer is active.
`,
          },
        ],
      },

      {
        id: 8,
        title: "Step 8: Countdown Runtime + Finish Screen",
        codes: [
          {
            topicTitle: "Pomodoro Countdown Function",
            descBeforeCode: `While the Pomodoro timer is running, the program must continuously manage several tasks at once: checking for user input, calculating how much time remains, determining when a work or break block has ended, and deciding what should happen next. To handle all of this logic in one place, we need to create a function to handle the countdown.
        
        This function acts as the “engine” of the Pomodoro timer. It will be called repeatedly while the timer screen is active, and it uses the functions we have created in the earlier lessons to:
        1) Update the display
        2) Track completed blocks
        3) Switch between work and break periods
        4) Return the user to the menu when necessary.`,
            code: `^^
  void handlePomodoroCountdown() {
  if (isPressed(PREV)) { // PREV stops and returns to menu
    screenMode = 0;
    delay(200);
    return;
  }

  DateTime now = rtc.now();
  TimeSpan remaining = endTime - now;
  long secLeft = remaining.totalseconds();

  // Checking if block is finished
  if (secLeft <= 0) {
    blocksDone = blocksDone + 1;

    // Done with all blocks?
    if (blocksDone >= totalBlocks) {
      screenMode = 6;
      delay(200);
      return;
    }

    // Flip work <-> break (only if not timer mode)
    if (repeatT1 != 0) {
      if (isWork == true) isWork = false;
      else                isWork = true;
    }

    startCurrentBlock();
    delay(200);
    return;
  }

  // Convert seconds to minutes/seconds 
  int minsLeft = secLeft / 60;
  int secsLeft = secLeft - (minsLeft * 60);

  if (repeatT1 == 0) {
    showTimerScreen("Pomodoro", "Timer running...", minsLeft, secsLeft, "PREV: Menu");
  } else {
    if (isWork == true) showTimerScreen("Pomodoro", "WORK (T1)...", minsLeft, secsLeft, "PREV: Menu");
    else                showTimerScreen("Pomodoro", "BREAK (T2)...", minsLeft, secsLeft, "PREV: Menu");
  }
}
  ^^`,
          },
          {
            topicTitle: `Pomodoro Finish Screen Function`,
            descBeforeCode: `When the Pomodoro timer completes all its work and break blocks, we want to display a finish screen to inform the user that their session is over. This function will utilize the time-up screen function we created earlier to show a message indicating that the Pomodoro session has finished. Refer back to the previous lesson for the structure of that function.`,
            code: `^^
void handlePomodoroFinished() {
  showTimeUpScreen("__BLANK[POMOFINISH1]__", "__BLANK[POMOFINISH2]__", "__BLANK[POMOFINISHHINT]__");

  if (isPressed(SEL)) {
    screenMode = 2; // back to T1 setup
    delay(200);
  }
  if (isPressed(PREV)) {
    screenMode = 0; // menu
    delay(200);
  }
}
}^^`,
            answerKey: {
              POMOFINISH1: { type: "string" },
              POMOFINISH2: { type: "string" },
              POMOFINISHHINT: { type: "string" },
            },
            blankExplanations: {},
          },
        ],
      },
    ],
  },
};

export default function CodeIntLesson({
  slug,
  lessonSlug,
}: {
  slug: string;
  lessonSlug: string;
}) {
  return (
    <CodeLessonBase
      lessonSteps={LESSON_STEPS_INTERMEDIATE}
      storagePrefix={`curio:${slug}:${lessonSlug}`}
      apiBaseUrl={
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
      }
      rightRailTitle="My Notes"
      rightRailScopeId="mynotes"
    />
  );
}

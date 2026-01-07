"use client";

import * as React from "react";
import CodeLessonBase from "@/src/lesson-core/CodeLessonBase";
import ESBProjectMindMapLesson from "./ProjectMindMapLesson";
import InputPullupCircuitInteractive from "./InputPullupCircuitInteractive";

export const LESSON_STEPS_INTERMEDIATE: Record<number, { phrase: string; advanced?: boolean; optional?: boolean; steps: any[] }> = {
  // =========================================================
  // LESSON 1
  // =========================================================
  
  1:{

    phrase: "Understand Project Logic",
    advanced: false,
    steps:[{
      title: "Understand Project Logic",
      customComponent: ESBProjectMindMapLesson, // wrapper
    }
    ]


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
              "Coding libraries are collections of prewritten code that help you perform common tasks. Using libraries saves time and prevents you from having to write everything from scratch. For our electronic status board, we need the correct libraries to communicate with the SSD1306 OLED display over I²C and to draw text and shapes on the screen.",
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `^^#include <Wire.h>
#include __BLANK[LIB_GFX]__
#include __BLANK[LIB_SSD]__
#include __BLANK[LIB_CLOCK]__^^     

void setup(){
}

void loop(){
}`,
        answerKey: {
          LIB_GFX: ["<Adafruit_GFX.h>"],
          LIB_SSD: ["<Adafruit_SSD1306.h>"],
          LIB_CLOCK: ["<RTClib.h>", "<DS3231.h>", "<RTC.h>"],
        },
        blankExplanations: {
          LIB_GFX:
            "This is the graphics helper library that gives you drawing tools (text, shapes, cursor control) for the OLED.",
          LIB_SSD:
            "This is the OLED driver library for the SSD1306 chip. It handles sending pixel data to the screen.",
          LIB_CLOCK:
            "This is a real-time clock (RTC) library. Use the one that matches your clock module (the module type matters).",
        },
        blankDifficulties: {
          LIB_GFX: "easy",
          LIB_SSD: "easy",
          LIB_CLOCK: "medium",
        },
            descAfterCode: `This step adds important libraries used for communicating with the OLED screen (and a clock module if you have one):

\`#include <Wire.h>\`  
Enables I²C communication so the Arduino can talk to devices using just two wires: **SDA** (data) and **SCL** (clock).  
The SSD1306 OLED uses I²C, so this library is required.

\`#include <Adafruit_GFX.h>\`
Loads Adafruit’s graphics library. This provides drawing tools like printing text, drawing shapes, and setting cursor positions.

\`#include <Adafruit_SSD1306.h>\`  
Loads the driver for the SSD1306 OLED controller so the display can render what you draw.

\`#include <RTClib.h>\`  
This is for a real-time clock module. The exact header depends on which clock module you are using.

**Together, these libraries allow the Arduino to communicate with the OLED and render text/graphics (and optionally read time from a clock module).**`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint:
              "Wire handles I²C. GFX draws. SSD1306 drives the OLED. Clock libs depend on the RTC module.",
          },
        ],
      },

      {
        id: 2,
        title: "Step 2: Defining Screen",
        codes: [
          {
            topicTitle: "Define the OLED dimensions",
            descBeforeCode: `Define the OLED dimensions and create the display object. This allows the libaray to know the correct dimensions of the screen and to send data to the correct pixels. Many modules are 128×64; slim ones are 128×32. So now, we have to define the width to be 128 and height to be 64 or 32. 

**Fill in the blanks.**`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `##include <Wire.h>
#include __BLANK[LIB_GFX]__
#include __BLANK[LIB_SSD]__
#include __BLANK[LIB_CLOCK]__
^^
#define __BLANK[WVAR]__  __BLANK[WIDTH]__ // Define width pixels
#define __BLANK[HVAR]__ __BLANK[HEIGHT]__ // Define height pixels
#define RESET  -1
Adafruit_SSD1306 display (__BLANK[WIDTH2]__, __BLANK[HEIGHT2]__ , &Wire, RESET);^^

void setup(){
}

void loop(){
}`,
        answerKey: {
          WVAR: { type: "identifier" },         // student chooses the name
          HVAR: { type: "identifier" },         // student chooses the name
          WIDTH: ["128"],
          HEIGHT: ["64", "32"],
          WIDTH2: { type: "sameAs", target: "WVAR" },   // must reuse chosen name
          HEIGHT2: { type: "sameAs", target: "HVAR" },  // must reuse chosen name
        },
        blankExplanations: {
          WVAR:
            "Pick a clear constant name for the display width (any valid identifier). You’ll reuse this same name later.",
          HVAR:
            "Pick a clear constant name for the display height (any valid identifier). You’ll reuse this same name later.",
          WIDTH:
            "This is the horizontal pixel width of your OLED display. Most SSD1306 modules are 128 pixels wide.",
          HEIGHT:
            "This is the vertical pixel height of your OLED. Common values are 32 or 64 pixels depending on the screen size.",
          HEIGHT2:
            "Use the variable for height you defined above so the constructor matches your screen’s height.",
          WIDTH2:
            "Use the variable for width you defined above so the constructor matches your screen’s width."
        },
        blankDifficulties: {
          WVAR: "easy",
          HVAR: "easy",
          WIDTH: "easy",
          HEIGHT: "easy",
          WIDTH2: "easy",
          HEIGHT2: "easy",
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
              "Next, we create names for the three buttons so the code knows which Arduino pins they are connected to, and so the program is easier to read and understand than if we used raw pin numbers. For this project, we need one button to move the cursor to the next option, one button to move to the previous option, and one button to select the highlighted option. If you want more practice working with buttons, review Lesson 1.",
            imageGridBeforeCode: {
              columns: 1,
              items: [
                {
                  imageSrc: "/electric-status-board/images/example-circuit.png",
                  label: "Example Circuit Image",
                },
              ],
            },
            descBetweenBeforeAndCode: null,
            code: `##include <Wire.h>
#include __BLANK[LIB_GFX]__
#include __BLANK[LIB_SSD]__
#include __BLANK[LIB_CLOCK]__

#define __BLANK[WVAR]__  __BLANK[WIDTH]__ 
#define __BLANK[HVAR]__ __BLANK[HEIGHT]__ 
#define RESET  -1
Adafruit_SSD1306 display (__BLANK[WIDTH2]__, __BLANK[HEIGHT2]__ , &Wire, RESET);
^^
#define PREV __BLANK[PREVN]__
#define __BLANK[NEXTVAR]__ __BLANK[NEXTN]__
#define __BLANK[SELVAR]__  __BLANK[SELN]__^^  

void setup(){
}

void loop(){
}`,
            answerKey: {
              PREVN: { type: "range", min: 0, max: 13 },
              NEXTVAR: { type: "identifier" },          // student chooses the name (ex: NEXT)
              NEXTN: { type: "range", min: 0, max: 13 }, // pin number
              SELVAR: { type: "identifier" },           // student chooses the name (ex: SELECT)
              SELN: { type: "range", min: 0, max: 13 },  // pin number
            },

            blankExplanations: {
              PREVN:
                "Enter the Arduino digital pin number connected to your PREV button (0–13). This must match your wiring.",
              NEXTVAR:
                "Pick a clear constant name for the NEXT button (any valid identifier). You’ll use this name later in your code.",
              NEXTN:
                "Enter the Arduino digital pin number connected to your NEXT button (0–13). This must match your wiring.",
              SELVAR:
                "Pick a clear constant name for the Select button (any valid identifier). You’ll use this name later in your code.",
              SELN:
                "Enter the Arduino digital pin number connected to your Select button (0–13). This must match your wiring.",
            },

            blankDifficulties: {
              PREVN: "easy",
              NEXTVAR: "easy",
              NEXTN: "easy",
              SELVAR: "easy",
              SELN: "easy",
            },
            descAfterCode: `Use the digital pin numbers from **your circuit design** (the pins you actually wired for PREV, NEXT, and SELECT).

Example: If your PREV button is connected to digital pin 3, then PREV would be 3. Fill the rest based on your wiring.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint:
              "Later, we'll set these pins to INPUT_PULLUP, which means the button will read LOW when pressed and HIGH when released.",
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
#include __BLANK[LIB_GFX]__
#include __BLANK[LIB_SSD]__
#include __BLANK[LIB_CLOCK]__

#define __BLANK[WVAR]__  __BLANK[WIDTH]__ 
#define __BLANK[HVAR]__ __BLANK[HEIGHT]__ 
#define RESET  -1
Adafruit_SSD1306 display (__BLANK[WIDTH2]__, __BLANK[HEIGHT2]__ , &Wire, RESET);

#define PREV __BLANK[PREVN]__
#define __BLANK[NEXTVAR]__ __BLANK[NEXTN]__
#define __BLANK[SELVAR]__  __BLANK[SELN]__
^^
void setup() {
  Wire.begin();
  __BLANK[BEGINA]__;      // Initialize OLED

  //<< set the modes for the buttons you are using 
  pinMode(PREV, INPUT_PULLUP);                 // PREV button
  __BLANK[PINMODE1]__(__BLANK[NEXT]__, __BLANK[INPUT1]__); // NEXT button
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);^^      // SELECT button
}`,
        answerKey: {
          BEGINA: ["display.begin(SSD1306_SWITCHCAPVCC, 0x3C)"],
          NEXT: ["NEXT"],
          INPUT1: ["INPUT_PULLUP"],
          PINMODE: ["pinMode"],
          PINMODE1: ["pinMode"],
          SELECT: { type: "sameAs", target: "SELVAR" },
          INPUT2: ["INPUT_PULLUP"],
        },
        blankExplanations: {
          BEGINA:
            "This line initializes the OLED display (power setting + I²C address).",
          NEXT:
            "Use the constant name for the NEXT button pin (not the raw number).",
          INPUT1:
            "Use the input mode that enables the internal pull-up resistor.",
          PINMODE:
            "Arduino function that sets a pin’s mode.",
          PINMODE1:
            "Arduino function that sets a pin’s mode.",
          SELECT:
            "Use the same identifier you defined earlier for the Select button constant.",
          INPUT2:
            "Use the same pull-up input mode for the Select button.",
        },
        blankDifficulties: {
          BEGINA: "easy",
          NEXT: "easy",
          INPUT1: "easy",
          PINMODE: "easy",
          PINMODE1: "easy",
          SELECT: "easy",
          INPUT2: "easy",
        },
            descAfterCode: `Reminder:
- With \`INPUT_PULLUP\`: released = HIGH, pressed = LOW.
- You must call the OLED update line after drawing if you want changes to show.`
      },{
topicTitle:"Useful functions for OLED module",
descBeforeCode:`\`Wire.begin();\`  
Starts the I²C communication bus so the Arduino can talk to devices like the OLED display using SDA (data) and SCL (clock). This must be called before using any I²C device.

\`display.begin(A, B);\`  
Initializes the OLED and prepares it for drawing.  
- **A**: usually **SSD1306_SWITCHCAPVCC**, which tells the display how to power its internal circuits.  
- **B**: the OLED’s I²C address, most commonly **0x3C**.

\`display.clearDisplay();\`  
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
Updates the physical OLED screen by sending the entire buffer to the display hardware.

\`pinMode(A,B);\`  
Configures the button pins as inputs with internal pull-up resistors.  
- **A**: the button pin (e.g., \`PREV\`)  
- **B**: \`INPUT_PULLUP\`, meaning:  
  - Button not pressed → reads **HIGH**  
  - Button pressed → reads **LOW**
`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint:
              "INPUT_PULLUP ties the pin internally to Vcc, so a button to GND reads LOW when pressed.",
          },
        ],
      },
    ],
  },

  // =========================================================
  // LESSON 3
  // =========================================================
  3: {
    phrase: "Screens: welcome page + status page functions",
    advanced: false,
    steps: [
      {
        id: 1,
        title: "Step 1: Draw First (Welcome) Page",
        codes: [
          {
            topicTitle: "Welcome Screen Function",
            descBeforeCode: "**Clear the screen, print a big greeting.**",
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
            descBetweenBeforeAndCode: `This is an example of a function named welcomeFunc. You can run this function by calling it in either setup() or loop(). As a reminder, functions are reusable blocks of code that perform a specific task. 
Since we want the welcome page to show up only ONCE when we turn the device on, we will place that function in the **setup()**.

**Difference between** \`println()\` **and** \`print()\`
@\`print()\` writes text (or a value) **without** moving to a new line afterward.
@If you call print() again, the next text continues on the same line.
@\`println()\` writes text (or a value) and then **moves the cursor to the start of the next line**.
@The next print() / println() will begin on a new line.

`},{
            code: `##include <Wire.h>
#include __BLANK[LIB_GFX]__
#include __BLANK[LIB_SSD]__
#include __BLANK[LIB_CLOCK]__

#define __BLANK[WVAR]__  __BLANK[WIDTH]__ 
#define __BLANK[HVAR]__ __BLANK[HEIGHT]__ 
#define RESET  -1
Adafruit_SSD1306 display (__BLANK[WIDTH2]__, __BLANK[HEIGHT2]__ , &Wire, RESET);

#define PREV __BLANK[PREVN]__
#define __BLANK[NEXTVAR]__ __BLANK[NEXTN]__
#define __BLANK[SELVAR]__  __BLANK[SELN]__

void setup() {
  Wire.begin();
  __BLANK[BEGINA]__; ^^  
//<< Produce welcome message upon starting the board   
  __BLANK[WELCOMEFUNCTION1]__(); ^^

//<<buttons being used
  pinMode(PREV, INPUT_PULLUP);                 
  __BLANK[PINMODE1]__(__BLANK[NEXT]__, __BLANK[INPUT1]__); 
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);  
}
void loop(){
}
^^
void __BLANK[WELCOMEFUNCTION]__() {
  __BLANK[DISPLAY1]__;  //clear display  
  __BLANK[DISPLAY2]__;  //text size 
  __BLANK[DISPLAY3]__;  //text color 
  __BLANK[DISPLAY6]__;  //text cursor 
  __BLANK[DISPLAY4]__;  //print line (println() or print()?)
  __BLANK[DISPLAY5]__;  //text size 
  __BLANK[DISPLAY7]__;  //print line 
  __BLANK[DISPLAY8]__;  //display 
}^^`,

          answerKey: {
            WELCOMEFUNCTION: { type: "identifier" },
            WELCOMEFUNCTION1:{ type:"sameAs",target:"WELCOMEFUNCTION"},
            DISPLAY1: ["display.clearDisplay()"],
            DISPLAY2: ["display.setTextSize(2)", "display.setTextSize(3)"],
            DISPLAY3: ["display.setTextColor(SSD1306_WHITE)"],
            DISPLAY4: {
              type: "regex",
              pattern: '^display\\.println\\(".*"\\)$',
            },
            DISPLAY5: ["display.setTextSize(1)"],
            DISPLAY6: {
              type: "regex",
              pattern: "^display\\.setCursor\\(\\d+,\\s*\\d+\\)$",
            },
            DISPLAY7: {
              type: "regex",
              pattern: '^display\\.println\\(".*"\\)$',
            },
            DISPLAY8: ["display.display()"],
          },
          blankExplanations: {
            WELCOMEFUNCTION1: `Call the welcome function you made below. For example if your function is named "sayWelcome", then you would call it in the setup() as sayWelcome();`,
            WELCOMEFUNCTION:
              "Pick a custom function name (valid identifier) for your welcome screen.",
            DISPLAY1: "Clear the OLED buffer first.",
            DISPLAY2: "Set a big text size for the main greeting.",
            DISPLAY3: "Set the text color mode so text shows clearly.",
            DISPLAY4:
              "Print a greeting message (keep it inside quotes). Make it your own.",
            DISPLAY5: "Optionally switch to a smaller size for a second line.",
            DISPLAY6:
              "Move the cursor down so the second line doesn’t overlap the first.",
            DISPLAY7:
              "Print a second line message (like a subtitle or instruction).",
            DISPLAY8:
              "Push the buffer to the OLED so the screen actually updates.",
          },
          blankDifficulties: {
            WELCOMEFUNCTION: "easy",
            DISPLAY1: "easy",
            DISPLAY2: "easy",
            DISPLAY3: "easy",
            DISPLAY4: "medium",
            DISPLAY5: "easy",
            DISPLAY6: "easy",
            DISPLAY7: "medium",
            DISPLAY8: "easy",
          },
            descAfterCode: `You call the Welcome Function you made in the void setup() so that it displays in the screen as soon as you turn the board on.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Call display() after drawing to push the buffer to the screen.",
          },
          {
            topicTitle: "Try Simulation",
            descBeforeCode:`Paste the code into simaulator and run it to check if the welcome message displays as intended. Here is an example of a welcome message. 
  You can set cursor for certain texts to position your welcome messages in a more organized manner!`,
            imageGridBeforeCode: {
              columns: 1,
              width: 400,
              height:350,
              items: [
                {
                  imageSrc: "/electric-status-board/welcomeFunc.png",
                  label: "Example: welcome function",
                },
              ],
            },
          }
        ],
      },

      {
        id: 2,
        title: "Step 2: Display Chosen Status",
        codes: [
          {
            topicTitle: "Status Screen Function",
            descBeforeCode:
              "In order to display the status that we want we need to clear the screen then print the status chosen from the menu screen",
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `void __BLANK[WELCOMEFUNCTION]__(){ //Welcome Function
  __BLANK[DISPLAY1]__; //clear display
  __BLANK[DISPLAY2]__; //text size
  __BLANK[DISPLAY3]__; //text color
  __BLANK[DISPLAY4]__; //print line
  __BLANK[DISPLAY5]__; //text size
  __BLANK[DISPLAY6]__; //cursor location
  __BLANK[DISPLAY7]__; //print line
  __BLANK[DISPLAY8]__; //display
}
 ^^  
void __BLANK[STATUSFUNCTION]__(){  //Status Function 
  __BLANK[STATUSCODE1]__;  //clear display
  __BLANK[STATUSCODE2]__;  //text size
  __BLANK[STATUSCODE3]__;  //cursor location
  __BLANK[STATUSCODE4]__;  //print a status as an example for now
  display.__BLANK[DISPLAY9]__; //display
}^^`,

        answerKey: {
          STATUSFUNCTION: { type: "identifier" },
          STATUSCODE1: ["display.clearDisplay()"],
          STATUSCODE2: ["display.setTextSize(2)", "display.setTextSize(3)"],
          STATUSCODE3: {
            type: "regex",
            pattern: "^display\\.setCursor\\(\\d+,\\s*\\d+\\)$",
          },
          STATUSCODE4: {
            type: "regex",
            pattern: '^display\\.println\\(".*"\\)$',
          },
          DISPLAY9: ["display()"],
        },
        blankExplanations: {
          STATUSFUNCTION:
            "Pick a function name (valid identifier) for the screen that shows the selected status.",
          STATUSCODE1:
            "Clear the display first so you don’t draw on top of old text.",
          STATUSCODE2:
            "Set a readable text size for the status message.",
          STATUSCODE3:
            "Move the cursor to where the status text should start.",
          STATUSCODE4:
            "Print an example status message inside quotes (you can change the text).",
          DISPLAY9:
            "Because the code already has `display.` before the blank, fill in the final update call name with parentheses.",
        },
        blankDifficulties: {
          STATUSFUNCTION: "easy",
          STATUSCODE1: "easy",
          STATUSCODE2: "easy",
          STATUSCODE3: "easy",
          STATUSCODE4: "medium",
          DISPLAY9: "easy"},

            descAfterCode: `Here are specific instructions on what each line of the code should do at its minimum:
**Line 1:** clear the display.
**Line 2:** set text size.
**Line 3:** set cursor location.
**Line 4:** print an example status like "Studying, Working, Coding, etc".`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: null,
          },
        ],
      },
    ],
  },

  // =========================================================
  // LESSON 4
  // =========================================================

  4: {
    phrase: "Variables + lists (arrays) for Main Menu options",
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
        title: "Step 2: Practice with Variables",
            optional: true,
        answerKey: {
          NAMETYPE: ["String"],
          NAME1: ["Emily"],
          YEAR: { type: "range", min: 1900, max: 2100 },
          MONTH: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ],
          READY: ["true", "false"],
          TEMP: { type: "range", min: -50, max: 150 },
          DATETYPE: ["String"],
          BUTTONTYPE: ["bool"],
          NAME2: ["daysInYear"],
          COUNTER: ["3"],
          LEVEL: ["4"],
        },
        blankExplanations: {
          NAMETYPE:
            "Pick a type that can store text in Arduino (something that works with quotes).",
          NAME1:
            "Enter a name as text inside quotes (make it personal if you want).",
          YEAR: "Enter a year as a number (no quotes).",
          MONTH: "Enter a month as text inside quotes.",
          READY: "This must be true or false (no quotes).",
          TEMP: "Enter a temperature number (decimals are allowed).",
          DATETYPE:
            "Use a type that can store text like a date formatted as \"12/25/2025\".",
          BUTTONTYPE:
            "Use the type meant for true/false values (button pressed or not).",
          NAME2:
            "Pick a valid variable name for the value 365 (no spaces, no symbols).",
          COUNTER:
            "Start at 0 and count how many times you add 1.",
          LEVEL:
            "Start at 1, then apply +1 and +2 in order.",
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
          COUNTER: "easy",
          LEVEL: "easy",
        },
        codes: [
          {
            topicTitle: "Practice Pack: Basic Variables + Counter + Level",
            descBeforeCode: `**Naming Variables**:
Here you will fill in the blanks to define variables in a correct syntax. Try to use the real information so it feels personal!`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: `**Understanding changes in Variables:**`,
            code: `^^__BLANK[NAMETYPE]__ name = "__BLANK[NAME1]__";
int year = __BLANK[YEAR]__;
String month = "__BLANK[MONTH]__";
bool ready = __BLANK[READY]__;  
float temperature = __BLANK[TEMP]__;
__BLANK[DATETYPE]__ date = "12/25/2025";
__BLANK[BUTTONTYPE]__ buttonState = false;
int __BLANK[NAME2]__ = 365^^;

^^// Practice: Counter^^
int counter = 0;

counter = counter + 1;
counter = counter + 1;
counter = counter + 1;

^^// Practice: Level^^
int level = 1;

level = level + 1;
level = level + 2;`,
            descAfterCode: `String uses double quotation \`" "\`.
Char uses single quotation \`' '\`.
Integer does not need anything surrounding the numbers. 
Boolean only allows true or false. 

What does the counter now read?    __BLANK[COUNTER]__

What does the level now read?    __BLANK[LEVEL]__`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: null,
          },
        ],
      },

      {
        id: 3,
        title: "Step 3: What Is a List (Array)?",
            optional: true,
        answerKey: {
          ARRAYTYPE: ["String"],
          ARRAYNAME: { type: "regex", pattern: "^[A-Za-z_]\\w*\\[\\]$" },
          ARRAY: {
            type: "regex",
            pattern: '^\\{\\s*".+"\\s*,\\s*".+"\\s*,\\s*".+"\\s*,\\s*".+"\\s*\\}$',
          },
          VARRAYTYPE: ["String"],
          VARRAYNAME: { type: "identifier" },
          CALL: { type: "regex", pattern: "^[A-Za-z_]\\w*\\[\\d+\\]$" },
        },
        blankExplanations: {
          ARRAYTYPE:
            "Use a type that can store words (colors) as text.",
          ARRAYNAME:
            "Give your array a name and include [] to show it’s a list.",
          ARRAY:
            "Fill in a curly-brace list with 4 quoted colors separated by commas.",
          VARRAYTYPE:
            "Use a text type for the variable that stores a chosen color.",
          VARRAYNAME:
            "Pick a variable name for the chosen color (valid identifier).",
          CALL:
            "Access one item by index like colors[0], colors[1], etc.",
        },
        blankDifficulties: {
          ARRAYTYPE: "easy",
          ARRAYNAME: "easy",
          ARRAY: "medium",
          VARRAYTYPE: "easy",
          VARRAYNAME: "easy",
          CALL: "easy",
        },
        codes: [
          {
            topicTitle: "Practice: Arrays",
            descBeforeCode:
              "A list (array) stores many values under one variable name. This is perfect for storing multiple menu options.",
            imageGridBeforeCode: {
              columns: 1,
              items: [
                {
                  imageSrc: "/electric-status-board/images/array.png",
                  label: "Array visual",
                },
              ],
            },
            descBetweenBeforeAndCode: null,
            code: `// List of four numbers^^
int numbers[] = {1, 2, 3, 4};
int select = numbers [1];^^

// List of five chars. ^^
char favLetters[] = {'A', 'D', 'F', 'H', 'K', 'M'};
char best = favLetters[3];^^

// Create an array of String of four differet colors. ^^
__BLANK[ARRAYTYPE]__  __BLANK[ARRAYNAME]__ = __BLANK[ARRAY]__;^^

// Assign a variable named favoriteColor that calls your favorite color within the array. ^^
__BLANK[VARRAYTYPE]__  __BLANK[VARRAYNAME]__ = __BLANK[CALL]__;^^`,
            descAfterCode: `Arrays group related data together:
  - \`numbers[0]\` gives the **first** item → \`1\`  
  - \`numbers[1]\` gives the second item → \`2\`  
  - \`numbers[3]\` gives the last item → \`4\`

Arrays are extremely useful when you want your code to handle lots of similar values without writing dozens of separate variables.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Arrays are 0-indexed: the first item is at index 0.",
          },
        ],
      },

      {
        id: 4,
        title: "Step 4: Create Lists for Main Menu Options",
        codes: [
          {
            topicTitle: "Create your main options array",
            descBeforeCode: `Instead of making many separate variables for each options, we store them all in a single array so the menu can move through them easily.
Before we can display a menu, we need to **store the menu options** somewhere. In this project, we keep the top-level menu labels (\`Status\`, \`Clock\`, \`Timer\`) inside a **string array**. 

\`Status\` : for static display of a certain status like "Studying", "Gaming", etc. 
\`Clock\` : for displaying time 
\`Timer\` : for starting a timer
`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `^^// List of main menu options
__BLANK[MMENUTYPE]__  __BLANK[MMENUNAME]__ = { //define array name
  "Status", //menu option 0
  __BLANK[MENULIST2]__, //menu option 1
  __BLANK[MENULIST3]__, //menu option 2
};^^

void setup(){
 ...
}

void loop(){
}
`,
              answerKey: {
                // Type that stores text labels for a menu array.
                // (We allow several common valid choices to keep it flexible.)
                MMENUTYPE: {
                  type: "string",
                  // Accept: const char*  | char* | String
                  // (regex is a STRING in this system)
                  regex: "^(const\\s+char\\s*\\*|char\\s*\\*|String)\\s*$",
                },

                // Array name must be a valid identifier AND include [] at the end in the code.
                // Using "string" + regex here because identifier spec alone won't enforce [].
                MMENUNAME: {
                  type: "string",
                  regex: "^[A-Za-z_]\\w*\\[\\]$",
                },

                // Let these be flexible: any quoted label is accepted.
                // (Users might choose different names for the menu items.)
                MENULIST2: {
                  type: "string",
                  regex: '^".+"$',
                },
                MENULIST3: {
                  type: "string",
                  regex: '^".+"$',
                },
              },

              blankExplanations: {
                MMENUTYPE:
                  "Choose a valid text type for a list of menu labels. Most commonly this is `const char*` (C-style strings), but `String` can also work depending on your codebase.",
                MMENUNAME:
                  "Name your menu array and include `[]` to show it’s an array (example: `mainMenu[]`).",
                MENULIST2:
                  "Write the second menu option as text inside quotes (example: \"Clock\"). This will be the label shown in the menu.",
                MENULIST3:
                  "Write the third menu option as text inside quotes (example: \"Timer\"). This will be the label shown in the menu.",
              },

              blankDifficulties: {
                MMENUTYPE: "easy",
                MMENUNAME: "easy",
                MENULIST2: "easy",
                MENULIST3: "easy",
              },

              descAfterCode: `Now your program has a **top-level menu list** stored in an array. Each item can be accessed by its index:

              - __BLANK[MMENUNAME]__[0] → "Status"
              - __BLANK[MMENUNAME]__[1] → __BLANK[MENULIST2]__
              - __BLANK[MMENUNAME]__[2] → __BLANK[MENULIST3]__`,

            imageGridAfterCode: null,
            descAfterImage: null,
          },
          {
            topicTitle: "Using the Main Menu Array",
            descBeforeCode: `We will need to create an index variable for the main menu array that will increment/decrement depending on the button presses (NEXT and PREVIOUS).
`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `
__BLANK[MMENUTYPE]__  __BLANK[MMENUNAME]__ = { //array name
  "Status", 
  __BLANK[MENULIST2]__, 
  __BLANK[MENULIST3]__, 
};^^

int __BLANK[TOTMAIN]__ = __BLANK[TOTMAINNUM]__;    //total number of items in the main menu array
__BLANK[MINDEXTYPE]__ __BLANK[MINDEX]__ = __BLANK[MINDEXNUM]__; //counter index for the main menu array. Assign 0.
^^

void setup(){
 ...
}

void loop(){
}`,
            answerKey: {
              // variable name for total items
              TOTMAIN: { type: "identifier" },

              // total number of items (Status, Clock, Timer) = 3
              TOTMAINNUM: { type: "range", min: 3, max: 3 },

              // type for the index variable (usually int)
              MINDEXTYPE: {
                // allow a few valid numeric types; keep flexible
                type: "string",
                regex: "^(int|uint8_t|byte|size_t)\\s*$",
              },

              // index variable name (must be a valid identifier)
              MINDEX: { type: "identifier" },

              // should start at 0
              MINDEXNUM: { type: "range", min: 0, max: 0 },
            },

            blankExplanations: {
              TOTMAIN:
                "Name the variable that stores how many items exist in the main menu array.",
              TOTMAINNUM:
                "Set this to the exact number of options in your main menu array. With Status, Clock, Timer → this should be **3**.",
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

          },{
            title: `Practice: Calling array item`,
            code: `// Practice how you can use the array using the index counter variable you just made. ^^
  String practice = __BLANK[MMENUNAME]__ [__BLANK[MINDEX1]__];^^`,
            descAfterCode: `What would the String \`practice\` read?   __BLANK[OPTION]__`,

          }
        ],
      },


    ],
  },

  5: {
  phrase: "Variables + arrays: iterating Main and Status menu options",
  advanced: false,
  steps: [
    { id: 1,
      title: "Step 1: What is a Loop?",
      optional: true,
      codes: [
        {
          topicTitle: "Why loops matter",
          descBeforeCode:
            "We already have an array of status messages. Now we want to print ALL of them without writing many repeated lines of code.",
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
          descAfterCode: `Without a loop, you have to write a separate line for every status in the array. If you add or remove items, you must rewrite the code.

Loops fix this problem by repeating the same code for each index in the array. In the next steps, we will use a **while loop** to walk through the list of options automatically.`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint:
            "Imagine you had 10 or 20 statuses. You wouldn’t want to copy-paste the same line 20 times.",
        },
      ],
    },

    { id: 2,
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
          descBeforeCode:
            `**Practice 1: Print Even Numbers**
Start at 2 and keep printing even numbers by adding the same step each time.`,
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `^^int num = 2;
while (num < __BLANK[P1_LIMIT]__) {
  Serial.println(__BLANK[P1_PRINT]__);
  num = num + __BLANK[P1_STEP]__;
}^^`,
          answerKey: {
            P1_LIMIT: { type: "range", min: 3, max: 50 },
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
          descBeforeCode:
            `**Loop Practice 2: Print Multiples of Three**
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
            P2_UPDATE: ["x = x + 3", "x += 3"],
          },
          blankExplanations: {
            P2_START:
              "Choose a starting number for x. It should make sense for counting by 3.",
            P2_CONDVAR:
              "Use the same variable you’re updating inside the loop for the condition check.",
            P2_LIMIT:
              "Pick a stopping limit so the loop eventually ends.",
            P2_PRINT:
              "Print the changing variable for each loop iteration.",
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
          hint: "Make sure the update changes x by 3.",
        },

        {
          descBeforeCode:
            `**Loop Practice 3: Stop when a Number Reaches a Limit**
Create a counter variable, print it, and increase it by 1 each loop until it reaches your limit.`,
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          title: `Loop Practice 3`,
          code: `^^int __BLANK[P3_VAR]__ = 5;
while (__BLANK[P3_CONDVAR]__ < __BLANK[P3_LIMIT]__) {
  Serial.println(__BLANK[P3_PRINT]__);
  __BLANK[P3_VAR]__ = __BLANK[P3_NEXT]__;
}^^`,
          answerKey: {
            P3_VAR: { type: "identifier" },
            P3_CONDVAR: { type: "sameAs", target: "P3_VAR" },
            P3_LIMIT: { type: "range", min: 6, max: 200 },
            P3_PRINT: { type: "sameAs", target: "P3_VAR" },
            P3_NEXT: { type: "expression" }, // should represent counter + 1
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
          hint: "Your update should increase the counter by exactly 1.",
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
            P4_PRINT: ['"Waiting..."', '"Pressed?"', '"Not ready yet"', '"..."'],
          },
          blankExplanations: {
            P4_TYPE:
              "Choose the correct type for a true/false variable.",
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
            P5_TARGET:
              "Pick a number you want to search for in the array.",
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
            P6_IDXVAR: ["k"],
            P6_STARTIDX: ["0"],
            P6_READ: { type: "expression" }, // array[index]
            P6_COMPARE: { type: "sameAs", target: "P6_DESNAME" },
            P6_PRINT: { type: "sameAs", target: "P6_DESNAME" },
            P6_INCLEFT: { type: "sameAs", target: "P6_IDXVAR" },
            P6_INCRIGHT: { type: "sameAs", target: "P6_IDXVAR" },
          },
          blankExplanations: {
            P6_ARRNAME:
              "Pick a valid array name for the list of numbers.",
            P6_TOTAL:
              "This is the number of items in your array. Count how many values you put in it.",
            P6_DESNAME:
              "Pick a variable name for the number you want to find.",
            P6_DESVAL:
              "Pick a number that exists in your array so the condition can become true.",
            P6_IDXVAR:
              "This is your index variable that moves through the array.",
            P6_STARTIDX:
              "Start at the first index of the array.",
            P6_READ:
              "Access the current array element using the index variable (array[index]).",
            P6_COMPARE:
              "Compare the current array value to your target variable.",
            P6_PRINT:
              "Print the target variable once it is found.",
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

    { id: 3,
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
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,

           code: `
__BLANK[MMENUTYPE]__  __BLANK[MMENUNAME]__ = { //array name
  "Status", 
  __BLANK[MENULIST2]__, 
  __BLANK[MENULIST3]__, 
};

int __BLANK[TOTMAIN]__ = __BLANK[TOTMAINNUM]__;    //total number of items in the main menu array
__BLANK[MINDEXTYPE]__ __BLANK[MINDEX]__ = __BLANK[MINDEXNUM]__; //counter index for the main menu array. Assign 0.
           
^^
void __BLANK[SHOWMAIN_FN]__() {                // name the function that draws the main menu
  __BLANK[DISPLAYM1]__.__BLANK[CLEAR]__;                 // clear the OLED screen
  __BLANK[DISPLAYM2]__.__BLANK[SET_SIZE]__;             // set small text size
  __BLANK[DISPLAYM3]__.__BLANK[SET_COLOR]__;// set text color
  __BLANK[DISPLAYM4]__.__BLANK[SET_CURSOR]__;        // move cursor to top-left corner
  __BLANK[DISPLAYM5]__.println("Main Menu:");              // print menu title
  display.println("----------");              // print divider line

  int i = __BLANK[START_I]__;                 // start index at first menu item (0)
  while (i < __BLANK[TOTALMAIN_USE]__) {      // loop through all main menu items
    if (i == __BLANK[INDEX_USE]__){             // check if this item is selected (i == your main menu index counter variable)
      display.print(__BLANK[ARROW]__);         // print arrow or other indicator for selected item
    }
    else { display.print(__BLANK[SPACES]__);        // print spaces for non-selected items
    }
    display.println(__BLANK[MENU_ACCESS]__);  // print menu text at index i
    __BLANK[INC_I]__;                          // move to the next menu item
  }

  display.__BLANK[FLUSH]__();                 // update OLED to show everything
}
^^`,
          answerKey: {
            // function name
            SHOWMAIN_FN: { type: "identifier" },

            // These should all be the SAME object (display)
            DISPLAYM1: "display",
            DISPLAYM2: "display",
            DISPLAYM3: "display",
            DISPLAYM4: "display",
            DISPLAYM5: "display",

            // display method names (must be correct calls)
            CLEAR: { type: "string", regex: "^clearDisplay\\(\\)$" },
            SET_SIZE: { type: "string", regex: "^setTextSize\\(.+\\)$" },      // allow any argument
            SET_COLOR: { type: "string", regex: "^setTextColor\\(.+\\)$" },    // allow any argument
            SET_CURSOR: { type: "string", regex: "^setCursor$" },              // args are already in code
            FLUSH: { type: "string", regex: "^display\\(\\)$" },

            // loop start index (start at 0)
            START_I: { type: "range", min: 0, max: 0 },

            // total items variable (should be totalMain, but let user choose identifier)
            TOTALMAIN_USE: { type: "sameAs", target: "TOTMAIN"},

            // MUST match the earlier blank MINDEX the user already filled in a previous step
            INDEX_USE: { type: "sameAs", target: "MINDEX" },

            // indicator + spacing (allow any quoted string)
            ARROW: { type: "string", regex: '^".+"$' },
            SPACES: { type: "string", regex: '^"\\s*"$' }, // allow "  " or "" etc.
            // print menu item at index i (flexible array name)
            MENU_ACCESS: { type: "string", regex: "^[A-Za-z_]\\w*\\s*\\[\\s*i\\s*\\]$" },
            // increment i
            INC_I: {
              type: "string",
              regex: "^(i\\+\\+|\\+\\+i|i\\s*\\+=\\s*1|i\\s*=\\s*i\\s*\\+\\s*1)$",
            },
          },

          blankExplanations: {
            SHOWMAIN_FN:
              "Name the function that draws the main menu screen.",
            DISPLAYM1:
              "This should be your OLED display object (usually named `display`).",
            DISPLAYM2:
              "Use the same display object name as above.",
            DISPLAYM3:
              "Use the same display object name as above.",
            DISPLAYM4:
              "Use the same display object name as above.",
            DISPLAYM5:
              "Use the same display object name as above.",
            CLEAR:
              "Call the function that clears the OLED screen.",
            SET_SIZE:
              "Call the function that sets text size: `setTextSize(...)`. You can choose any size number.",
            SET_COLOR:
              "Call the function that sets text color: `setTextColor(...)`. You can choose any valid color constant (example: `SSD1306_WHITE`).",
            SET_CURSOR:
              "Use the method name `setCursor` (use the x,y coordinates to place the header on the top of the screen.",
            FLUSH:
              "Call `display()` to push everything you printed onto the OLED screen.",
            START_I:
              "Start `i` at 0 so the loop begins at the first menu item.",
            TOTALMAIN_USE:
              "Use the variable that stores how many main menu items exist, which you created earlier.",
            INDEX_USE:
              "This MUST match the same menu index variable you created earlier. This is the variable that changes when buttons are pressed.",
            ARROW:
              "Pick an indicator to show which option is selected. Common choices: `\"> \"`, `\"* \"`, `\"->\"`, or even an emoji if your font supports it.",
            SPACES:
              "Print spacing for non-selected items so the menu stays aligned (usually two spaces like `\"  \"`).",
            MENU_ACCESS:
              "Print the menu label at index `i` using array indexing variable.",
            INC_I:
              "Increment `i` by 1 so the loop moves to the next menu item each time.",
          },

          blankDifficulties: {
            SHOWMAIN_FN: "easy",

            DISPLAYM1: "easy",
            DISPLAYM2: "easy",
            DISPLAYM3: "easy",
            DISPLAYM4: "easy",
            DISPLAYM5: "easy",

            CLEAR: "easy",
            SET_SIZE: "easy",
            SET_COLOR: "easy",
            SET_CURSOR: "easy",
            FLUSH: "easy",

            START_I: "easy",
            TOTALMAIN_USE: "easy",
            INDEX_USE: "easy",

            ARROW: "easy",
            SPACES: "easy",
            MENU_ACCESS: "medium",
            INC_I: "easy",
          },
        },
       {
          topicTitle: "Checkpoint: Test your code so far on Simulator (Welcome → Main Menu)",
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
#include __BLANK[LIB_GFX]__
#include __BLANK[LIB_SSD]__
#include __BLANK[LIB_CLOCK]__

#define __BLANK[WVAR]__  __BLANK[WIDTH]__
#define __BLANK[HVAR]__  __BLANK[HEIGHT]__
#define RESET  -1
Adafruit_SSD1306 display(__BLANK[WIDTH2]__, __BLANK[HEIGHT2]__, &Wire, RESET);

#define PREV __BLANK[PREVN]__
#define __BLANK[NEXTVAR]__ __BLANK[NEXTN]__
#define __BLANK[SELVAR]__  __BLANK[SELN]__

//<< ------------------------------
//<< MAIN MENU DATA (from Lesson 4)
//<< ------------------------------
__BLANK[MMENUTYPE]__ __BLANK[MMENUNAME]__ = {
  "Status",
  __BLANK[MENULIST2]__,
  __BLANK[MENULIST3]__,
};

int __BLANK[TOTMAIN]__ = __BLANK[TOTMAINNUM]__;
__BLANK[MINDEXTYPE]__ __BLANK[MINDEX]__ = __BLANK[MINDEXNUM]__;

//<< ------------------------------
//<< SETUP + LOOP (run so far)
//<< ------------------------------
void setup() {
  Wire.begin();
  __BLANK[BEGINA]__;

  pinMode(PREV, INPUT_PULLUP);
  pinMode(__BLANK[NEXTVAR]__, INPUT_PULLUP);
  pinMode(__BLANK[SELVAR]__, INPUT_PULLUP);

  //<< 1) Call Welcome Function once
  __BLANK[WELCOMEFUNCTION]__();

  //<< 2) A short delay before the main menu so you can see the welcome function
  delay(__BLANK[DELAY_MS]__);

  //<< 3) Then call the main menu Function 
  __BLANK[SHOWMAIN_FN1]__();
}

void loop() {
  //<< No navigation yet — we add button logic next lesson/step.
}

//<< ------------------------------
//<< FUNCTIONS (from Lesson 3 + 5)
//<< ------------------------------

//<< Welcome screen (from Lesson 3)
void __BLANK[WELCOMEFUNCTION]__() {
  __BLANK[DISPLAY1]__;
  __BLANK[DISPLAY2]__;
  __BLANK[DISPLAY3]__;
  __BLANK[DISPLAY4]__;
  __BLANK[DISPLAY5]__;
  __BLANK[DISPLAY6]__;
  __BLANK[DISPLAY7]__;
  __BLANK[DISPLAY8]__;
}

//<< Main menu screen (from Lesson 5 Step 3)
void __BLANK[SHOWMAIN_FN]__() {
  __BLANK[DISPLAYM1]__.__BLANK[CLEAR]__;
  __BLANK[DISPLAYM2]__.__BLANK[SET_SIZE]__;
  __BLANK[DISPLAYM3]__.__BLANK[SET_COLOR]__;
  __BLANK[DISPLAYM4]__.setCursor(0, 0);
  __BLANK[DISPLAYM5]__.println("Main Menu:");
  display.println("----------");

  int i = __BLANK[START_I]__;
  while (i < __BLANK[TOTALMAIN_USE]__) {
    if (i == __BLANK[INDEX_USE]__) {
      display.print(__BLANK[ARROW]__);
    } else {
      display.print(__BLANK[SPACES]__);
    }
    display.println(__BLANK[MENU_ACCESS]__);
    __BLANK[INC_I]__;
  }

  display.__BLANK[FLUSH]__();
}
^^`,
      answerKey:{
        DELAY_MS: {
          type: "range",
          min: 300,
          max: 10000,
        },
        //SHOWMAIN_FN1: {type:"sameAs",target:"SHOWMAIN_FN"}
      },

      blankExplanations:{
        DELAY_MS: "Choose how long (in milliseconds) the welcome screen stays visible before switching to the main menu. If the value is very small (i.e.10-200 ms), it may disappear too quickly for you to see.",
        SHOWMAIN_FN1: "This function is one you made that draws the main menu screen. Check the functions you made so far."
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
        },],},
    {
      id: 4,
      title: "Step 4: Show the Status Menu",
      codes: [
        {
          topicTitle: "Loop through status options",
          descBeforeCode: `Once the "Status" option is selected on the main menu, the screen should lead to several status options you can choose from. Just like we made an array for the main menu, and used a while loop to go through each option with an indicator (i.e. arrow), we will bascially do the same thing again for this purpose as well. `,
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `^^// List of main menu options
__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = { //define array name
  __BLANK[STATUSLIST1]__, //status 0
  __BLANK[STATUSLIST2]__, //status 1
  __BLANK[STATUSLIST3]__, //status 2
  __BLANK[STATUSLIST4]__  //status 3
};

__BLANK[TOTTYPE]__ __BLANK[TOTNAME]__ = __BLANK[TOTNUM]__; // Number of items in the status list

__BLANK[TRACKTYPE]__ __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__; ^^ // Counter for tracking which item of the status list you are on. Assign 0 for the counter.
^^
`,
        answerKey: {
          STATUSTYPE: ["String"],
          STATUSNAME: { type: "regex", pattern: "^[A-Za-z_]\\w*\\[\\]$" },
          STATUSLIST1: { type: "regex", pattern: '^".+"$' },
          STATUSLIST2: { type: "regex", pattern: '^".+"$' },
          STATUSLIST3: { type: "regex", pattern: '^".+"$' },
          STATUSLIST4: { type: "regex", pattern: '^".+"$' },
                    TOTTYPE: ["int"],
          TOTNAME: { type: "identifier" },
          TOTNUM: { type: "range", min: 1, max: 20 },
          TRACKTYPE: ["int"],
          TRACKNAME: { type: "identifier" },
          TRACKNUM: ["0"],
          OPTION: { type: "regex", pattern: '^".+"$' },
        },
        blankExplanations: {
          STATUSTYPE:
            "Use a type that can store words/sentences as text.",
          STATUSNAME:
            "Name your status list and include [] to show it’s an array.",
          STATUSLIST1:
            "Write a status option inside quotes (example: \"Studying\").",
          STATUSLIST2:
            "Write a second status option inside quotes.",
          STATUSLIST3:
            "Write a third status option inside quotes.",
          STATUSLIST4:
            "Write a fourth status option inside quotes.",
          TOTTYPE:
            "The total count is a whole number, so use an integer type.",
          TOTNAME:
            "Pick a clear name that means “how many statuses exist.”",
          TOTNUM:
            "Count how many items are in your status array and store that number.",
          TRACKTYPE:
            "The array index is a whole number, so use int.",
          TRACKNAME:
            "Pick a name that tracks which status you are currently on.",
          TRACKNUM:
            "Start at 0 because arrays begin at index 0.",
          OPTION:
            "This is the first status in your list if your index starts at 0."
        },
        blankDifficulties: {
          STATUSTYPE: "easy",
          STATUSNAME: "easy",
          STATUSLIST1: "easy",
          STATUSLIST2: "easy",
          STATUSLIST3: "easy",
          STATUSLIST4: "easy",
          TOTTYPE: "easy",
          TOTNAME: "easy",
          TOTNUM: "easy",
          TRACKTYPE: "easy",
          TRACKNAME: "easy",
          TRACKNUM: "easy",
          OPTION: "easy",
        },
            descAfterCode: `Each item will now be accessed by its index:
  __BLANK[STATUSNAME]__ [0] → __BLANK[STATUSLIST1]__
  __BLANK[STATUSNAME]__ [1] → __BLANK[STATUSLIST2]__
  __BLANK[STATUSNAME]__ [2] → __BLANK[STATUSLIST3]__ 
  __BLANK[STATUSNAME]__ [3] → __BLANK[STATUSLIST4]__

  This list allows your program to display different messages simply by picking a number.`,


        },
        {
          topicTitle:"Function to display Status Menu",
          descBeforeCode:`You will write a function that displays the Status Menu on the OLED screen.
The function clears the screen, sets up text formatting, and then uses a while loop to print each status option from your status list. As the loop runs, it checks whether the current index matches the value stored in __BLANK[TRACKNAME]__.
When the indices match, that status is highlighted using an indicator (such as \`>\`). All other statuses are printed normally. This allows the selected status to move as the index value changes when buttons are pressed.`, 
          code:
`^^
void __BLANK[SHOWSTATUSMENU_FN]__() {                // name the function that draws the main menu
  __BLANK[DISPLAYS1]__.__BLANK[CLEARS]__;                 // clear the OLED screen
  __BLANK[DISPLAYS2]__.__BLANK[SET_SIZES]__;             // set small text size
  __BLANK[DISPLAYS3]__.__BLANK[SET_COLORS]__;// set text color
  __BLANK[DISPLAYS4]__.__BLANK[SET_CURSORS]__;        // move cursor to top-left corner
  __BLANK[DISPLAYS5]__.println(__BLANK[MENUTITLE]__);              // print menu title
  display.println("----------");              // print divider line

  int i = __BLANK[HL_STARTI]__;
  while (i < __BLANK[HL_TOTALUSE]__) {
    if (i == __BLANK[CHOSENIND]__) {
      display.__BLANK[INDICATE]__;        // arrow for the selected item
    } else {
      display.__BLANK[SPACE]__;        // spaces for others
    }
    display.println(__BLANK[STATUSNAME1]__); // print status at the "i"th index.
    __BLANK[IINCRE]__;
  }
  display.display();
}^^`,
          answerKey: {
            // function name
            SHOWSTATUSMENU_FN: { type: "identifier" },
            DISPLAYS1: { type: "identifier" },
            DISPLAYS2: { type: "sameAs", target: "DISPLAYS1" },
            DISPLAYS3: { type: "sameAs", target: "DISPLAYS1" },
            DISPLAYS4: { type: "sameAs", target: "DISPLAYS1" },
            DISPLAYS5: { type: "sameAs", target: "DISPLAYS1" },
            // display method calls — allow freedom for size/color/cursor content
            CLEARS: { type: "string", regex: "^clearDisplay\\(\\)$" },
            SET_SIZES: { type: "string", regex: "^setTextSize\\(.+\\)$" },     // any arg
            SET_COLORS: { type: "string", regex: "^setTextColor\\(.+\\)$" },   // any arg
            SET_CURSORS: { type: "string", regex: "^setCursor\\(.+\\)$" },     // any args

            // menu title string is flexible (must be a quoted string)
            MENUTITLE: { type: "string", regex: '^".+"$' },

            HL_STARTI: { type: "range", min: 0, max: 0 },

            HL_TOTALUSE: { type: "sameAs", target: "TOTNAME" },

            CHOSENIND: { type: "sameAs", target: "TRACKNAME" },

            INDICATE: {
              type: "string",
              regex: "^(print\\(.+\\)|println\\(.+\\))$",
            },
            SPACE: {
              type: "string",
              regex: "^(print\\(.+\\)|println\\(.+\\))$",
            },

            // what to print each row:
            // MUST be the status array at index i, and MUST match array name from FIRST block (STATUSNAME)
            STATUSNAME1: {
              type: "string",
              // enforce: <same array name>[i]
              regex: "^[A-Za-z_]\\w*\\s*\\[\\s*i\\s*\\]$",
            },

            // increment i
            IINCRE: {
              type: "string",
              regex: "^(i\\+\\+|\\+\\+i|i\\s*\\+=\\s*1|i\\s*=\\s*i\\s*\\+\\s*1)$",
            },
          },

          blankExplanations: {
            SHOWSTATUSMENU_FN:
              "Name the function that draws the Status Menu screen.",
            DISPLAYS1:
              "This should be your OLED display object (usually named `display`).",
            DISPLAYS2:
              "Use the same display object name as above.",
            DISPLAYS3:
              "Use the same display object name as above.",
            DISPLAYS4:
              "Use the same display object name as above.",
            DISPLAYS5:
              "Use the same display object name as above.",
            CLEARS:
              "Call `clearDisplay()` to wipe the old screen before redrawing the menu.",
            SET_SIZES:
              "Call `setTextSize(...)` to choose a readable font size. You can use any number.",
            SET_COLORS:
              "Call `setTextColor(...)` to set the text color. You can use any valid OLED color constant.",
            SET_CURSORS:
              "Call `setCursor(...)` to choose where text starts on the screen. You can pick any (x, y).",
            MENUTITLE:
              "Write the title text shown at the top of the Status Menu (example: \"Status Menu:\").",
            HL_STARTI:
              "Start the loop at 0 so you begin printing from the first status in the array.",
            HL_TOTALUSE:
              "Use the same total-count variable from the first block. This makes the loop stop at the correct time.",
            CHOSENIND:
              "Use the SAME tracking index variable from the first block. This is the one that changes when buttons are pressed.",
            INDICATE:
              "Print an indicator for the selected item (example: `print(\"> \")` or `print(\"* \")`).",
            SPACE:
              "Print spacing for non-selected items (example: `print(\"  \")`) so the menu stays aligned.",

            STATUSNAME1:
              "Print the current status text at index [i] using array indexing.",

            IINCRE:
              "Increment `i` so the loop moves to the next status each time.",
          },

          blankDifficulties: {
            SHOWSTATUSMENU_FN: "easy",

            DISPLAYS1: "easy",
            DISPLAYS2: "easy",
            DISPLAYS3: "easy",
            DISPLAYS4: "easy",
            DISPLAYS5: "easy",

            CLEARS: "easy",
            SET_SIZES: "easy",
            SET_COLORS: "easy",
            SET_CURSORS: "easy",

            MENUTITLE: "easy",

            HL_STARTI: "easy",
            HL_TOTALUSE: "easy",
            CHOSENIND: "easy",

            INDICATE: "easy",
            SPACE: "easy",

            STATUSNAME1: "medium",
            IINCRE: "easy",
          },

        }
      ],
    },
  ],
  },

// =========================================================
// LESSON 6
// =========================================================
6: {
  phrase: "Putting it all together: full sketch structure + what you have so far",
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
@ **Constants + global variables** go next (pins, arrays, counters, totals).
@ **setup()** is for one-time initialization (Wire, OLED begin, pinMode, welcome screen).
@ **loop()** runs forever (later we will read buttons and decide which screen to show).
@ **Functions** can go below loop() (or above setup()) — but they must be **outside** setup() and loop().

Below is a “skeleton” that shows the correct order. (No blanks — just a map.)`,
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
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
void __BLANK[WELCOMEFUNCTION]__() { ... }
void __BLANK[SHOWMAIN_FN]__() { ... }
void __BLANK[SHOWSTATUSMENU_FN]__() { ... }
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

          code: `^^
//<< ===================== 1) LIBRARIES =======================================
#include <Wire.h>
#include __BLANK[LIB_GFX]__
#include __BLANK[LIB_SSD]__
#include __BLANK[LIB_CLOCK]__

//<< ===================== 2) CONSTANTS + GLOBAL VARIABLES =====================

//<< --- OLED setup ---
#define __BLANK[WVAR]__  __BLANK[WIDTH]__          // screen width in pixels
#define __BLANK[HVAR]__  __BLANK[HEIGHT]__         // screen height in pixels
#define RESET -1                                  // no reset pin wired
Adafruit_SSD1306 display(__BLANK[WIDTH2]__, __BLANK[HEIGHT2]__, &Wire, RESET);

//<< --- button pins ---
#define PREV __BLANK[PREVN]__                      // previous button pin
#define __BLANK[NEXTVAR]__ __BLANK[NEXTN]__        // next button pin
#define __BLANK[SELVAR]__  __BLANK[SELN]__         // select button pin

//<< --- main menu array ---
__BLANK[MMENUTYPE]__ __BLANK[MMENUNAME]__ = {
  "Status",
  __BLANK[MENULIST2]__,
  __BLANK[MENULIST3]__,
};

int __BLANK[TOTMAIN]__ = __BLANK[TOTMAINNUM]__;            // number of items in main menu
__BLANK[MINDEXTYPE]__ __BLANK[MINDEX]__ = __BLANK[MINDEXNUM]__; // selected main-menu index

//<< --- status menu array ---
__BLANK[STATUSTYPE]__ __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__,
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__
};

__BLANK[TOTTYPE]__ __BLANK[TOTNAME]__ = __BLANK[TOTNUM]__;         // number of status items
__BLANK[TRACKTYPE]__ __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__;   // selected status index

//<< ===================== 3) SETUP (RUNS ONCE) ===============================
void setup() {
  Wire.begin();
  __BLANK[BEGINA]__;                            // initialize OLED

  //<< buttons (pull-up mode)
  pinMode(PREV, INPUT_PULLUP);
  __BLANK[PINMODE1]__(__BLANK[NEXTVAR]__, __BLANK[INPUT1]__);
  __BLANK[PINMODE]__(__BLANK[SELVAR]__, __BLANK[INPUT2]__);

  //<< welcome page once on power-up
  __BLANK[WELCOMEFUNCTION]__();
}

//<< ===================== 4) LOOP (RUNS FOREVER) ============================
void loop() {
  //<< later: read buttons, update __BLANK[MINDEX]__ / __BLANK[TRACKNAME]__,
  //<< and decide which screen function to call.
}

//<< ===================== 5) FUNCTIONS (OUTSIDE setup/loop) =================

//<< --- welcome screen ---
void __BLANK[WELCOMEFUNCTION]__() {
  __BLANK[DISPLAY1]__;
  __BLANK[DISPLAY2]__;
  __BLANK[DISPLAY3]__;
  __BLANK[DISPLAY4]__;
  __BLANK[DISPLAY5]__;
  __BLANK[DISPLAY6]__;
  __BLANK[DISPLAY7]__;
  __BLANK[DISPLAY8]__;
}

//<< --- example status screen ---
void __BLANK[STATUSFUNCTION]__() {
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__;
  display.__BLANK[DISPLAY9]__;
}

//<< --- main menu screen ---
void __BLANK[SHOWMAIN_FN]__() {
  __BLANK[DISPLAYM1]__.__BLANK[CLEAR]__;
  __BLANK[DISPLAYM2]__.__BLANK[SET_SIZE]__;
  __BLANK[DISPLAYM3]__.__BLANK[SET_COLOR]__;
  __BLANK[DISPLAYM4]__.__BLANK[SET_CURSOR]__;
  __BLANK[DISPLAYM5]__.println("Main Menu:");
  display.println("----------");

  int i = __BLANK[START_I]__;
  while (i < __BLANK[TOTALMAIN_USE]__) {
    if (i == __BLANK[INDEX_USE]__) {
      display.print(__BLANK[ARROW]__);
    } else {
      display.print(__BLANK[SPACES]__);
    }
    display.println(__BLANK[MENU_ACCESS]__);
    __BLANK[INC_I]__;
  }
  display.__BLANK[FLUSH]__;
}

//<< --- status menu screen ---
void __BLANK[SHOWSTATUSMENU_FN]__() {
  __BLANK[DISPLAYS1]__.__BLANK[CLEARS]__;
  __BLANK[DISPLAYS2]__.__BLANK[SET_SIZES]__;
  __BLANK[DISPLAYS3]__.__BLANK[SET_COLORS]__;
  __BLANK[DISPLAYS4]__.__BLANK[SET_CURSORS]__;
  __BLANK[DISPLAYS5]__.println(__BLANK[MENUTITLE]__);
  display.println("----------");

  int i = __BLANK[HL_STARTI]__;
  while (i < __BLANK[HL_TOTALUSE]__) {
    if (i == __BLANK[CHOSENIND]__) {
      display.__BLANK[INDICATE]__;
    } else {
      display.__BLANK[SPACE]__;
    }
    display.println(__BLANK[STATUSNAME]__[i]);  // print the i-th status
    __BLANK[IINCRE]__;
  }
  display.display();
}
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
@ change __BLANK[MINDEX]__ to scroll the main menu
@ change __BLANK[TRACKNAME]__ to scroll the status menu
@ call the correct screen function based on the selection`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "Use this as your checkpoint sketch. If something is missing, it’s usually because it was placed in the wrong section.",
        },
        {
          topicTitle: "Try Simulating Main and Status menu",
          descBeforeCode:`Just like you called the welcome function and the main menu function (temporarily) in the void setup(), you can also call the status menu function in the setup() after a delay to check if the status menu displays as intended.`,
          code:`^^
void setup() {
  Wire.begin();
  __BLANK[BEGINA]__;

  pinMode(PREV, INPUT_PULLUP);
  pinMode(__BLANK[NEXTVAR]__, INPUT_PULLUP);
  pinMode(__BLANK[SELVAR]__, INPUT_PULLUP);

  //<< 1) Call Welcome Function once
  __BLANK[WELCOMEFUNCTION]__();

  //<< 2) A short delay before the main menu so you can see the welcome function
  delay(__BLANK[DELAY_MS]__);

  //<< 3) Then call the main menu Function 
  __BLANK[SHOWMAIN_FN1]__();

  //<< 4) A short delay before the status menu
  __BLANK[DELAYTRY]__

  //<< 5) Call the status menu function
  __BLANK[STATUSTRY]__
}^^`,
          answerKey: {
            // ...keep your existing keys...

            // 4) A short delay before the status menu
            // This blank should be a full delay line (with parentheses + semicolon).
            DELAYTRY: {
              type: "string",
              regex: "^delay\\(\\s*\\d+\\s*\\)\\s*;?$",
            },
          }
        }
      ],
    },
  ],
},

7: {
  phrase:"Using buttons for Menu",
  advanced: false,
  steps: [
    {
      id: 1,
      optional: true,
      title: "Step 1: How Buttons Work & INPUT_PULLUP",
      desc: `Buttons are simple switches. When you press a button, it closes the circuit so current can flow. When you release it, the circuit opens again, and current stops.
On the Arduino, we use buttons as **digital inputs** that read either \`HIGH\` or \`LOW\`. However, if a pin is not connected to anything, it can "float" and randomly jump between \`HIGH\` and \`LOW\`. This is why we use **pull-up** (or pull-down) resistors.`,
      codes:[{
topicTitle: "How Input Pullup works",
descBetweenBeforeAndCode:`**With** \`INPUT_PULLUP\`**:**
@ The Arduino turns on an internal resistor that pulls the pin up to \`HIGH\` when the button is not pressed.
@ The button is wired so that one side connects to the digital pin and the other side connects to GND. When the button is not pressed, the circuit is open, so the pin is not connected to ground. Because of the internal pull-up resistor, the pin stays at HIGH.
@ When the button is pressed, the switch closes and directly connects the pin to GND. This pulls the pin \`LOW\`, overpowering the weak internal pull-up resistor.

So the logic becomes:
@ **Not pressed → \`digitalRead(pin)\` is** __BLANK[INPUTHIGHLOW1]__
@ **Pressed → \`digitalRead(pin)\` is** __BLANK[INPUTHIGHLOW]__
We'll use this pattern for all the buttons in the status board project.`,

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
      },}]
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
      desc: "Now try a few different ways of using buttons so you’re ready for the menu page logic in the status board project.",
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
            BUTTON5:
              "Use the constant name you defined for the button pin.",
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
^^  __BLANK[BUTTON9]__  __BLANK[BUTTON10]__ = __BLANK[BUTTON11]__;^^   // define button pin number
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
            BUTTON9: ["int"],
            BUTTON10: ["BUTTON"],
            BUTTON11: ["10"],
            BUTTON12: ["digitalRead(BUTTON)"],
            BUTTON13: ["LOW"],
          },
          blankExplanations: {
            BUTTON9:
              "Choose a numeric type for storing a pin number constant.",
            BUTTON10:
              "Use the constant name for the button pin.",
            BUTTON11:
              "Choose a valid digital pin number for the button connection.",
            BUTTON12:
              "Read the button pin so you can check if it’s pressed.",
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
            "This is very close to how the status board scrolls through different statuses. The variable `index` is like a menu cursor that moves and wraps around.",
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
            BUTTON16: ["10"],
            BUTTON17: ["LOW"],
            BUTTON18: ["LOW"],
          },
          blankExplanations: {
            BUTTON14:
              "Write the preprocessor keyword used to define constants.",
            BUTTON15:
              "Use the same constant name for the button pin.",
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
      desc:
        "Real buttons can be noisy. When you press them, they may rapidly flicker between HIGH and LOW for a few milliseconds. This is called 'bouncing'. A **debounce helper function** makes sure we only react to a clean, stable press.",
      hint:
        "The helper checks the pin, waits a bit, and checks again to confirm the press. Make sure variable names match in this example.",
      codes: [
        {
          title: "Practice Code: Debouncing Function",
          code: `^^#define button 4

//<< Example of how this function can be used in the void loop() 
void loop() {
  if (__BLANK[HELPER1]__(__BLANK[BUTTONPINEX]__) == __BLANK[TRUEFALSE1]__) { //if the button helper function is (true/false)
    Serial.println("Clean press detected!");
    delay(200);
  }
}

//<< Button Helper Function
bool __BLANK[HELPER1]__(int buttonPin) { //boolean function because it returns true or false. Not a void type. 
  if (__BLANK[HELPER2]__) { //if high or low
    __BLANK[HELPER3]__; //create a short delay
    if (__BLANK[HELPER4]__) {//if hight or low
      return __BLANK[TRUEFALSE2]__; //if the button is still pressed after a delay, return (true/false)
    }
    return __BLANK[TRUEFALSE3]__; //if not, return (true/false)
  }
}^^

`,
          answerKey: {
            // function name must match everywhere it appears
            HELPER1: { type: "identifier" },

            // should refer to the #defined constant above (button)
            // allow either "button" or the literal "4" since some students may use the pin directly
            BUTTONPINEX: { type: "string", regex: "^(button|4)$" },

            // allow true/false
            TRUEFALSE1: ["true", "false"],
            TRUEFALSE2: ["true", "false"],
            TRUEFALSE3: ["true", "false"],

            // FIRST read check: digitalRead(buttonPin) == LOW/HIGH (spaces optional)
            HELPER2: {
              type: "string",
              regex: "^digitalRead\\(\\s*buttonPin\\s*\\)\\s*==\\s*(LOW|HIGH)$",
            },

            // short debounce delay: allow any integer milliseconds, semicolon optional
            HELPER3: {
              type: "string",
              regex: "^delay\\(\\s*\\d+\\s*\\)\\s*;?$",
            },

            // SECOND read check after delay: same idea as HELPER2, but allow it to differ if they want
            // (still forces correct structure and buttonPin usage)
            HELPER4: {
              type: "string",
              regex: "^digitalRead\\(\\s*buttonPin\\s*\\)\\s*==\\s*(LOW|HIGH)$",
            },
          },

          blankExplanations: {
            HELPER1:
              "This is the name of your helper function. It must be the same everywhere it appears (both where you call it in loop() and where you define it).",

            BUTTONPINEX:
              "This is the pin value being sent into the helper function. Most code uses the named constant you defined at the top, but some code may pass the raw pin number directly. Either way, it must represent the same physical button pin.",

            TRUEFALSE1:
              "The helper function returns a boolean value. Here you are comparing its result to a boolean literal to decide whether to print the message.",

            HELPER2:
              "This condition performs the *first read* of the input pin. It should read the state of the pin passed into the function and compare it to the electrical state that represents a press in your wiring style. Spacing around symbols does not matter, but the structure and variable name should be correct.",

            HELPER3:
              "This line adds a short wait to reduce button 'bounce' (rapid flickering of the signal right when you press). The exact number of milliseconds can vary, but it should be a small delay written with correct function-call syntax.",

            HELPER4:
              "This condition performs the *second read* after the short delay. The purpose is to confirm the button is still in the pressed-state, instead of reacting to a noisy flicker. It should use the same pin variable passed into the helper and compare the read value to a valid digital state.",
              
            TRUEFALSE2:
              "This is the value returned when the press is confirmed after the second read. It should match the meaning of a clean press in your helper logic.",

            TRUEFALSE3:
              "This is the value returned when the press is not confirmed after the second read (meaning the signal changed or was not stable).",
          },

          blankDifficulties: {
            HELPER1: "easy",
            BUTTONPINEX: "easy",

            TRUEFALSE1: "easy",
            TRUEFALSE2: "medium",
            TRUEFALSE3: "medium",

            HELPER2: "medium",
            HELPER3: "easy",
            HELPER4: "medium",
          },

          descAfterCode:`The helper reads the pin, waits briefly, and checks again. If the pin is still in the pressed state, it returns true. This reduces false triggers from button bounce.
**Place this boolean function** __BLANK[HELPER1]__ **into your current code draft with the rest of your functions.**`,
        },
      ],
    },
  ],
},

  8: {
  phrase: "Clock screen: printing HH:MM:SS + showing it on the OLED",
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
                imageSrc: "/electric-status-board/images/clockHelperDiagram.png",
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
          code: `^^
void __BLANK[SHOWTIME]__() {                          // function name for showing time
  DateTime __BLANK[NOWVAR]__ = __BLANK[RTC]__.now();  // get current time from RTC

  int __BLANK[HHVAR]__ = __BLANK[NOWVAR]__.hour();                    // extract hour
  int __BLANK[MMVAR]__ = __BLANK[NOWVAR]__.__BLANK[GET_MINUTE]__;     // extract minute
  int __BLANK[SSVAR]__ = __BLANK[NOWVAR]__.__BLANK[GET_SECOND]__;     // extract second

  if (__BLANK[HHVAR]__ < __BLANK[TEN1]__) {           // if hour is 0-9...
    display.__BLANK[PRINT0_1]__;                      // print leading 0
  }
  display.__BLANK[PRINTH]__(__BLANK[HHVAR]__);        // print hour number
  display.__BLANK[PRINTCOLON1]__;                     // print ":"

  if (__BLANK[MMVAR1]__ < __BLANK[TEN2]__) {          // if minute is 0-9...
    display.__BLANK[PRINT0_2]__;                      // print leading 0
  }
  display.__BLANK[PRINTM]__(__BLANK[MMVAR2]__);       // print minute number
  display.__BLANK[PRINTCOLON2]__;                     // print ":"

  if (__BLANK[SSVAR1]__ < __BLANK[TEN3]__) {          // if second is 0-9...
    display.__BLANK[PRINT0_3]__;                      // print leading 0
  }
  display.__BLANK[PRINTS]__(__BLANK[SSVAR2]__);       // print second number
}
^^
`,
          answerKey: {
            SHOWTIME: { type: "identifier" },

            NOWVAR: { type: "identifier" },

            // Your original had __[BLANK]__.now()
            // Give that blank a real name students can understand:
            RTC: ["rtc"],

            HHVAR: { type: "identifier" },

            MMVAR: { type: "identifier" },
            MMVAR1: { type: "sameAs", target: "MMVAR" },
            MMVAR2: { type: "sameAs", target: "MMVAR" },

            SSVAR: { type: "identifier" },
            SSVAR1: { type: "sameAs", target: "SSVAR" },
            SSVAR2: { type: "sameAs", target: "SSVAR" },

            // IMPORTANT: because your template is nowVar.__BLANK[GET_MINUTE]__;
            // this blank must include parentheses.
            GET_MINUTE: ["minute()"],
            GET_SECOND: ["second()"],

            TEN1: ["10"],
            TEN2: ["10"],
            TEN3: ["10"],

            // display.__BLANK[...]__; expects the full member call part
            PRINT0_1: ['print("0")', "print('0')"],
            PRINT0_2: ['print("0")', "print('0')"],
            PRINT0_3: ['print("0")', "print('0')"],

            // display.__BLANK[PRINTH]__(...) expects just "print" or "println"
            PRINTH: ["print"],
            PRINTM: ["print"],
            PRINTS: ["print"],

            PRINTCOLON1: ['print(":")', "print(':')"],
            PRINTCOLON2: ['print(":")', "print(':')"],
          },

            blankExplanations: {
              SHOWTIME:
                "Function name that prints the current time (example: showTime). Must be a valid identifier.",

              NOWVAR:
                "Variable name holding the DateTime returned by rtc.now() (example: now).",

              RTC:
                "The name of your RTC object. In most projects it’s `rtc` (from: RTC_DS3231 rtc;).",

              HHVAR:
                "Variable name that stores the hour (0–23). You will reuse this SAME name later in the if and print lines.",

              MMVAR:
                "Variable name that stores the minute (0–59). You will reuse the SAME name again in MMVAR1 and MMVAR2.",

              MMVAR1:
                "This must be EXACTLY the same variable name you typed for MMVAR (practice: reuse the same variable consistently).",

              MMVAR2:
                "This must be EXACTLY the same variable name you typed for MMVAR.",

              SSVAR:
                "Variable name that stores the second (0–59). You must reuse it again in SSVAR1 and SSVAR2.",

              SSVAR1:
                "This must be EXACTLY the same variable name you typed for SSVAR.",

              SSVAR2:
                "This must be EXACTLY the same variable name you typed for SSVAR.",

              GET_MINUTE:
                "DateTime function that extracts minutes. Because the template already has a dot before it, include parentheses: minute().",

              GET_SECOND:
                "DateTime function that extracts seconds. Include parentheses: second().",

              TEN1:
                "Use 10 so you can check if hour is a single digit (0–9). If hour < 10, print a leading 0 first.",

              TEN2:
                "Use 10 so you can check if minute is 0–9 and needs a leading 0.",

              TEN3:
                "Use 10 so you can check if second is 0–9 and needs a leading 0.",

              PRINT0_1:
                'Print the leading "0" before the hour when needed. Since the code is display.__BLANK[...]__; fill in print("0") (or print(\'0\')).',

              PRINT0_2:
                'Print the leading "0" before the minute when needed. Use print("0") (or print(\'0\')).',

              PRINT0_3:
                'Print the leading "0" before the second when needed. Use print("0") (or print(\'0\')).',

              PRINTH:
                "Use the display function name that prints the hour number without a newline. Usually `print`.",

              PRINTM:
                "Use the display function name that prints the minute number without a newline. Usually `print`.",

              PRINTS:
                "Use the display function name that prints the second number. Usually `print`.",

              PRINTCOLON1:
                'Print the ":" after the hour. Use print(":") (or print(\':\')).',

              PRINTCOLON2:
                'Print the ":" after the minute. Use print(":") (or print(\':\')).',
            },


            blankDifficulties: {
              SHOWTIME: "easy",
              NOWVAR: "easy",
              RTC: "easy",

              HHVAR: "easy",

              MMVAR: "easy",
              MMVAR1: "medium", // “repeat exactly” is the learning point
              MMVAR2: "medium",

              SSVAR: "easy",
              SSVAR1: "medium",
              SSVAR2: "medium",

              GET_MINUTE: "easy",
              GET_SECOND: "easy",

              TEN1: "easy",
              TEN2: "easy",
              TEN3: "easy",

              PRINT0_1: "easy",
              PRINT0_2: "easy",
              PRINT0_3: "easy",

              PRINTH: "easy",
              PRINTM: "easy",
              PRINTS: "easy",

              PRINTCOLON1: "easy",
              PRINTCOLON2: "easy",
            },

          descAfterCode: `As an example, imagine the real-time clock currently reads **March 8, 2026 at 14:07:03 (2:07:03 PM)**. When the line __BLANK[RTC]__.now() runs, it does not return just one number. 
Instead, it returns a \`DateTime\` object that contains the entire timestamp all at once: the year, month, day, hour, minute, and second. 
This full snapshot of the current moment is stored in the variable __BLANK[NOWVAR]__, allowing the program to work with a single, consistent time reading.

From that snapshot, the program then extracts individual pieces of time. Calling __BLANK[NOWVAR]__.hour() returns 14, __BLANK[NOWVAR]__.minute() returns 7, and __BLANK[NOWVAR]__.second() returns 3.
`,
          imageGridAfterCode: null,
          descAfterImage: `When you’re done, this function should print something like \`09:07:03\` or \`14:25:56\` depending on the time.
**Important:** This function only prints to the OLED's buffer at the current cursor location. It does not clear the screen and does not call \`display.display()\`.`,
          hint:
            "Use display.print(...) not display.println(...) so the time stays on one line.",
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
void __BLANK[SHOWTT]__() {                           // function name for clock look
  display.__BLANK[CLEAR]__;                          // clear old pixels/text
  __BLANK[COLOR]__;                                 // set text color (white)

  __BLANK[SIZE1]__;                                 // small text for label
  __BLANK[CURSOR1]__;                               // cursor for label
  __BLANK[PRINT_LABEL]__;                           // print "Clock:"

  __BLANK[SIZE2]__;                                 // bigger text for time
  __BLANK[CURSOR2]__;                               // cursor for time
  __BLANK[CALL_HELPER]__();                         // call HH:MM:SS clock function to print time here

  // add code here for small hint at the bottom to say previous: menu
  __BLANK[SIZE3]__;                                 // small text for hint
  __BLANK[CURSOR3]__;                               // cursor near bottom
  __BLANK[PRINT_HINT]__;                            // print "PREV: Menu"

  display.__BLANK[FLUSH1]__;                         // update OLED display
}
^^
`,

          answerKey: {
            SHOWTT: { type: "identifier" },

            CLEAR: ["clearDisplay()"],
            FLUSH1: ["display()"],

            COLOR: ["display.setTextColor(SSD1306_WHITE)"],

            // allow ANY numeric text size (1,2,3,4,...)
            SIZE1: { type: "string", regex: "^display\\.setTextSize\\(\\s*\\d+\\s*\\)\\s*;?$" },
            SIZE2: { type: "string", regex: "^display\\.setTextSize\\(\\s*\\d+\\s*\\)\\s*;?$" },
            SIZE3: { type: "string", regex: "^display\\.setTextSize\\(\\s*\\d+\\s*\\)\\s*;?$" },

            // allow ANY cursor position (x,y integers)
            CURSOR1: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)\\s*;?$" },
            CURSOR2: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)\\s*;?$" },
            CURSOR3: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)\\s*;?$" },

            // just require display.print/println(...) (don’t check the content)
            PRINT_LABEL: { type: "string", regex: "^display\\.(print|println)\\(.*\\)\\s*;?$" },

            // hint should be a print/println that includes PREV and Menu somewhere
            PRINT_HINT: {
              type: "string",
              regex: '^display\\.(print|println)\\(\\s*".*(PREV|Prev|prev).*?(Menu|menu).*"\\s*\\)\\s*;?$',
            },

            // must match the helper function name they made earlier (SHOWTIME)
            CALL_HELPER: { type: "sameAs", target: "SHOWTIME" },
          },

          blankExplanations: {
            SHOWTT:
              "This is the function name for the screen that shows the clock. Use a valid function name (letters/numbers/underscore, no spaces).",

            CLEAR:
              "This clears the OLED’s drawing buffer at the start so old text doesn’t remain on the screen.",

            COLOR:
              "This sets the text drawing color mode for the OLED so the text is visible.",

            SIZE1:
              "Set the text size for the label line. Any valid number is accepted as long as you use the correct function format.",

            CURSOR1:
              "Move the cursor to where you want the label to appear before you print it (x and y are pixel coordinates).",

            PRINT_LABEL:
              "Print a short label for the screen using a display print function. The grader only checks that you used a print/println call correctly.",

            SIZE2:
              "Set the text size for the time display. Use a valid text-size call (any number is accepted).",

            CURSOR2:
              "Move the cursor to where you want the time to start before calling your time helper.",

            CALL_HELPER:
              "Call the time-printing helper you defined earlier. This must match the same helper name you already created (the grader checks name consistency).",

            SIZE3:
              "Set a smaller text size for the hint so it stays subtle compared to the main time.",

            CURSOR3:
              "Move the cursor near the bottom portion of the screen so the hint prints at the bottom area.",

            PRINT_HINT:
              "Print a hint message that includes a short 'previous/menu' instruction. The grader checks that you used a display print/println call and that the message contains the key words.",

            FLUSH1:
              "This updates the physical OLED screen so everything you drew becomes visible.",
          },

          blankDifficulties: {
            SHOWTT: "easy",

            CLEAR: "easy",
            COLOR: "easy",

            SIZE1: "easy",
            CURSOR1: "easy",
            PRINT_LABEL: "easy",

            SIZE2: "easy",
            CURSOR2: "medium",
            CALL_HELPER: "easy",

            SIZE3: "easy",
            CURSOR3: "easy",
            PRINT_HINT: "easy",

            FLUSH1: "easy",
          },

          descAfterCode: `After you fill this in, calling \`showClockScreen()\` should display:
1) A label that says "Clock:" or anything you want. 
2) A large time in HH:MM:SS
3) A small hint at the bottom that instructs what button to press to go back to Main Menu. 

This is a complete screen function because it clears the display and calls \`display.display()\` at the end.`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint:
            "Remember: your helper function prints time at the cursor, so setCursor(...) before calling it.",
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
      apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}
    />
  );
}








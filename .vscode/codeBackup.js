"use client";

import * as React from "react";
import CodeLessonBase from "@/src/lesson-core/CodeLessonBase";
import ESBProjectMindMapLesson from "./ProjectMindMapLesson";

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

  // set the modes for the buttons you are using 
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
          SELECT: { type: "sameAs", target: "SEL" },
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
- You must call the OLED update line after drawing if you want changes to show.

**Here are some useful functions for OLED module**
\`Wire.begin();\`  
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
              items: [
                {
                  imageSrc: "/electric-status-board/images/welcomeFunc.png",
                  label: "Example: welcome function",
                },
              ],
            },
            descBetweenBeforeAndCode: `This is an example of a function named welcomeFunc. All of the lines of code inside the curly brackets define what welcomeFunc does. You can run this function by calling it in either setup() or loop(). As a reminder, functions are reusable blocks of code that perform a specific task. 
      
Since we want the welcome page to show up only ONCE when we turn the device on, we will place that function in the **setup()**.
Read through each line of the code in the example above, and try to understand what it does.`,
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
  __BLANK[BEGINA]__;      
  __BLANK[WELCOMEFUNCTION]__(); // Produce welcome message upon starting the board

  //buttons being used
  pinMode(PREV, INPUT_PULLUP);                 
  __BLANK[PINMODE1]__(__BLANK[NEXT]__, __BLANK[INPUT1]__); 
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);^^      
}

void loop(){
}

^^
void __BLANK[WELCOMEFUNCTION]__() {
  __BLANK[DISPLAY1]__;  //clear display  
  __BLANK[DISPLAY2]__;  //text size 
  __BLANK[DISPLAY3]__;  //text color 
  __BLANK[DISPLAY4]__;  //print line 
  __BLANK[DISPLAY5]__;  //text size 
  __BLANK[DISPLAY6]__;  //text cursor 
  __BLANK[DISPLAY7]__;  //print line 
  __BLANK[DISPLAY8]__;  //display 
}^^`,

          answerKey: {
            WELCOMEFUNCTION: { type: "identifier" },
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
            descAfterCode: `Now, create a function with the same functionality as the example WelcomeFunc above. 
But, **rename the function as something else and have it display a different message.** Fill in the blanks.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "Call display() after drawing to push the buffer to the screen.",
          },
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
    phrase: "Variables + lists (arrays) for menu options",
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
__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = { //define array name
  __BLANK[STATUSLIST1]__, //status 0
  __BLANK[STATUSLIST2]__, //status 1
  __BLANK[STATUSLIST3]__, //status 2
  __BLANK[STATUSLIST4]__  //status 3
};^^

void setup(){
 ...
}

void loop(){
}
`,
        answerKey: {
          STATUSTYPE: ["String"],
          STATUSNAME: { type: "regex", pattern: "^[A-Za-z_]\\w*\\[\\]$" },
          STATUSLIST1: { type: "regex", pattern: '^".+"$' },
          STATUSLIST2: { type: "regex", pattern: '^".+"$' },
          STATUSLIST3: { type: "regex", pattern: '^".+"$' },
          STATUSLIST4: { type: "regex", pattern: '^".+"$' },
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
        },
        blankDifficulties: {
          STATUSTYPE: "easy",
          STATUSNAME: "easy",
          STATUSLIST1: "easy",
          STATUSLIST2: "easy",
          STATUSLIST3: "easy",
          STATUSLIST4: "easy",
        },
            descAfterCode: `Each item will now be accessed by its index:
  - __BLANK[STATUSNAME]__ [0] → __BLANK[STATUSLIST1]__
  - __BLANK[STATUSNAME]__ [1] → __BLANK[STATUSLIST2]__
  - __BLANK[STATUSNAME]__ [2] → __BLANK[STATUSLIST3]__ 
  - __BLANK[STATUSNAME]__ [3] → __BLANK[STATUSLIST4]__

  This list allows your program to display different messages simply by picking a number.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "This is the same structure used in your favoriteColor array.",
          },
        ],
      },

      {
        id: 5,
        title: "Step 5: Counting Items in the List",
        codes: [
          {
            topicTitle: "Total count + tracking index",
            descBeforeCode: `Arrays don’t automatically know how many items they contain, so we store the total count in a variable.
Create a variable that stores the total **number** of status in the array.`,
            imageGridBeforeCode: {
              columns: 1,
              height: 380,
              width: 450,
              items: [
                {
                  imageSrc: "/electric-status-board/videos/CurioLabL4.gif",
                  label: "Status Board menu",
                },
              ],
            },
            descBetweenBeforeAndCode: null,
            code: `__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__, 
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__
};

// Number of items in the status list^^
__BLANK[TOTTYPE]__ __BLANK[TOTNAME]__ = __BLANK[TOTNUM]__;^^

// Counter for tracking which item of the status list you are on. Assign 0 for the counter.^^
__BLANK[TRACKTYPE]__ __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__; ^^`,

        answerKey: {
          TOTTYPE: ["int"],
          TOTNAME: { type: "identifier" },
          TOTNUM: { type: "range", min: 1, max: 20 },
          TRACKTYPE: ["int"],
          TRACKNAME: { type: "identifier" },
          TRACKNUM: ["0"],
          OPTION: { type: "regex", pattern: '^".+"$' },
        },
        blankExplanations: {
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
            "This is the first status in your list if your index starts at 0.",
        },
        blankDifficulties: {
          TOTTYPE: "easy",
          TOTNAME: "easy",
          TOTNUM: "easy",
          TRACKTYPE: "easy",
          TRACKNAME: "easy",
          TRACKNUM: "easy",
          OPTION: "easy",
        },
            descAfterCode: `These two variables let the menu scroll correctly. In our code we can check the value of counter:
  - If it is past the last item → wrap back to the first  
  - If it is before the first → wrap to the last.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "We use this to handle scrolling and wrap-around behavior."},
            {
            title: `Practice: Calling array item`,
            code: `// Practice how you can use the array and the counter = 0. ^^
  String option = __BLANK[STATUSNAME]__ [__BLANK[TRACKNAME]__];^^`,
            descAfterCode: `What would the String option read?   __BLANK[OPTION]__`,
         }
         ],
      },
      {
        id: 6,
        title: "Step 6: Function for Menu Page",
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

          WELCOMEFUNCTION: { type: "identifier" },
          STATUSFUNCTION: { type: "identifier" },

          DISPLAY1: ["display.clearDisplay()"],
          DISPLAY2: ["display.setTextSize(2)", "display.setTextSize(3)"],
          DISPLAY3: ["display.setTextColor(SSD1306_WHITE)"],
          DISPLAY4: { type: "regex", pattern: '^display\\.println\\(".*"\\)$' },
          DISPLAY5: ["display.setTextSize(1)"],
          DISPLAY6: { type: "regex", pattern: "^display\\.setCursor\\(\\d+,\\s*\\d+\\)$" },
          DISPLAY7: { type: "regex", pattern: '^display\\.println\\(".*"\\)$' },
          DISPLAY8: ["display.display()"],

          STATUSCODE1: ["display.clearDisplay()"],
          STATUSCODE2: ["display.setTextSize(2)", "display.setTextSize(3)"],
          STATUSCODE3: { type: "regex", pattern: "^display\\.setCursor\\(\\d+,\\s*\\d+\\)$" },
          STATUSCODE4: ["display.setTextColor(SSD1306_WHITE)"],

          STATUSNAME2: { type: "identifier" },
          TRACKNAME2: { type: "identifier" },
        },
        blankExplanations: {
          STATUSNAME2:
            "Use the array name (without []) so you can index into it like name[index].",
          TRACKNAME2:
            "Use the variable that tracks which status index you’re currently on.",
        },
        blankDifficulties: {
          STATUSNAME2: "easy",
          TRACKNAME2: "easy",
        },
        codes: [
          {
            topicTitle: "Functions so far (welcome + status)",
            descBeforeCode:
              "Now we create a menu page, where pressing Next or Previous button allows the user to toggle around the status options",
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__, 
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__,
};
__BLANK[TOTTYPE]__ __BLANK[TOTNAME]__ = __BLANK[TOTNUM]__;
__BLANK[TRACKTYPE]__ __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__;

void __BLANK[WELCOMEFUNCTION]__(){
  __BLANK[DISPLAY1]__; //clear display
  __BLANK[DISPLAY2]__; //text size
  __BLANK[DISPLAY3]__; //text color
  __BLANK[DISPLAY4]__; //print line
  __BLANK[DISPLAY5]__; //text size
  __BLANK[DISPLAY6]__; //text cursor
  __BLANK[DISPLAY7]__; //print line
  __BLANK[DISPLAY8]__; //display
}^^

void __BLANK[STATUSFUNCTION]__(){
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__; 
  display.println(__BLANK[STATUSNAME2]__[__BLANK[TRACKNAME2]__]);^^ // show a status from the array using counter
}^^`,
            descAfterCode: `Now your project can:
  - Store multiple status options in an array  
  - Track the current option using an index variable  
  - Display the correct message on the OLED  

Variables track **where** you are. Arrays store **what choices** you have.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: null,
          },
        ],
      },
    ],
  },

  5: {
  phrase: "Variables + arrays: storing menu options and tracking state",
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

    {
      id: 3,
      title: "Step 3: While Loop for the Status Menu",
      codes: [
        {
          topicTitle: "Loop through status options",
          descBeforeCode: `Now we use a while loop to go through each item in the options array. Instead of printing numbers, we print status messages.
This code will be very similar to how you did in the array loop practice.`,
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `^^const String options[] = {
  "Sleeping",
  "Studying",
  "Gaming",
  "Do Not Disturb"
};
int __BLANK[SL_TOTALNAME]__ = 4;      ^^// total number of items in the array^^

int i = 0;
while (i < __BLANK[SL_TOTALUSE]__) {
  display.println(__BLANK[SL_PRINT]__);   ^^// print the status at index i^^
  __BLANK[SL_INC]__;                     ^^// move to the next index^^
}^^`,
          answerKey: {
            SL_TOTALNAME: { type: "identifier" },
            SL_TOTALUSE: { type: "sameAs", target: "SL_TOTALNAME" },
            SL_PRINT: { type: "expression" }, // options[i]
            SL_INC: ["i = i + 1", "i += 1"],
          },
          blankExplanations: {
            SL_TOTALNAME:
              "Choose a variable name that stores how many items are in the options array.",
            SL_TOTALUSE:
              "Use the same total-count variable you defined above so the loop stops correctly.",
            SL_PRINT:
              "Print the current option at index i using array indexing (array[i]).",
            SL_INC:
              "Increment i so the loop moves to the next index each time.",
          },
          blankDifficulties: {
            SL_TOTALNAME: "easy",
            SL_TOTALUSE: "easy",
            SL_PRINT: "medium",
            SL_INC: "easy",
          },
          descAfterCode:
            "The loop stops when i reaches the total count, so it still works if you add or remove statuses later.",
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: null,
        },
      ],
    },

    {
      id: 4,
      title: "Step 4: Highlight the Selected Status",
      codes: [
        {
          topicTitle: "Add a highlight indicator",
          descBeforeCode:
            "We want the menu to show which status is currently selected by displaying a symbol like > next to the status. We do this by checking if the loop index i matches a chosen index number.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `^^int indexChosen = 1;    ^^// example: 'Studying' is selected^^

const String options[] = {
  "Sleeping",
  "Studying",
  "Gaming",
  "Do Not Disturb"
};
int __BLANK[HL_TOTALNAME]__ = __BLANK[HL_TOTALCOUNT]__;      ^^// total items^^

int i = __BLANK[HL_STARTI]__;
while (i < __BLANK[HL_TOTALUSE]__) {
  if (i == indexChosen) {
    display.print("> ");        ^^// arrow for the selected item^^
  } else {
    display.print("  ");        ^^// spaces for others^^
  }
  display.println(options[i]);
  i = i + 1;
}^^`,
          answerKey: {
            HL_TOTALNAME: { type: "identifier" },
            HL_TOTALCOUNT: ["4"],
            HL_TOTALUSE: { type: "sameAs", target: "HL_TOTALNAME" },
            HL_STARTI: ["0"],
          },
          blankExplanations: {
            HL_TOTALNAME:
              "Choose a variable name that stores the total number of menu options.",
            HL_TOTALCOUNT:
              "This should match how many items are in the options array right now.",
            HL_TOTALUSE:
              "Use the same total-count variable you defined above in the while condition.",
            HL_STARTI:
              "Start the index at the first item of the array (the first index).",
          },
          blankDifficulties: {
            HL_TOTALNAME: "easy",
            HL_TOTALCOUNT: "easy",
            HL_TOTALUSE: "easy",
            HL_STARTI: "easy",
          },
          descAfterCode:
            "If i equals the chosen index, we print an arrow first. Otherwise we print spaces so everything stays aligned.",
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "Use an if statement inside the while loop to decide when to draw the arrow.",
        },
      ],
    },

    {
      id: 5,
      title: "Step 5: Create a Function that Draws the Menu on the OLED",
      codes: [
        {
          topicTitle: "Build showMenu() using a while loop",
          descBeforeCode:
            "Add a function that clears the screen, prints a title, then prints each status with a highlight for the selected one.",
          imageGridBeforeCode: {
            columns: 1,
            width: 400,
            height: 350,
            items: [
              {
                imageSrc: "/electric-status-board/videos/CurioLabL4.gif",
                label: "Menu preview",
              },
            ],
          },
          descBetweenBeforeAndCode:
            "Use the same while loop logic, but draw everything onto the OLED inside a function.",
          code: `^^void __BLANK[SHOWMENU]__() {
  display.__BLANK[SHOW_CLEAR]__;           // clear display buffer

  display.__BLANK[SHOW_SIZE]__(__BLANK[SHOW_SIZE_N]__);   // set text size
  display.__BLANK[SHOW_CURSOR]__(__BLANK[SHOW_X]__, __BLANK[SHOW_Y]__); // set cursor
  display.println(__BLANK[SHOW_HEADER]__);                // print header
  display.println("-------------------");

  int i = 0;
  while (__BLANK[WHILE_COND]__) {
    if (i == __BLANK[TRACKNAME]__) {
      display.print(__BLANK[HIGHLIGHT]__);  // selected indicator
    } else {
      display.print(__BLANK[NONHIGH]__);    // spacing
    }

    display.println(__BLANK[STATUS_AT_I]__); // print status text
    __BLANK[INC_I]__;                         // go to next index
  }

  display.display(); // push buffer to OLED
}^^`,
          answerKey: {
            SHOWMENU: { type: "identifier" },

            SHOW_CLEAR: ["clearDisplay()"],
            SHOW_SIZE: ["setTextSize"],
            SHOW_SIZE_N: { type: "range", min: 1, max: 3 },
            SHOW_CURSOR: ["setCursor"],
            SHOW_X: { type: "range", min: 0, max: 127 },
            SHOW_Y: { type: "range", min: 0, max: 63 },
            SHOW_HEADER: [
              '"Menu"',
              '"Status Menu"',
              '"Choose Status"',
              '"Select Status"',
            ],

            WHILE_COND: { type: "expression" }, // i < total
            TRACKNAME: { type: "identifier" }, // selected index variable name

            HIGHLIGHT: ['"> "', '"* "', '"-> "', '"• "'],
            NONHIGH: ['"  "'],

            STATUS_AT_I: { type: "expression" }, // array[i]
            INC_I: ["i = i + 1", "i += 1"],
          },
          blankExplanations: {
            SHOWMENU:
              "Pick a function name (any valid identifier). You’ll call this function when you want to draw the menu.",
            SHOW_CLEAR:
              "Clear the OLED’s buffer before drawing the menu.",
            SHOW_SIZE:
              "Use the function that sets text size on the OLED.",
            SHOW_SIZE_N:
              "Choose a small text size so multiple menu lines fit on the screen.",
            SHOW_CURSOR:
              "Set the cursor position before printing text.",
            SHOW_X:
              "Choose an x-position for the menu header (0 starts at the left).",
            SHOW_Y:
              "Choose a y-position near the top for the menu header.",
            SHOW_HEADER:
              "Pick a short header message that will appear at the top of the menu.",
            WHILE_COND:
              "Write the while condition that stops the loop at the right time (usually compares i to your total count).",
            TRACKNAME:
              "Use your variable name that tracks which option is selected (its value should match an index).",
            HIGHLIGHT:
              "Choose a symbol (string) that marks the selected option.",
            NONHIGH:
              "Use spaces so non-selected lines still align with the selected line.",
            STATUS_AT_I:
              "Print the status item at index i using array indexing (array[i]).",
            INC_I:
              "Increment i so the while loop moves to the next menu item.",
          },
          blankDifficulties: {
            SHOWMENU: "easy",
            SHOW_CLEAR: "easy",
            SHOW_SIZE: "easy",
            SHOW_SIZE_N: "easy",
            SHOW_CURSOR: "easy",
            SHOW_X: "easy",
            SHOW_Y: "easy",
            SHOW_HEADER: "easy",
            WHILE_COND: "medium",
            TRACKNAME: "easy",
            HIGHLIGHT: "easy",
            NONHIGH: "easy",
            STATUS_AT_I: "medium",
            INC_I: "easy",
          },
          descAfterCode:
            "Once this function works, you can call it whenever the user is on the menu screen.",
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: null,
        },
      ],
    },
  ],
  },

  6: {
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
  __BLANK[PRINT_LABEL]__;                           // print "Clock:"

  __BLANK[SIZE2]__;                                 // bigger text for time
  __BLANK[CALL_HELPER]__;                           // call HH:MM:SS clock function to print time here

  display.__BLANK[FLUSH]__;                          // update OLED display
}
^^
            `,
            answerKey: {
              SHOWTT: { type: "identifier" },
              CLEAR: ["clearDisplay()"],
              FLUSH: ["display()"],
              COLOR: ["display.setTextColor(SSD1306_WHITE)"],
              // allow ANY numeric text size (1,2,3,4,...)
              SIZE1: { type: "string", regex: "^display\\.setTextSize\\(\\s*\\d+\\s*\\)\\s*;?$" },
              SIZE2: { type: "string", regex: "^display\\.setTextSize\\(\\s*\\d+\\s*\\)\\s*;?$" },
              // just require display.print(...) (don’t check the content)
              PRINT_LABEL: { type: "string", regex: "^display\\.(print|println)\\(.*\\)\\s*;?$" },
              CALL_HELPER: { type: "sameAs", target: "SHOWTIME" },
            },

          blankExplanations: {
            SHOWTT:
              "This is the function name that draws the clock screen. It must be a valid identifier (no spaces).",

            CLEAR:
              "Clears the OLED buffer so old text doesn’t remain. Because the code is display.__BLANK[CLEAR]__; fill in clearDisplay().",

            COLOR:
              "Set the OLED text color to white using: display.setTextColor(SSD1306_WHITE).",

            SIZE1:
              "Set the text size for the label. Any number is allowed as long as you write display.setTextSize(number).",

            PRINT_LABEL:
              "Print a label using display.print(...) (or display.println(...)). The exact text doesn’t matter for grading.",

            SIZE2:
              "Set the text size for the actual time. Any number is allowed as long as you write display.setTextSize(number).",

            CALL_HELPER:
              "Call your time-printing helper function here. It should match the function name you created earlier for SHOWTIME (and include parentheses, like showTime()).",

            FLUSH:
              "Push the buffer to the screen so it appears. Because the code is display.__BLANK[FLUSH]__; fill in display().",
          },

          blankDifficulties: {
            CLEAR: "easy",
            COLOR: "easy",
            SIZE1: "easy",
            CURSOR1: "easy",
            PRINT_LABEL: "easy",
            SIZE2: "easy",
            CURSOR2: "medium",
            CALL_HELPER: "easy",
            FLUSH: "easy",
          },
          descAfterCode: `After you fill this in, calling \`showClockScreen()\` should display:
1) A label that says "Clock:" or anything you want. 
2) A large time in HH:MM:SS
3) A small hint at the bottom that says "PREV: Menu"

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








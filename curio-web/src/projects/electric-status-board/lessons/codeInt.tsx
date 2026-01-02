"use client";

import * as React from "react";
import CodeLessonBase from "@/src/lesson-core/CodeLessonBase";

export const LESSON_STEPS_INTERMEDIATE: Record<number, { phrase: string; advanced?: boolean; optional?: boolean; steps: any[] }> = {
  // =========================================================
  // LESSON 1
  // =========================================================
  1: {
    phrase: "OLED setup: libraries, screen dimensions, and button pins",
    advanced: false,
    steps: [
      {
        id: 1,
        title: "Step 1: Setting Libraries",
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
  // LESSON 2
  // =========================================================
  2: {
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
  // LESSON 3
  // =========================================================
  3: {
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
        title: "Step 4: Lists Are Perfect for Menu Options",
        codes: [
          {
            topicTitle: "Create your status array",
            descBeforeCode: `Instead of making many separate variables for each status, we store them all in a single array so the menu can move through them easily.
        
Think of at least four status that relates to your daily acitivity, like studying, working, playing, etc.
Place those status in an array. Create a name for that array.`,
            imageGridBeforeCode: null,
            descBetweenBeforeAndCode: null,
            code: `^^// List of menu status messages
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
__BLANK[TRACKTYPE]__ __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__; ^^

// Practice how you can use the array and the counter. ^^
String option = __BLANK[STATUSNAME]__ [__BLANK[TRACKNAME]__];^^`,

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
  - If it is before the first → wrap to the last

What would the String option read?   __BLANK[OPTION]__`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "We use this to handle scrolling and wrap-around behavior.",
          },
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
  display.println(__BLANK[STATUSNAME2]__[__BLANK[TRACKNAME2]__]);^^ // show one status from the array
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








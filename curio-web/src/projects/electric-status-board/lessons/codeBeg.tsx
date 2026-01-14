//https://wokwi.com/projects/447184024115506177

"use client";

import * as React from "react";
import CodeLessonBase from "@/src/lesson-core/CodeLessonBase";
import ESBProjectMindMapLessonBeg from "./ProjectMindMapLessonBeg";
import { TouchpadIcon } from "lucide-react";
import TotalCountArrayInteractive from "./counterVariableBeg";
import InputPullupCircuitInteractive from "./InputPullupCircuitInteractive";


export const LESSON_STEPS_BEGINNER: Record<number, { phrase: string; advanced?: boolean; steps: any[] }> = {

  1:{
    phrase: "Understand Project Logic",
    advanced: false,
    steps:[{
      title: "Understand Project Logic",
      customComponent: ESBProjectMindMapLessonBeg, // wrapper
    }
    ]
  },

  2: {
    phrase: "Arduino basics: setup(), loop(), and your first blink",
    advanced: false,
    steps: [
    {
      id: 1,
      title: "Step 1: Understanding Arduino Basics",
      desc:
        "Arduino is an open-source electronics platform used to create interactive projects. Every Arduino sketch has two main functions: setup() runs once when the board is powered on or reset, loop() runs continuously as long as the board has power.",
      hint: "pinMode() configures a pin as INPUT or OUTPUT",

      // all visual content goes through imageGrid, inside codes blocks
      codes: [
        {
          // this used to be step.gif
          imageGridBeforeCode: {
            columns: 1,
            width: 300,
            height: 320,
            items: [
              {
                imageSrc: "/electric-status-board/videos/CurioLabL1S1.gif",
                label: "Blink example",
              },
            ],
          },

          // this used to be descAfterCircuit
          descBetweenBeforeAndCode: `The LED’s positive leg (anode) connects to \`pin 13\`, and the negative leg (cathode) connects to \`GND\`. When the LED is connected to pin 13 on an Arduino, it blinks because pin 13 is set as a digital output. The code switches the pin between HIGH (5 V) and LOW (0 V), turning the LED on and off.`,

          code: `// Arduino Blink Example
^^void setup() {  // This runs once
  pinMode(13, OUTPUT);
}

void loop() { // This runs forever
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);^^
}`,

          // this used to be step.descAfterCode
          descAfterCode: `Here's what happens step by step:
    **1. Setup:** In the Arduino code, \`pinMode(13, OUTPUT);\` configures pin 13 to act as an output.
    **2. Loop:**
        - \`digitalWrite(13, HIGH);\` sends 5 V through the LED → the LED turns on.
        - \`delay(1000);\` keeps it on for one second.
        - \`digitalWrite(13, LOW);\` turns the voltage off → the LED turns off.
        - Another \`delay(1000);\` keeps the LED off for a second.

This continuous on/off cycle makes the LED blink once per second.`,
        },
      ],
    },
    ],
  },

  3: {
    phrase: "OLED setup: libraries, screen dimensions, and button pins",
    advanced: false,
    steps: [
    {
      id: 1,
      title: "Step 1: Setting Libraries",
      desc:
        "Coding libraries are collections of prewritten code that help you perform common tasks. Using libraries saves time and prevents you from having to write everything from scratch. For our electronic status board, we need the correct libraries to communicate with the SSD1306 OLED display over I²C and to draw text and shapes on the screen.",
      hint: "Adafruit_GFX provides drawing; Adafruit_SSD1306 is the OLED driver.",

      codes: [
        {
          code: `^^#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>^^

void setup(){
}

void loop(){
}`,

          descAfterCode: `This step adds three important libraries used for communicating with the OLED screen:

\`#include <Wire.h>\`
Enables I²C communication so the Arduino can talk to devices using just two wires: **SDA** (data) and **SCL** (clock).  
The SSD1306 OLED uses I²C, so this library is required.

\`#include <Adafruit_GFX.h>\`
Loads Adafruit’s graphics library. This provides the drawing tools you’ll use, like printing text, drawing shapes, and setting cursor positions.

\`#include <Adafruit_SSD1306.h>\`  
Loads the driver for the SSD1306 OLED controller. It knows how to send pixel-level commands so the display can show what you draw.

**Together, these libraries allow the Arduino to communicate with the OLED and render text and graphics on the screen.**`,
        },
      ],
    },
    {
      id: 2,
      title: "Step 2: Defining Screen",
      desc: `Define the OLED dimensions and create the display object. This allows the libaray to know the correct dimensions of the screen and to send data to the correct pixels. Many modules are 128×64; slim ones are 128×32. So now, we have to define the width to be 128 and height to be 64 or 32. 

**Fill in the blanks.**`,
      hint: "If your board has no RESET pin wired, keep RESET at -1.",

      codes: [
        {
          code: `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
^^
#define WIDTH  __BLANK[WIDTH]__.     // width of display in pixels
#define HEIGHT __BLANK[HEIGHT]__.    // height of display in pixels
#define RESET  -1
Adafruit_SSD1306 display (WIDTH, __BLANK[HEIGHT2]__ , &Wire, RESET);^^

void setup(){
}

void loop(){
}`,

          answerKey: {
            WIDTH: ["128"],
            HEIGHT: ["64", "32"],
            HEIGHT2: ["HEIGHT"],
          },

          blankExplanations: {
            WIDTH:
              "This is the horizontal pixel width of your OLED display. Most SSD1306 modules are 128 pixels wide.",
            HEIGHT:
              "This is the vertical pixel height of your OLED. Common values are 32 or 64 pixels depending on the screen size.",
            HEIGHT2:
              "Use the HEIGHT constant or variable you defined above. The display constructor must receive the same height value you set in #define HEIGHT. See how other constants are listed.",
          },

          blankDifficulties: {
            WIDTH: "easy",
            HEIGHT: "easy",
            HEIGHT2: "easy",
          },

          descAfterCode: `Here’s what the blanks represent:
- The first blank is for the **variable name** for height and the second blank describes the **screen’s height** (in pixels).
- The **value you fill in** should match your OLED module’s actual pixel height.
- The **same height variable** must be used again inside the \`display()\` constructor.`,
        },
      ],
    },
    {
      id: 3,
      title: "Step 3: Button Pins",
      desc: `Next, we name the three buttons to identify their Arduino pins as well as improve code readability. For this project, we need one button to move the cursor to the next option, one button to move to the previous option, and one button to select the highlighted option. If you want more practice working with buttons, review Lesson 1.`,
      hint: "Later, we'll set these pins to INPUT_PULLUP, which means the button will read LOW when pressed and HIGH when released.",

      codes: [
        {
          code: `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define WIDTH  __BLANK[WIDTH]__
#define HEIGHT __BLANK[HEIGHT]__
#define RESET  -1
Adafruit_SSD1306 display (WIDTH, __BLANK[HEIGHT2]__ , &Wire, RESET);
^^
#define PREV __BLANK[PREVN]__
#define NEXT __BLANK[NEXTN]__
#define __BLANK[SEL]__  __BLANK[SELN]__^^
 
void setup(){
}

void loop(){
}`,

          answerKey: {
            PREVN: { type: "range", min: 0, max: 13 }, // PREV button pin
            NEXTN: { type: "range", min: 0, max: 13 }, // NEXT button pin
            SEL: { type: "identifier" }, // SELECT define name
            SELN: { type: "range", min: 0, max: 13 }, // SELECT button pin
          },

          blankExplanations: {
            PREVN:
              "Enter the Arduino digital pin number connected to your PREV button (0-13). This must match the pin you connected in your wiring.",
            NEXTN:
              "Enter the Arduino digital pin number wired to your NEXT button (0–13). This must match the pin you connected in your wiring.",
            SEL:
              "This is the identifier (name) for your Select button constant, such as SELECT. It must be a valid C/C++ identifier.",
            SELN:
              "Enter the Arduino digital pin used for your Select button (0–13). This must match the pin you connected in your wiring.",
          },

          descAfterCode: `Use the digital pin numbers on your Arduino from **your circuit design**, which are the ones you used for the previous, next, and select buttons.
      
For example, the first blank for PREV can be 3 if you connected it to digital pin 3, as shown in the example circuit image below. Fill in the rest of the blanks for the Next and Select buttons based on your wiring.`,

          // this used to be step.circuitImage
          imageGridAfterCode: {
            columns: 1,
            rows: 1,
            items: [
              {
                imageSrc:
                  "https://dummyimage.com/600x400/ddd/000.png&text=Example+Circuit+Image",
                label: "Example circuit image",
              },
            ],
          },
        },
      ],
    },

    {
      id: 4,
      title: "Step 4: Initialize Display & Buttons",
      desc:
        "Now we need to start I²C, initialize the OLED display at address 0x3C, clear the screen, and set the button pins to INPUT_PULLUP. All of these actions are placed inside void setup() because they only need to run once at the beginning of the program. Refer to the descriptions below to understand what each function does.",
      hint: "INPUT_PULLUP ties the pin internally to Vcc, so a button to GND reads LOW when pressed.",

      codes: [
        {
          code: `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define WIDTH  __BLANK[WIDTH]__
#define HEIGHT __BLANK[HEIGHT]__
#define RESET  -1
Adafruit_SSD1306 display (WIDTH, __BLANK[HEIGHT2]__ , &Wire, RESET);

#define PREV __BLANK[PREVN]__
#define NEXT __BLANK[NEXTN]__
#define __BLANK[SEL]__  __BLANK[SELN]__   
^^
void setup() {
  Wire.begin();
  display.__BLANK[BEGIN]__(__BLANK[BEGINA]__, __BLANK[BEGINB]__);      // Initialize OLED

// set the modes for the buttons you are using 
  pinMode(PREV, INPUT_PULLUP);  // PREV button is an input, not output
  pinMode(__BLANK[NEXT]__, __BLANK[INPUT1]__);  // NEXT button
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);^^
}`,

          answerKey: {
            BEGIN: ["begin"],
            BEGINA: ["SSD1306_SWITCHCAPVCC"],
            BEGINB: ["0x3C"],
            CLEAR: ["clearDisplay()"],
            SETTEXTSIZE: ["setTextSize"],
            SETTEXTSIZE2: { type: "range", min: 1, max: 5 },
            SETTEXTCOLOR: ["setTextColor"],
            SETTEXTCOLOR2: ["SSD1306_WHITE", "SSD1306_BLACK", "SSD1306_INVERSE"],
            SETCURSOR: ["setCursor"],
            DISPLAY: ["display"],
            NEXT: ["NEXT"],
            INPUT1: ["INPUT_PULLUP"],
            PINMODE: ["pinMode"],
            SELECT: { type: "sameAs", target: "SEL" },
            INPUT2: ["INPUT_PULLUP"],
          },

          blankExplanations: {
            BEGIN:
              "This is the Adafruit SSD1306 function that initializes the display. Use begin so the display is ready to draw.",
            BEGINA:
              "This argument tells the display how to generate its internal voltage. For SSD1306 modules we usually use SSD1306_SWITCHCAPVCC.",
            BEGINB:
              "0x3C is the I²C address of the OLED display. Most SSD1306 OLED modules use 0x3C as their default address on the I²C bus, which tells the Arduino which device it should communicate with.",
            CLEAR:
              "Call the function that clears the display buffer, for example clearDisplay(). This wipes whatever was drawn before.",
            SETTEXTSIZE:
              "Use the function that sets the text size on the OLED, such as setTextSize.",
            SETTEXTSIZE2:
              "Choose a text size number (like 1, 2, or 3). Larger numbers make the characters bigger on the screen.",
            SETTEXTCOLOR:
              "Use the function that sets the text color on the OLED, such as setTextColor.",
            SETTEXTCOLOR2:
              "Pick a text color constant such as SSD1306_WHITE (normal), SSD1306_BLACK (erase), or SSD1306_INVERSE (inverted).",
            SETCURSOR:
              "Use the function that sets the text cursor position, such as setCursor. It takes x and y pixel positions as arguments.",
            DISPLAY:
              "This should be the function that actually sends the current buffer to the OLED, usually display().",
            NEXT:
              "Use the name of the constant you defined earlier for the NEXT button pin (for example NEXT), not the pin number directly.",
            INPUT1:
              "Use the pin mode constant that enables the internal pull-up for the NEXT button, usually INPUT_PULLUP.",
            PINMODE:
              "This should be the Arduino function pinMode, which sets whether a pin is an INPUT, OUTPUT, or INPUT_PULLUP.",
            SELECT:
              "Use the identifier you used in your earlier #define for the Select button (for example SELECT, SEL, select, selection, etc.).",
            INPUT2:
              "Use INPUT_PULLUP, so the Select button uses the same pull-up wiring pattern as the rest of the buttons.",
          },

          descAfterCode: `Here is what each function in **setup()** does:
\`Wire.begin();\`  
Starts the I²C communication bus so the Arduino can talk to devices like the OLED display using SDA (data) and SCL (clock). This must be called before using any I²C device.

\`display.begin(A, B);\`  
Initializes the OLED and prepares it for drawing.  
@ **A**: usually **SSD1306_SWITCHCAPVCC**, which tells the display how to power its internal circuits.  
@ **B**: the OLED’s I²C address, most commonly **0x3C**.

\`display.clearDisplay();\`  
Clears the display’s internal pixel buffer. The screen becomes blank after the next call to **display.display();**.

\`display.setTextSize(A);\`  
Sets the size (scale) of the text.  
@ **A**: any integer >= 1
    ➜ 1 = smallest, 2 = medium, 3 = large, etc.

\`display.setTextColor(A);\`  
Sets how text pixels are drawn.  
@ **A** can be:  
    ➜ \`SSD1306_WHITE\`: pixels ON (bright text)  
    ➜ \`SSD1306_BLACK\`: pixels OFF (used to erase)  
    ➜ \`SSD1306_INVERSE\`: invert black/white for highlighting

\`display.setCursor(A,B);\`  
Moves the text cursor to a new position on the screen.  
@ **A**: x-position in pixels from the left  
@ **B**: y-position in pixels from the top

\`display.display();\`  
Updates the physical OLED screen by sending the entire buffer to the display hardware.

\`pinMode(A,B);\`  
Configures the button pins as inputs with internal pull-up resistors.  
@ **A**: the button pin (e.g., \`PREV\`)  
@ **B**: \`INPUT_PULLUP\`, meaning:  
    ➜ Button not pressed → reads **HIGH**  
    ➜ Button pressed → reads **LOW**`,
        },
      ],
    },
    ],
  },

  4: {
    phrase: "Screen: Welcome message",
    advanced: false,
    steps: [
      {
        id: 1,
        title: "Step 1: Display First (Welcome) Page",
        codes: [
          {
            topicTitle: "Welcome Screen Function",
            descBeforeCode: `**Clear the screen, print a big greeting.**
You will create a welcome message by calling it in the setup(). As a reminder, functions are reusable blocks of code that perform a specific task. 
Since we want the welcome page to show up only **ONCE when we turn the device on**, we will place that function in the **setup()**. Recall the important display functions from Lesson 2 Step 4. Use those functions to fill each blank in the code.`,
          },{
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
`           },{

          // this used to be descAfterCircuit
          code: `^^#include <Wire.h> 
...
...
void setup(){
  Wire.begin();
  display.__BLANK[BEGIN]__(__BLANK[BEGINA]__, __BLANK[BEGINB]__);      // Initialize OLED
  __BLANK[WELCOMEFUNCTION]__;  // Call welcome function once at startup
}

void loop(){
}

void __BLANK[WELCOMEFUNCTION]__ {
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
  // Same blank appears twice: must match exactly
  WELCOMEFUNCTION: { type: "identifier" },
  DISPLAY1: ["display.clearDisplay()"],
  DISPLAY2: ["display.setTextSize(1)", "display.setTextSize(2)", "display.setTextSize(3)"],
  DISPLAY3: ["display.setTextColor(SSD1306_WHITE)", "display.setTextColor(SSD1306_INVERSE)"],

  // The “print line” comment in your template is misleading — this line MUST set cursor.
  // So we validate it as setCursor(...)
  DISPLAY4: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },
  DISPLAY5: ["display.setTextSize(1)", "display.setTextSize(2)", "display.setTextSize(3)"],
  DISPLAY6: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },

  // Allow print or println (kids may do either)
  DISPLAY7: { type: "string", regex: "^display\\.(print|println)\\(.*\\)$" },

  DISPLAY8: ["display.display()"],
},

blankExplanations: {
  WELCOMEFUNCTION:
    "This is the NAME of your welcome function (example: welcomeScreen). It must be a valid function identifier: letters/underscores, not starting with a number, no spaces.",

  DISPLAY1:
    "Clears the OLED’s drawing buffer so you start with a blank screen. Use: display.clearDisplay().",

  DISPLAY2:
    "Sets the text size for the first part of the welcome screen. Common values: 1 (small), 2 (medium), 3 (large).",

  DISPLAY3:
    "Sets text color mode. Most of the time you use SSD1306_WHITE so text shows up. SSD1306_INVERSE is a fun option for highlighting.",

  DISPLAY4:
    "Moves the cursor to where the first text should start. Must be display.setCursor(x, y) where x and y are pixel coordinates.",

  DISPLAY5:
    "Optionally change the text size again (example: big title then smaller subtitle).",

  DISPLAY6:
    "Move the cursor again before the next line, so your second line prints lower on the screen.",

  DISPLAY7:
    'Print your welcome message line (example: display.println("Hello!");). You can use print or println.',

  DISPLAY8:
    "Updates the physical OLED screen by pushing the buffer to the display. Without display.display(), nothing shows up.",
},

blankDifficulties: {
  WELCOMEFUNCTION: "easy",
  DISPLAY1: "easy",
  DISPLAY2: "easy",
  DISPLAY3: "easy",
  DISPLAY4: "easy",
  DISPLAY5: "easy",
  DISPLAY6: "medium",
  DISPLAY7: "easy",
  DISPLAY8: "easy",
},

          descAfterCode: `Try to modify your welcome message to say something different! You can also change the text size and cursor positions to make it look unique.`,
        },
          {
            topicTitle: "Useful Functions",
            descBeforeCode:`**Here are some useful functions to help you create your welcome message:**
            display.begin(A, B);
            display.clearDisplay();
            display.setTextSize(A);
            display.setTextColor(A);
            display.setCursor(A,B);
            display.print("text");
            display.display();`
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
      desc: "In order to display the status that we want we need to clear the screen then print the status chosen from the menu screen",

      codes: [
        {
          code: `void __BLANK[WELCOMEFUNCTION]__{
  __BLANK[DISPLAY1]__; //clear display
  __BLANK[DISPLAY2]__; //text size
  __BLANK[DISPLAY3]__; //text color
  __BLANK[DISPLAY4]__; //print line
  __BLANK[DISPLAY5]__; //text size
  __BLANK[DISPLAY6]__; //text cursor
  __BLANK[DISPLAY7]__; //print line
  __BLANK[DISPLAY8]__; //display
}
 ^^  
void __BLANK[STATUSFUNCTION]__{
  __BLANK[STATUSCODE1]__; //clear display
  __BLANK[STATUSCODE2]__; //text size
  __BLANK[STATUSCODE3]__; //text cursor
  __BLANK[STATUSCODE4]__; //print line
  display.__BLANK[DISPLAY9]__; //display
}^^`,

          answerKey: {STATUSFUNCTION: { type: "identifier" },
                      STATUSCODE1: ["display.clearDisplay()"],
                      STATUSCODE2: { type: "string", regex: "^display\\.setTextSize\\(\\s*\\d+\\s*\\)\\s*;?$" },
                      STATUSCODE3: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)\\s*;?$" },
                      STATUSCODE4: { type: "string", regex: "^display\\.(print|println)\\(.*\\)\\s*;?$" },

                      // In your code you wrote: display.__BLANK[DISPLAY9]__;
                      // That blank MUST include parentheses in the stored value.
                      DISPLAY9: ["display()"],
                    },
          blankExplanations: {
              STATUSFUNCTION:
                "This is the NAME of your function that draws the chosen status screen (example: showStatus). Must be a valid identifier.",
              STATUSCODE1:
                "Clear the OLED buffer at the start of the status screen so old menu text doesn’t remain.",
              STATUSCODE2:
                "Set the text size for the status screen (example: display.setTextSize(2);).",
              STATUSCODE3:
                "Set the cursor position for where the status text should start (example: display.setCursor(0, 0);).",
              STATUSCODE4:
                'Print the status text. Example: display.println("Studying"); or display.println(option);',
              DISPLAY9:
                "Push the buffer to the OLED so the printed status actually appears. Use display.display().",
            },
            blankDifficulties: {
              STATUSFUNCTION: "easy",
              STATUSCODE1: "easy",
              STATUSCODE2: "easy",
              STATUSCODE3: "easy",
              STATUSCODE4: "easy",
              DISPLAY9: "easy",
            },


          descAfterCode: `Here are specific instructions on what each line of the code should do at it's minimum. You can also add more functinalities to this in the code editor.
**Line 1:** clear the display.
**Line 2:** set text size.
**Line 3:** set cursor location.
**Line 4:** print an example status like "Studying, Working, Coding, etc".`,
        },{
            topicTitle: "Try Simulation",
            descBeforeCode:`Paste the code into simaulator and run it to check if the status message displays as intended. Replace your Welcome Message Function with the Status Function in the setup() to see the status message on the screen.`,
            imageGridBeforeCode: {
              columns: 1,
              width: 400,
              height:350,
              items: [
                {
                  imageSrc: "/electric-status-board/statusScreen.png",
                  label: "Example: status screen",
                },
              ],
            },  

        }
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
      title: "Step 1: What Is a Variable?",
      desc:
        "Variables act like labeled boxes in the Arduino’s memory where values are stored. Each variable has a type, a name, and a value.",
      hint: "A variable stores exactly one piece of information.",

      codes: [
        {
          title: `Practice: Variables`,
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
- \`float\` : decimal numbers
`,
        },
      ],
    },

    {
      id: 2,
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
      title: "Step 3: Variable for Screen States",
      desc: `In order to keep track of which screen the user is currently on (menu screen, status menu screen, status screen), we will create a variable. This variable will assign a number that represents the current screen state. For example, 0 for menu screen, and 1 for status menu screen.`,
      codes: [
        {
          topicTitle: "Screen State Variable",
          descAfterCode: `Assign numbers for each screen state based on your preference. Fill in the blanks to create a variable that tracks the current screen state.
Example: 0 → Main Menu : means we should be on the Main Menu screen.
**Use: "Main Menu", "Status Menu", "Status Screen" for screen names.**
__BLANK[STATENAME]__ = 0 → __BLANK[SCREEN1]__
__BLANK[STATENAME]__ = 1 → __BLANK[SCREEN2]__
__BLANK[STATENAME]__ = 2 → __BLANK[SCREEN3]__`,
          code: `^^
//<< Integer variable to track current screen
__BLANK[STATETYPE]__ __BLANK[STATENAME]__ = __BLANK[STATEVALUE]__; // initalize to be = 0.

^^`,    
    },{
      topicTitle: "Understanding Screen States",
      descAfterCode: `For example, you chose index 0 in the Main Menu options, which corresponds to Status. The screen state variable should now be updated to integer 1. Next time through loop(), the program will see if the screen state variable == 1, and if so, it will call the function to draw the Status Menu screen.
**Warning:** These numbers and indexes are just examples. You choose your own numbers, indexes, and order of the lists.
      `,
      imageGridAfterCode: {
        columns: 1,
        height: 500,
        width: 900,
        items: [
          {
            imageSrc: "/electric-status-board/understandingScreenVariable.png",
            label: "Example: screen state variable usage",
          },
        ],
      },
    }
  
  ],
  },

    {
      id: 4,
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
          },
          descBetweenBeforeAndCode: `Here we practice creating arrays of strings and accessing items by index. Fill the blanks below to complete the examples.`,

          title: `Practice: Arrays`,
          code: `// List of four numbers^^
int numbers[] = {1, 2, 3, 4};
int select = numbers [1];^^

// List of five chars. ^^
char favLetters[] = {'A', 'D', 'F', 'H', 'K', 'M'};
char best = favLetters[3];^^

// Create an array of String of four differet colors. ^^
__BLANK[ARRAYTYPE]__  __BLANK[ARRAYNAME]__ = __BLANK[ARRAY]__;^^

/* Assign a variable named favoriteColor that calls your favorite color within the array. */
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
        },
        {
          title: `More Practice:`,
          code: `^^String days[] = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};

//Fill in the blanks:
days[3] =  __BLANK[DAY]__
days[1] =  __BLANK[DAY2]__
days[__BLANK[DAY3]__] = Monday
days[__BLANK[DAY4]__] = Sunday^^`,

          answerKey: {
            DAY: ["Thursday"],
            DAY2: ["Tuesday"],
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
      ],
    },

    {
      id: 5,
      title: "Step 4: Creating Lists for Menu Options",
      desc: `Instead of making many separate variables for each status, we store them all in a single array so the menu can move through them easily.
        
Think of at least four status that relates to your daily acitivity, like studying, working, playing, etc.
Place those status in an array. Create a name for that array.`,
      hint: "This is the same structure used in your favoriteColor array.",

      codes: [
        {
          code: `^^// List of menu status messages
__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__,
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__
};^^`,
        answerKey: {
          STATUSTYPE: ["String"],
          STATUSNAME: { type: "string", regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\[\\s*\\]$" },

          // Each should be a quoted string (you want them to type their own, so validate format)
          STATUSLIST1: { type: "string", regex: '^".*"$' },
          STATUSLIST2: { type: "string", regex: '^".*"$' },
          STATUSLIST3: { type: "string", regex: '^".*"$' },
          STATUSLIST4: { type: "string", regex: '^".*"$' },
        },

        blankExplanations: {
          STATUSTYPE:
            "Your array is storing text messages, so the type is String.",
          STATUSNAME:
            "This is the NAME of the array and must include [] at the end. Example: statuses[] or options[].",
          STATUSLIST1:
            'A status message in double quotes. Example: "Studying".',
          STATUSLIST2:
            'Another status message in double quotes. Example: "Working".',
          STATUSLIST3:
            'Another status message in double quotes. Example: "Gaming".',
          STATUSLIST4:
            'Another status message in double quotes. Example: "Do Not Disturb".',
        },

        blankDifficulties: {
          STATUSTYPE: "easy",
          STATUSNAME: "medium",
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
        },
      ],
    },

    {
      id: 6,
      title: "Step 5: Counting Items in the List",
      desc: `Arrays don’t automatically know how many items they contain, so we store the total count in a variable.
Create a variable that stores the total **number** of status in the array.`,
      hint: "We use this to handle scrolling and wrap-around behavior.",

      codes: [
        {
          imageGridBeforeCode: {
            columns: 1,
            rows: 1,
            items: [
              {
                imageSrc: "/electric-status-board/CurioLabL4.gif",
                label: "Status Board menu",
              },
            ],
          },

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

            // they can have 4+ statuses; just enforce it's a positive integer
            TOTNUM: { type: "range", min: 1, max: 50 },

            TRACKTYPE: ["int"],
            TRACKNAME: { type: "identifier" },
            TRACKNUM: ["0"],

            // “What would option read?” depends on their own list, so don’t hardgrade it.
            OPTION: { type: "string" },
          },

          blankExplanations: {
            TOTTYPE:
              "This variable stores a count (whole number), so use int.",
            TOTNAME:
              "A variable name for the total number of status options. Example: totalOptions or totalStatuses.",
            TOTNUM:
              "The number of items in your status array (example: 4 if you listed 4 statuses). This MUST match how many strings you put in the array.",
            TRACKTYPE:
              "The menu index/cursor is a whole number, so use int.",
            TRACKNAME:
              "A variable name for the current selected index. Example: index, cursor, selectedIndex.",
            TRACKNUM:
              "Start at 0 so the first element of the array is selected at the beginning.",
            OPTION:
              "This is whatever status string is at index 0 (because the counter starts at 0). It depends on what YOU put as the first status in the array.",
          },

          blankDifficulties: {
            TOTTYPE: "easy",
            TOTNAME: "medium",
            TOTNUM: "medium",
            TRACKTYPE: "easy",
            TRACKNAME: "medium",
            TRACKNUM: "easy",
            OPTION: "easy",
          },

            descAfterCode: `These two variables let the menu scroll correctly. In our code we can check the value of counter:
@ If it is past the last item → wrap back to the first  
@ If it is before the first → wrap to the last.`,
            imageGridAfterCode: null,
            descAfterImage: null,
            hint: "We use this to handle scrolling and wrap-around behavior."
          },
            {
            title: `Practice: Calling array item`,
            code: `// Practice how you can use the array and the counter = 0. ^^
  String EXAMPLE_OPTION = __BLANK[STATUSNAME]__ [__BLANK[TRACKNAME]__];^^`,
            descAfterCode: `What would the String EXAMPLE_OPTION read?   __BLANK[OPTION]__`,
            },
      ],
    },

    {
      id: 7,
      title: "Step 6: Function for Chosen Status Display",
      desc:
        "Now we create a menu page, where pressing Next or Previous button allows the user to toggle around the status options",

      codes: [
        {
          topicTitle: "Update Show Status Function",
          descBeforeCode: `We already created a function to display the chosen status on the screen. But, we originally hardcoded the status text with something like "Studying" or "Working". Now, we will modify that function to use the array and the counter variable to display the correct status based on what the user selected from the menu.`,
          code: `__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__, 
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__,
};
__BLANK[TOTTYPE]__ __BLANK[TOTNAME]__ = __BLANK[TOTNUM]__;
__BLANK[TRACKTYPE]__ __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__;

void __BLANK[WELCOMEFUNCTION]__{
  __BLANK[DISPLAY1]__; //clear display
  __BLANK[DISPLAY2]__; //text size
  __BLANK[DISPLAY3]__; //text color
  __BLANK[DISPLAY4]__; //print line
  __BLANK[DISPLAY5]__; //text size
  __BLANK[DISPLAY6]__; //text cursor
  __BLANK[DISPLAY7]__; //print line
  __BLANK[DISPLAY8]__; //display
}^^
//<< Function to show chosen status on screen 
void __BLANK[STATUSFUNCTION]__{  
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__; 
  display.println(__BLANK[STATUSNAME2]__[__BLANK[TRACKNAME2]__]); // display your array of status indexed by the counter variable^^
}^^`,}
      ],
    },
    ],
  },

  6: {
    phrase: "Loops: while loops and iterating through arrays",
    advanced: false,
    steps: [
    {
      id: 1,
      title: "Step 1: What is a Loop?",
      desc:
        "We already have an array of status messages. Now we want to print ALL of them without writing many repeated lines of code.",
      hint: "Imagine you had 10 or 20 statuses. You wouldn’t want to copy-paste the same line 20 times.",

      codes: [
        {
          code: `^^//<< Without a loop (not flexible)
display.println(options[0]);
display.println(options[1]);
display.println(options[2]);
display.println(options[3]);

//<<Better idea: use a loop to repeat the same pattern for each item.^^`,
          descAfterCode: `Without a loop, you have to write a separate line for every status in the array. If you add or remove items, you must rewrite the code.

Loops fix this problem by repeating the same code for each index in the array. In the next steps, we will use a **while loop** to walk through the list of options automatically.`,
        },
      ],
    },

    {
      id: 2,
      title: "Step 2: Basic While Loop",
      desc:
        "A while loop repeats a block of code as long as its condition is true. Here is a simple example that prints numbers.",
      hint: "Focus on the three parts: start value, condition, and update.",

      codes: [
        {
          title: "Practice: How While Loops are used",
          code: `^^int i = 0;                      ^^// 1. start value^^
while (i < 4) {                 ^^// 2. condition^^
  Serial.println(i);
  i = i + 1;                    ^^// 3. update (moves i forward)^^
}^^`,
          descAfterCode: `This loop prints the numbers 0, 1, 2, and 3, then stops when \`i < 4\` becomes false.

The pattern is:
- **Start value:** \`int i = 0;\`
- **Condition:** \`i < 4\` → “keep going while this is true”
- **Update:** \`i = i + 1;\` → move to the next number
If you forget the update line, the loop never ends, because \`i\` would stay the same forever.

What does the \`i\` read after while loop ends?    __BLANK[ANSWEREX]__`,
          answerKey: {
            ANSWEREX: ["4"],
          },
          blankExplanations: {
            ANSWEREX:
              "The loop starts at i = 0 and keeps running while i < 4. It prints 0, 1, 2, 3, then increments to 4. When i becomes 4, the condition (i < 4) is false, so the loop stops. Final value: 4.",
          },
          blankDifficulties: {
            ANSWEREX: "easy",
          },
        },
        {
          title: "Loop Practice 1: Print Even Numbers",
          descBeforeCode:
            "Write a while loop that prints only the even numbers from 2 to 10. Start at 2 and increase by 2 at each loop.",
          code: `^^int num = 2;
while (num < __BLANK[LOOP1]__){
  Serial.println(__BLANK[LOOP2]__);
  num = num + __BLANK[LOOP3]__;
}^^`,
          answerKey: {
            LOOP1: ["11"],                 // stop once num reaches 10, so condition should be num < 11
            LOOP2: ["num"],                // print the variable num
            LOOP3: ["2"],                  // increase by 2 each time
          },
          blankExplanations: {
            LOOP1:
              "We want to print even numbers up to 10. If we use `while (num < 11)`, the last printed value can be 10. (If we used `< 10`, it would stop at 8.)",
            LOOP2:
              "You should print the current value of the variable `num` each loop.",
            LOOP3:
              "To jump between even numbers (2 → 4 → 6 → 8 → 10), add 2 each time.",
          },
          blankDifficulties: {
            LOOP1: "easy",
            LOOP2: "easy",
            LOOP3: "easy",
          },
        },
        {
          title: "Loop Practice 2: Print Multiples of 3",
          descBeforeCode:
            "Write a while loop that prints the multiples of 3 from 3 to 27. Start at 3.",
          code: `^^int x = __BLANK[LOOP5]__;
while (__BLANK[LOOP6]__ < __BLANK[LOOP7]__){
  Serial.println(__BLANK[LOOP8]__);
  x = __BLANK[LOOP9]__;
}^^`,
          answerKey: {
            LOOP5: ["3"],        // start at 3
            LOOP6: ["x"],        // loop condition uses x
            LOOP7: ["28"],       // allow 27 to print: while (x < 28)
            LOOP8: ["x"],        // print x
            LOOP9: ["x + 3"],    // increment by 3
          },
          blankExplanations: {
            LOOP5:
              "Multiples of 3 starting at 3 means initialize x to 3.",
            LOOP6:
              "The while loop should compare the variable `x` against an upper limit.",
            LOOP7:
              "To include 27, use an upper bound just above it, like 28, with `<`. (So 27 prints, then x becomes 30 and stops.)",
            LOOP8:
              "Print the current multiple: `x`.",
            LOOP9:
              "Advance to the next multiple of 3 by adding 3 each loop.",
          },
          blankDifficulties: {
            LOOP5: "easy",
            LOOP6: "easy",
            LOOP7: "medium",
            LOOP8: "easy",
            LOOP9: "easy",
          },
        },
        {
          title: "Loop Practice 3: Stop when a Number Reaches a Limit",
          descBeforeCode:
            "Write a while loop that multiplies the number by 2 each loop and stop when the number is greater than 100.",
          code: `^^int __BLANK[LOOP10]__ = 5;
while (__BLANK[LOOP11]__ < __BLANK[LOOP12]__){
  Serial.println(__BLANK[LOOP13]__);
  __BLANK[LOOP14]__ = __BLANK[LOOP15]__;
}^^`,
          answerKey: {
            LOOP10: ["value", "num", "x"], // any valid identifier is fine
            LOOP11: { type: "sameAs", target: "LOOP10" },
            LOOP12: ["101"],              // stop when > 100, so continue while < 101
            LOOP13: { type: "sameAs", target: "LOOP10" },
            LOOP14: { type: "sameAs", target: "LOOP10" },
            LOOP15: { type: "string", regex: "^(\\s*__BLANK\\[LOOP10\\]__\\s*\\*\\s*2\\s*|\\s*\\w+\\s*\\*\\s*2\\s*)$" },
          },
          blankExplanations: {
            LOOP10:
              "Pick a variable name (identifier) to store the number you keep doubling, like `value` or `num`.",
            LOOP11:
              "This should be the same variable as LOOP10 (the number you’re tracking). The loop condition uses that same variable.",
            LOOP12:
              "We stop when the number becomes greater than 100. Using `while (num < 101)` guarantees you’ll stop right after passing 100.",
            LOOP13:
              "Print the same variable you are doubling each time so you can watch it grow.",
            LOOP14:
              "This left side should be the same variable name again, because you are updating that variable.",
            LOOP15:
              "Update the variable by doubling it each loop: `num * 2` (or `value * 2`).",
          },
          blankDifficulties: {
            LOOP10: "easy",
            LOOP11: "easy",
            LOOP12: "medium",
            LOOP13: "easy",
            LOOP14: "easy",
            LOOP15: "easy",
          },
        },
        {
          title: "Loop Practice 4: Loop Until Botton Press",
          descBeforeCode:
            'Simulate a loop that keeps printing "Waiting..." until `ready` becomes `true`.',
          code: `^^__BLANK[LOOP16]__ ready = __BLANK[LOOP17]__;
while (__BLANK[LOOP11]__ == false){
  Serial.println(__BLANK[LOOP13]__);
}^^`,
          answerKey: {
            LOOP16: ["bool"],
            LOOP17: ["false"],
            // LOOP11 is used here as the variable name in: while (__BLANK[LOOP11]__ == false)
            // It must match the variable being loop-checked (ready). Since your code uses `ready`,
            // the simplest correct answer is to require LOOP11 to be "ready".
            LOOP11: ["ready"],
            LOOP13: ['"Waiting..."', '"Waiting..."', '"Waiting..."'], // allow exact string
          },
          blankExplanations: {
            LOOP16:
              "`ready` is a true/false value, so its type should be `bool`.",
            LOOP17:
              "Start with `ready = false` so the loop runs and keeps printing until something changes it to true.",
            LOOP11:
              "This blank is the variable the loop checks. Since your variable is named `ready`, the condition should be `while (ready == false)`.",
            LOOP13:
              "This should print the message each loop. Put the string literal in quotes: `\"Waiting...\"`.",
          },
          blankDifficulties: {
            LOOP16: "easy",
            LOOP17: "easy",
            LOOP11: "easy",
            LOOP13: "easy",
          },
        },
        {
          title: "Loop Practice 5: Loop through Array 1",
          descBeforeCode:
            "Loop through an array of integers and display the desired number.",
          code: `^^int nums[] = {2, 4, 7, 9, 11, 14};
int total = __BLANK[LOOP14]__;   ^^// total number of items in the array^^
int desiredNum = __BLANK[LOOP15]__;

int j = 0;
while (j < total) {
  if (nums[j] == __BLANK[LOOP16]__) {
    Serial.println("Target reached!");
    Serial.println(desiredNum);   ^^// print the desired number^^
    break;                        ^^// stop the loop^^
  }
j = j + 1 ^^ // increment to the next index^^
}^^`,
          answerKey: {
            LOOP14: ["6"],      // total items in nums[] (2,4,7,9,11,14)
            LOOP15: { type: "range", min: 0, max: 20 }, // desiredNum can be any number, but typically one from the array
            LOOP16: { type: "sameAs", target: "LOOP15" }, // compare against desiredNum
          },
          blankExplanations: {
            LOOP14:
              "This array has 6 items, so `total` should be 6. That ensures the while loop visits indices 0 through 5.",
            LOOP15:
              "Choose the number you want to find in the array (commonly one of the values inside nums[], like 9 or 14).",
            LOOP16:
              "To detect the target, compare `nums[j]` to the SAME number stored in `desiredNum`.",
          },
          blankDifficulties: {
            LOOP14: "easy",
            LOOP15: "easy",
            LOOP16: "easy",
          },
        },
        {
          title: "Loop Practice 6: Loop through Array 2",
          descBeforeCode:
            'Loop through an array of integers and display "Here is the number:" followed by the desired number.',
          code: `^^int __BLANK[LOOP17]__ = {4, 3, 2, 10, 1, 6};
int total = __BLANK[LOOP18]__;   ^^// total number of items in the array^^
int __BLANK[LOOP19]__ = __BLANK[LOOP20]__;   ^^// desired number to display^^

int __BLANK[LOOP21]__ = __BLANK[LOOP22]__;
while (__BLANK[LOOP21]__ < total) {
  if (__BLANK[LOOP23]__ == __BLANK[LOOP24]__) {  ^^ // if the number in the array equals the desired number^^
    Serial.println("Here is the number:");
    Serial.println(__BLANK[LOOP25]__);   ^^     // print the desired number^^
    break;                        ^^// stop the loop^^
  }
  __BLANK[LOOP26]__ = __BLANK[LOOP23]__ + 1;  ^^           // increment to the next index^^
}^^`,
          answerKey: {
            LOOP17: {
              type: "string",
              regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\[\\s*\\]$",
            },
            LOOP18: ["6"],
            LOOP19: { type: "identifier" },
            LOOP20: { type: "range", min: 0, max: 20 },            // choose a desired number
            LOOP21: ["k", "i", "j", "idx"],                         // loop index variable name
            LOOP22: ["0"],
            LOOP23: { type: "string", regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\[\\s*__BLANK\\[LOOP21\\]__\\s*\\]$" },
            LOOP24: { type: "sameAs", target: "LOOP20" },           // compare to desired value
            LOOP25: { type: "sameAs", target: "LOOP19" },           // print the desired number variable
            LOOP26: { type: "sameAs", target: "LOOP21" },           // increment index variable
          },
          blankExplanations: {
            LOOP17:
              "This is the name of the integer array variable, and it must include `[]`, like `nums[]`.",
            LOOP18:
              "There are 6 numbers inside the array, so `total` should be 6.",
            LOOP19:
              "Create a variable name to store the desired number, like `desiredNum`.",
            LOOP20:
              "Pick the number you want to find and print (often one that exists in the array).",
            LOOP21:
              "This is the index variable used to walk through the array, like `k` or `i`.",
            LOOP22:
              "Start at index 0 because arrays are 0-indexed.",
            LOOP23:
              "This should reference the current element in the array using your index variable: `nums[k]` (arrayName[indexVar]).",
            LOOP24:
              "Compare the current array element to the exact desired value you chose (the same value as LOOP20).",
            LOOP25:
              "When you find the target, print the variable that stores the desired number (LOOP19).",
            LOOP26:
              "Increment the index variable so the loop moves to the next element: `k = k + 1`.",
          },
          blankDifficulties: {
            LOOP17: "medium",
            LOOP18: "easy",
            LOOP19: "easy",
            LOOP20: "easy",
            LOOP21: "easy",
            LOOP22: "easy",
            LOOP23: "medium",
            LOOP24: "easy",
            LOOP25: "easy",
            LOOP26: "easy",
          },
        },
      ],
    },

    {
      id: 3,
      title: "Step 3: While Loop for the Status Menu",
      desc: `Now we use a while loop to go through each item in the options array. Instead of printing numbers, we print status messages.
 This code will be very similar to how you did in the "Loop Through Array" practice.`,

      codes: [
        {
          title: "Practice: Loop through Example Status Options",
          code: `^^const String optionsExample[] = {
  "Sleeping",
  "Studying",
  "Gaming",
  "Do Not Disturb"
};
int __BLANK[SL1]__ = 4;      ^^// total number of items in the array^^

int i = 0;
while (i < __BLANK[SL2]__) {
  display.print(__BLANK[SL3]__);   ^^// print the status at index i^^
  __BLANK[SL4]__;                    ^^// move to the next index^^
}^^`,
          answerKey: {
            SL2: { type: "sameAs", target: "SL1" },
            SL3: ["optionsExample[i]", "optionsExample[ i ]"],
            SL4: ["i = i + 1", "i++"],
          },
          blankExplanations: {
            SL1:
              "Name a variable that stores the total number of items in the optionsExample array (here it’s 4). A clear name is `totalOptions`.",
            SL2:
              "The while loop should compare `i` to the SAME total variable you integer variabledefined in above for total number of items",
            SL3:
              "To print each status, you must print the array element at index i: `optionsExample[i]`.",
            SL4:
              "Increment i so the loop moves to the next index. Otherwise it would never end.",
          },
          blankDifficulties: {
            SL1: "easy",
            SL2: "easy",
            SL3: "easy",
            SL4: "easy",
          },
          descAfterCode: `Here, \`i\` is used as the **array index**:
- When \`i = 0\`, we print \`optionsExample[0]\` → "Sleeping"
- When \`i = 1\`, we print \`optionsExample[1]\` → "Studying"
- When \`i = 2\`, we print \`optionsExample[2]\` → "Gaming"
- When \`i = 3\`, we print \`optionsExample[3]\` → "Do Not Disturb"

The loop stops when \`i\` becomes equal to \`totalOptions\`. This makes the code still correct if you change the number of items later.`,
        },
      ],
    },

    {
      id: 4,
      title: "Step 4: Highlight the Selected Status",
      desc:
        "We want the menu to show which status is currently selected by displaying a symbol like > next to the status. We do this by checking if the loop index i matches a desired index number.",
      hint: "Use an if statement inside the while loop to decide when to draw the arrow.",

      codes: [
        {
          code: `^^int indexChosen = 1;    ^^// dummy example: index 1 or 'Studying' is selected^^

const String optionsExample[] = {
  "Sleeping",
  "Studying",
  "Gaming",
  "Do Not Disturb"
};
int __BLANK[SL1]__ = 4;      ^^// total number of items in the array^^

int i = __BLANK[SL5]__;
while (i < __BLANK[SL6]__) {
  if (i == indexChosen) {
      display.print("> ");        ^^// arrow for the selected item^^
    } else {
    display.print("  ");        ^^// just spaces for others^^
    }
  display.println(optionsExample[i]);
  i = i + 1;
}^^`,
          answerKey: {
            SL5: ["0"],
            SL6: ["4", { type: "sameAs", target: "SL1" }],
          },
          blankExplanations: {
            SL5:
              "Start your loop index at 0 so you print from the first status in the array.",
            SL6:
              "The loop should run until i reaches the total number of options. Since there are 4 items, using 4 works. If you used a variable like `totalOptions`, that also works (and is more flexible).",
          },
          blankDifficulties: {
            SL5: "easy",
            SL6: "easy",
          },
          descAfterCode: `The condition \`if (i == indexChosen)\` means:
- If this row’s index equals the selected index, print \`"> "\` first.
- Otherwise, print spaces so the text lines up.

Example: if \`indexChosen = 1\`, the output looks like:
\`  Sleeping\`
\`> Studying\`
\`  Gaming\`
\`  Do Not Disturb\`

The arrow moves when \`indexChosen\` changes from button presses. For this example, we are assuming that the index after button press is 1. The while loop simply walks through the array and draws each line.
See that there are some spaces at the front of each status when there is no arrow to make sure each line is properly aligned.`,
        },
      ],
    },

    {
      id: 5,
      title: "Step 5: Function that Draws the Status Menu",

      codes: [      
        {
          topicTitle: "Create Status Menu Display Function",
          descBeforeCode:
            "Now we use the same while loop idea, and we draw everything on the OLED screen inside a function.",
          code: `^^void __BLANK[SHOWMENU]__() {
  display.__BLANK[SHOW1]__;           // clear display
  __BLANK[SHOW2]__;                   // set text size
  __BLANK[SHOW3]__;                   // set cursor location
  display.println(__BLANK[SHOW4]__);            // print your header
  display.println("-------------------");       // feel free to change what this looks like 

  int i = 0;
  while (i < __BLANK[TOTNAME]__) {

    if (i == __BLANK[TRACKNAME]__) {
      display.print(__BLANK[HIGHLIGHT]__);     // highlight the current status
    } else {
      display.print(__BLANK[NONHIGH]__);     // keep spacing for non-selected
    }

    display.println(__BLANK[STATUSARRAY]__);    // print the status text
    __BLANK[INCREMENT]__;                     // move to the next item
  }

  display.display();              // push everything to the screen
}^^`,
          answerKey: {
            SHOWMENU: { type: "identifier" },
            // You used display.__BLANK[SHOW1]__; so SHOW1 should be "clearDisplay()"
            SHOW1: ["clearDisplay()"],
            // These are lines without the "display." prefix in your template,
            // so we validate the full statement they should type.
            SHOW2: { type: "string", regex: "^display\\.setTextSize\\(\\s*\\d+\\s*\\)\\s*;?$" },
            SHOW3: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)\\s*;?$" },
            SHOW4: { type: "string", regex: '^".*"$' },
            HIGHLIGHT: ['"> "', '"-> "', '"▶ "', '"* "', '"✓ "', '"• "'],
            NONHIGH: ['"  "', '"   "', '"    "'],
            // Must print the ith element of the status array (whatever they named it)
            STATUSARRAY: { type: "string", regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\[\\s*i\\s*\\]$" },
            INCREMENT: ["i++", "i = i + 1", "i += 1"],
          },
          blankExplanations: {
            SHOWMENU:
              "This is the function name that draws your menu screen (example: showMenu). Must be a valid identifier.",
            SHOW1:
              "Because your code is written as display.__BLANK[SHOW1]__; you must fill in just the function call part: clearDisplay().",
            SHOW2:
              "Set the menu text size. Example: display.setTextSize(1);",
            SHOW3:
              "Set the cursor for where the menu starts. Example: display.setCursor(0, 0);",
            SHOW4:
              'The menu header text in quotes. Example: "Select Status".',
            HIGHLIGHT:
              'This is the symbol you print before the selected line. Most common is "> ".',
            NONHIGH:
              'Spaces that keep the non-selected lines aligned so the menu looks neat. Example: "  ".',
            STATUSARRAY:
              "Print the status at index i from your status array. Example: statuses[i]. (Use whatever array name you created.)",
            INCREMENT:
              "You must increase i each loop so the while loop finishes. Example: i++;",
          },
          blankDifficulties: {
            SHOWMENU: "medium",
            SHOW1: "easy",
            SHOW2: "medium",
            SHOW3: "medium",
            SHOW4: "easy",
            HIGHLIGHT: "easy",
            NONHIGH: "easy",
            STATUSARRAY: "medium",
            INCREMENT: "easy",
          },

          descAfterCode: `This function:
1. Clears the screen and prints the title.
2. Uses a while loop to go through every status in __BLANK[STATUSNAME]__.
3. Checks if i == __BLANK[TRACKNAME]__ to decide whether to draw an arrow.
4. Prints the status text for each row.
5. Calls \`display.display();\` once at the end to update the OLED.

The while loop is what makes the menu flexible. You can add more status or modify them by just simply editing just the array __BLANK[STATUSNAME]__.
Feel free to change how you want the menu to show. You do not need to stick to indicating with an arrow. Be creative and use different symbols or indicators!`,
        },
                {
          topicTitle: "Complete Code So Far",
          descBeforeCode: `This is what you should have so far. You will add the new function that shows menu with the other functions you have already made.`,
          code: `^^#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define WIDTH  __BLANK[WIDTH]__
#define HEIGHT __BLANK[HEIGHT]__
#define RESET  -1
Adafruit_SSD1306 display (WIDTH, __BLANK[HEIGHT2]__ , &Wire, RESET);

#define PREV __BLANK[PREVN]__
#define NEXT __BLANK[NEXTN]__
#define __BLANK[SEL]__  __BLANK[SELN]__   

__BLANK[STATETYPE]__ __BLANK[STATENAME]__ = __BLANK[STATEVALUE]__;  // variable to hold current state

__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__, 
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__,
};

__BLANK[TOTTYPE]__  __BLANK[TOTNAME]__ = __BLANK[TOTNUM]__;
__BLANK[TRACKTYPE]__  __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__;

void setup() {
  Wire.begin();
  display.__BLANK[BEGIN]__(__BLANK[BEGINA]__, 0x3C);
  display.__BLANK[CLEAR]__;         // to clear display
  __BLANK[WELCOMEFUNCTION]__();     // show welcome message

  //<< set the modes for the buttons you are using 
  pinMode(PREV, INPUT_PULLUP); // PREV button is an input, not output
  pinMode(__BLANK[NEXT]__, __BLANK[INPUT1]__);
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);
}

void loop() {
  //<< Your main code will go here
}

//<< Function to show welcome message on screen
void __BLANK[WELCOMEFUNCTION]__{
  __BLANK[DISPLAY1]__; 
  __BLANK[DISPLAY2]__;
  __BLANK[DISPLAY3]__; 
  __BLANK[DISPLAY4]__; 
  __BLANK[DISPLAY5]__; 
  __BLANK[DISPLAY6]__; 
  __BLANK[DISPLAY7]__; 
  __BLANK[DISPLAY8]__; 
}

//<< Function to show chosen status on screen
void __BLANK[STATUSFUNCTION]__{
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__; 
  display.__BLANK[DISPLAY9]__; 
}

//<< Function to show status menu on screen
void __BLANK[SHOWMENU]__() {
  display.__BLANK[SHOW1]__;           
  __BLANK[SHOW2]__;                   
  __BLANK[SHOW3]__;                   
  display.println(__BLANK[SHOW4]__);            
  display.println("-------------------");       

  int i = 0;
  while (i < __BLANK[TOTNAME]__) {

    if (i == __BLANK[TRACKNAME]__) {
      display.print(__BLANK[HIGHLIGHT]__);     
    } else {
      display.print(__BLANK[NONHIGH]__);     
    }

    display.println(__BLANK[STATUSARRAY]__);    
    __BLANK[INCREMENT]__;                     
  }
  display.display();              
}^^`,
        },  
        {
          topicTitle: "Try Simulation",
          descBeforeCode:`Paste the code into simaulator and run it to check if the menu displays as intended. Here is an example of how the status menu would look like on the OLED screen. You can replace your Welcome Message Function with the Show Menu Function in the setup() to see the status menu on the screen for testing purposes.`,
          imageGridBeforeCode: {
            columns: 1,
            width: 400,
            height:350,
            items: [
              {
                imageSrc: "/electric-status-board/statusMenu.png",
                label: "Example: menu screen",
              },
            ],
          },
        }
      ],
    },
    {

      id: 6,
      title: "Step 6: Function that Draws the Main Menu",
      desc: `Now that you have created the status menu display function, you can create another function that draws the main menu with options like "Set Status" and "View Clock". This function will be similar to the status menu function but will use a different array of options.`,
      codes: [
        {
          topicTitle: "Create Main Menu Array",
          descBeforeCode:
            "First, create an array of strings that contains the main menu options that you want to be displayed on the screen.",
          imageGridBeforeCode: {
            columns: 1,
            width: 800,
            height:480,
            items: [
              {
                imageSrc: "/electric-status-board/mainMenuBeg2.png",
                label: "Example: main menu options",
              },
            ],
          },
          code: `^^String __BLANK[MAINOPTION]__ = {
  __BLANK[MAINOPTION1]__, //option 1
  __BLANK[MAINOPTION2]__  //option 2
};

__BLANK[TOTMAIN]__  __BLANK[TOTMAINNAME]__ = __BLANK[TOTMAINNUM]__; // total number of main menu options
__BLANK[TRACKMAIN]__  __BLANK[TRACKMAINNAME]__ = __BLANK[TRACKMAINNUM]__; // tracks the current selected main menu option (set as 0)^^`,
          answerKey: {
            MAINOPTION: { type: "identifier" },
            MAINOPTION1: {type: "string", regex: '^".*"$' },
            MAINOPTION2: {type: "string", regex: '^".*"$' },
            TOTMAIN: { type: "type", regex: "^(int|const int|unsigned int|size_t)$" },
            TOTMAINNAME: { type: "identifier" },
            TOTMAINNUM: ["2"],
            TRACKMAIN: { type: "type", regex: "^(int|const int|unsigned int|size_t)$" },
            TRACKMAINNAME: { type: "identifier" },
            TRACKMAINNUM: ["0"],
          },
          blankExplanations: {
            MAINOPTION:
              "This is the name of the array variable that holds your main menu options (example: mainMenuOptions).",
            MAINOPTION1:
              "This is the first main menu option in quotes (example: \"Set Status\").",
            MAINOPTION2:
              "This is the second main menu option in quotes (example: \"View Clock\").",
            TOTMAIN:  
              "This is the data type for the total number of main menu options (commonly int).",
            TOTMAINNAME:
              "This is the variable name that stores the total number of main menu options (example: totalMainOptions).",
            TOTMAINNUM:
              "Since there are 2 main menu options, this value should be 2.",
            TRACKMAIN:
              "This is the data type for tracking the current selected main menu option (commonly int).",
            TRACKMAINNAME:  
              "This is the variable name that tracks the current selected main menu option (example: trackMainOption).",
            TRACKMAINNUM:
              "Start with 0 so the first option is selected by default.",
          },
          blankDifficulties: {
            MAINOPTION: "easy",
            MAINOPTION1: "easy",
            MAINOPTION2: "easy",
            TOTMAIN: "easy",
            TOTMAINNAME: "easy",
            TOTMAINNUM: "easy",
          },
        },
        {
          topicTitle: "Create Main Menu Display Function",
          descBeforeCode:
            "Now, create a function that displays the main menu on the OLED screen using a while loop similar to the status menu function.",
code: `^^
void __BLANK[SHOWMAINMENU]__() {
  __BLANK[MAIN1]__;                 // clear display
  __BLANK[MAIN2]__;                 // set text size
  __BLANK[MAIN3]__;                 // set cursor location
  __BLANK[MAIN4]__;                 // print your header

  int i = 0;
  while (i < __BLANK[TOTMAINNAME]__) { // loop through all main menu options
    if (i == __BLANK[TRACKMAINNAME]__) { // check if this is the selected option using the counter variable
      __BLANK[MAINHIGHLIGHT]__;     // highlight the current main menu option
    } else {
      __BLANK[MAINNONHIGH]__;       // keep spacing for non-selected
    }
    __BLANK[MAINSTATUSARRAY]__;     // print the main menu option text
    __BLANK[MAININCREMENT]__;       // move to the next item
  }
  __BLANK[MAINDISPLAY]__;           // push everything to the screen
}
^^`,

          answerKey: {
            SHOWMAINMENU: {
              type: "identifier",
            },
            // display.clearDisplay();
            MAIN1: {
              type: "string",
              regex: "^display\\.clearDisplay\\(\\s*\\)\\s*;?$",
            },
            // display.setTextSize(anyNumber);
            MAIN2: {
              type: "string",
              regex: "^display\\.setTextSize\\(\\s*\\d+\\s*\\)\\s*;?$",
            },
            // display.setCursor(anyX, anyY);
            MAIN3: {
              type: "string",
              regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)\\s*;?$",
            },
            // display.print(...) or display.println(...)
            MAIN4: {
              type: "string",
              regex: "^display\\.(print|println)\\(.*\\)\\s*;?$",
            },
            // total menu count variable
            TOTMAINNAME: {
              type: "identifier",
            },
            TRACKMAINNAME: {
              type: "identifier",
            },
            // highlight indicator: display.print(anything)
            MAINHIGHLIGHT: {
              type: "string",
              regex: "^display\\.print\\(.*\\)\\s*;?$",
            },
            // non-highlight spacing: display.print(anything)
            MAINNONHIGH: {
              type: "string",
              regex: "^display\\.print\\(.*\\)\\s*;?$",
            },
            // display.print(array[i]) or println(array[i])
            MAINSTATUSARRAY: {
              type: "string",
              regex:
                "^display\\.(print|println)\\(\\s*[A-Za-z_][A-Za-z0-9_]*\\s*\\[\\s*i\\s*\\]\\s*\\)\\s*;?$",
            },
            // i++, ++i, i+=1, i=i+1
            MAININCREMENT: {
              type: "string",
              regex:
                "^(i\\+\\+|\\+\\+i|i\\s*\\+=\\s*1|i\\s*=\\s*i\\s*\\+\\s*1)\\s*;?$",
            },

            // display.display();
            MAINDISPLAY: {
              type: "string",
              regex: "^display\\.display\\(\\s*\\)\\s*;?$",
            },},
          blankExplanations: {
            SHOWMAINMENU:
              "This is the function name that draws your main menu screen. Must be a valid identifier.",
            MAIN1:
              "Clear the display at the start of the function.",
            MAIN2:
              "Set the text size for the main menu.",
            MAIN3:
              "Set the cursor position for where the main menu starts.",
            MAIN4:
              "Print the header for the main menu.",
            TOTMAINNAME:
              "This is the variable that holds the total number of main menu options.",
            TRACKMAINNAME:
              "This is the variable that tracks the currently selected main menu option.",
            MAINHIGHLIGHT:
              "Print the highlight indicator (like an arrow) for the selected main menu option.",
            MAINNONHIGH:
              "Print spaces to align non-selected main menu options.",
            MAINSTATUSARRAY:
              "Print the main menu option at index i from your main menu options array.",
            MAININCREMENT:
              "Increment i to move to the next main menu option.",
            MAINDISPLAY:
              "Update the OLED display with all the drawn content.",
          },
          blankDifficulties: {
            SHOWMAINMENU: "medium",
            MAIN1: "easy",
            MAIN2: "medium",
            MAIN3: "medium",
            MAIN4: "easy",
            TOTMAINNAME: "easy",  
            TRACKMAINNAME: "easy",
            MAINHIGHLIGHT: "easy",
            MAINNONHIGH: "easy",
            MAINSTATUSARRAY: "medium",
            MAININCREMENT: "easy",
            MAINDISPLAY: "easy",
          }
        }

      ]
    },  

    ],
  },

7: {
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
              { imageSrc: "/electric-status-board/arduinoStructure.png", label: "Sketch structure" }
            ],
          },
          descBetweenBeforeAndCode: null,
          title: "Arduino Sketch Structure",
          code: `^^//<< ===== 1) Libraries (top of file) =====
#include <Wire.h> 
#include ...

//<< ===== 2) Constants + global variables (menus, pins, counters, display object) =====
#define WIDTH __BLANK[WIDTH]__....
Adafruit_SSD1306 display(...);
#define PREV __BLANK[PREVN]__
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
void __BLANK[SHOWMAINMENU]__() { ... }
void __BLANK[SHOWMENU]__() { ... }
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
      title: "Step 2: What you have so far",
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

          code: `^^//<< ===================== 1) LIBRARIES =======================================
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

//<< ===================== 2) CONSTANTS + GLOBAL VARIABLES =====================
//<< --- OLED setup ---
#define WIDTH  __BLANK[WIDTH]__
#define HEIGHT __BLANK[HEIGHT]__
#define RESET  -1
Adafruit_SSD1306 display (WIDTH, __BLANK[HEIGHT2]__ , &Wire, RESET);

#define PREV __BLANK[PREVN]__
#define NEXT __BLANK[NEXTN]__
#define __BLANK[SEL]__  __BLANK[SELN]__   

__BLANK[STATETYPE]__ __BLANK[STATENAME]__ = __BLANK[STATEVALUE]__;  // tracks current mode (e.g., main menu, status menu, clock)

//<< --- status options array ---
__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__, 
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__,
};

__BLANK[TOTTYPE]__  __BLANK[TOTNAME]__ = __BLANK[TOTNUM]__; // total number of status options
__BLANK[TRACKTYPE]__  __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__; // tracks the current selected status option

//<< --- main menu array ---
String __BLANK[MAINOPTION]__ = {
  __BLANK[MAINOPTION1]__, //option 1
  __BLANK[MAINOPTION2]__  //option 2
};

__BLANK[TOTMAIN]__  __BLANK[TOTMAINNAME]__ = __BLANK[TOTMAINNUM]__; // total number of main menu options
__BLANK[TRACKMAIN]__  __BLANK[TRACKMAINNAME]__ = __BLANK[TRACKMAINNUM]__; // tracks the current selected main menu option 

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
  //<< later: display screens in logical order based on button presses
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

//<< --- status screen ---
void __BLANK[STATUSFUNCTION]__{
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__; 
  display.__BLANK[DISPLAY9]__; 
}

//<< --- status menu screen ---
void __BLANK[SHOWMENU]__() {
  display.__BLANK[SHOW1]__;           
  __BLANK[SHOW2]__;                   
  __BLANK[SHOW3]__;                   
  display.println(__BLANK[SHOW4]__);            
  display.println("-------------------");       

  int i = 0;
  while (i < __BLANK[TOTNAME]__) {

    if (i == __BLANK[TRACKNAME]__) {
      display.print(__BLANK[HIGHLIGHT]__);     
    } else {
      display.print(__BLANK[NONHIGH]__);     
    }

    display.println(__BLANK[STATUSARRAY]__);    
    __BLANK[INCREMENT]__;                     
  }
  display.display();              
}

//<< --- main menu screen ---
void __BLANK[SHOWMAINMENU]__() {
  __BLANK[MAIN1]__;                 
  __BLANK[MAIN2]__;                
  __BLANK[MAIN3]__;                 
  __BLANK[MAIN4]__;                 

  int i = 0;
  while (i < __BLANK[TOTMAINNAME]__) { 
    if (i == __BLANK[TRACKMAINNAME]__) {
      __BLANK[MAINHIGHLIGHT]__;    
    } else {
      __BLANK[MAINNONHIGH]__;      
    }
    __BLANK[MAINSTATUSARRAY]__;  
    __BLANK[MAININCREMENT]__;      
  }
  __BLANK[MAINDISPLAY]__;          
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
@ change __BLANK[TRACKMAINNAME]__ to scroll the main menu
@ change __BLANK[TRACKNAME]__ to scroll the status menu
@ call the correct screen function based on the selection`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "Use this as your checkpoint sketch. If something is missing, it’s usually because it was placed in the wrong section.",
        },
        {
          topicTitle: "Try Simulating Main menu",
          descBeforeCode:`Now that you have the full sketch structure, keep confirming it in the Curio simulator to see the displays working properly (without button navigation yet). Again, you can replace your Welcome Message Function with the Show Main Menu Function in the setup() to see the main menu on the screen for testing purposes.`,
          imageGridBeforeCode: {
            columns: 1,
            width: 400,
            height:350,
            items: [
              { imageSrc: "/electric-status-board/mainMenuBegWokwi.png",
                label: "Example: main menu options",
              },
            ],
          },

        }
      ],
    },
  ],
},

8: {
  phrase:"Using buttons for Menu",
  advanced: false,
  steps: [
    {
      id: 1,
      optional: false,
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
      },}]
    },

    {
      id: 2,
      optional: false,
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
      optional: false,
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
        "Real buttons can be noisy. When you press them, they may rapidly flicker between HIGH and LOW for a few milliseconds. This is called 'bouncing'. A **debounce helper function** makes sure we only react to a clean, stable press. The code will tell the computer to wait a little bit, and only count the button if it stays pressed.",
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
  {
      id: 5,
      title: "Step 5: Toggling around the Main Menu",
      hint: "Wrap-around rule: if index < 0 → go to last item. If index > last item → go back to 0.",

      codes: [
        {
          topicTitle:`Navigation Logic Overview`,
          descBeforeCode:`Now we will add the **navigation logic** for your **Main Menu**.

You already have a function called __BLANK[SHOWMAIN]__() that draws the menu screen using:
- an index or counter variable __BLANK[TRACKMAINNAME1]__ to track which item is highlighted (the arrow)
- a total variable __BLANK[TOTMAINNAME1]__ for how many menu items exist

So now our job is to:
1) Change __BLANK[TRACKMAINNAME1]__ when PREV / NEXT is pressed  
2) Wrap-around (so it loops from top to bottom and bottom to top)  
3) Use SELECT to enter the page that is currently highlighted

**Example (wrap-around idea):**
@ If __BLANK[TRACKMAINNAME1]__ is 0 and you press PREV, it should jump to the last menu item.
@ If __BLANK[TRACKMAINNAME1]__ is the last item and you press NEXT, it should jump back to 0.

In void loop, we repeatedly would call __BLANK[SHOWMAIN]__() so the OLED is constantly updated by redrawing the arrow on the new item.`
        },
        {
          topicTitle: `Using PREV button to toggle upward (Main Menu)`,
          customComponent: TotalCountArrayInteractive,
          descBeforeCode: `When the PREV button is pressed, we move **up** in the Main Menu.

**Here’s what this code should do:**
- Use your debouncing helper function __BLANK[HELPER1]__ to check PREV.
- Decrease __BLANK[TRACKMAINNAME1]__ by 1.
- If the index goes below 0, wrap it to the last menu item:
  last index = __BLANK[TOTMAINNAME1]__ - 1
- Call __BLANK[SHOWMAIN]__() to redraw the menu with the new highlight.
- Add a short delay so it doesn’t scroll too fast.`,
          code: `^^
if (__BLANK[HELPER1A]__(PREV) == true) { //if the button helper function is true (previous button is truly pressed)
  __BLANK[TRACKMAINNAME1A]__ = __BLANK[TRACKMAINNAME1B]__ - 1; //decrease the menu index by 1
  if (__BLANK[TRACKMAINNAME1C]__ < 0) { //if the menu index is less than 0
    __BLANK[TRACKMAINNAME1D]__ = __BLANK[TOTMAINNAME2]__ - 1; //set the menu index to the last index (total main menu items - 1)
  }
  __BLANK[SHOWMAIN1]__(); //call the main menu function to redraw the screen
  delay(180);
}
^^`,

blankDifficulties: {
},
blankExplanations: {

},
answerKey: {
}
        },
        {
          topicTitle: `Using NEXT button to toggle downward (Main Menu)`,
          descBeforeCode: `When the NEXT button is pressed, we move **down** in the Main Menu.

**Here’s what this code should do:**
- Use your debouncing helper function __BLANK[HELPER1]__ to check NEXT.
- Increase __BLANK[TRACKMAINNAME2]__ by 1.
- If the index goes past the last item, wrap it back to 0.
- Call __BLANK[SHOWMAIN]__() to redraw the menu.
- Add a short delay so it doesn’t scroll too fast.`,
          code: `^^
if (__BLANK[HELPER1B]__(__BLANK[NEXTVARA]__) == true) { //if the button helper function is true (next button is truly pressed)
  __BLANK[TRACKMAINNAME3]__ = __BLANK[TRACKMAINNAME4]__ + 1;
  if (__BLANK[TRACKMAINNAME5]__ == __BLANK[TOTALMAIN_USEH]__ - 1) { //if the menu index is equal to total main menu items (ex. Index is 2 and total items is 3. Remember index starts at 0)
    __BLANK[TRACKMAINNAME2]__ = 0; //wrap-around to first item if past last item
  }
  __BLANK[SHOWMAIN2]__();
  delay(180);
}
^^`,// Block 2 (NEXT) — add to this code block object
        },

        {
          topicTitle: `Using SELECT button to enter the highlighted page`,
          descBeforeCode: `When the SELECT button is pressed, we want to **enter** the page that is currently highlighted in the Main Menu.

**What this code should do:**
- Use your debouncing helper function __BLANK[HELPER1]__ to check SELECT.
- Look at __BLANK[TRACKMAINNAME6]__ to see which menu item is chosen.
- Change a screen variable (example: \`screenMode\`) so the program knows which screen to show next.
- Add a small delay so one press doesn’t count multiple times.`,
          code: `^^
if (__BLANK[HELPER1C]__(__BLANK[SELVARA]__) == true) { //if the button helper function is true (select button is truly pressed)
  if (__BLANK[TRACKMAINNAME7]__ == 0) { //if the main menu index is 0 (first item in the menu)
    __BLANK[SCREENVAR1A]__ = __BLANK[SCREENTYPENUM1A]__;  // Go to Screen 1: Clock or Pomodoro, update the screen variable accordingly
  } else if (__BLANK[TRACKMAINNAME8]__ == 1) { //if the main menu index is 1 (second item in the menu)
    __BLANK[SCREENVAR2B]__ = __BLANK[SCREENTYPENUM2B]__; // Go to Screen 2: Clock or Pomodoro
  }
  delay(200);
}
^^`,

        },
      ],
    },
    {
      id: 6,
      title: "Step 6: Place the button toggle logic into the show main function",
      desc: `Now that you have the three button logic blocks for (PREVIOUS / NEXT / SELECT), it's time to place them into your current code draft into the __BLANK[SHOWMAIN_FN]__ function. Placing the button navigation logic into the main menu function keeps your code organized and ensures that the menu responds correctly to user input every time the main menu screen is called.`,
      codes:[{
        topicTitle: `Warning and Tips for Placement`,
        descBeforeCode: `Make sure to place the button logic blocks **after** the the initial drawing, so the screen is drawn first before checking for button presses. 
@ This way, the user sees the menu before interacting with it.
Make sure to place the code blocks in the **correct order**: PREV first, then NEXT, then SELECT last. 
@ This way, the user can navigate properly through the menu options.`,
          code:`^^
void __BLANK[SHOWMAINMENU]__() {
  __BLANK[MAIN1]__;                 
  __BLANK[MAIN2]__;                
  __BLANK[MAIN3]__;                 
  __BLANK[MAIN4]__;                 

  int i = 0;
  while (i < __BLANK[TOTMAINNAME]__) { 
    if (i == __BLANK[TRACKMAINNAME]__) {
      __BLANK[MAINHIGHLIGHT]__;    
    } else {
      __BLANK[MAINNONHIGH]__;      
    }
    __BLANK[MAINSTATUSARRAY]__;  
    __BLANK[MAININCREMENT]__;      
  }
  __BLANK[MAINDISPLAY]__;
  
  //<< --- Place the button logic blocks here in the correct order ---
  if (__BLANK[HELPER1]__(PREV) == true) {    // If the PREV button is pressed. 
    __BLANK[VL1]__ = __BLANK[VL1]__ - 1;      
    if (__BLANK[VL1]__ < __BLANK[VL2]__) {    
      __BLANK[VL3]__ = __BLANK[VL4]__ - 1;    
    }
  }
  else if (__BLANK[HELPER0]__(__BLANK[VL5]__) == true) {        // If the NEXT button is pressed. 
    __BLANK[VL6]__ = __BLANK[VL7]__;
    if (__BLANK[VL8]__ == __BLANK[VL9]__ - 1) {            
    __BLANK[VL10]__;                        
    }
  }
  else if (__BLANK[HELPER00]__  == true) {      // If the SELECT button is pressed
    showingStatus = true;    
  __BLANK[STATUSFUNCTION]__();               
  }
}`,

},
{
        topicTitle:`Run Void Loop() to test`,
        descBeforeCode:`After placing the button logic into your main menu function, ensure that your \`void loop()\` is able to call the main menu function repeatedly at appropriate times.
Just insert the following line into your currently empty main loop. Everything else remains the same.`,
          code:`^^
void loop() {
  __BLANK[SHOWMAIN3]__(); // Call the main menu function to display and interact with the menu
}
^^`,
answerKey:{
  SHOWMAIN3: { type: "sameAs", target: "SHOWMAIN" }
}, 
blankExplanations:{
  SHOWMAIN3:
    "This should be the SAME main menu function name you used earlier. This ensures your loop calls the main menu function to display and interact with the menu.",
},
blankDifficulties:{
  SHOWMAIN3: "easy"
}},
      {
        topicTitle:`Simulation with buttons`,
        descBeforeCode:`After placing the button logic into your main menu function, test your code using the simulator.
@ This allows you to verify that the menu navigation works as expected without needing physical hardware.
@ Remember, all functions go to the bottom of your code draft, so ensure your main loop calls the main menu function appropriately to see the button interactions in action (see Lesson 7 for code structure).`,
      }]
    },
    {
      id: 7,
      title: "Step 7: Toggling around the Status Menu",
      desc: `Now that you have completed the Main Menu button navigation, it's time to implement similar button navigation logic for the **Status Menu**.
This involves using the PREV, NEXT, and SELECT buttons to scroll through and select different statuses from your status array.
Here’s a quick recap of what you need to do:
1) Change the status index variable __BLANK[TRACKNAME]__ when PREV / NEXT is pressed  
2) Wrap-around (so it loops from top to bottom and bottom to top)  
3) Use SELECT to confirm the currently highlighted status.`,
      codes: [
        {
          topicTitle:`Status Menu Navigation Logic Overview`,
          descBeforeCode:`You already have a function called __BLANK[SHOWMENU]__() that draws the status menu screen using:
@ an index or counter variable __BLANK[TRACKNAME]__ to track which status is highlighted (the arrow)
@ a total variable __BLANK[TOTNAME]__ for how many statuses exist
Follow how you implemented the Main Menu button logic to create similar logic for the Status Menu.`,
        imageGridBeforeCode: {
          columns: 1,
          rows: 1,
          width: 800,
          height: 400,
          items: [
            { imageSrc: "/electric-status-board/loop.png", label: "Status menu loop concept" }
          ],
        },
        code:`^^
void __BLANK[SHOWMENU]__() {^^
  display.__BLANK[SHOW1]__;           
  __BLANK[SHOW2]__;                   
  __BLANK[SHOW3]__;                   
  display.println(__BLANK[SHOW4]__);            
  display.println("-------------------");       

  int i = 0;
  while (i < __BLANK[TOTNAME]__) {

    if (i == __BLANK[TRACKNAME]__) {
      display.print(__BLANK[HIGHLIGHT]__);     
    } else {
      display.print(__BLANK[NONHIGH]__);     
    }

    display.println(__BLANK[STATUSARRAY]__);    
    __BLANK[INCREMENT]__;                     
  }
  display.display();^^
  
  //<< --- Place the button logic blocks here in the correct order ---
  if (__BLANK[HELPERSM1]__(PREV) == __BLANK[HELPERTRUE1]__) {    // If the PREV button is pressed.
    __BLANK[TRACKSM1]__ = __BLANK[TRACKSM2]__ - 1; // Decrease the status index by 1
    if (__BLANK[TRACKSM3]__ < 0) { // If the status index is less than 0
      __BLANK[TRACKSM4]__ = __BLANK[TOTSM1]__ - 1; // Set the status index to the last index (total statuses - 1)
    }
  }
  else if (__BLANK[HELPERSM2]__(__BLANK[NEXTSM]__) == __BLANK[HELPERTRUE2]__) {        // If the NEXT button is pressed.
    __BLANK[TRACKSM5]__ = __BLANK[TRACKSM6]__ + 1; // Increase the status index by 1
    if (__BLANK[TRACKSM7]__ == __BLANK[TOTSM2]__ - 1) { // If the status index is equal to the last index (total statuses - 1)
      __BLANK[TRACKSM8]__ = __BLANK[TRACKSM9]__; // Set the status index to the first index (0)
    }
  }
  else if (__BLANK[HELPERSM3]__(__BLANK[SELSM]__) == __BLANK[HELPERTRUE3]__) {      // If the SELECT button is pressed
    __BLANK[SCREENVAR3]__ = __BLANK[SCREENTYPENUM3]__;  // Update the screen variable to show confirmed status screen
    __BLANK[SHOWCONFIRMED]__(); // Call the function to show the confirmed status screen
  }
}^^`
        },
        {
          topicTitle:`Simulation with Status Menu buttons`,
          descBeforeCode:`After placing the button logic into your status menu function, test your code using the simulator. Replace your main menu function call in \`void loop()\` with the status menu function to see the button interactions in action.`,
        }
      ],
    }
  ]},
}

export default function CodeBegLesson({
  slug,
  lessonSlug,
}: {
  slug: string;
  lessonSlug: string;
}) {
  return (
    <CodeLessonBase
      lessonSteps={LESSON_STEPS_BEGINNER}
      storagePrefix={`curio:${slug}:${lessonSlug}`}
      apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}
      rightRailTitle="My Notes"
      rightRailScopeId="mynotes"
    />
  );
}

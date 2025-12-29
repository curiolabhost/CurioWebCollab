// code.js
// answer key: https://wokwi.com/projects/447184024115506177

import React from "react";
import CodeLessonBase from "./components/CodeLessonBase";

const LESSON_STEPS_BEGINNER = {
  1: [
    {
      id: 1,
      title: "Step 1: Understanding Arduino Basics",
      desc:
        "Arduino is an open-source electronics platform used to create interactive projects. Every Arduino sketch has two main functions: setup() runs once when the board is powered on or reset, loop() runs continuously as long as the board has power.",
      hint: "pinMode() configures a pin as INPUT or OUTPUT",

      // ✅ NEW: all visual content goes through imageGrid, inside codes blocks
      codes: [
        {
          // this used to be step.gif
          imageGridBeforeCode: {
            columns: 1,
            width: 300,
            height: 300,
            items: [
              {
                image: require("../../../assets/videos/CurioLabL1S1.gif"),
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

  2: [
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
      desc: `Next, we create names for the three buttons so the code knows which Arduino pins they are connected to, and so the program is easier to read and understand than if we used raw pin numbers. For this project, we need one button to move the cursor to the next option, one button to move to the previous option, and one button to select the highlighted option. If you want more practice working with buttons, review Lesson 1.`,
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

          // ✅ this used to be step.circuitImage
          imageGridAfterCode: {
            columns: 1,
            rows: 1,
            items: [
              {
                image: {
                  uri: "https://dummyimage.com/600x400/ddd/000.png&text=Example+Circuit+Image",
                },
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
  display.__BLANK[CLEAR]__;      // to clear display
  display.__BLANK[SETTEXTSIZE]__(__BLANK[SETTEXTSIZE2]__);      // to select text size
  display.__BLANK[SETTEXTCOLOR]__(__BLANK[SETTEXTCOLOR2]__);      // to select text color
  display.__BLANK[SETCURSOR]__(0, 0);   // to set cursor location
  display.__BLANK[DISPLAY]__();    // to update the screen to display 

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
  - Button pressed → reads **LOW**`,
        },
      ],
    },
  ],

  3: [
    {
      id: 1,
      title: "Step 1: Draw First (Welcome) Page",
      desc: "**Clear the screen, print a big greeting.**",
      hint: "Call display() after drawing to push the buffer to the screen.",
      answerKey: {
        WELCOMEFUNCTION: {
          type: "string",
          regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\(\\s*\\)$",
        },
        DISPLAY1: ["display.clearDisplay()"],
        DISPLAY2: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
        DISPLAY3: ["display.setTextColor(SSD1306_WHITE)"],
        DISPLAY4: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
        DISPLAY5: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
        DISPLAY6: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },
        DISPLAY7: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
        DISPLAY8: ["display.display()"],
      },
      codes: [
        {
          imageGridBeforeCode: {
            columns: 1,
            rows: 1,
            items: [
              {
                image: require("../../../assets/welcomeFunc.png"),
                label: "Welcome function example",
              },
            ],
          },

          // this used to be descAfterCircuit
          descBetweenBeforeAndCode: `This is an example of a function named welcomeFunc. All of the lines of code inside the curly brackets define what welcomeFunc does. You can run this function by calling it in either setup() or loop(). As a reminder, functions are reusable blocks of code that perform a specific task..
      
Since we want the welcome page to show up only ONCE when we turn the device on, we will place that function in the **setup()**.
Read through each line of the code in the example above, and try to understand what it does. Then, fill in the blanks for the code below by following the comment lines to the right. Refer back to lesson 2.4 if you don't remember the functions.`,

          code: `#include <Wire.h> 
...
...
void setup(){
...
}^^

void loop(){
__BLANK[WELCOMEFUNCTION]__;
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

          descAfterCode: `Now, create a function with the same functionality as the example WelcomeFunc above. 
But, **rename the function as something else and have it display a different message.** Fill in the blanks.`,
        },
      ],
    },
    {
      id: 2,
      title: "Step 2: Display Chosen Status",
      desc: "In order to display the status that we want we need to clear the screen then print the status chosen from the menu screen",
      answerKey: {
        WELCOMEFUNCTION: {
            type: "string",
            regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\(\\s*\\)$",
          },
          STATUSFUNCTION: {
            type: "string",
            regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\(\\s*\\)$",
          },
          DISPLAY1: ["display.clearDisplay()"],
          DISPLAY2: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
          DISPLAY3: ["display.setTextColor(SSD1306_WHITE)"],
          DISPLAY4: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
          DISPLAY5: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
          DISPLAY6: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },
          DISPLAY7: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
          DISPLAY8: ["display.display()"],
          STATUSCODE1: ["display.clearDisplay()"],
          STATUSCODE2: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
          STATUSCODE3: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },
          STATUSCODE4: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
          DISPLAY9: ["display()"],
      },
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
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__;
  display.__BLANK[DISPLAY9]__;
}^^`,

          descAfterCode: `Here are specific instructions on what each line of the code should do at it's minimum. You can also add more functinalities to this in the code editor.
**Line 1:** clear the display.
**Line 2:** set text size.
**Line 3:** set cursor location.
**Line 4:** print an example status like "Studying, Working, Coding, etc".`,
        },
      ],
    },
  ],

  4: [
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
      answerKey: {
        NAMETYPE: ["String"],
        NAME1: { type: "string" },
        YEAR: { type: "range", min: 1900, max: 2100 },
        MONTH: { type: "string" },
        READY: ["true", "false"],
        TEMP: { type: "number" },
        DATETYPE: ["String"],
        BUTTONTYPE: ["bool"],
        NAME2: { type: "identifier" },
      },
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
          descAfterCode: `String uses double quotation \`"" ""\`.
Char uses single quotation \`' '\`.
Integer does not need anything surrounding the numbers. 
Boolean only allows true or false. `,
        },
        {
          descBeforeCode: `**Understanding changes in Variables:**`,
          title: "Practice: Counter",
          code: `int counter = 0;

counter = counter + 1;
counter = counter + 1;
counter = counter + 1;`,
          descAfterCode: `What does the counter now read?    __BLANK[COUNTER]__`,
        },
        {
          title: "Practice: Level",
          code: `int level = 1;

level = level + 1;
level = level + 2;`,
          descAfterCode: `What does the level now read?    __BLANK[LEVEL]__`,
        },
      ],
    },

    {
      id: 3,
      title: "Step 3: What Is a List (Array)?",
      desc:
        "A list (array) stores many values under one variable name. This is perfect for storing multiple menu options.",
      hint: "Arrays are 0-indexed: the first item is at index 0.",

      codes: [
        {
          // ✅ gif -> imageGrid
          imageGridBeforeCode: {
            columns: 1,
            rows: 1,
            items: [{ image: require("../../../assets/array.png"), label: "Array example" }],
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

          descAfterCode: `Arrays group related data together:
  - \`numbers[0]\` gives the **first** item → \`1\`  
  - \`numbers[1]\` gives the second item → \`2\`  
  - \`numbers[3]\` gives the last item → \`4\`

Arrays are extremely useful when you want your code to handle lots of similar values without writing dozens of separate variables.`
        },
        {
title: `More Practice:`,
code: `String days[] = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};

Fill in the blanks:
days[3] =  __BLANK[DAY]__
days[1] =  __BLANK[DAY2]__
days[__BLANK[DAY3]__] = Monday
days[__BLANK[DAY4]__] = Sunday`,

          answerKey: {
            ARRAYTYPE: ["String"],
            ARRAYNAME: { type: "string", regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\[\\s*\\]$" },
            ARRAY: { type: "string", regex: "^\\{.*\\}$" },
            VARRAYTYPE: ["String"],
            VARRAYNAME: { type: "identifier" },
            CALL: { type: "string", regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\[\\s*\\d+\\s*\\]$" },

            DAY: ['"Thursday"', "Thursday"],
            DAY2: ['"Monday"', "Monday"],
            DAY3: ["0"],
            DAY4: ["6"],
        },
        blankexplanations:{
          DAY: "day at the 3rd index in list",
          DAY2: "day at the 1st index in list",
          DAY3: "index of Monday in list",
          DAY4: "index of Sunday in list",

        },


        },
      ],
    },

    {
      id: 4,
      title: "Step 4: Lists Are Perfect for Menu Options",
      desc: `Instead of making many separate variables for each status, we store them all in a single array so the menu can move through them easily.
        
Think of at least four status that relates to your daily acitivity, like studying, working, playing, etc.
Place those status in an array. Create a name for that array.`,
      hint: "This is the same structure used in your favoriteColor array.",
      answerKey: {
        STATUSTYPE: ["String", "const String"],
        STATUSNAME: { type: "identifier" },
        STATUSLIST1: { type: "string", regex: '^".+"$' },
        STATUSLIST2: { type: "string", regex: '^".+"$' },
        STATUSLIST3: { type: "string", regex: '^".+"$' },
        STATUSLIST4: { type: "string", regex: '^".+"$' },
      },
      codes: [
        {
          code: `^^// List of menu status messages
__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__,
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__
};^^`,
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
      id: 5,
      title: "Step 5: Counting Items in the List",
      desc: `Arrays don’t automatically know how many items they contain, so we store the total count in a variable.
Create a variable that stores the total **number** of status in the array.`,
      hint: "We use this to handle scrolling and wrap-around behavior.",
      answerKey: {
        STATUSTYPE: ["String", "const String"],
        STATUSNAME: { type: "identifier" },
        STATUSLIST1: { type: "string", regex: '^".+"$' },
        STATUSLIST2: { type: "string", regex: '^".+"$' },
        STATUSLIST3: { type: "string", regex: '^".+"$' },
        STATUSLIST4: { type: "string", regex: '^".+"$' },
        TOTTYPE: ["int"],
        TOTNAME: { type: "identifier" },
        TOTNUM: ["4"],
        TRACKTYPE: ["int"],
        TRACKNAME: { type: "identifier" },
        TRACKNUM: ["0"],

        // depends on the list
        OPTION: { type: "string" },
      },
      codes: [
        {
          imageGridBeforeCode: {
            columns: 1,
            rows: 1,
            items: [
              {
                image: require("../../../assets/videos/CurioLabL4.gif"),
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
__BLANK[TRACKTYPE]__ __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__; ^^

String option = __BLANK[STATUSNAME]__ [__BLANK[TRACKNAME]__];^^`,
          descAfterCode: `These two variables let the menu scroll correctly. In our code we can check the value of counter:
  - If it is past the last item → wrap back to the first  
  - If it is before the first → wrap to the last
This way the menu will always "wrap around" and cycle smoothly, just like the image above.

What would the String option read?   __BLANK[OPTION]__`,
        },
      ],
    },

    {
      id: 6,
      title: "Step 6: Function for Menu Page",
      desc:
        "Now we create a menu page, where pressing Next or Previous button allows the user to toggle around the status options",
      answerKey: {
        STATUSTYPE: ["String", "const String"],
        STATUSNAME: { type: "identifier" },

        STATUSLIST1: { type: "string", regex: '^".+"$' },
        STATUSLIST2: { type: "string", regex: '^".+"$' },
        STATUSLIST3: { type: "string", regex: '^".+"$' },
        STATUSLIST4: { type: "string", regex: '^".+"$' },

        TOTTYPE: ["int"],
        TOTNAME: { type: "identifier" },
        TOTNUM: ["4"],

        TRACKTYPE: ["int"],
        TRACKNAME: { type: "identifier" },
        TRACKNUM: ["0"],

        WELCOMEFUNCTION: {
          type: "string",
          regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\(\\s*\\)$",
        },

        STATUSFUNCTION: {
          type: "string",
          regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\(\\s*\\)$",
        },

        DISPLAY1: ["display.clearDisplay()"],
        DISPLAY2: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
        DISPLAY3: ["display.setTextColor(SSD1306_WHITE)"],
        DISPLAY4: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
        DISPLAY5: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
        DISPLAY6: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },
        DISPLAY7: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
        DISPLAY8: ["display.display()"],

        STATUSCODE1: ["display.clearDisplay()"],
        STATUSCODE2: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
        STATUSCODE3: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },
        STATUSCODE4: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
        STATUSNAME2: { type: "sameAs", target: "STATUSNAME" },
        TRACKNAME2: { type: "sameAs", target: "TRACKNAME" },
      },
      codes: [
        {
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

void __BLANK[STATUSFUNCTION]__{
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__; 
  display.println(__BLANK[STATUSNAME2]__[__BLANK[TRACKNAME2]__]); // → display your array of status indexed by the counter variable^^
}^^`,
        },
        {
          descBeforeCode:
            "Now we use the same while loop idea, and we draw everything on the OLED screen inside a function.",
            answerKey: {
              SHOWMENU: { type: "identifier" },
              SHOW1: ["clearDisplay()"],
              SHOW2: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
              SHOW3: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },
              SHOW4: { type: "string", regex: '^".+"$' },

              TOTNAME: { type: "identifier" },
              TRACKNAME: { type: "identifier" },
              HIGHLIGHT: { type: "string", regex: '^(\".*\"|\'.*\')$' },
              NONHIGH: { type: "string", regex: '^(\".*\"|\'.*\')$' },

              // should be something like options[]
              STATUSARRAY: { type: "string" },
              INCREMENT: { type: "string" }, 
            },
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
          descAfterCode: `This function:
1. Clears the screen and prints the title.
2. Uses a while loop to go through every status in __BLANK[STATUSNAME]__.
3. Checks if i == __BLANK[TRACKNAME]__ to decide whether to draw an arrow.
4. Prints the status text for each row.
5. Calls \`display.display();\` once at the end to update the OLED.

The while loop is what makes the menu flexible. You can add more status or modify them by just simply editing just the array __BLANK[STATUSNAME]__.
Feel free to change how you want the menu to show. You do not need to stick to indicating with an arrow. Be creative and use different symbols or indicators!`,
        },
      ],
    },
  ],

  5: [
    {
      id: 1,
      title: "Step 1: What is a Loop?",
      desc:
        "We already have an array of status messages. Now we want to print ALL of them without writing many repeated lines of code.",
      hint: "Imagine you had 10 or 20 statuses. You wouldn’t want to copy-paste the same line 20 times.",

      codes: [
        {
          code: `^^// Without a loop (not flexible)
display.println(options[0]);
display.println(options[1]);
display.println(options[2]);
display.println(options[3]);

// Better idea: use a loop to repeat
// the same pattern for each item.^^`,
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
      answerKey: {
        LOOP1: ["12"],   
        LOOP2: ["num"],
        LOOP3: ["2"],
      },
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

What does the \`i\` read after while loop ends?    __BLANK[ANSWER]__`,
        },
        {
          title: "Loop Practice 1: Print Even Numbers",
          descBeforeCode:
            "Write a while loop that prints only the even numbers from 2 to 10. Start at 2 and increase by 2 at each loop.",
            answerKey: {
              LOOP5: ["3"],
              LOOP6: ["x"],
              LOOP7: ["30"],   
              LOOP8: ["x"],
              LOOP9: ["x + 3"],
            },
          code: `^^int num = 2;
while (num < __BLANK[LOOP1]__){
  Serial.println(__BLANK[LOOP2]__);
  num = num + __BLANK[LOOP3]__;
}^^`,
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
        },
        {
          title: "Loop Practice 3: Stop when a Number Reaches a Limit",
          descBeforeCode:
            "Write a while loop that multiplies the number by 2 each loop and stop when the number is greater than 100.",
            answerKey: {
              LOOP10: ["n"],
              LOOP11: ["n"],
              LOOP12: ["101"],
              LOOP13: ["n"],
              LOOP14: ["n"],
              LOOP15: ["n * 2"],
            },
          code: `^^int __BLANK[LOOP10]__ = 5;
while (__BLANK[LOOP11]__ < __BLANK[LOOP12]__){
  Serial.println(__BLANK[LOOP13]__);
  __BLANK[LOOP14]__ = __BLANK[LOOP15]__;
}^^`,
        },
        {
          title: "Loop Practice 4: Loop Until Botton Press",
          descBeforeCode:
            'Simulate a loop that keeps printing "Waiting..." until `ready` becomes `true`.',
            answerKey: {
              LOOP16: ["bool"],
              LOOP17: ["false"],
              LOOP11: ["ready"],
              LOOP13: ['"Waiting..."'],
            },
          code: `^^__BLANK[LOOP16]__ ready = __BLANK[LOOP17]__;
while (__BLANK[LOOP11]__ == false){
  Serial.println(__BLANK[LOOP13]__);
}^^`,
        },
        {
          title: "Loop Practice 5: Loop through Array 1",
          descBeforeCode:
            "Loop through an array of integers and display the desired number.",
            answerKey: {
              LOOP14: ["6"],
              LOOP15: ["11"],          
              LOOP16: ["desiredNum"],  
            },
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
        },
        {
          title: "Loop Practice 6: Loop through Array 2",
          descBeforeCode:
            'Loop through an array of integers and display "Here is the number:" followed by the desired number.',
            answerKey: {
              LOOP17: ["nums[]"],
              LOOP18: ["6"],
              LOOP19: ["desiredNum"],
              LOOP20: ["10"],
              LOOP21: ["j"],
              LOOP22: ["0"],
              LOOP23: ["nums[j]"],
              LOOP24: ["desiredNum"],
              LOOP25: ["desiredNum"],
              LOOP26: ["j"],
            },
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
        },
      ],
    },

    {
      id: 3,
      title: "Step 3: While Loop for the Status Menu",
      desc: `Now we use a while loop to go through each item in the options array. Instead of printing numbers, we print status messages.
 This code will be very similar to how you did in the "Loop Through Array" practice.`,
      answerKey: {
        SL1: ["totalOptions"],
        SL2: ["totalOptions"],
        SL3: ["options[i]"],
        SL4: ["i = i + 1"],
      },
      codes: [
        {
          code: `^^const String options[] = {
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
          descAfterCode: `Here, \`i\` is used as the **array index**:
- When \`i = 0\`, we print \`options[0]\` → "Sleeping"
- When \`i = 1\`, we print \`options[1]\` → "Studying"
- When \`i = 2\`, we print \`options[2]\` → "Gaming"
- When \`i = 3\`, we print \`options[3]\` → "Do Not Disturb"

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
      answerKey: {
        SL1: ["totalOptions"],
        SL5: ["0"],
        SL6: ["totalOptions"],
      },
      codes: [
        {
          code: `^^int indexChosen = 1;    ^^// example: 'Studying' is selected^^

const String options[] = {
  "Sleeping",
  "Studying",
  "Gaming",
  "Do Not Disturb"
};
int __BLANK[SL1]__ = 4;      ^^// total number of items in the array^^

int i = __BLANK[SL5]__;
while (i < __BLANK[SL6]__ {
  if (i == indexChosen) {
      display.print("> ");        ^^// arrow for the selected item^^
    } else {
    display.print("  ");        ^^// just spaces for others^^
    }
  display.println(options[i]);
  i = i + 1;
}^^`,
          descAfterCode: `The condition \`if (i == indexChosen)\` means:
- If this row’s index equals the selected index, print \`"> "\` first.
- Otherwise, print spaces so the text lines up.

Example: if \`indexChosen = 1\`, the output looks like:
\`  Sleeping\`
\`> Studying\`
\`  Gaming\`
\`  Do Not Disturb\`

The arrow moves when \`indexChosen\` changes. The while loop simply walks through the array and draws each line.
See that there are some spaces at the front of each status when there is no arrow.`,
        },
      ],
    },

    {
      id: 5,
      title: "Step 5: Create a Function that Draws the Menu on the OLED",
      desc:
        "Combining everything and creating the showMenu function.",
      answerKey: {
        WIDTH: ["128"],
        HEIGHT: ["64", "32"],
        HEIGHT2: ["HEIGHT"],
        PREVN: { type: "range", min: 0, max: 13 },
        NEXTN: { type: "range", min: 0, max: 13 },
        SEL: { type: "identifier" },
        SELN: { type: "range", min: 0, max: 13 },
        BEGIN: ["begin"],
        BEGINA: ["SSD1306_SWITCHCAPVCC"],
        CLEAR: ["clearDisplay()"],
        SETTEXTSIZE: [
          "setTextSize(1)",
          "setTextSize(2)",
          "setTextSize(3)",
          "setTextSize(4)",
          "setTextSize(5)",
        ],
        SETTEXTCOLOR: [
          "setTextColor(SSD1306_WHITE)",
          "setTextColor(SSD1306_BLACK)",
          "setTextColor(SSD1306_INVERSE)",
        ],
        SETCURSOR: ["setCursor"],
        DISPLAY: ["display"],
        NEXT: ["NEXT"],
        INPUT1: ["INPUT_PULLUP"],
        PINMODE: ["pinMode"],
        SELECT: { type: "sameAs", target: "SEL" },
        INPUT2: ["INPUT_PULLUP"],
        STATUSTYPE: ["String", "const String"],
        STATUSNAME: { type: "identifier" },
        STATUSLIST1: { type: "string", regex: '^".+"$' },
        STATUSLIST2: { type: "string", regex: '^".+"$' },
        STATUSLIST3: { type: "string", regex: '^".+"$' },
        STATUSLIST4: { type: "string", regex: '^".+"$' },
        TOTTYPE: ["int"],
        TOTNAME: { type: "identifier" },
        TOTNUM: ["4"],
        TRACKTYPE: ["int"],
        TRACKNAME: { type: "identifier" },
        TRACKNUM: ["0"],
        WELCOMEFUNCTION: {
          type: "string",
          regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\(\\s*\\)$",
        },
        STATUSFUNCTION: {
          type: "string",
          regex: "^[A-Za-z_][A-Za-z0-9_]*\\s*\\(\\s*\\)$",
        },
        DISPLAY1: ["display.clearDisplay()"],
        DISPLAY2: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
        DISPLAY3: ["display.setTextColor(SSD1306_WHITE)"],
        DISPLAY4: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
        DISPLAY5: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
        DISPLAY6: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },
        DISPLAY7: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
        DISPLAY8: ["display.display()"],
        STATUSCODE1: ["display.clearDisplay()"],
        STATUSCODE2: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
        STATUSCODE3: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },
        STATUSCODE4: { type: "string", regex: "^display\\.(print|println)\\(.+\\)$" },
        DISPLAY9: ["display()"],
      },
      codes: [
        {
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

void setup() {
  Wire.begin();
  display.__BLANK[BEGIN]__(__BLANK[BEGINA]__, 0x3C);
  display.__BLANK[CLEAR]__;         // to clear display
  display.__BLANK[SETTEXTSIZE]__;         // to select text size
  display.__BLANK[SETTEXTCOLOR]__;         // to select text color
  display.__BLANK[SETCURSOR]__(0, 0);   // to set cursor location
  display.__BLANK[DISPLAY]__();       // to update the screen to display 

  // set the modes for the buttons you are using 
  pinMode(PREV, INPUT_PULLUP); // PREV button is an input, not output
  pinMode(__BLANK[NEXT]__, __BLANK[INPUT1]__);
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);
}
        
__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__, 
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__,
};

__BLANK[TOTTYPE]__  __BLANK[TOTNAME]__ = __BLANK[TOTNUM]__;
__BLANK[TRACKTYPE]__  __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__;

void __BLANK[WELCOMEFUNCTION]__{
  __BLANK[DISPLAY1]__; //clear display
  __BLANK[DISPLAY2]__; //text size
  __BLANK[DISPLAY3]__; //text color
  __BLANK[DISPLAY4]__; //print line
  __BLANK[DISPLAY5]__; //text size
  __BLANK[DISPLAY6]__; //text cursor
  __BLANK[DISPLAY7]__; //print line
  __BLANK[DISPLAY8]__; //display
}

void __BLANK[STATUSFUNCTION]__{
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__; 
  display.__BLANK[DISPLAY9]__; 
}^^`,
        },
        {
          descBeforeCode:
            "Now we use the same while loop idea, and we draw everything on the OLED screen inside a function.",
            answerKey: {
              SHOWMENU: { type: "identifier" },
              SHOW1: ["clearDisplay()"],
              SHOW2: { type: "string", regex: "^display\\.setTextSize\\(\\s*[1-5]\\s*\\)$" },
              SHOW3: { type: "string", regex: "^display\\.setCursor\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)$" },
              SHOW4: { type: "string", regex: '^".+"$' },
              TOTNAME: { type: "identifier" },
              TRACKNAME: { type: "identifier" },
              HIGHLIGHT: { type: "string", regex: '^(\".*\"|\'.*\')$' },
              NONHIGH: { type: "string", regex: '^(\".*\"|\'.*\')$' },

              STATUSARRAY: { type: "string" }, 
              INCREMENT: { type: "string" },   
            },

          code: `^^void __BLANK[SHOWMENU]__() {
  display.__BLANK[SHOW1]__;      // clear display
  __BLANK[SHOW2]__;              // set text size
  __BLANK[SHOW3]__;              // set cursor location
  display.println(__BLANK[SHOW4]__);       // print your header
  display.println("-------------------");  

  int i = 0;
  while (i < __BLANK[TOTNAME]__) {

    if (i == __BLANK[TRACKNAME]__) {
      display.print(__BLANK[HIGHLIGHT]__);     // highlight the current status
    } else {
      display.print(__BLANK[NONHIGH]__);     // keep spacing for non-selected
    }

    display.println(__BLANK[STATUSARRAY]__);  // print the status text
    __BLANK[INCREMENT]__;                    // move to the next item
  }
  display.display();              // push everything to the screen
}^^`,
          descAfterCode: `This function:
1. Clears the screen and prints the title.
2. Uses a while loop to go through every status in __BLANK[STATUSNAME]__.
3. Checks if i == __BLANK[TRACKNAME]__ to decide whether to draw an arrow.
4. Prints the status text for each row.
5. Calls \`display.display();\` once at the end to update the OLED.

The while loop is what makes the menu flexible. You can add more status or modify them by just simply editing just the array __BLANK[STATUSNAME]__.
Feel free to change how you want the menu to show. You do not need to stick to indicating with an arrow. Be creative and use different symbols or indicators!`,
        },
      ],
    },
  ],

  6: [
    {
      id: 1,
      title: "Step 1: How Buttons Work & INPUT_PULLUP",
      desc: `Buttons are simple switches. When you press a button, it closes the circuit so current can flow. When you release it, the circuit opens again, and current stops.

On the Arduino, we use buttons as **digital inputs** that read either \`HIGH\` or \`LOW\`.

However, if a pin is not connected to anything, it can "float" and randomly jump between \`HIGH\` and \`LOW\`. This is why we use **pull-up** (or pull-down) resistors.

With \`INPUT_PULLUP\`:

- The Arduino turns on an internal resistor that pulls the pin **up to HIGH** when the button is not pressed.
- We wire the button from the pin to **GND**.
- When the button is pressed, it connects the pin to GND, so the pin reads \`LOW\`.

So the logic becomes:

- **Not pressed → \`digitalRead(pin)\` is** __BLANK[INPUTHIGHLOW1]__
- **Pressed → \`digitalRead(pin)\` is** __BLANK[INPUTHIGHLOW]__

We'll use this pattern for all the buttons in the status board project.`,
      hint:
        "Remember: with INPUT_PULLUP, a pressed button reads LOW, and a released button reads HIGH.",
    },
    {
      id: 2,
      title: "Step 2: Basic Button Code",
      desc:
        "Here is a minimal example that reads a single button wired from pin 2 to GND, using `INPUT_PULLUP`.",
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
      title: "Step 3: Button Practice Exercises",
      desc:
        "Now try a few different ways of using buttons so you’re ready for the menu page logic in the status board project.",
      hint: "All of these still use INPUT_PULLUP and treat LOW as 'pressed'.",

      // already a codes array: no change needed beyond consistency
      codes: [
        {
          title: "Practice 1: Count Button Presses",
          descBeforeCode:
            "Each time you press the button, increase a counter by 1 and print it to the Serial Monitor.",
      answerKey: {
        BUTTON1: ["INPUT_PULLUP"],
        BUTTON2: ["LOW"],
        BUTTON3: ["1"],
      },
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
          descAfterCode:
            "Try pressing the button multiple times and watch the numbers go up. This is similar to how we move through menu items with each press.",
        },
        {
          title: "Practice 2: Toggle an LED On/Off",
          descBeforeCode:
            "Use the button to turn an LED on and off, switching state each time you press.",
            answerKey: {
              BUTTON4: ["#define"   ],
              BUTTON5: ["BUTTON"],
              BUTTON6: ["INPUT_PULLUP"],
              BUTTON7: ["digitalRead(BUTTON)"],
              BUTTON8: ["LOW"],
            },
          code: `^^__BLANK[BUTTON4]__ BUTTON 2^^
^^#define LED 13^^

^^bool ledState = false;^^

^^void setup() {^^
^^  pinMode(__BLANK[BUTTON5]__, __BLANK[BUTTON6]__);^^   // pin mode for button
^^  pinMode(LED, OUTPUT);^^                              // pin mode for LED which is an output
^^}^^

^^void loop() {^^
^^  if (__BLANK[BUTTON7]__ == __BLANK[BUTTON8]__) {^^    // if button is pressed
^^    ledState = !ledState;^^                            // flip true ↔ false, '!' means 'opposite of'
^^    digitalWrite(LED, ledState);^^                     // switch the LED to true(on) or false(off)
^^    delay(250);^^                                      // simple debounce
^^  }^^
^^}^^`,
          descAfterCode:
            "First press turns the LED **on**, second press turns it **off**, and so on. This idea of flipping a state is exactly how we’ll switch screens or modes later.",
        },
        {
          title: "Practice 3: Cycle Through Options in an Array",
          descBeforeCode:
            "This practice is similar to your menu page. Each press moves to the next item in the list and wraps around when it reaches the end.",
            answerKey: {
              BUTTON9: ["int"],
              BUTTON10: ["BUTTON"],
              BUTTON11: ["10"],
              BUTTON12: ["digitalRead(BUTTON)"],
              BUTTON13: ["LOW"],
            },
          code: `^^#define BUTTON 2^^

^^String options[] = {"Red", "Blue", "Green", "Yellow"};^^
^^int totalOptions = 4;^^
^^int index = 0;^^

^^void setup() {^^
^^  __BLANK[BUTTON9]__  __BLANK[BUTTON10]__ = __BLANK[BUTTON11]__;^^   // define button, connected to pin 10
^^  Serial.begin(9600);^^
^^  Serial.println(options[index]);^^                                   // show the first option
^^}^^

^^void loop() {^^
^^  if (__BLANK[BUTTON12]__ == __BLANK[BUTTON13]__) {^^                 // if the button is pressed
^^    index = index + 1;^^                                              // index increments by 1

^^    if (index >= totalOptions) {^^
^^      index = 0;^^                                                    // wrap back to the first item if you reached the end of the array
^^    }^^

^^    Serial.println(options[index]);^^                                 // print the array of the incremented index
^^    delay(250);^^
^^  }^^
^^}^^`,
          descAfterCode:
            "This is very close to how the status board scrolls through different statuses. The variable `index` is like a menu cursor that moves and wraps around.",
        },
        {
          title: "Practice 4: Only React to a Long Press",
          descBeforeCode:
            "Make your code respond only if the button is held down for about 2 seconds, not just tapped.",
          code: `^^__BLANK[BUTTON14]__  __BLANK[BUTTON15]__  =  __BLANK[BUTTON16]__^^   // define button, connected to pin 10

^^void setup() {^^
^^  pinMode(BUTTON, INPUT_PULLUP);^^
^^  Serial.begin(9600);^^
^^}^^

^^void loop() {^^
^^  if (__BLANK[BUTTON16]__ == __BLANK[BUTTON17]__) {^^   // if button is pressed
^^    delay(2000);^^                                      // wait 2 seconds. This prevents the flickering of buttons!!

^^    if (digitalRead(BUTTON) == __BLANK[BUTTON18]__) {^^  // still pressed?
^^      Serial.println("You held the button!");^^
^^      delay(500);^^                                     // prevent spam
^^    }^^
^^  }^^
^^}^^`,
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
      hint: "The helper checks the pin, waits a bit, and checks again to confirm the press. Make sure variable names match what you have declared previously.",

      codes: [
        {
          title: `Example Code: Debouncing Function`,
          code: `^^bool __BLANK[HELPER1]__(int pin) {^^    // the function returns true or false, so it's a bool type function
^^  if (__BLANK[HELPER2]__) {^^           // if the button is pressed
^^    __BLANK[HELPER3]__;^^               // short delay for mechanical bounce^^
      if (__BLANK[HELPER2]__) {           ^^// if the button is still pressed^^
        return true;
      }
      return false;
    }
}^^

/* Example of how this function can be used in the void loop() */

^^#define button = 1;^^

^^void loop() {^^
^^  if (__BLANK[HELPER1]__(button)) {^^   // if true, then print "Clean press detected"
^^    Serial.println("Clean press detected!");^^  // print message
^^    delay(200);^^                              // extra delay to avoid multiple triggers
^^  }^^
}^^`,
          descAfterCode:
            "The function `isPressed(pin)`:\n\n" +
            "- Reads the pin once and checks if it is `LOW`.\n" +
            "- Waits a short time (`delay(20);`).\n" +
            "- Reads again and only returns `true` if it is **still** `LOW`.\n\n" +
            'This removes most bouncing and gives you a clean "yes or no" for each press. In the status board project, you\'ll use the same idea with buttons like `PREV`, `NEXT`, and `SELECT`.',
        },
        {
          descBeforeCode: `This is what you have done so far including the most recent function for debouncing with buttons.`,
          title: `Up to date full code`,
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
  display.__BLANK[CLEAR]__; // to clear display
  display.__BLANK[SETTEXTSIZE]__; // to select text size
  display.__BLANK[SETTEXTCOLOR]__; // to select text color
  display.__BLANK[SETCURSOR]__(0, 0); // to set cursor location
  display.__BLANK[DISPLAY]__(); // to update the screen to display 

  // set the modes for the buttons you are using 
  pinMode(PREV, INPUT_PULLUP); // PREV button is an input, not output
  pinMode(__BLANK[NEXT]__, __BLANK[INPUT1]__);
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);
}

void __BLANK[WELCOMEFUNCTION]__{
  __BLANK[DISPLAY1]__; //clear display
  __BLANK[DISPLAY2]__; //text size
  __BLANK[DISPLAY3]__; //text color
  __BLANK[DISPLAY4]__; //print line
  __BLANK[DISPLAY5]__; //text size
  __BLANK[DISPLAY6]__; //text cursor
  __BLANK[DISPLAY7]__; //print line
  __BLANK[DISPLAY8]__; //display
}

void __BLANK[STATUSFUNCTION]__{
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__; 
  display.__BLANK[DISPLAY9]__; 
}

void __BLANK[SHOWMENU]__() {
  display.__BLANK[SHOW1]__;      // clear display
  __BLANK[SHOW2]__;              // set text size
  __BLANK[SHOW3]__;              // set cursor location
  display.println(__BLANK[SHOW4]__);       // print your header
  display.println("-------------------");  

  int i = 0;
  while (i < __BLANK[TOTNAME]__) {

    if (i == __BLANK[TRACKNAME]__) {
      display.print(__BLANK[HIGHLIGHT]__);     // highlight the current status
    } else {
      display.print(__BLANK[NONHIGH]__);     // keep spacing for non-selected
    }

    display.println(__BLANK[STATUSARRAY]__);  // print the status text
    __BLANK[INCREMENT]__;                    // move to the next item
  }
  display.display();              // push everything to the screen
}^^

bool __BLANK[HELPER1]__(int pin) {^^    // the function returns true or false, so it's a bool type function
^^  if (__BLANK[HELPER2]__) {^^           // if the button is pressed
^^    __BLANK[HELPER3]__;^^               // short delay for mechanical bounce^^
      if (__BLANK[HELPER2]__) {        ^^// if the button is still pressed^^
        return true;
      }
      return false;
    }
}^^`,
        },
      ],
    },
  ],

  7: [
    {
      id: 1,
      title: "Step 1: Using button to toggle around the menu",
      desc: `Cycle through options with Prev/Next and show the confirmed choice. If a button is pressed, the __BLANK[TRACKNAME]__ updates such that pressing NEXT button increments it by 1 and PREVIOUS decrements it by 1. Then, that new number in __BLANK[TRACKNAME]__ would indicate the new index of the array of status to highlight in the menu page.
Recall your function called __BLANK[SHOWMENU]__. In that function, we are looping until we reach the correct __BLANK[TRACKNAME]__ then highligh that status.
For example, let's say your __BLANK[TRACKNAME]__ == 2, and you pressed NEXT, making it to be 3. Then, we will update our menu page to highlight the status corresponding to index 3.`,
      hint: "Wrap-around: when counter goes below 0 or past the end, jump to the other side.",

      codes: [
        {
          // ✅ gif -> imageGrid inside codes
          imageGridBeforeCode: {
            columns: 1,
            rows: 1,
            items: [{ image: require("../../../assets/loop.png"), label: "Menu loop concept" }],
          },

          topicTitle: `Using PREV button to toggle upward`,
          descBeforeCode: `If the PREV button is pressed, we want to move **upward** through the list of statuses.

**Here’s what this code should do:**
- Use your button helper function __BLANK[HELPER1]__ to check if the PREV button is pressed.
- If it is pressed, decrease the menu index or counter variable __BLANK[TRACKNAME]__ by 1 to move to the previous item in the list.
- If the counter becomes smaller than 0, wrap it around to the **last item** in the array __BLANK[STATUSNAME]__.
- Call the function __BLANK[SHOWMENU]__ that would give the menu screen to show the newly selected item.
- Add a small delay so the button doesn't scroll too quickly.`,
          code: `^^if (__BLANK[HELPER1]__(PREV) == true) {^^    // If the PREV button is pressed. Use the Debouncing function you created.
^^  __BLANK[VL1]__ = __BLANK[VL1]__ - 1;^^      // Decrease the index by 1
^^  if (__BLANK[VL1]__ < __BLANK[VL2]__) {^^    // If we went before the first item in array of status
^^    __BLANK[VL3]__ = __BLANK[VL4]__ - 1;^^    // Let index wrap around to the last item. Hint: use the variable you made for total number of status in array.
^^  }^^
^^}^^`,
        },
        {
          topicTitle: `Using NEXT button to toggle downward`,
          descBeforeCode: `If the NEXT button is pressed, we want to move **downward** through the list of statuses.

**Here’s what this code should do:**
- Use your button helper function __BLANK[HELPER1]__ to check if the NEXT button is pressed.
- If it is pressed, increase the menu counter variable __BLANK[TRACKNAME]__ by 1 to move to the next item in the list.
- If the counter becomes equal to the number of items  __BLANK[TOTNAME]__, wrap it around to the **first item** in the array (index 0).
- Call the function again __BLANK[SHOWMENU]__ to refresh the menu screen to show the newly selected item.
- Add a small delay so the button doesn’t scroll too fast.`,
          code: `^^if (__BLANK[HELPER0]__(__BLANK[VL5]__) == true) {^^        // If the NEXT button is pressed. Use the Debouncing function you created.
^^  __BLANK[VL6]__ = __BLANK[VL7]__;^^                  // Increase the index by 1
^^  if (__BLANK[VL8]__ > __BLANK[VL9]__) {^^            // If we went after the last item in array of status
^^    __BLANK[VL10]__;^^                        // Let index wrap around to the first item in the array
^^  }^^
^^}^^`,
        },
        {
          topicTitle: `Using SELECT button`,
          descBeforeCode: `If the SELECT button is pressed, we want to **confirm** the current status.

**Here’s what this code should do:**
- Use your button helper function __BLANK[HELPER1]__ to check if the SELECT button is pressed.
- If it is pressed, set a variable (\`showingStatus\`) to remember that the status is chosen.
- Call a function __BLANK[SHOWCONFIRMED]__ that will draw the confirmed status screen on the OLED.
- Add a small delay so one long press doesn’t count as many presses.`,
          code: `^^if (__BLANK[HELPER00]__  == true) {      ^^// If the SELECT button is pressed^^
  showingStatus = true;    ^^// Mark that the current status is confirmed^^
  __BLANK[STATUSFUNCTION]__();                ^^// Show the confirmed status on the screen^^
}^^`,
        },
      ],
    },

    {
      id: 2,
      title: "Step 2: Going Back to the Menu page",

      codes: [
        {
          topicTitle: `From Status Page to Menu Page`,
          descBeforeCode: `When the user is viewing a status page (for example, “Studying”, “Sleeping”, “Gaming”, etc.), we want a way to return to the main menu without restarting the Arduino.
To add this behavior, we will use one of the existing buttons, such as the **PREV** button, as the “Back to Menu” control.

**Here’s what this code should do:**
- Use the button helper function __BLANK[HELPER1]__ to check if the PREV button is pressed.  
- If it is pressed, set the screen mode variable __BLANK[STATE]__ to switch back to **menu mode**.  
- Call a function __BLANK[SHOWMENU]__ to redraw the main menu on the OLED screen.  
- Add a short delay so one long press doesn’t register multiple times.`,
          code: `
// If the PREV button is pressed while viewing a status page,
// go back to the main menu^^
if (__BLANK[HELPER000]__ == __BLANK[ISHELPER]__) {            ^^// check if PREV is pressed^^
  showingStatus = __BLANK[MENU_MODE]__; ^^       // switch screen state to menu mode, switch the showingStatus (true/false)^^
  __BLANK[SHOWMENU]__();                  ^^   // call function to call the menu screen^^
  __BLANK[VLDELAY]__;                 ^^ // add a delay to prevent repeats^^
}^^`,
          descAfterCode: `With this logic in place, your user can navigate **from any status page back to the main menu** just by pressing the PREV button.
Later, when you build additional pages or modes, you can reuse this same pattern—just make sure the screen mode variable, helper function, and menu-rendering function match the rest of your program.`,
        },
        {
          topicTitle: `Add a condition`,
          descBeforeCode: `We are now using the **same PREV button** for two different jobs:

- When we are on the **menu screen**, PREV should move the highlight to the **previous status** in the list.
- When we are on the **status screen**, PREV should take us **back to the menu screen**.

The Arduino can’t guess which meaning we want unless we tell it **which screen we’re currently showing**.  

That’s why we use a boolean called **showingStatus**:

- \`showingStatus = false\` → we are on the **menu** page.
- \`showingStatus = true\` → we are on the **status** page.

Then we add a condition so PREV checks \`showingStatus\` and decides **which behavior** to run.`,
          code: `^^if (showingStatus == false) {^^
  ^^if (__BLANK[HELPER1]__(PREV) == true) {^^    // If the PREV button is pressed. Use the Debouncing function you created.
    ^^__BLANK[VL1]__ = __BLANK[VL1]__ - 1;^^      // Decrease the index by 1
    ^^if (__BLANK[VL1]__ < __BLANK[VL2]__) {^^    // If we went before the first item in array of status
      ^^__BLANK[VL3]__ = __BLANK[VL4]__ - 1;^^    // Let index wrap around to the last item in the array
    ^^}^^
  ^^}^^
  ^^else if (showingStatus == __BLANK[STATUSTF]__) {^^
    ^^showingStatus = __BLANK[MENU_MODE]__;^^     // switch screen state to menu mode
    ^^__BLANK[SHOWMENU]__();^^                    // call function to show the menu screen
    ^^__BLANK[VLDELAY]__;^^                       // add a delay to prevent repeats
  ^^}^^
^^}^^`,
        },
      ],
    },

    {
      id: 3,
      title: "Step 3: Putting it All Together",
      desc: `Combining all the functions, variables, setup, and loop, your code should look like this:`,

      codes: [
        {
          code: `^^#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define WIDTH  __BLANK[WIDTH]__
#define HEIGHT __BLANK[HEIGHT]__
#define RESET  -1
Adafruit_SSD1306 display(WIDTH, __BLANK[HEIGHT2]__, &Wire, RESET);

#define PREV __BLANK[PREVN]__
#define NEXT __BLANK[NEXTN]__
#define __BLANK[SEL]__  __BLANK[SELN]__   

__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__, 
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__,
};

__BLANK[TOTTYPE]__   __BLANK[TOTNAME]__   = __BLANK[TOTNUM]__;
__BLANK[TRACKTYPE]__ __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__;

bool showingStatus = false;   // menu mode (false) vs status mode (true)

void setup() {
  Wire.begin();
  display.__BLANK[BEGIN]__(__BLANK[BEGINA]__, 0x3C);
  display.__BLANK[CLEAR]__;        // to clear display
  display.__BLANK[SETTEXTSIZE]__;  // to select text size
  display.__BLANK[SETTEXTCOLOR]__; // to select text color
  display.__BLANK[SETCURSOR]__(0, 0); // to set cursor location
  display.__BLANK[DISPLAY]__();    // to update the screen to display 

  // set the modes for the buttons you are using 
  pinMode(PREV, INPUT_PULLUP); // PREV button is an input, not output
  pinMode(__BLANK[NEXT]__, __BLANK[INPUT1]__);
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);
}

void loop() {
  if (showingStatus == false) {
    __BLANK[SHOWMENU]__();

    if (__BLANK[HELPER1]__(PREV) == true) {    // If the PREV button is pressed. Use the Debouncing function you created.
      __BLANK[VL1]__ = __BLANK[VL1]__ - 1;     // Decrease the index by 1
      if (__BLANK[VL1]__ < __BLANK[VL2]__) {   // If we went before the first item in array of status
        __BLANK[VL3]__ = __BLANK[VL4]__ - 1;   // Let index wrap around to the last item in the array
      }
    }

    if (__BLANK[HELPER0]__(__BLANK[VL5]__) == true) {   // If the NEXT button is pressed. Use the Debouncing function you created.
      __BLANK[VL6]__ = __BLANK[VL7]__;                  // Increase the index by 1
      if (__BLANK[VL8]__ > __BLANK[VL9]__) {            // If we went after the last item in array of status
        __BLANK[VL10]__;                                // Let index wrap around to the first item in the array
      }
    }

    if (__BLANK[HELPER00]__ == true) {       // If the SELECT button is pressed
      showingStatus = true;                  // Mark that the current status is confirmed
      __BLANK[STATUSFUNCTION]__();           // Show the confirmed status on the screen
    }
  }  // end of showingStatus == false

  else if (showingStatus == __BLANK[STATUSTF]__) {
    showingStatus = __BLANK[MENU_MODE]__;    // switch screen state to menu mode
    __BLANK[SHOWMENU]__();                   // call function to show the menu screen
    __BLANK[VLDELAY]__;                      // add a delay to prevent repeats
  }
}   // end loop()

void __BLANK[WELCOMEFUNCTION]__() {
  __BLANK[DISPLAY1]__; //clear display
  __BLANK[DISPLAY2]__; //text size
  __BLANK[DISPLAY3]__; //text color
  __BLANK[DISPLAY4]__; //print line
  __BLANK[DISPLAY5]__; //text size
  __BLANK[DISPLAY6]__; //text cursor
  __BLANK[DISPLAY7]__; //print line
  __BLANK[DISPLAY8]__; //display
}

void __BLANK[STATUSFUNCTION]__() {
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__; 
  display.__BLANK[DISPLAY9]__; 
}

void __BLANK[SHOWMENU]__() {
  display.__BLANK[SHOW1]__;      // clear display
  __BLANK[SHOW2]__;              // set text size
  __BLANK[SHOW3]__;              // set cursor location
  display.println(__BLANK[SHOW4]__);       // print your header
  display.println("-------------------");  

  int i = 0;
  while (i < __BLANK[TOTNAME]__) {

    if (i == __BLANK[TRACKNAME]__) {
      display.print(__BLANK[HIGHLIGHT]__);     // highlight the current status
    } else {
      display.print(__BLANK[NONHIGH]__);       // keep spacing for non-selected
    }

    display.println(__BLANK[STATUSARRAY]__);   // print the status text
    __BLANK[INCREMENT]__;                      // move to the next item
  }
  display.display();              // push everything to the screen
}

bool __BLANK[HELPER1]__(int pin) {    // the function returns true or false, so it's a bool type function
  if (__BLANK[HELPER2]__) {           // if the button is pressed
    __BLANK[HELPER3]__;               // short delay for mechanical bounce
    if (__BLANK[HELPER2]__) {         // if the button is still pressed
      return true;
    }
    return false;
  }
  return false;
}^^`,
        },
      ],
    },
  ],
};

export default function CodeBeg() {
  return (
    <CodeLessonBase
      screenTitle="Coding (Beginner)"
      lessonSteps={LESSON_STEPS_BEGINNER}
      storagePrefix="esb:coding:beginner"
      doneSetKey="esb:coding:beginner:doneSet"
      overallProgressKey="esb:coding:beginner:overallProgress"
      globalBlanksKey="esb:coding:beginner:blanks:GLOBAL"
      localBlanksPrefixKey="esb:coding:beginner:blanks:LOCAL"
      analyticsTag="coding_beginner"
      apiBaseUrl="http://localhost:4000"
      backRoute="/projects/electric-status-board/learn"
    />
  );
}

// WOKWI: https://wokwi.com/projects/450650715926197249

import React from "react";
import CodeLessonBase from "./components/CodeLessonBase";

const LESSON_STEPS_ADVANCED = {
  1: [
    {
      id: 1,
      title: "Step 1: Setting Libraries",
      // (kept at step-level if you still want it elsewhere, but the new renderer flow is inside codes[])
      codes: [
        {
          topicTitle: "Include Libraries",
          descBeforeCode:
            "Coding libraries are collections of prewritten code that help you perform common tasks. Using libraries saves time and prevents you from having to write everything from scratch. For our electronic status board, we need the correct libraries to communicate with the SSD1306 OLED display over I²C and to draw text and shapes on the screen.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `^^#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h> 
(ADD CLOCK MODULE HERE - ANUSHKA)     
^^
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

\`#include CLOCK MODULE HERE - ANUSHKA\` 
ADD EXPLANATION FOR CLOCK MODULE HERE - ANUSHKA

**Together, these libraries allow the Arduino to communicate with the OLED and render text and graphics on the screen.**`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint:
            "Adafruit_GFX provides drawing; Adafruit_SSD1306 is the OLED driver.",
        },
      ],
    },

    {
      id: 2,
      title: "Step 2: Defining Screen",

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

      codes: [
        {
          topicTitle: "Define the OLED dimensions",
          descBeforeCode: `Define the OLED dimensions and create the display object. This allows the libaray to know the correct dimensions of the screen and to send data to the correct pixels. Many modules are 128×64; slim ones are 128×32. So now, we have to define the width to be 128 and height to be 64 or 32. 

**Fill in the blanks.**`,
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
^^
#define WIDTH  __BLANK[WIDTH]__ 
#define HEIGHT __BLANK[HEIGHT]__
#define RESET  -1
Adafruit_SSD1306 display (WIDTH, __BLANK[HEIGHT2]__ , &Wire, RESET);^^

void setup(){
}

void loop(){
}`,
          descAfterCode: `Here’s what the blanks represent:
- The first blank is for the **variable name** for height and the second blank describes the **screen’s height** (in pixels).
- The **value you fill in** should match your OLED module’s actual pixel height.
- The **same height variable** must be used again inside the \`display()\` constructor.`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "If your board has no RESET pin wired, keep RESET at -1.",
        },
      ],
    },

    {
      id: 3,
      title: "Step 3: Button Pins",

      answerKey: {
        PREVN: { type: "range", min: 0, max: 13 },
        NEXTN: { type: "range", min: 0, max: 13 },
        SEL: { type: "identifier" },
        SELN: { type: "range", min: 0, max: 13 },
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

      codes: [
        {
          topicTitle: "Define button pins",
          descBeforeCode:
            "Next, we create names for the three buttons so the code knows which Arduino pins they are connected to, and so the program is easier to read and understand than if we used raw pin numbers. For this project, we need one button to move the cursor to the next option, one button to move to the previous option, and one button to select the highlighted option. If you want more practice working with buttons, review Lesson 1.",
          imageGridBeforeCode: {
            columns: 1,
            items: [
              {
                image:
                  "https://dummyimage.com/600x400/ddd/000.png&text=Example+Circuit+Image",
                label: "Example Circuit Image",
              },
            ],
          },
          descBetweenBeforeAndCode: null,
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
          descAfterCode: `Use the digital pin numbers on your Arduino from **your circuit design**, which are the ones you used for the previous, next, and select buttons.
      
For example, the first blank for PREV can be 3 if you connected it to digital pin 3, as shown in the example circuit image below. Fill in the rest of the blanks for the Next and Select buttons based on your wiring.`,
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

      answerKey: {
        BEGIN: ["begin"],
        BEGINA: ["display.begin(SSD1306_SWITCHCAPVCC, 0x3C)"],
        BEGINB: ["0x3C"],
        CLEAR: ["display.clearDisplay()"],
        SETTEXTSIZE: ["display.setTextSize"],
        SETTEXTSIZE2: { type: "range", min: 1, max: 5 },
        SETTEXTCOLOR: ["display.setTextColor"],
        SETTEXTCOLOR2: ["SSD1306_WHITE", "SSD1306_BLACK", "SSD1306_INVERSE"],
        SETCURSOR: ["display.setCursor"],
        XCOORD: { type: "range", min: 0, max: 127 },
        YCOORD: { type: "range", min: 0, max: 63 },
        DISPLAY: ["display.display()"],
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
        XCOORD:
          "This is the x-coordinate (horizontal position) of the cursor. You can choose any number from 0 to the screen width minus the text width.",
        YCOORD:
          "This is the y-coordinate (vertical position) of the cursor. You can choose any number from 0 to the screen height minus the text height.",
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

      codes: [
        {
          topicTitle: "Initialize OLED + Buttons in setup()",
          descBeforeCode:
            "Now we need to start I²C, initialize the OLED display at address 0x3C, clear the screen, and set the button pins to INPUT_PULLUP. All of these actions are placed inside void setup() because they only need to run once at the beginning of the program. Refer to the descriptions below to understand what each function does.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
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
  __BLANK[BEGINA]__;      // Initialize OLED
  __BLANK[CLEAR]__;      // to clear display
  __BLANK[SETTEXTSIZE]__(__BLANK[SETTEXTSIZE2]__);      // to select text size
  __BLANK[SETTEXTCOLOR]__(__BLANK[SETTEXTCOLOR2]__);      // to select text color
  __BLANK[SETCURSOR]__(__BLANK[XCOORD]__, __BLANK[YCOORD]__);   // to set cursor location
  __BLANK[DISPLAY]__;    // to update the screen to display 

// set the modes for the buttons you are using 
  pinMode(PREV, INPUT_PULLUP);  // PREV button is an input, not output
  pinMode(__BLANK[NEXT]__, __BLANK[INPUT1]__);  // NEXT button
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);^^.     // SELECT button
}`,
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

  2: [
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
                image: require("../../../assets/welcomeFunc.png"),
                label: "Example: welcome function",
              },
            ],
          },
          descBetweenBeforeAndCode: `This is an example of a function named welcomeFunc. All of the lines of code inside the curly brackets define what welcomeFunc does. You can run this function by calling it in either setup() or loop(). As a reminder, functions are reusable blocks of code that perform a specific task. 
      
Since we want the welcome page to show up only ONCE when we turn the device on, we will place that function in the **setup()**.
Read through each line of the code in the example above, and try to understand what it does.`,
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
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: null,
        },
      ],
    },
  ],

  3: [
    {
      id: 1,
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
- \`float\` : decimal numbers
`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "A variable stores exactly one piece of information.",
        },
      ],
    },

    {
      id: 2,
      title: "Step 2: Practice with Variables",
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
          descAfterCode: `String uses double quotation \`"" ""\`.
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
      codes: [
        {
          topicTitle: "Practice: Arrays",
          descBeforeCode:
            "A list (array) stores many values under one variable name. This is perfect for storing multiple menu options.",
          imageGridBeforeCode: {
            columns: 1,
            items: [
              {
                image: require("../../../assets/array.png"),
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
                image: require("../../../assets/videos/CurioLabL4.gif"),
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
          descAfterCode: `These two variables let the menu scroll correctly. In our code we can check the value of counter:
  - If it is past the last item → wrap back to the first  
  - If it is before the first → wrap to the last
This way the menu will always "wrap around" and cycle smoothly, just like the image above.

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
          descAfterCode: `Now your project can:
  - Move up and down the list using the buttons  
  - Display the correct message on the OLED  
  - Change screens when the user selects a status
Variables track **where** you are.  Arrays track **what choices** you have.`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: null,
        },
      ],
    },
  ],

  4: [
    {
      id: 1,
      title: "Step 1: What is a Loop?",
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
      codes: [
        {
          topicTitle:
            "While Loop Practice Pack (examples + exercises in one block)",
          descBeforeCode:
            "A while loop repeats a block of code as long as its condition is true. Here is a simple example that prints numbers.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: `Loop Practice 1–6 are included below as separate mini-exercises in the same code block.`,
          code: `^^// Practice: How While Loops are used^^
^^int i = 0;                      ^^// 1. start value^^
while (i < 4) {                 ^^// 2. condition^^
  Serial.println(i);
  i = i + 1;                    ^^// 3. update (moves i forward)^^
}^^

^^// Loop Practice 1: Print Even Numbers^^
^^int num = 2;
while (num < __BLANK[LOOP1]__){
  Serial.println(__BLANK[LOOP2]__);
  num = num + __BLANK[LOOP3]__;
}^^

^^// Loop Practice 2: Print Multiples of 3^^
^^int x = __BLANK[LOOP5]__;
while (__BLANK[LOOP6]__ < __BLANK[LOOP7]__){
  Serial.println(__BLANK[LOOP8]__);
  x = __BLANK[LOOP9]__;
}^^

^^// Loop Practice 3: Stop when a Number Reaches a Limit^^
^^int __BLANK[LOOP10]__ = 5;
while (__BLANK[LOOP11]__ < __BLANK[LOOP12]__){
  Serial.println(__BLANK[LOOP13]__);
  __BLANK[LOOP14]__ = __BLANK[LOOP15]__;
}^^

^^// Loop Practice 4: Loop Until Button Press^^
^^__BLANK[LOOP16]__ ready = __BLANK[LOOP17]__;
while (__BLANK[LOOP11]__ == false){
  Serial.println(__BLANK[LOOP13]__);
}^^

^^// Loop Practice 5: Loop through Array 1^^
^^int nums[] = {2, 4, 7, 9, 11, 14};
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
}^^

^^// Loop Practice 6: Loop through Array 2^^
^^int __BLANK[LOOP17]__ = {4, 3, 2, 10, 1, 6};
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
          descAfterCode: `This loop prints the numbers 0, 1, 2, and 3, then stops when \`i < 4\` becomes false.

The pattern is:
- **Start value:** \`int i = 0;\`
- **Condition:** \`i < 4\` → “keep going while this is true”
- **Update:** \`i = i + 1;\` → move to the next number
If you forget the update line, the loop never ends, because \`i\` would stay the same forever.

What does the \`i\` read after while loop ends?    __BLANK[ANSWER]__`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "Focus on the three parts: start value, condition, and update.",
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
 This code will be very similar to how you did in the "Loop Through Array" practice.`,
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
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
            "We want the menu to show which status is currently selected by displaying a symbol like > next to the status. We do this by checking if the loop index i matches a desired index number.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
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
            "This is what you should have so far. You will add the new function that shows menu with the other functions you have already made.",
          imageGridBeforeCode: {
            columns: 1,
            items: [
              {
                image: require("../../../assets/videos/CurioLabL4.gif"),
                label: "Menu preview",
              },
            ],
          },
          descBetweenBeforeAndCode:
            "Now we use the same while loop idea, and we draw everything on the OLED screen inside a function.",
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
  display.println(__BLANK[STATUSNAME2]__[__BLANK[TRACKNAME2]__]); 
}

^^void __BLANK[SHOWMENU]__() {
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
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: null,
        },
      ],
    },
  ],

  5: [
    {
      id: 1,
      title: "Step 1: Adding Clock Functionality (ANUSHKA)",
      codes: [
        {
          topicTitle: "Clock Module Placeholder",
          descBeforeCode: "...",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `^^
...
^^`,
          descAfterCode: `...`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "...",
        },
      ],
    },
  ],

6: [
    {
      id: 1,
      title: "Step 1: Adding Timer Functionality",
      codes: [
        {
          topicTitle: "Understanding the Timer Logic",
          descBeforeCode: "In previous lessons, you learned how to store related pieces of information inside an array and access them using an index. In this lesson, the timer feature uses that same idea to store preset time values.",
          imageGridBeforeCode: {
            columns: 1,
            items: [
              {
                image: require("../../../assets/welcomeFunc.png"), // Update this path if needed
                label: "Timer Logic Flow",
              },
            ],
          },
          descBetweenBeforeAndCode: null,
          code: `^^// No code for this step. 
// Review the logic below before moving to Step 2.^^`,
          descAfterCode: `**We want to let the user:**
1. Choose a timer duration from a preset list
2. Start the timer
3. See the countdown update automatically
4. Be notified when time runs out

**How will this work logically?**
- The timer durations are stored in an array:
  \`int TIMER_PRESETS_MIN[] = {10, 20, 30, 45, 60};\`
- A variable called \`timerPresetIndex\` keeps track of which preset is currently selected.
- The **NEXT** and **PREV** buttons change the index.
- The **SEL** button confirms the choice and starts the timer.`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "This is very similar to how the status menu worked earlier — instead of statuses, we are scrolling through timer durations.",
        },
      ],
    },

    {
      id: 2,
      title: "Step 2: NEXT/PREV Input Handling",

      answerKey: {
        NEXT: ["NEXT"],
        PREV: ["PREV"],
        IDX: ["timerPresetIndex"],
        LIMIT: ["totalTimerPresets"],
        RESET_ZERO: ["0"]
      },

      blankExplanations: {
        NEXT: "The button pin constant for moving forward (NEXT).",
        PREV: "The button pin constant for moving backward (PREV).",
        IDX: "The variable tracking the current position in the menu (timerPresetIndex).",
        LIMIT: "The total number of items in the preset array (totalTimerPresets).",
        RESET_ZERO: "The first index of an array is always 0."
      },

      codes: [
        {
          topicTitle: "Timer Selection Function",
          descBeforeCode: "Each timer preset represents a number of minutes. The program allows the user to scroll through these preset values. We use bounds checking to make sure the index stays within the list.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `void handleTimerSelectMode() { 
  // 1. Handle NEXT Button (Increment Index)
  if (isPressed(__BLANK[NEXT]__) == true) {
    __BLANK[IDX]__ = __BLANK[IDX]__ + 1;
    
    // Bounds check: If we go past the end, loop back to start
    if (__BLANK[IDX]__ >= __BLANK[LIMIT]__) {
      __BLANK[IDX]__ = __BLANK[RESET_ZERO]__;
      }
      delay(200);
  }

  // 2. Handle PREV Button (Decrement Index)
  if (isPressed(__BLANK[PREV]__) == true) {
    __BLANK[IDX]__ = __BLANK[IDX]__ - 1;
    
    // Bounds check: If we go below zero, loop to the end
    if (__BLANK[IDX]__ < __BLANK[RESET_ZERO]__) {
      __BLANK[IDX]__ = __BLANK[LIMIT]__ - 1;
    }
    delay(200);
  }`,
          descAfterCode: `This logic creates a "carousel" effect. 
- If you go past the last item, it wraps around to the start (0).
- If you go before the first item, it wraps around to the end.`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "Use 'totalTimerPresets' to know the limit of the list.",
        },
      ],
    },

    {
      id: 3,
      title: "Step 3: SEL Input Handling",

      answerKey: {
        SEL: ["SEL"],
        RTC_NOW: ["rtc.now()"],
        MIN_ARRAY: ["TIMER_PRESETS_MIN"],
        IDX: ["timerPresetIndex"],
        TIME_ADD: ["TimeSpan"],
        MODE_COUNT: ["3"]
      },

      blankExplanations: {
        SEL: "The constant for the Select button.",
        RTC_NOW: "The RTC library function to get the current time.",
        MIN_ARRAY: "The array containing the preset minute values (TIMER_PRESETS_MIN).",
        IDX: "The index variable used to pick the correct minutes.",
        TIME_ADD: "The object type added to 'now' to create a future timestamp (TimeSpan).",
        MODE_COUNT: "Screen mode 3 corresponds to the Countdown Running screen."
      },

      codes: [
        {
          topicTitle: "Starting the Timer",
          descBeforeCode: "When **SEL** is pressed, the program must calculate exactly when the timer should end. We do this by taking the current time (`now`) and adding the selected number of minutes.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `  // ... previous NEXT/PREV code ...

  // 3. Handle SELECT Button (Start Timer)
  if (isPressed(__BLANK[SEL]__) == true) {
    DateTime now = __BLANK[RTC_NOW]__;
    
    // Get the minutes from the array based on current index
    int minutes = __BLANK[MIN_ARRAY]__[__BLANK[IDX]__];
    
    // MATH: End Time = Current Time + (0 days, minutes, 0 seconds)
    timerEndTime = now + __BLANK[TIME_ADD]__(0, minutes, 0); 
    
    // Switch to Countdown Mode (Mode 3)
    screenMode = __BLANK[MODE_COUNT]__;
    delay(200);
  }
    
  int presetMinutes = TIMER_PRESETS_MIN[timerPresetIndex];
  showTimerScreen("Select timer:", presetMinutes, 0);
}`,
          descAfterCode: `**Key Concept: TimeSpan**
\`timerEndTime = now + TimeSpan(0, minutes, 0);\`
This line adds the selected minutes to the current clock time to calculate the exact moment the timer should finish.`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "We add a TimeSpan to the current time to get the future end time.",
        },
      ],
    },

    {
      id: 4,
      title: "Step 4: Countdown Display Function",

      answerKey: {
        RTC_NOW: ["rtc.now()"],
        END_TIME: ["timerEndTime"],
        CURR_TIME: ["now"],
        TO_SEC: ["totalseconds()"]
      },

      blankExplanations: {
        RTC_NOW: "Call the RTC function to get the current time.",
        END_TIME: "The variable storing the calculated finish time.",
        CURR_TIME: "The variable storing the current moment (now).",
        TO_SEC: "A helper function that converts a TimeSpan object into a total number of seconds."
      },

      codes: [
        {
          topicTitle: "Calculating Remaining Time",
          descBeforeCode: "While the timer is running, the program constantly checks: *Is the current time past the end time?* It calculates the difference between `timerEndTime` and `now`.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `void handleTimerCountdownMode() {
  DateTime now = __BLANK[RTC_NOW]__;
  
  // LOGIC: Remaining time is the difference between Future and Now
  TimeSpan remaining = __BLANK[END_TIME]__ - __BLANK[CURR_TIME]__;
  
  // Convert the complex TimeSpan into simple total seconds for math
  long secLeft = remaining.__BLANK[TO_SEC]__;`,
          descAfterCode: `We convert everything to **total seconds** (\`secLeft\`) because it is much easier to check if \`secLeft <= 0\` than to compare hours, minutes, and seconds separately.`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "Subtract 'now' from 'timerEndTime' to find the remaining duration.",
        },
      ],
    },

    {
      id: 5,
      title: "Step 5: Finalizing Countdown Function",

      answerKey: {
        PREV: ["PREV"],
        MATH_60: ["60"]
      },

      blankExplanations: {
        PREV: "The Previous button allows the user to cancel.",
        MATH_60: "Used to convert seconds to minutes (division) or find remainder seconds (modulo)."
      },

      codes: [
        {
          topicTitle: "Countdown Logic",
          descBeforeCode: "Finally, we handle the three states of the countdown: Canceling (User presses PREV), Finishing (Time runs out), or Running (Show the time).",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `  // ... previous calculation code ...

  // 1. Allow Cancel with PREV
  if (isPressed(__BLANK[PREV]__) == true) {   
    screenMode = 2; // Return to selection
    delay(200);
  }

  // 2. Check if Time is Up
  if (secLeft <= 0) {    
    screenMode = 4; // Go to "Time's Up" screen
    delay(200);
  } else {
    // 3. Convert Seconds back to Min:Sec for display
    int minsLeft = secLeft / __BLANK[MATH_60]__;
    
    // Calculate remainder seconds (Logic: Total - (Mins * 60))
    int secsLeft = secLeft - (minsLeft * __BLANK[MATH_60]__);
    
    showTimerScreen("Timer running:", minsLeft, secsLeft);
  }
}`,
          descAfterCode: `**Math Check:**
If you have 65 seconds left:
- \`minsLeft = 65 / 60\` which is **1**.
- \`secsLeft = 65 - (1 * 60)\` which is **5**.
So the screen displays **1:05**.`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "To find seconds remaining after extracting minutes, we subtract (minutes * 60).",
        },
      ],
    },
  ],
 6: [
    {
      id: 1,
      title: "Step 1: Adding Timer Functionality",
      codes: [
        {
          topicTitle: "Understanding the Timer Logic",
          descBeforeCode: "In previous lessons, you learned how to store related pieces of information inside an array and access them using an index. In this lesson, the timer feature uses that same idea to store preset time values.",
          imageGridBeforeCode:{
            columns: 1,
            items: [
              {
                image: require("../../../assets/welcomeFunc.png"),
                label: "Placeholder for gif",
              },
            ],
          },          
          descAfterImage: "**We want to let the user:**\n**1.** Choose a timer duration from a preset list\n**2.** Start the timer\n**3.** See the countdown update automatically\n**4.** Be notified when time runs out\n\n **How will this work logically?**\n- The timer durations are stored in an array:\n\`int TIMER_PRESETS_MIN[] = {10, 20, 30, 45, 60};\`\n- A variable called \`timerPresetIndex\` keeps track of which preset is currently selected\n- The **NEXT** and **PREV** buttons change the index\n- The **SEL** button confirms the choice and starts the timer",
          descBetweenBeforeAndCode: null,
          code: null,
          descAfterCode: null,
          imageGridAfterCode: null,
          hint: "This is very similar to how the status menu worked earlier — instead of statuses, we are scrolling through timer durations.",
        },
      ],
    },

    {
      id: 2,
      title: "Step 2: NEXT/PREV Input Handling",
      answers: ["totalTimerPresets"],
      codes: [
        {
          topicTitle: "Timer Selection Function",
          descBeforeCode: "In previous lessons, you learned how to store related pieces of information inside an array and access them using an index.\n\nIn this lesson, the timer feature uses that same idea to store preset time values. Each timer preset represents a number of minutes. Instead of typing a time manually, the program allows the user to scroll through these preset values and select one. A separate variable is used to track which preset is currently selected. This variable stores a number that points to one position in the preset array.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `^^void handleTimerSelectMode() { // NEXT / PREV choose preset^^
^^  if (isPressed(__BLANK[NEXT]__) == true) {^^
^^    timerPresetIndex = timerPresetIndex + 1;^^
^^    if (timerPresetIndex >= __BLANK[totalTimerPresets]__) {^^
^^      timerPresetIndex = 0;^^
^^      }^^
^^      delay(200);^^
^^  }^^

^^  if (isPressed(__BLANK[PREV]__) == true) {^^
^^    timerPresetIndex = timerPresetIndex - 1;^^
^^    if (timerPresetIndex < __BLANK[0]__) {^^
^^      timerPresetIndex = __BLANK[totalTimerPresets]__ - 1;^^
^^    }^^
^^    delay(200);^^
^^  }^^`,
          descAfterCode: `...`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "...",
        },
      ],
    },

    {
      id: 3,
      title: "Step 3: SEL Input Handling",
      codes: [
        {
          topicTitle: "Wrapping Up Timer Selection Function",
          descBeforeCode: "In Lesson 5, you learned how the program switches between different behaviors using conditional logic. In this step, you will use the **SEL** button to select and begin the timer countdown.\n\nWhen **SEL** is pressed, the program must determine which preset was chosen and calculate when the timer should end. This is done by reading the current time and adding the selected number of minutes. The program then switches to a new screen mode where the countdown will be displayed.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `void handleTimerSelectMode() { // NEXT / PREV choose preset
  if (isPressed(__BLANK[NEXT]__) == true) {
    timerPresetIndex = timerPresetIndex + 1;
    if (timerPresetIndex >= __BLANK[totalTimerPresets]__) {
      timerPresetIndex = 0;
      }
      delay(200);
  }

  if (isPressed(__BLANK[PREV]__) == true) {
    timerPresetIndex = timerPresetIndex - 1;
    if (timerPresetIndex < __BLANK[0]__) {
      timerPresetIndex = __BLANK[totalTimerPresets]__ - 1;
    }
    delay(200);
  }

^^// SELECT → start countdown
  if (isPressed(__BLANK[SEL]__) == true) {
    DateTime now = rtc.__BLANK[now()]__;
    int minutes = TIMER_PRESETS_MIN[__BLANK[timerPresetIndex]__];
    timerEndTime = now + TimeSpan(0, __BLANK[minutes]__, 0);  // 0 hours, minutes, 0 seconds
    screenMode = __BLANK[3]__;
    delay(200);
  }
    
  int presetMinutes = TIMER_PRESETS_MIN[timerPresetIndex];
  showTimerScreen("Select timer:", presetMinutes, 0);
}^^`,
          descAfterCode: `...`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "...",
        },
      ],
    },

    {
      id: 4,
      title: "Step 4: Countdown Display Function",
      codes: [
        {
          topicTitle: "Establishing Local Variables in Countdown Mode",
          descBeforeCode: "While the timer is running, the program must determine how much time remains. Instead of counting down manually, the program compares the current time to the previously calculated end time. The difference between these two values represents the remaining time. This difference is converted into seconds so it can be used for display and decision-making.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `^^void handleTimerCountdownMode() {
  DateTime now = rtc.__BLANK[now()]__;
  TimeSpan remaining = timerEndTime - __BLANK[now]__;
  long secLeft = remaining.totalseconds();^^`,
          descAfterCode: `...`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "...",
        },
      ],
    },

    {
      id: 5,
      title: "Step 5: Finalizing Countdown Function",
      codes: [
        {
          topicTitle: "Countdown Logic, Canceling, and Completion",
          descBeforeCode: "If the PREV button is pressed while the timer is running, the timer should stop and return to the timer selection screen. If the remaining time reaches zero, the program should switch to a screen that indicates the timer has finished. If time remains, the program displays the remaining minutes and seconds on the screen.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: `void handleTimerCountdownMode() {
  DateTime now = rtc.__BLANK[now()]__;
  TimeSpan remaining = timerEndTime - __BLANK[now]__;
  long secLeft = remaining.totalseconds();

  ^^if (isPressed(__BLANK[PREV]__) == true) {   // PREV cancels timer and returns to TIMER SELECT
    screenMode = __BLANK[2]__;
    delay(200);
  }

  if (secLeft <= __BLANK[0]__) {    // Time's up
    screenMode = __BLANK[4]__;
    delay(200);
  }

  else {
    int minsLeft = secLeft / __BLANK[60]__;
    int secsLeft = secLeft - (minsLeft * __BLANK[60]__);
    showTimerScreen("Timer running:", __BLANK[minsLeft]__, __BLANK[secsLeft);
  }
}^^`,
          descAfterCode: `...`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "...",
        },
      ],
    },
  ],

  7: [
    {
      id: 1,
      title: "Step 1: How Buttons Work & INPUT_PULLUP",
      codes: [
        {
          topicTitle: "INPUT_PULLUP concept",
          descBeforeCode: `Buttons are simple switches. When you press a button, it closes the circuit so current can flow. When you release it, the circuit opens again, and current stops.

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
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
          code: ``,
          descAfterCode: null,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint:
            "Remember: with INPUT_PULLUP, a pressed button reads LOW, and a released button reads HIGH.",
        },
      ],
    },

    {
      id: 2,
      title: "Step 2: Basic Button Code",
      codes: [
        {
          topicTitle: "Minimal button read example",
          descBeforeCode:
            "Here is a minimal example that reads a single button wired from pin 2 to GND, using `INPUT_PULLUP`.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
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
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "Notice that we print 'pressed' when the state is LOW, not HIGH.",
        },
      ],
    },

    {
      id: 3,
      title: "Step 3: Button Practice Exercises",
      codes: [
        {
          topicTitle: "Practice Pack 1–4 (single block)",
          descBeforeCode:
            "Now try a few different ways of using buttons so you’re ready for the menu page logic in the status board project.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode:
            "All practices below still use INPUT_PULLUP and treat LOW as 'pressed'.",
          code: `^^// Practice 1: Count Button Presses^^
^^#define BUTTON 2^^
^^int counter = 0;^^

^^void setup() {^^
^^  pinMode(BUTTON, __BLANK[BUTTON1]__);^^     // set button as INPUT_PULLUP
^^  Serial.begin(9600);^^
^^}^^

^^void loop() {^^
^^  if (digitalRead(BUTTON) == __BLANK[BUTTON2]__) {^^
^^    counter = counter + __BLANK[BUTTON3]__;^^
^^    Serial.println(counter);^^
^^    delay(250);^^
^^  }^^
^^}^^

^^// Practice 2: Toggle an LED On/Off^^
^^__BLANK[BUTTON4]__ BUTTON 2^^
^^#define LED 13^^

^^bool ledState = false;^^

^^void setup() {^^
^^  pinMode(__BLANK[BUTTON5]__, __BLANK[BUTTON6]__);^^
^^  pinMode(LED, OUTPUT);^^
^^}^^

^^void loop() {^^
^^  if (__BLANK[BUTTON7]__ == __BLANK[BUTTON8]__) {^^
^^    ledState = !ledState;^^
^^    digitalWrite(LED, ledState);^^
^^    delay(250);^^
^^  }^^
^^}^^

^^// Practice 3: Cycle Through Options in an Array^^
^^#define BUTTON 2^^

^^String options[] = {"Red", "Blue", "Green", "Yellow"};^^
^^int totalOptions = 4;^^
^^int index = 0;^^

^^void setup() {^^
^^  __BLANK[BUTTON9]__  __BLANK[BUTTON10]__ = __BLANK[BUTTON11]__;^^
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
^^}^^

^^// Practice 4: Only React to a Long Press^^
^^__BLANK[BUTTON14]__  __BLANK[BUTTON15]__  =  __BLANK[BUTTON16]__^^

^^void setup() {^^
^^  pinMode(BUTTON, INPUT_PULLUP);^^
^^  Serial.begin(9600);^^
^^}^^

^^void loop() {^^
^^  if (__BLANK[BUTTON16]__ == __BLANK[BUTTON17]__) {^^
^^    delay(2000);^^

^^    if (digitalRead(BUTTON) == __BLANK[BUTTON18]__) {^^
^^      Serial.println("You held the button!");^^
^^      delay(500);^^
^^    }^^
^^  }^^
^^}^^`,
          descAfterCode:
            "Try each practice and compare what changes (counters, toggles, array index wrap-around, long-press). These patterns are reused in the status board menu logic.",
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: "All of these still use INPUT_PULLUP and treat LOW as 'pressed'.",
        },
      ],
    },

    {
      id: 4,
      title: "Step 4: Create a Helper Function for Button",
      codes: [
        {
          topicTitle: "Debounce helper + up-to-date code",
          descBeforeCode:
            "Real buttons can be noisy. When you press them, they may rapidly flicker between HIGH and LOW for a few milliseconds. This is called 'bouncing'. A **debounce helper function** makes sure we only react to a clean, stable press.",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode:
            "Below includes (1) the debounce helper example and (2) your current full code snapshot in one block.",
          code: `^^// Example Code: Debouncing Function^^
^^bool __BLANK[HELPER1]__(int pin) {^^
^^  if (__BLANK[HELPER2]__) {^^
^^    __BLANK[HELPER3]__;^^
      if (__BLANK[HELPER2]__) {^^
        return true;
      }
      return false;
    }
}^^

^^/* Example of how this function can be used in the void loop() */^^

^^#define button = 1;^^

^^void loop() {^^
^^  if (__BLANK[HELPER1]__(button)) {^^
^^    Serial.println("Clean press detected!");^^
^^    delay(200);^^
^^  }^^
^^}^^

^^// Up to date full code snapshot^^
#include <Wire.h>
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
  __BLANK[BEGINA]__; 
  __BLANK[CLEAR]__;
  __BLANK[SETTEXTSIZE]__(__BLANK[SETTEXTSIZE2]__);
  __BLANK[SETTEXTCOLOR]__(__BLANK[SETTEXTCOLOR2]__);
  __BLANK[SETCURSOR]__(__BLANK[XCOORD]__, __BLANK[YCOORD]__);
  __BLANK[DISPLAY]__;

  pinMode(PREV, INPUT_PULLUP);
  pinMode(__BLANK[NEXT]__, __BLANK[INPUT1]__);
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);
}

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

void __BLANK[STATUSFUNCTION]__{
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__; 
  display.__BLANK[DISPLAY9]__; 
}

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

bool __BLANK[HELPER1]__(int pin) {
  if (__BLANK[HELPER2]__) {
    __BLANK[HELPER3]__;
    if (__BLANK[HELPER2]__) {
      return true;
    }
    return false;
  }
}^^`,
          descAfterCode:
            "The debounce helper reads the pin, waits briefly, then reads again. It returns true only if the press is stable. This prevents accidental multi-triggers from a single physical press.",
          imageGridAfterCode: null,
          descAfterImage: null,
          hint:
            "The helper checks the pin, waits a bit, and checks again to confirm the press. Make sure variable names match what you have declared previously.",
        },
      ],
    },
  ],

  8: [
    {
      id: 1,
      title: "Step 1: Using button to toggle around the menu",
      codes: [
        {
          topicTitle:
            "PREV / NEXT / SELECT logic (combined into one code block)",
          descBeforeCode: `Cycle through options with Prev/Next and show the confirmed choice. If a button is pressed, the __BLANK[TRACKNAME]__ updates such that pressing NEXT button increments it by 1 and PREVIOUS decrements it by 1. Then, that new number in __BLANK[TRACKNAME]__ would indicate the new index of the array of status to highlight in the menu page.
Recall your function called __BLANK[SHOWMENU]__. In that function, we are looping until we reach the correct __BLANK[TRACKNAME]__ then highligh that status.
For example, let's say your __BLANK[TRACKNAME]__ == 2, and you pressed NEXT, making it to be 3. Then, we will update our menu page to highlight the status corresponding to index 3.`,
          imageGridBeforeCode: {
            columns: 1,
            items: [
              {
                image: require("../../../assets/loop.png"),
                label: "Loop reminder visual",
              },
            ],
          },
          descBetweenBeforeAndCode: `The code below includes three sections:
1) PREV moves up and wraps to the last item
2) NEXT moves down and wraps to the first item
3) SELECT confirms and switches to status screen`,
          code: `^^// Using PREV button to toggle upward^^
^^if (__BLANK[HELPER1]__(PREV) == true) {^^
^^  __BLANK[VL1]__ = __BLANK[VL1]__ - 1;^^
^^  if (__BLANK[VL1]__ < __BLANK[VL2]__) {^^
^^    __BLANK[VL3]__ = __BLANK[VL4]__ - 1;^^
^^  }^^
^^}^^

^^// Using NEXT button to toggle downward^^
^^if (__BLANK[HELPER0]__(__BLANK[VL5]__) == true) {^^
^^  __BLANK[VL6]__ = __BLANK[VL7]__;^^
^^  if (__BLANK[VL8]__ > __BLANK[VL9]__) {^^
^^    __BLANK[VL10]__;^^
^^  }^^
^^}^^

^^// Using SELECT button^^
^^if (__BLANK[HELPER00]__  == true) {^^
  showingStatus = true;
  __BLANK[STATUSFUNCTION]__();
}^^`,
          descAfterCode:
            "Make sure your wrap-around logic uses your total-count variable, and call __BLANK[SHOWMENU]__ after changes so the user sees the updated highlight.",
          imageGridAfterCode: null,
          descAfterImage: null,
          hint:
            "Wrap-around: when counter goes below 0 or past the end, jump to the other side.",
        },
      ],
    },

    {
      id: 2,
      title: "Step 2: Going Back to the Menu page",
      codes: [
        {
          topicTitle: "Status page → Menu page (PREV as Back)",
          descBeforeCode: `When the user is viewing a status page (for example, “Studying”, “Sleeping”, “Gaming”, etc.), we want a way to return to the main menu without restarting the Arduino.
To add this behavior, we will use one of the existing buttons, such as the **PREV** button, as the “Back to Menu” control.`,
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode:
            "We also add a condition based on showingStatus so PREV behaves differently depending on the current screen.",
          code: `// If the PREV button is pressed while viewing a status page,
// go back to the main menu^^
if (__BLANK[HELPER000]__ == __BLANK[ISHELPER]__) {^^
  showingStatus = __BLANK[MENU_MODE]__;
  __BLANK[SHOWMENU]__();
  __BLANK[VLDELAY]__;
}^^

^^// Add a condition so PREV does different things depending on screen^^
^^if (showingStatus == false) {^^
  ^^if (__BLANK[HELPER1]__(PREV) == true) {^^
    ^^__BLANK[VL1]__ = __BLANK[VL1]__ - 1;^^
    ^^if (__BLANK[VL1]__ < __BLANK[VL2]__) {^^
      ^^__BLANK[VL3]__ = __BLANK[VL4]__ - 1;^^
    ^^}^^
  ^^}^^
  ^^else if (showingStatus == __BLANK[STATUSTF]__) {^^
    ^^showingStatus = __BLANK[MENU_MODE]__;^^
    ^^__BLANK[SHOWMENU]__();^^
    ^^__BLANK[VLDELAY]__;^^
  ^^}^^
^^}^^`,
          descAfterCode: `With this logic in place, your user can navigate **from any status page back to the main menu** just by pressing the PREV button.
Later, when you build additional pages or modes, you can reuse this same pattern—just make sure the screen mode variable, helper function, and menu-rendering function match the rest of your program.`,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: null,
        },
      ],
    },

    {
      id: 3,
      title: "Step 3: Putting it All Together",
      codes: [
        {
          topicTitle: "Full combined sketch",
          descBeforeCode:
            "Combining all the functions, variables, setup, and loop, your code should look like this:",
          imageGridBeforeCode: null,
          descBetweenBeforeAndCode: null,
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

bool showingStatus = false;

void setup() {
  Wire.begin();
  __BLANK[BEGINA]__;
  __BLANK[CLEAR]__;
  __BLANK[SETTEXTSIZE]__(__BLANK[SETTEXTSIZE2]__);
  __BLANK[SETTEXTCOLOR]__(__BLANK[SETTEXTCOLOR2]__);
  __BLANK[SETCURSOR]__(__BLANK[XCOORD]__, __BLANK[YCOORD]__);
  __BLANK[DISPLAY]__;

  pinMode(PREV, INPUT_PULLUP);
  pinMode(__BLANK[NEXT]__, __BLANK[INPUT1]__);
  __BLANK[PINMODE]__(__BLANK[SELECT]__, __BLANK[INPUT2]__);
}

void loop() {
  if (showingStatus == false) {
    __BLANK[SHOWMENU]__();

    if (__BLANK[HELPER1]__(PREV) == true) {
      __BLANK[VL1]__ = __BLANK[VL1]__ - 1;
      if (__BLANK[VL1]__ < __BLANK[VL2]__) {
        __BLANK[VL3]__ = __BLANK[VL4]__ - 1;
      }
    }

    if (__BLANK[HELPER0]__(__BLANK[VL5]__) == true) {
      __BLANK[VL6]__ = __BLANK[VL7]__;
      if (__BLANK[VL8]__ > __BLANK[VL9]__) {
        __BLANK[VL10]__;
      }
    }

    if (__BLANK[HELPER00]__ == true) {
      showingStatus = true;
      __BLANK[STATUSFUNCTION]__();
    }
  } else if (showingStatus == __BLANK[STATUSTF]__) {
    showingStatus = __BLANK[MENU_MODE]__;
    __BLANK[SHOWMENU]__();
    __BLANK[VLDELAY]__;
  }
}

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

void __BLANK[STATUSFUNCTION]__() {
  __BLANK[STATUSCODE1]__;
  __BLANK[STATUSCODE2]__;
  __BLANK[STATUSCODE3]__;
  __BLANK[STATUSCODE4]__; 
  display.__BLANK[DISPLAY9]__; 
}

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

bool __BLANK[HELPER1]__(int pin) {
  if (__BLANK[HELPER2]__) {
    __BLANK[HELPER3]__;
    if (__BLANK[HELPER2]__) {
      return true;
    }
    return false;
  }
  return false;
}^^`,
          descAfterCode: null,
          imageGridAfterCode: null,
          descAfterImage: null,
          hint: null,
        },
      ],
    },
  ],
};


export default function CodeAdv() {
  return (
    <CodeLessonBase
      screenTitle="Coding (Advanced)"
      lessonSteps={LESSON_STEPS_ADVANCED}
      storagePrefix="esb:coding:advanced"
      doneSetKey="esb:coding:advanced:doneSet"
      overallProgressKey="esb:coding:advanced:overallProgress"
      globalBlanksKey="esb:coding:advanced:blanks:GLOBAL"
      localBlanksPrefixKey="esb:coding:advanced:blanks:LOCAL"
      analyticsTag="coding_advanced"
      apiBaseUrl="http://localhost:4000"
      backRoute="/projects/electric-status-board/learn"
    />
  );
}

// code.js
// answer key: https://wokwi.com/projects/447184024115506177

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";

import SplitView from "./components/SplitView";
import ArduinoEditor from "./components/ArduinoEditor";
import useEditorToggle from "./hooks/useEditorToggle";
import { Image } from "react-native";


/* ---------------- LESSON DATA: steps per lesson ---------------- */
const LESSON_STEPS = {
  1: [
    {
      id: 1,
      title: "Step 1: Understanding Arduino Basics",
      desc:
        "Arduino is an open-source electronics platform. Every sketch has two main functions: setup() runs once on power/reset, loop() runs continuously.",
      hint: "pinMode() configures a pin as INPUT or OUTPUT",
      gif: require("../../../assets/videos/CurioLabL1S1.gif"),
      descAfterCircuit: `The LED’s positive leg (anode) connects to \`pin 13\`, and the negative leg (cathode) connects to \`GND\`. When the LED is connected to pin 13 on an Arduino, it blinks because pin 13 is set as digital output pin programmed to switch between HIGH (5 V) and LOW (0 V) states in the code.`,
      code: `// Arduino Blink Example
^^void setup() {
  // This runs once
  pinMode(13, OUTPUT);
}

void loop() {
  // This runs forever
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);^^
}`,
      descAfterCode: 
`Here's what happens step by step:
    **1. Setup:** In the Arduino code, \`pinMode(13, OUTPUT);\` configures pin 13 to act as an output.
    **2. Loop:**
        - \`digitalWrite(13, HIGH);\` sends 5 V through the LED → it lights up.
        - \`delay(1000);\` keeps it on for one second.
        - \`digitalWrite(13, LOW);\` turns the voltage off → LED turns off.
        - Another \`delay(1000);\` keeps it off for a second.

This continuous on/off cycle makes the LED blink once per second.`,
    },
  ],

  2: [
    {
      id: 1,
      title: "Step 1: Setting Libraries",
      desc:
        "We include the right libraries to talk to the SSD1306 OLED over I²C and draw text/shapes.",
      hint: "Adafruit_GFX provides drawing; Adafruit_SSD1306 is the OLED driver.",
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
    {
      id: 2,
      title: "Step 2: Defining Screen",
      desc:`Define the OLED dimensions and create the display object. Many modules are 128×64; slim ones are 128×32. So now, we have to define the width to be 128 and height to be 64 or 32. 

**Fill in the blanks.**`,
      hint: "If your board has no RESET pin wired, keep RESET at -1.",
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
      answerKey:{
        WIDTH: ["128"],
        HEIGHT: ["64","32"],
        HEIGHT2: ["HEIGHT"],
      },

     blankExplanations: {
        WIDTH: "This is the horizontal pixel width of your OLED display. Most SSD1306 modules are 128 pixels wide.",
        HEIGHT: "This is the vertical pixel height of your OLED. Common values are 32 or 64 pixels depending on the screen size.",
        HEIGHT2: "Use the HEIGHT constant or variable you defined above. The display constructor must receive the same height value you set in #define HEIGHT. See how other constants are listed.",
      },

      blankDifficulties: {
        WIDTH: "easy",
        HEIGHT: "easy",
        HEIGHT2: "easy",
      },

      descAfterCode: `Here’s what the blanks represent:
- The first blank is for the **variable name** for height and the second blank describes the **screen’s height** (in pixels).
- The **value you fill in** should match your OLED module’s actual pixel height.
- The **same height variable** must be used again inside the \`display()\` constructor.`
    },
    {
      id: 3,
      title: "Step 3: Button Pins",
      desc: `Next, we create names for the three buttons so the code knows which Arduino pins they are connected to, and it's easier to use those names later in the code than the raw numbers. Review Lesson 1 if you want more practice with buttons.`,
      hint: "Later, we'll set these pins to INPUT_PULLUP, which means the button will read LOW when pressed and HIGH when released.",
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
        PREVN: { type: "range", min: 0, max: 13 },   // PREV button pin
        NEXTN: { type: "range", min: 0, max: 13 },   // NEXT button pin
        SEL:   { type: "identifier" },               // SELECT define name
        SELN:  { type: "range", min: 0, max: 13 },   // SELECT button pin
      },
      blankExplanations: {
        PREVN: "Enter the Arduino digital pin number connected to your PREV button (0-13). This must match the pin you connected in your wiring.",
        NEXTN: "Enter the Arduino digital pin number wired to your NEXT button (0–13). This must match the pin you connected in your wiring.",
        SEL: "This is the identifier (name) for your Select button constant, such as SELECT. It must be a valid C/C++ identifier.",
        SELN: "Enter the Arduino digital pin used for your Select button (0–13). This must match the pin you connected in your wiring.",
      },
      descAfterCode: `Use the digital pin numbers on your Arduino from **your circuit design**, which are the ones you used for the previous, next, and select buttons.
      
For example, the first blank for PREV can be 3 if you connected it to digital pin 3, as shown in the example circuit image below. Fill in the rest of the blanks for the Next and Select buttons based on your wiring.`,
      circuitImage: { uri: "https://dummyimage.com/600x400/ddd/000.png&text=Example+Circuit+Image" },
    },

    {
      id: 4,
      title: "Step 4: Initialize Display & Buttons",
      desc:
        "Start I²C, initialize the OLED at 0x3C, clear the screen, and set the button pins to INPUT_PULLUP.",
      hint: "INPUT_PULLUP ties the pin internally to Vcc, so a button to GND reads LOW when pressed.",
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
  display.__BLANK[BEGIN]__(__BLANK[BEGINA]__, __BLANK[BEGINB]__);
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
        BEGIN:        ["begin"],
        BEGINA:       ["SSD1306_SWITCHCAPVCC"],
        BEGINB:      ["0x3C"],
        // so student should write "clearDisplay()"
        CLEAR:        ["clearDisplay()"],
        SETTEXTSIZE:  ["setTextSize"],
        // Typical text size 1–5 (you can widen if you want)
        SETTEXTSIZE2: { type: "range", min: 1, max: 5 },
        SETTEXTCOLOR: ["setTextColor"],
        SETTEXTCOLOR2: [
          "SSD1306_WHITE",
          "SSD1306_BLACK",
          "SSD1306_INVERSE",
        ],
        SETCURSOR:    ["setCursor"],
        DISPLAY:      ["display"],      // makes display.display();
        // Button setup
        NEXT:   ["NEXT"],               // reuse constant name
        INPUT1: ["INPUT_PULLUP"],
        PINMODE: ["pinMode"],
        SELECT:  {type: "sameAs", target:"SEL"},            // reuse constant name
        INPUT2:  ["INPUT_PULLUP"],
      },

      blankExplanations: {
        BEGIN: "This is the Adafruit SSD1306 function that initializes the display. Use begin so the display is ready to draw.",
        BEGINA: "This argument tells the display how to generate its internal voltage. For SSD1306 modules we usually use SSD1306_SWITCHCAPVCC.",
        BEGINB: "0x3C is the I²C address of the OLED display. Most SSD1306 OLED modules use 0x3C as their default address on the I²C bus, which tells the Arduino which device it should communicate with.",
        CLEAR: "Call the function that clears the display buffer, for example clearDisplay(). This wipes whatever was drawn before.",
        SETTEXTSIZE: "Use the function that sets the text size on the OLED, such as setTextSize.",
        SETTEXTSIZE2: "Choose a text size number (like 1, 2, or 3). Larger numbers make the characters bigger on the screen.",
        SETTEXTCOLOR: "Use the function that sets the text color on the OLED, such as setTextColor.",
        SETTEXTCOLOR2: "Pick a text color constant such as SSD1306_WHITE (normal), SSD1306_BLACK (erase), or SSD1306_INVERSE (inverted).",
        SETCURSOR: "Use the function that sets the text cursor position, such as setCursor. It takes x and y pixel positions as arguments.",
        DISPLAY: "This should be the function that actually sends the current buffer to the OLED, usually display().",
        NEXT: "Use the name of the constant you defined earlier for the NEXT button pin (for example NEXT), not the pin number directly.",
        INPUT1: "Use the pin mode constant that enables the internal pull-up for the NEXT button, usually INPUT_PULLUP.",
        PINMODE: "This should be the Arduino function pinMode, which sets whether a pin is an INPUT, OUTPUT, or INPUT_PULLUP.",
        SELECT: "Use the identifier you used in your earlier #define for the Select button (for example SELECT, SEL, select, selection, etc.).",
        INPUT2: "Use INPUT_PULLUP, so the Select button uses the same pull-up wiring pattern as the rest of the buttons.",
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
  - Button pressed → reads **LOW**
`
    }
  ],

  3: [
    {
      id: 1,
      title: "Step 1: Draw First (Welcome) Page",
      desc: "**Clear the screen, print a big greeting.**",
      hint: "Call display() after drawing to push the buffer to the screen.",
      gif: require("../../../assets/welcomeFunc.png"),
      descAfterCircuit:`This is an example of a function, which we named welcomeFunc. All the lines of code within the curly brackets define what our welcomeFunc would do. You can see that we call the Welcome Func in the setup () or loop() to run that function. 
      
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
      descAfterCode:
`Now, create a function with the same functionality as the example WelcomeFunc above. 
But, **rename the function as something else and have it display a different message.** Fill in the blanks.`
    },
    {
    id: 2,
    title: "Step 2: Display Chosen Status",
    desc: "Clear the screen, print the status chosen from the menu screen",
    code:`^^void __BLANK[WELCOMEFUNCTION]__{
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
  display.__BLANK[DISPLAY9]__;^^
}`,
    descAfterCode: `Here are specific instructions on what each line of the code should do at it's minimum. You can also add more functinalities to this in the code editor.
**Line 1:** clear the display.
**Line 2:** set text size.
**Line 3:** set cursor location.
**Line 4:** print an example status like "Studying, Working, Coding, etc".`
    }
  ],

  4: [
    {
      id: 1,
      title: "Step 1: What Is a Variable?",
      desc:
        "Variables act like labeled boxes in the Arduino’s memory where values are stored. Each variable has a type, a name, and a value.",
      hint: "A variable stores exactly one piece of information.",
      codes: [{
        title:`Practice: Variables`,
        code: `^^int x = 5;          ^^// integer variable^^
bool ready = true;  ^^// true/false variable^^
float speed = 3.5;  ^^// decimal number^^`,
      }],
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
`
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
int __BLANK[NAME2]__ = 365^^;
`,
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
        descAfterCode: `What does the counter now read?    __BLANK[COUNTER]__` 
      },
      {
        title: "Practice: Level",
        code: `int level = 1;

level = level + 1;
level = level + 2;`,
        descAfterCode: `What does the level now read?    __BLANK[LEVEL]__`
      },
    ],
  },

    {
      id: 3,
      title: "Step 3: What Is a List (Array)?",
      gif: require("../../../assets/array.png"),
      desc:
        "A list (array) stores many values under one variable name. This is perfect for storing multiple menu options.",
      hint: "Arrays are 0-indexed: the first item is at index 0.",
      codes: [
      {
        title:`Practice: Arrays`,
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

Arrays are extremely useful when you want your code to handle lots of similar values without writing dozens of separate variables.`
      }]
    },

    {
      id: 4,
      title: "Step 4: Lists Are Perfect for Menu Options",
      desc:
        `Instead of making many separate variables for each status, we store them all in a single array so the menu can move through them easily.
        
Think of at least four status that relates to your daily acitivity, like studying, working, playing, etc.
Place those status in an array. Create a name for that array.`,
      hint: "This is the same structure used in your favoriteColor array.",
      code: `// List of menu status messages^^
__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__, ^^// List here
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__,^^
};^^`,
      descAfterCode: `Each item will now be accessed by its index:
  - __BLANK[STATUSNAME]__ [0] → __BLANK[STATUSLIST1]__
  - __BLANK[STATUSNAME]__ [1] → __BLANK[STATUSLIST2]__
  - __BLANK[STATUSNAME]__ [2] → __BLANK[STATUSLIST3]__ 
  - __BLANK[STATUSNAME]__ [3] → __BLANK[STATUSLIST4]__

  This list allows your program to display different messages simply by picking a number.`
    },

    {
      id: 5,
      title: "Step 5: Counting Items in the List",
      desc: `Arrays don’t automatically know how many items they contain, so we store the total count in a variable.
Create a variable that stores the total **number** of status in the array.`,
      hint: "We use this to handle scrolling and wrap-around behavior.",
      gif: require("../../../assets/videos/CurioLabL4.gif"),
      gifCaption: "Status Board menu",
      code: `__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__, 
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__,
};

// Number of items in the status list^^
__BLANK[TOTTYPE]__  __BLANK[TOTNAME]__ = __BLANK[TOTNUM]__;^^

// Counter for tracking which item of the status list you are on. Assign 0 for the counter.^^
__BLANK[TRACKTYPE]__  __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__; ^^

// Practice how you can use the array and the counter. ^^
String option = __BLANK[STATUSNAME]__ [__BLANK[TRACKNAME]__];^^`
,
      descAfterCode: `These two variables let the menu scroll correctly:
  - If you go past the last item → wrap back to the first  
  - If you go before the first → wrap to the last
So the menu always cycles smoothly, just like the image above.

What would the String option read?   __BLANK[OPTION]__`
    },

    {
      id: 6,
      title: "Step 6: Function for Menu Page",
      desc:
        "Now we create a menu page, where pressing Next or Previous button allows the user to toggle around the status options",
      
      code: `__BLANK[STATUSTYPE]__  __BLANK[STATUSNAME]__ = {
  __BLANK[STATUSLIST1]__, 
  __BLANK[STATUSLIST2]__,
  __BLANK[STATUSLIST3]__,
  __BLANK[STATUSLIST4]__,
};
__BLANK[TOTTYPE]__  __BLANK[TOTNAME]__ = __BLANK[TOTNUM]__;
__BLANK[TRACKTYPE]__  __BLANK[TRACKNAME]__ = __BLANK[TRACKNUM]__;
^^

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
  __BLANK[STATUSCODE4]__; ^^
  display.__BLANK[DISPLAY9]__; → display your array of status indexed by the counter variable^^
}`,
      descAfterCode: `Now your project can:
  - Move up and down the list using the buttons  
  - Display the correct message on the OLED  
  - Change screens when the user selects a status
Variables track **where** you are.  Arrays track **what choices** you have.`
    }
  ],

  5: [
    {
      id: 1,
      title: "Step 1: What is a Loop?",
      desc:
        "We already have an array of status messages. Now we want to print ALL of them without writing many repeated lines of code.",
      hint: "Imagine you had 10 or 20 statuses. You wouldn’t want to copy-paste the same line 20 times.",
      code: `^^// Without a loop (not flexible)
display.println(options[0]);
display.println(options[1]);
display.println(options[2]);
display.println(options[3]);

// Better idea: use a loop to repeat
// the same pattern for each item.^^`,
      descAfterCode: `Without a loop, you have to write a separate line for every status in the array. If you add or remove items, you must rewrite the code.

Loops fix this problem by repeating the same code for each index in the array. In the next steps, we will use a **while loop** to walk through the list of options automatically.`
    },

    {
      id: 2,
      title: "Step 2: Basic While Loop",
      desc:
        "A while loop repeats a block of code as long as its condition is true. Here is a simple example that prints numbers.",
      hint: "Focus on the three parts: start value, condition, and update.",
      codes: [{
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

What does the \`i\` read after while loop ends?    __BLANK[ANSWER]__
`
      },
      {
      title: "Loop Practice 1: Print Even Numbers",
      descBeforeCode: `Write a while loop that prints only the even numbers from 2 to 10. Start at 2 and increase by 2 at each loop.`,
      code: `^^int num = 2;
while (num < __BLANK[LOOP1]__){
  Serial.println(__BLANK[LOOP2]__);
  num = num + __BLANK[LOOP3]__;
}^^`
      },
      {
      title: "Loop Practice 2: Print Multiples of 3",
      descBeforeCode: `Write a while loop that prints the multiples of 3 from 3 to 27. Start at 3.`,
      code: `^^int x = __BLANK[LOOP5]__;
while (__BLANK[LOOP6]__ < __BLANK[LOOP7]__){
  Serial.println(__BLANK[LOOP8]__);
  x = __BLANK[LOOP9]__;
}^^`
      },
      {
      title: "Loop Practice 3: Stop when a Number Reaches a Limit",
      descBeforeCode: `Write a while loop that multiplies the number by 2 each loop and stop when the number is greater than 100.`,
      code: `^^int __BLANK[LOOP10]__ = 5;
while (__BLANK[LOOP11]__ < __BLANK[LOOP12]__){
  Serial.println(__BLANK[LOOP13]__);
  __BLANK[LOOP14]__ = __BLANK[LOOP15]__;
}^^`
      },
      {
      title: "Loop Practice 4: Loop Until Botton Press",
      descBeforeCode: `Simulate a loop that keeps printing "Waiting..." until \`ready\` becomes \`true\`.`,
      code: `^^__BLANK[LOOP16]__ ready = __BLANK[LOOP17]__;
while (__BLANK[LOOP11]__ == false){
  Serial.println(__BLANK[LOOP13]__);
}^^`
      },
      {
      title: "Loop Practice 5: Loop through Array 1",
      descBeforeCode: `Loop through an array of integers and display the desired number.`,
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
}^^`
      },
      {
      title: "Loop Practice 6: Loop through Array 2",
      descBeforeCode: `Loop through an array of integers and display "Here is the number:" followed by the desired number.`,
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
}^^`
      }

    ]
    },
    {
      id: 3,
      title: "Step 3: While Loop for the Status Menu",
      desc:`Now we use a while loop to go through each item in the options array. Instead of printing numbers, we print status messages.
 This code will be very similar to how you did in the "Loop Through Array" practice.`,
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

The loop stops when \`i\` becomes equal to \`totalOptions\`. This makes the code still correct if you change the number of items later.`
    },

    {
      id: 4,
      title: "Step 4: Highlight the Selected Status",
      desc:
        "We want the menu to show which status is currently selected. We do this by checking if the loop index i matches a desired index number.",
      hint: "Use an if statement inside the while loop to decide when to draw the arrow.",
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
See that there are some spaces at the front of each status when there is no arrow.`
    },

    {
      id: 5,
      title: "Step 5: Create a Function that Draws the Menu on the OLED",
      gif: require("../../../assets/videos/CurioLabL4.gif"),

      codes:[{
        descBeforeCode:`This is what you should have so far. You will add the new function that shows menu with the other functions you have already made.`,
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
}^^`
      },{
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
      descAfterCode: `This function:
1. Clears the screen and prints the title.
2. Uses a while loop to go through every status in __BLANK[STATUSFUNCTION]__.
3. Checks if i == __BLANK[TRACKNAME]__ to decide whether to draw an arrow.
4. Prints the status text for each row.
5. Calls \`display.display();\` once at the end to update the OLED.

The while loop is what makes the menu flexible. You can add more status or modify them by just simply editing just the array __BLANK[STATUSFUNCTION]__.
Feel free to change how you want the menu to show. You do not need to stick to indicating with an arrow. Be creative and use different symbols or indicators!`
    }],
    }
],

  6: [
    {
       id: 1,
      title: "Step 1: How Buttons Work & INPUT_PULLUP",
      desc:
        `Buttons are simple switches. When you press a button, it closes the circuit so current can flow. When you release it, the circuit opens again, and current stops.

On the Arduino, we use buttons as **digital inputs** that read either \`HIGH\` or \`LOW\`.

However, if a pin is not connected to anything, it can "float" and randomly jump between \`HIGH\` and \`LOW\`. This is why we use **pull-up** (or pull-down) resistors.

With \`INPUT_PULLUP\`:

- The Arduino turns on an internal resistor that pulls the pin **up to HIGH** when the button is not pressed.
- We wire the button from the pin to **GND**.
- When the button is pressed, it connects the pin to GND, so the pin reads \`LOW\`.

So the logic becomes:

- **Not pressed → \`digitalRead(pin)\` is** __BLANK[INPUT]__
- **Pressed → \`digitalRead(pin)\` is** __BLANK[INPUT1]__

We'll use this pattern for all the buttons in the status board project.`,
      hint: "Remember: with INPUT_PULLUP, a pressed button reads LOW, and a released button reads HIGH."
    },
    {
      id: 2,
      title: "Step 2: Basic Button Code",
      desc:
        "Here is a minimal example that reads a single button wired from pin 2 to GND, using `INPUT_PULLUP`.",
      hint: "Notice that we print 'pressed' when the state is LOW, not HIGH.",
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
      descAfterCode:
        `Here's what is happening:

- \`pinMode(BUTTON, INPUT_PULLUP);\` enables the internal pull-up resistor and expects the button to be wired to GND.
- \`digitalRead(BUTTON)\` returns:
  - \`LOW\` when the button is **pressed** (connected to GND),
  - \`HIGH\` when the button is **not pressed**.
- The \`if\` statement checks for \`LOW\` to detect the press and prints out the correct message.`
    },

    {
      id: 3,
      title: "Step 3: Button Practice Exercises",
      desc:
        "Now try a few different ways of using buttons so you’re ready for the menu page logic in the status board project.",
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
          descAfterCode:
            "Try pressing the button multiple times and watch the numbers go up. This is similar to how we move through menu items with each press."
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
^^    ledState = !ledState;^^                            // flip true ↔ false, '!' means 'opposite of'
^^    digitalWrite(LED, ledState);^^                     // switch the LED to true(on) or false(off)
^^    delay(250);^^                                      // simple debounce
^^  }^^
^^}^^`,
          descAfterCode:
            "First press turns the LED **on**, second press turns it **off**, and so on. This idea of flipping a state is exactly how we’ll switch screens or modes later."
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
            "This is very close to how the status board scrolls through different statuses. The variable `index` is like a menu cursor that moves and wraps around."
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
            "This pattern is useful for features like a 'long-press to reset' or special settings mode, where you don’t want a quick tap to trigger the action."
        }
      ]
    },

    {
      id: 4,
      title: "Step 4: Create a Helper Function for Button",
      desc:
        "Real buttons can be noisy. When you press them, they may rapidly flicker between HIGH and LOW for a few milliseconds. This is called 'bouncing'. A **debounce helper function** makes sure we only react to a clean, stable press.",
      hint: "The helper checks the pin, waits a bit, and checks again to confirm the press. Make sure variable names match what you have declared previously.",
      codes:[{
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
}^^
`,
      descAfterCode:
        "The function `isPressed(pin)`:\n\n" +
        "- Reads the pin once and checks if it is `LOW`.\n" +
        "- Waits a short time (`delay(20);`).\n" +
        "- Reads again and only returns `true` if it is **still** `LOW`.\n\n" +
        "This removes most bouncing and gives you a clean \"yes or no\" for each press. In the status board project, you'll use the same idea with buttons like `PREV`, `NEXT`, and `SELECT`."
    },
    {
      descBeforeCode:`This is what you have done so far including the most recent function for debouncing with buttons.`,
      title: `Up to date full code`,
      code:`#include <Wire.h>
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
}^^
`
    }]


  }
  ],

  7: [
    {
      id: 1,
      title: "Step 1: Using button to toggle around the menu",
      gif: require("../../../assets/loop.png"),
      desc:
`Cycle through options with Prev/Next and show the confirmed choice. If a button is pressed, the __BLANK[TRACKNAME]__ updates such that pressing NEXT button increments it by 1 and PREVIOUS decrements it by 1. Then, that new number in __BLANK[TRACKNAME]__ would indicate the new index of the array of status to highlight in the menu page.
Recall your function called __BLANK[SHOWMENU]__. In that function, we are looping until we reach the correct __BLANK[TRACKNAME]__ then highligh that status.
For example, let's say your __BLANK[TRACKNAME]__ == 2, and you pressed NEXT, making it to be 3. Then, we will update our menu page to highlight the status corresponding to index 3.`,
      hint: "Wrap-around: when counter goes below 0 or past the end, jump to the other side.",
      codes: [{
        topicTitle: `Using PREV button to toggle upward`,
        descBeforeCode: `If the PREV button is pressed, we want to move **upward** through the list of statuses.

**Here’s what this code should do:**
- Use your button helper function (__BLANK[HELPER1]__) to check if the PREV button is pressed.
- If it is pressed, decrease the menu index or counter variable (__BLANK[TRACKNAME]__) by 1 to move to the previous item in the list.
- If the counter becomes smaller than 0, wrap it around to the **last item** in the array (__BLANK[STATUSNAME]__).
- Call function (__BLANK[SHOWMENU]__) that refreshes the menu screen to show the newly selected item.
- Add a small delay so the button doesn't scroll too quickly.`,

        code:`^^if (__BLANK[HELPER1]__(PREV) == true) {^^    // If the PREV button is pressed. Use the Debouncing function you created.
^^  __BLANK[VL1]__ = __BLANK[VL1]__ - 1;^^      // Decrease the index by 1
^^  if (__BLANK[VL1]__ < __BLANK[VL2]__) {^^    // If we went before the first item in array of status
^^    __BLANK[VL3]__ = __BLANK[VL4]__ - 1;^^    // Let index wrap around to the last item. Hint: use the variable you made for total number of status in array.
^^  }^^
^^}^^
`      },
      {
        topicTitle:`Using NEXT button to toggle downward`,
        descBeforeCode: `If the NEXT button is pressed, we want to move **downward** through the list of statuses.

**Here’s what this code should do:**
- Use your button helper function (__BLANK[HELPER1]__) to check if the NEXT button is pressed.
- If it is pressed, increase the menu counter variable (__BLANK[TRACKNAME]__) by 1 to move to the next item in the list.
- If the counter becomes equal to the number of items  (__BLANK[TOTNAME]__), wrap it around to the **first item** in the array (index 0).
- Call a function (__BLANK[SHOWMENU]__) that refreshes the menu screen to show the newly selected item.
- Add a small delay so the button doesn’t scroll too fast.`,

        code:`^^if (__BLANK[HELPER0]__(__BLANK[VL5]__) == true) {^^        // If the NEXT button is pressed. Use the Debouncing function you created.
^^  __BLANK[VL6]__ = __BLANK[VL7]__;^^                  // Increase the index by 1
^^  if (__BLANK[VL8]__ > __BLANK[VL9]__) {^^            // If we went after the last item in array of status
^^    __BLANK[VL10]__;^^                        // Let index wrap around to the first item in the array
^^  }^^
^^}^^
`
      },{
        topicTitle:`Using SELECT button`,
        descBeforeCode: `If the SELECT button is pressed, we want to **confirm** the current status.

**Here’s what this code should do:**
- Use your button helper function (__BLANK[HELPER1]__) to check if the SELECT button is pressed.
- If it is pressed, set a variable (\`showingStatus\`) to remember that the status is chosen.
- Call a function ( __BLANK[SHOWCONFIRMED]__ ) that will draw the confirmed status screen on the OLED.
- Add a small delay so one long press doesn’t count as many presses.`,

  code: `^^if (__BLANK[HELPER00]__  == true) {      ^^// If the SELECT button is pressed^^
  showingStatus = true;    ^^// Mark that the current status is confirmed^^
  __BLANK[STATUSFUNCTION]__();                ^^// Show the confirmed status on the screen^^
}^^`
      }
    ]
    },
    {
    id:2,
    title: "Step 2: Going Back to the Menu page",

    codes:[{
      topicTitle: `From Status Page to Menu Page`,
      descBeforeCode:`When the user is viewing a status page (for example, “Studying”, “Sleeping”, “Gaming”, etc.), we want a way to return to the main menu without restarting the Arduino.
To add this behavior, we will use one of the existing buttons, such as the **PREV** button, as the “Back to Menu” control.

**Here’s what this code should do:**
- Use the button helper function (__BLANK[HELPER1]__) to check if the PREV button is pressed.  
- If it is pressed, set the screen mode variable (__BLANK[STATE]__) to switch back to **menu mode**.  
- Call a function (__BLANK[SHOWMENU]__) to redraw the main menu on the OLED screen.  
- Add a short delay so one long press doesn’t register multiple times.`,
      code: `
// If the PREV button is pressed while viewing a status page,
// go back to the main menu^^
if (__BLANK[HELPER000]__ == __BLANK[ISHELPER]__) {            ^^// check if PREV is pressed^^
  showingStatus = __BLANK[MENU_MODE]__; ^^       // switch screen state to menu mode, switch the showingStatus (true/false)^^
  __BLANK[SHOWMENU]__();                  ^^   // call function to call the menu screen^^
  __BLANK[VLDELAY]__;                 ^^ // add a delay to prevent repeats^^
}^^
`,
    descAfterCode: `With this logic in place, your user can navigate **from any status page back to the main menu** just by pressing the PREV button.
Later, when you build additional pages or modes, you can reuse this same pattern—just make sure the screen mode variable, helper function, and menu-rendering function match the rest of your program.`
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
      code:`^^if (showingStatus == false) {^^
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
^^}^^
`
    }]
  },
  {
      id: 3,
      title: "Step 3: Putting it All Together",
      desc: `Combining all the functions, variables, setup, and loop, your code should look like this:`,
      code:`^^#include <Wire.h>
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
}^^`
  }
  ],
};

const TOTAL_LESSONS = Object.keys(LESSON_STEPS).length;
const TOTAL_STEPS = Object.values(LESSON_STEPS).reduce(
  (sum, arr) => sum + arr.length,
  0
);

// --- Simple Arduino-style syntax groups for example boxes ---
const TYPE_KEYWORDS = [
  "void",
  "int",
  "long",
  "float",
  "double",
  "char",
  "bool",
  "boolean",
  "unsigned",
  "short",
  "byte",
  "word",
  "String",
  "static",
  "const",
];

const CONTROL_KEYWORDS = [        
        "for",
        "while",
        "do",
        "switch",
        "case",
        "break",
        "continue",
        "if",
        "else",
        "#define",
        "#include",
      ];

const ARDUINO_FUNCS = [
  "setup",
  "loop",
  "pinMode",
  "digitalWrite",
  "digitalRead",
  "analogWrite",
  "analogRead",
  "delay",
  "millis",
  "micros",
  "Serial",
  "Serial.begin",
  "Serial.print",
  "Serial.println",
  "HIGH",
  "LOW",
  "INPUT",
  "OUTPUT",
  "INPUT_PULLUP",
];

const CODE_FONT = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});


/* ---------------- REUSABLE STEP CARD ---------------- */
function StepCard({ step, storageKey }) {
  const [localBlanks, setLocalBlanks] = React.useState({});
  const [globalBlanks, setGlobalBlanks] = React.useState({});
  const [blankStatus, setBlankStatus] = React.useState({});
  const [activeBlankHint, setActiveBlankHint] = React.useState(null);

  // AI state: per-blank help keyed by "blockIndex:blankName"
  const [aiHelpByBlank, setAiHelpByBlank] = React.useState({});
  const [aiLoadingKey, setAiLoadingKey] = React.useState(null);
  const [aiLastRequestAtByKey, setAiLastRequestAtByKey] = React.useState({});
  const [checkAttempts, setCheckAttempts] = React.useState(0);
  const [aiHintLevelByBlank, setAiHintLevelByBlank] = React.useState({});
  const [blankAttemptsByName, setBlankAttemptsByName] = React.useState({});  // number of attempts per blank

  const GLOBAL_KEY = "esb:coding:blanks:GLOBAL";
  const AI_COOLDOWN_MS = 8000; // 8 seconds between AI hints per blank
  const MAX_HINT_LEVEL = 3; // max AI hint depth (1..3)

  /* ==========================================================
     SMALL ANALYTICS LOGGER
     - Sends anonymized events to your backend
  ========================================================== */
  //  helper to send analytics events to the server
  const logBlankAnalytics = async (event) => {
    try {
      await fetch("http://localhost:4000/api/blank-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          stepId: step?.id,
          stepTitle: step?.title,
          storageKey: storageKey || null,
        }),
      });
    } catch (err) {
      console.warn("analytics failed:", err);
    }
  };


  /* ==========================================================
     1. LOAD GLOBAL BLANKS
  ========================================================== */
  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(GLOBAL_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setGlobalBlanks(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  /* ==========================================================
     2. LOAD LOCAL BLANKS FOR THIS STEP
  ========================================================== */
  React.useEffect(() => {
    if (!storageKey) return;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setLocalBlanks(parsed);
          }
        }
      } catch {}
    })();
  }, [storageKey]);

  /* ==========================================================
     3. SAVE LOCAL BLANKS
  ========================================================== */
  React.useEffect(() => {
    if (!storageKey) return;
    (async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(localBlanks));
      } catch {}
    })();
  }, [storageKey, localBlanks]);

  /* ==========================================================
     4. SAVE GLOBAL BLANKS
  ========================================================== */
  React.useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(GLOBAL_KEY, JSON.stringify(globalBlanks));
      } catch {}
    })();
  }, [globalBlanks]);

  /* ==========================================================
     5. MERGED BLANKS
  ========================================================== */
  const mergedBlanks = { ...localBlanks, ...globalBlanks };

  /* ==========================================================
    AI HELP FOR A SPECIFIC BLANK  (with previous-hint memory)
  ========================================================== */
const requestAiBlankHelpForBlank = async ({ blankName, blockIndex, code }) => {
  if (!step) return;

  const key = `${blockIndex}:${blankName}`;

  // 🔹 How many hints have already been used for this blank?
  // Stored value = number of hints already received (0–3).
  const usedHints = aiHintLevelByBlank[key] ?? 0;

  // 🔹 HARD CAP: if they already used 3 hints, do nothing.
  if (usedHints >= MAX_HINT_LEVEL) {
    return; // keep the existing hint text stable, no reload
  }

  const studentAnswer = (mergedBlanks[blankName] ?? "").trim();
  const rule = step.answerKey?.[blankName];
  if (!rule) return;

  // 🔹 What did AI already say for this blank (if anything)?
  const previousHintText = aiHelpByBlank[key] || null;

  // 🔹 Cooldown to avoid spamming the endpoint
  const now = Date.now();
  const last = aiLastRequestAtByKey[key] || 0;
  if (now - last < AI_COOLDOWN_MS) {
    const secondsLeft = Math.ceil(
      (AI_COOLDOWN_MS - (now - last)) / 1000
    );

    setAiHelpByBlank((prev) => ({
      ...prev,
      [key]:
        prev[key] ||
        `Try tweaking your answer or re-reading the hint first. You can ask AI again in about ${secondsLeft} second${
          secondsLeft === 1 ? "" : "s"
        }.`,
    }));
    return;
  }

  // This call will produce hint # (usedHints + 1)
  const upcomingHintNumber = usedHints + 1;

  // Map upcoming hint number → server-side mode
  let mode = "gentle_nudge";
  if (upcomingHintNumber === 2) {
    mode = "conceptual_explanation";
  } else if (upcomingHintNumber === 3) {
    mode = "analogy_based";
  }

  const payload = {
    lessonId: step.id,
    title: step.title,
    description: step.desc || null,
    codeSnippet: code || step.code || null,

    blank: {
      name: blankName,
      studentAnswer,
      rule,
      allBlanks: mergedBlanks,
      previousHint: previousHintText,
    },

    mode,               // server uses this to pick the prompt style
    hintLevel: upcomingHintNumber, // also send the numeric level (1,2,3)
  };

  try {
    setAiLoadingKey(key);
    setAiLastRequestAtByKey((prev) => ({
      ...prev,
      [key]: now,
    }));

    const res = await fetch("http://localhost:4000/api/blank-help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("AI help request failed");

    const data = await res.json();
    if (!data || !data.explanation) return;

    // REPLACE the old hint with the NEW one (no stacking)
    setAiHelpByBlank((prev) => ({
      ...prev,
      [key]: data.explanation, // only the latest hint is shown
    }));

    // Record that this blank has now used `upcomingHintNumber` hints
    setAiHintLevelByBlank((prev) => ({
      ...prev,
      [key]: upcomingHintNumber, // 1, then 2, then 3
    }));

    const difficulties = step.blankDifficulties || {};
    const difficulty = difficulties[blankName] || null;

    // Analytics: log that an AI hint was used
    logBlankAnalytics?.({
      type: "AI_HINT",
      blankName,
      blockIndex,
      hintLevel: upcomingHintNumber,
      studentAnswer,
      previousHintUsed: !!previousHintText,
      difficulty,
    });
  } catch (err) {
    console.warn("AI blank help error:", err);
    setAiHelpByBlank((prev) => ({
      ...prev,
      [key]:
        prev[key] ||
        "I had trouble generating more help right now. Try adjusting your answer slightly and re-checking.",
    }));
  } finally {
    setAiLoadingKey((prev) => (prev === key ? null : prev));
  }
};






  /* ==========================================================
     COPY FUNCTION
  ========================================================== */
  const copyCode = async (rawCode) => {
    try {
      let textToCopy = rawCode || "";

      Object.entries(mergedBlanks).forEach(([name, value]) => {
        const placeholder = `__BLANK[${name}]__`;
        const replacement =
          value && String(value).trim().length > 0 ? String(value) : "_____";

        textToCopy = textToCopy.split(placeholder).join(replacement);
      });

      textToCopy = textToCopy.replace(/__BLANK\[[A-Z0-9_]+\]__/g, "_____");
      textToCopy = textToCopy.replace(/\^\^/g, "");

      await Clipboard.setStringAsync(textToCopy);
    } catch (e) {
      console.warn("Failed to copy code:", e);
    }
  };

  /* ==========================================================
     CHECK WITH ANSWER KEY FUNCTION
  ========================================================== */
const checkBlanks = async () => {
  if (!step?.answerKey) return;

  // Pre-compute next attempt index (since setState is async)
  const nextAttempt = checkAttempts + 1;
  setCheckAttempts((prev) => prev + 1);

  const results = {};

  Object.entries(step.answerKey).forEach(([name, spec]) => {
    const raw = (mergedBlanks[name] ?? "").trim();
    let isCorrect = false;

    if (spec && typeof spec === "object" && !Array.isArray(spec)) {
      switch (spec.type) {
        case "identifier": {
          isCorrect = /^[A-Za-z_][A-Za-z0-9_]*$/.test(raw);
          break;
        }
        case "range": {
          const num = Number(raw);
          if (!Number.isNaN(num)) {
            const min = spec.min ?? -Infinity;
            const max = spec.max ?? Infinity;
            isCorrect = num >= min && num <= max;
          }
          break;
        }
        case "number": {
          const num = Number(raw);
          isCorrect = !Number.isNaN(num);
          break;
        }
        case "sameAs": {
          const otherName = spec.target;
          const otherVal = (mergedBlanks[otherName] ?? "").trim();
          isCorrect = raw !== "" && raw === otherVal;
          break;
        }
        case "string": {
          if (raw.length === 0) {
            isCorrect = false;
          } else if (spec.regex) {
            const re = new RegExp(spec.regex);
            isCorrect = re.test(raw);
          } else {
            isCorrect = true;
          }
          break;
        }
        default: {
          if (Array.isArray(spec.values)) {
            isCorrect = spec.values.some(
              (v) => raw === String(v).trim()
            );
          } else {
            isCorrect = false;
          }
        }
      }
    } else {
      const accepted = Array.isArray(spec)
        ? spec
        : spec != null
        ? [spec]
        : [];
      isCorrect = accepted.some((v) => raw === String(v).trim());
    }

    results[name] = isCorrect;
  });

  const nextBlankAttempts = { ...blankAttemptsByName }; 

  Object.entries(results).forEach(([name, isCorrect]) => {
    if (!isCorrect) {
      const prevCount = nextBlankAttempts[name] ?? 0;
      nextBlankAttempts[name] = prevCount + 1;
    }
    // (If it's correct, we leave its count as-is,
    //  so you know how many tries it needed before they got it.)
  });

  setBlankAttemptsByName(nextBlankAttempts);

  // Update UI with correctness
  setBlankStatus(results);

  // Figure out which blanks are wrong
  const incorrectNames = Object.entries(results)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  const hasIncorrect = incorrectNames.length > 0;

  // --- Analytics payload 
  const difficulties = step.blankDifficulties || {};

  const payload = {
    type: "CHECK_BLANKS",
    attempt: nextAttempt,
    results,
    blanks: Object.entries(results).map(([name, isCorrect]) => ({
      name,
      isCorrect,
      studentAnswer: (mergedBlanks[name] ?? "").trim(),
      difficulty: difficulties[name] || null,
      attemptsForThisBlank: nextBlankAttempts[name] ?? 0,
    })),
    incorrectBlanks: incorrectNames,
  };

  logBlankAnalytics(payload);

  // If everything is correct, clear AI hints
  if (!hasIncorrect) {
    setActiveBlankHint(null);
    setAiHelpByBlank({});
  }
};


  /* ==========================================================
     SYNTAX HIGHLIGHTING
  ========================================================== */
  const renderSyntaxHighlightedSegment = (text) => {
    if (!text) return null;

    const pieces = [];
    const regex =
      /(\b[A-Za-z_]\w*\b|\/\/[^\n]*|"[^"\n]*"|'[^'\n]*'|\d+|\s+|[^\w\s]+)/g;

    let match;
    let idx = 0;

    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      let style = styles.codeHighlight;

      if (token.startsWith("//")) {
        style = styles.syntaxComment;
      } else if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
      ) {
        style = styles.syntaxString;
      } else if (/^\d/.test(token)) {
        style = styles.syntaxNumber;
      } else if (TYPE_KEYWORDS.includes(token)) {
        style = styles.syntaxType;
      } else if (CONTROL_KEYWORDS.includes(token)) {
        style = styles.syntaxControl;
      } else if (ARDUINO_FUNCS.includes(token)) {
        style = styles.syntaxArduinoFunc;
      }

      pieces.push(
        <Text key={`seg-${idx++}`} style={style}>
          {token}
        </Text>
      );
    }

    return pieces;
  };

  /* ==========================================================
     RENDER CODE WITH BLANKS
  ========================================================== */
  const renderCodeWithBlanks = (code, blockIndex, blockExplanations) => {
    if (!code) return null;

    const chunks = code.split(/(\^\^[\s\S]*?\^\^)/g).filter(Boolean);
    const tokens = [];

    for (let chunk of chunks) {
      const isHighlight = chunk.startsWith("^^") && chunk.endsWith("^^");
      const inner = isHighlight ? chunk.slice(2, -2) : chunk;

      const parts = inner.split(/(__BLANK\[[A-Z0-9_]+\]__|\n)/g);

      for (let part of parts) {
        if (part === "\n") {
          tokens.push({ type: "newline" });
          continue;
        }
        if (!part) continue;

        const blankMatch = part.match(/^__BLANK\[([A-Z0-9_]+)\]__$/);
        if (blankMatch) {
          const name = blankMatch[1];
          const value = mergedBlanks[name] ?? "";
          const displayLength = value.length > 0 ? value.length : 1;

          tokens.push({
            type: "blank",
            name,
            value,
            width: Math.max(40, displayLength * 9),
            highlight: isHighlight,
          });
        } else {
          tokens.push({
            type: "text",
            highlight: isHighlight,
            content: part,
          });
        }
      }
    }

    const lines = [[]];
    tokens.forEach((tok) => {
      if (tok.type === "newline") {
        lines.push([]);
      } else {
        lines[lines.length - 1].push(tok);
      }
    });

    return lines.map((lineTokens, lineIdx) => {
      if (lineTokens.length === 0) {
        return (
          <View key={`line-${lineIdx}`} style={styles.codeLine}>
            <Text style={styles.codeNormal}>{" "}</Text>
          </View>
        );
      }

      return (
        <View key={`line-${lineIdx}`} style={styles.codeLine}>
          {lineTokens.map((tok, idx) => {
            if (tok.type === "text") {
              const textContent = tok.content;

              if (tok.highlight) {
                return (
                  <React.Fragment key={`t-${lineIdx}-${idx}`}>
                    {renderSyntaxHighlightedSegment(textContent)}
                  </React.Fragment>
                );
              }

              return (
                <Text
                  key={`t-${lineIdx}-${idx}`}
                  style={styles.codeNormal}
                >
                  {textContent}
                </Text>
              );
            }

            if (tok.type === "blank") {
              const status = blankStatus[tok.name];

              return (
                <View
                  key={`b-${lineIdx}-${idx}`}
                  style={styles.blankWithDot}
                >
                  <TextInput
                    value={tok.value}
                    onChangeText={(txt) => {
                      setLocalBlanks((prev) => ({
                        ...prev,
                        [tok.name]: txt,
                      }));
                      setGlobalBlanks((prev) => ({
                        ...prev,
                        [tok.name]: txt,
                      }));

                      setBlankStatus((prev) => {
                        const copy = { ...prev };
                        delete copy[tok.name];
                        return copy;
                      });

                      setActiveBlankHint((prev) =>
                        prev &&
                        prev.name === tok.name &&
                        prev.blockIndex === blockIndex
                          ? null
                          : prev
                      );
                      setAiHelpByBlank((prev) => {
                        const next = { ...prev };
                        delete next[`${blockIndex}:${tok.name}`];
                        return next;
                      });
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    style={[
                      styles.codeBlankInput,
                      tok.highlight && styles.codeBlankInputHighlight,
                      status === true && styles.blankCorrect,
                      status === false && styles.blankIncorrect,
                      { maxWidth: tok.width },
                    ]}
                  />
                  {status === false && (
                    <TouchableOpacity
                      style={styles.errorDot}
                      onPress={() => {
                        const explanation =
                          (blockExplanations &&
                            blockExplanations[tok.name]) ||
                          (step.blankExplanations &&
                            step.blankExplanations[tok.name]) ||
                          "Hint: Re-check what this blank represents.";

                        setActiveBlankHint({
                          name: tok.name,
                          text: explanation,
                          blockIndex,
                        });
                      }}
                    />
                  )}
                </View>
              );
            }

            return null;
          })}
        </View>
      );
    });
  };

  /* ==========================================================
     RENDER DESCRIPTION WITH INLINE BLANKS + CODE
  ========================================================== */
  const renderWithInlineCode = (text) => {
    if (!text) return null;

    const lines = text.split(/\n/);

    return lines.map((line, lineIdx) => {
      if (line === "") {
        return (
          <View
            key={`p-line-${lineIdx}`}
            style={styles.richTextLine}
          >
            <Text style={styles.stepDescText}>{" "}</Text>
          </View>
        );
      }

      const parts = line
        .split(/(__BLANK\[[A-Z0-9_]+\]__|`[^`]+`|\*\*[^*]+\*\*)/g)
        .filter(Boolean);

      return (
        <View
          key={`p-line-${lineIdx}`}
          style={styles.richTextLine}
        >
          {parts.map((part, idx) => {
            const blankMatch = part.match(/^__BLANK\[([A-Z0-9_]+)\]__$/);
            if (blankMatch) {
              const name = blankMatch[1];
              const value = mergedBlanks[name] ?? "";
              const width = Math.max(50, (value?.length || 1) * 8);

              return (
                <TextInput
                  key={`p-blank-${lineIdx}-${idx}`}
                  value={value}
                  onChangeText={(txt) => {
                    setLocalBlanks((prev) => ({
                      ...prev,
                      [name]: txt,
                    }));
                    setGlobalBlanks((prev) => ({
                      ...prev,
                      [name]: txt,
                    }));
                    setBlankStatus((prev) => {
                      const next = { ...prev };
                      delete next[name];
                      return next;
                    });
                    setActiveBlankHint(null);
                    setAiHelpByBlank({});
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  style={[styles.inlineBlankInput, { width }]}
                />
              );
            }

            if (part.startsWith("`") && part.endsWith("`")) {
              let code = part.slice(1, -1);

              if (code.startsWith("***") && code.endsWith("***")) {
                const strong = code.slice(3, -3);
                return (
                  <Text
                    key={`p-strong-code-${lineIdx}-${idx}`}
                    style={styles.inlineCodeStrong}
                  >
                    {strong}
                  </Text>
                );
              }

              return (
                <Text
                  key={`p-code-${lineIdx}-${idx}`}
                  style={styles.inlineCode}
                >
                  {code}
                </Text>
              );
            }

            if (part.startsWith("**") && part.endsWith("**")) {
              const boldText = part.slice(2, -2);

              let style = styles.boldGeneral;
              if (/Wiring/i.test(boldText)) style = styles.boldWiring;
              else if (/Setup/i.test(boldText)) style = styles.boldSetup;
              else if (/Loop/i.test(boldText)) style = styles.boldLoop;

              return (
                <Text
                  key={`p-bold-${lineIdx}-${idx}`}
                  style={style}
                >
                  {boldText}
                </Text>
              );
            }

            return (
              <Text
                key={`p-text-${lineIdx}-${idx}`}
                style={styles.stepDescText}
              >
                {part}
              </Text>
            );
          })}
        </View>
      );
    });
  };

  /* ==========================================================
     UI RENDER
  ========================================================== */
  return (
    <View style={styles.stepOuter}>
      <View style={styles.stepCard}>
        <View style={styles.stepHeaderRow}>
          <Text style={styles.stepTitle}>{step.title}</Text>
        </View>

        {step.topicTitle ? (
          <Text style={styles.topicTitle}>{step.topicTitle}</Text>
        ) : null}

        {step.desc ? (
          <View style={styles.stepDescBlock}>
            {renderWithInlineCode(step.desc)}
          </View>
        ) : null}

        {step.gif && (
          <View style={styles.gifCard}>
            <Image
              source={step.gif}
              style={styles.gifImage}
              resizeMode="contain"
            />
            <Text style={styles.gifCaption}>{step.gifCaption}</Text>
          </View>
        )}

        {step.descAfterCircuit ? (
          <View style={styles.stepDescBlock}>
            {renderWithInlineCode(step.descAfterCircuit)}
          </View>
        ) : null}

        {/* ---- Code blocks ---- */}
        {Array.isArray(step.codes) && step.codes.length > 0 ? (
          <>
            {step.codes.map((block, idx) => {
              const aiKey =
                activeBlankHint &&
                activeBlankHint.blockIndex === idx &&
                activeBlankHint.name
                  ? `${idx}:${activeBlankHint.name}`
                  : null;
              const aiText =
                aiKey &&
                Object.prototype.hasOwnProperty.call(aiHelpByBlank, aiKey)
                  ? aiHelpByBlank[aiKey]
                  : null;
              const loadingThis = aiKey && aiLoadingKey === aiKey;

              return (
                <View
                  key={`code-block-${idx}`}
                  style={{ marginTop: idx === 0 ? 12 : 16 }}
                >
                  {block.topicTitle ? (
                    <Text style={styles.topicTitle}>
                      {block.topicTitle}
                    </Text>
                  ) : null}

                  {block.descBeforeCode ? (
                    <View style={styles.stepDescBlock}>
                      {renderWithInlineCode(block.descBeforeCode)}
                    </View>
                  ) : null}

                  <View style={styles.codeCard}>
                    <View style={styles.codeCardHeader}>
                      <Text style={styles.codeCardTitle}>
                        Example Code
                      </Text>

                      <View style={styles.codeCardHeaderActions}>
                        {step.answerKey && (
                          <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={checkBlanks}
                          >
                            <Ionicons
                              name="checkmark-done-outline"
                              size={16}
                              color="#cbd5e1"
                            />
                            <Text style={styles.copyBtnText}>
                              Check Code
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={() =>
                            copyCode(block.code || step.code)
                          }
                        >
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color="#cbd5e1"
                          />
                          <Text style={styles.copyBtnText}>
                            Copy to Editor
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.codeBox}>
                      {renderCodeWithBlanks(
                        block.code,
                        idx,
                        block.blankExplanations || step.blankExplanations
                      )}
                    </View>
                  </View>

                  {/* HINT BOX for THIS CODE BLOCK ONLY */}
                  {activeBlankHint &&
                    activeBlankHint.blockIndex === idx && (
                      <View style={styles.blankHintBox}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={18}
                          color="#b91c1c"
                          style={{ marginRight: 8, marginTop: 2 }}
                        />
                        <View style={styles.hintContent}>
                          <Text style={styles.blankHintText}>
                            {activeBlankHint.text}
                          </Text>

                          {/* Cost awareness text (only if no AI text yet and not loading) */}
                          {!aiText && !loadingThis && (
                            <Text
                              style={[
                                styles.blankHintText,
                                {
                                  fontSize: 11,
                                  color: "#9ca3af",
                                  marginTop: 4,
                                },
                              ]}
                            >
                              More AI hints are allowed after you’ve thought it
                              through for at least 6 seconds.
                            </Text>
                          )}

                          {aiText && (
                            <>
                              <View style={styles.aiHintDivider} />
                              <Text style={styles.blankHintText}>
                                {aiText}
                              </Text>
                            </>
                          )}

                          {!aiText && loadingThis && (
                            <>
                              <View style={styles.aiHintDivider} />
                              <Text
                                style={[
                                  styles.blankHintText,
                                  {
                                    fontStyle: "italic",
                                    color: "#6b7280",
                                  },
                                ]}
                              >
                                Thinking…
                              </Text>
                            </>
                          )}
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                          }}
                        >
                          {/* Circle icon OR spinner while loading */}
                          {loadingThis ? (
                            <ActivityIndicator
                              size="small"
                              color="#2563eb"
                              style={{ marginRight: 8 }}
                            />
                          ) : (
                            <TouchableOpacity
                              onPress={() =>
                                requestAiBlankHelpForBlank({
                                  blankName: activeBlankHint.name,
                                  blockIndex: activeBlankHint.blockIndex,
                                  code: block.code || step.code,
                                })
                              }
                              style={{ marginRight: 8 }}
                            >
                              <Ionicons
                                name="help-circle-outline"
                                size={18}
                                color="#2563eb"
                              />
                            </TouchableOpacity>
                          )}

                          {/* X to close the hint box */}
                          <TouchableOpacity
                            onPress={() => {
                              setActiveBlankHint(null);
                              setAiHelpByBlank((prev) => {
                                if (!aiKey) return prev;
                                const next = { ...prev };
                                delete next[aiKey];
                                return next;
                              });
                            }}
                          >
                            <Ionicons
                              name="close"
                              size={18}
                              color="#6b7280"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                  {block.descAfterCode ? (
                    <View style={styles.stepDescBlock}>
                      {renderWithInlineCode(block.descAfterCode)}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        ) : step.code ? (
          (() => {
            const aiKey =
              activeBlankHint &&
              activeBlankHint.blockIndex === "single" &&
              activeBlankHint.name
                ? `single:${activeBlankHint.name}`
                : null;
            const aiText =
              aiKey &&
              Object.prototype.hasOwnProperty.call(aiHelpByBlank, aiKey)
                ? aiHelpByBlank[aiKey]
                : null;
            const loadingThis = aiKey && aiLoadingKey === aiKey;

            return (
              <>
                <View style={styles.codeCard}>
                  <View style={styles.codeCardHeader}>
                    <Text style={styles.codeCardTitle}>
                      Example Code
                    </Text>

                    <View style={styles.codeHeaderButtons}>
                      {step.answerKey && (
                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={checkBlanks}
                        >
                          <Ionicons
                            name="checkmark-done-outline"
                            size={16}
                            color="#cbd5e1"
                          />
                          <Text style={styles.copyBtnText}>
                            Check Code
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.copyBtn,
                          step.answerKey && { marginLeft: 8 },
                        ]}
                        onPress={() => copyCode(step.code)}
                      >
                        <Ionicons
                          name="copy-outline"
                          size={16}
                          color="#cbd5e1"
                        />
                        <Text style={styles.copyBtnText}>
                          Copy to Editor
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.codeBox}>
                    {renderCodeWithBlanks(
                      step.code,
                      "single",
                      step.blankExplanations
                    )}
                  </View>
                </View>

                {/* HINT BOX for the single step.code variant */}
                {activeBlankHint &&
                  activeBlankHint.blockIndex === "single" && (
                    <View style={styles.blankHintBox}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={18}
                        color="#b91c1c"
                        style={{ marginRight: 8, marginTop: 2 }}
                      />
                      <View style={styles.hintContent}>
                        <Text style={styles.blankHintText}>
                          {activeBlankHint.text}
                        </Text>

                        {!aiText && !loadingThis && (
                          <Text
                            style={[
                              styles.blankHintText,
                              {
                                fontSize: 11,
                                color: "#9ca3af",
                                marginTop: 4,
                              },
                            ]}
                          >
                              More AI hints are allowed after you’ve thought it
                              through for at least 6 seconds. You are allowed up to 3 hints per blank. 
                          </Text>
                        )}

                        {aiText && (
                          <>
                            <View style={styles.aiHintDivider} />
                            <Text style={styles.blankHintText}>
                              {aiText}
                            </Text>
                          </>
                        )}

                        {!aiText && loadingThis && (
                          <>
                            <View style={styles.aiHintDivider} />
                            <Text
                              style={[
                                styles.blankHintText,
                                {
                                  fontStyle: "italic",
                                  color: "#6b7280",
                                },
                              ]}
                            >
                              Thinking…
                            </Text>
                          </>
                        )}
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                        }}
                      >
                        {/* Circle icon OR spinner while loading */}
                        {loadingThis ? (
                          <ActivityIndicator
                            size="small"
                            color="#2563eb"
                            style={{ marginRight: 8 }}
                          />
                        ) : (
                          <TouchableOpacity
                            onPress={() =>
                              requestAiBlankHelpForBlank({
                                blankName: activeBlankHint.name,
                                blockIndex: "single",
                                code: step.code,
                              })
                            }
                            style={{ marginRight: 8 }}
                          >
                            <Ionicons
                              name="help-circle-outline"
                              size={18}
                              color="#2563eb"
                            />
                          </TouchableOpacity>
                        )}

                        {/* X to close the hint box */}
                        <TouchableOpacity
                          onPress={() => {
                            setActiveBlankHint(null);
                            setAiHelpByBlank((prev) => {
                              if (!aiKey) return prev;
                              const next = { ...prev };
                              delete next[aiKey];
                              return next;
                            });
                          }}
                        >
                          <Ionicons
                            name="close"
                            size={18}
                            color="#6b7280"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
              </>
            );
          })()
        ) : null}

        {step.descAfterCode ? (
          <View style={styles.stepDescBlock}>
            {renderWithInlineCode(step.descAfterCode)}
          </View>
        ) : null}

        {step.circuitImage && (
          <View style={styles.gifCard}>
            <Image
              source={step.circuitImage}
              style={styles.gifImage}
              resizeMode="contain"
            />
          </View>
        )}

        {step.hint ? (
          <View style={styles.hintBox}>
            <Ionicons name="bulb-outline" size={18} color="#6a5c1d" />
            <Text style={styles.hintText}>
              <Text style={{ fontWeight: "700" }}>Hint: </Text>
              {step.hint}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}


function renderCodeWithHighlights(text) {
  const parts = text.split(/(\^\^[\s\S]+?\^\^)/g);

  return parts
    .filter(Boolean)
    .map((part, idx) => {
      if (part.startsWith("^^") && part.endsWith("^^")) {
        const code = part.slice(2, -2);
        return (
          <Text key={idx} style={styles.codeHighlight}>
            {code}
          </Text>
        );
      }

      return (
        <Text key={idx} style={styles.codeNormal}>
          {part}
        </Text>
      );
    });
}


function renderWithInlineCode(text) {
  if (!text) return null;

  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Inline code (may include strong)
    if (part.startsWith("`") && part.endsWith("`")) {
      let code = part.slice(1, -1); // remove backticks

      // Strong inline code FIRST
      if (code.startsWith("***") && code.endsWith("***")) {
        const strong = code.slice(3, -3);
        return (
          <Text key={idx} style={styles.inlineCodeStrong}>
            {strong}
          </Text>
        );
      }

      // Normal inline code
      return (
        <Text key={idx} style={styles.inlineCode}>
          {code}
        </Text>
      );
    }

    // Bold **...**
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);

      let style = styles.boldGeneral;
      if (/Wiring/i.test(boldText)) style = styles.boldWiring;
      else if (/Setup/i.test(boldText)) style = styles.boldSetup;
      else if (/Loop/i.test(boldText)) style = styles.boldLoop;

      return (
        <Text key={idx} style={style}>
          {boldText}
        </Text>
      );
    }

    return <Text key={idx}>{part}</Text>;
  });
}

/*----------------SIDE BAR---------------------*/

function LessonSidebar({ currentLesson, currentStepIndex, onSelectStep, fullWidth, isStepDone}) {
  return (
    <View style={[styles.lessonSidebar,
      fullWidth && styles.sidebarExpanded,
    ]}>
      <Text style={styles.sidebarTitle}>Lessons & Steps</Text>

      {Object.entries(LESSON_STEPS).map(([lessonNumStr, steps]) => {
        const lessonNum = Number(lessonNumStr);
        const isCurrentLesson = lessonNum === currentLesson;

        return (
          <View key={lessonNumStr} style={styles.sidebarLessonBlock}>
            <Text
              style={[
                styles.sidebarLessonTitle,
                isCurrentLesson && styles.sidebarLessonTitleActive,
              ]}
            >
              Lesson {lessonNum}
            </Text>

            {steps.map((step, idx) => {
              const isActive = isCurrentLesson && idx === currentStepIndex;
              const done = 
                typeof isStepDone === "function" &&
                isStepDone(lessonNum,idx);

              return (
                <TouchableOpacity
                  key={`L${lessonNum}-S${idx}`}
                  style={[
                    styles.sidebarStepRow,
                    isActive && styles.sidebarStepRowActive,
                    !isActive && done && styles.sidebarStepRowDone,
                  ]}
                  onPress={() => onSelectStep(lessonNum, idx)}
                >
                  <Text
                    style={[
                      styles.sidebarStepText,
                      isActive && styles.sidebarStepTextActive,
                      !isActive && done && styles.sidebarStepRowDone,
                    ]}
                    numberOfLines={1}
                  >
                    {step.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}


/* ---------------- MAIN SCREEN ---------------- */
export default function CodeLessons() {
  const router = useRouter();
  const { showEditor, toggle } = useEditorToggle();

  const [lesson, setLesson] = React.useState(1);
  const [stepIndex, setStepIndex] = React.useState(0);
  const scrollRef = React.useRef(null); 
  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const STORAGE_KEYS = { 
    doneSet: "esb:coding:doneSet",
    overallProgress: "esb:coding:overallProgress",
   };

  const [doneSet, setDoneSet] = React.useState(new Set());

  React.useEffect(() => {
    (async () => {
      try {
        const d = await AsyncStorage.getItem(STORAGE_KEYS.doneSet);
        if (d) {
          const ids = JSON.parse(d);
          if (Array.isArray(ids)) {
            setDoneSet(new Set(ids));
          }
        }
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.doneSet,
          JSON.stringify(Array.from(doneSet))
        );
      } catch {}
    })();
  }, [doneSet]);

  /* ---- safe step bounds ---- */
  const steps = LESSON_STEPS[lesson] || [];
  const safeStepIndex = stepIndex < steps.length ? stepIndex : 0;
  const lastStep = safeStepIndex >= steps.length - 1;
    // unique key for each step
  const makeStepKey = (lessonNumber, stepIdx) => `L${lessonNumber}-S${stepIdx}`;
  const currentStepKey = makeStepKey(lesson, safeStepIndex);

  // is the CURRENT step done?
  const isDone = doneSet.has(currentStepKey);

  /* ---- PROGRESS CALCULATIONS (based on done steps) ---- */
  // collect all valid step keys so we ignore any old junk in storage
  const validDoneKeys = new Set();
  Object.entries(LESSON_STEPS).forEach(([lessonNumStr, stepsArr]) => {
    const lessonNum = Number(lessonNumStr);
    (stepsArr || []).forEach((_, idx) => {
      const key = makeStepKey(lessonNum, idx);
      if (doneSet.has(key)) {
        validDoneKeys.add(key);
      }
    });
  });

  // overall progress: % of all steps done
  const overallCompletedSteps = validDoneKeys.size;
  const overallProgress =
    TOTAL_STEPS > 0
      ? Math.round((overallCompletedSteps / TOTAL_STEPS) * 100)
      : 0;
  
  React.useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.overallProgress,
          JSON.stringify(overallProgress)
        );
      } catch (e) {
        console.warn("Failed to save overall coding progress:", e);
      }
    })();
  }, [overallProgress])

  // per-lesson progress: % of steps in THIS lesson done
  let completedInThisLesson = 0;
  steps.forEach((_, idx) => {
    const key = makeStepKey(lesson, idx);
    if (doneSet.has(key)) {
      completedInThisLesson++;
    }
  });

  const lessonProgress =
    steps.length > 0
      ? Math.round((completedInThisLesson / steps.length) * 100)
      : 0;


  const markDone = () =>
    setDoneSet(prev => {
      const next = new Set(prev);
      next.add(currentStepKey);
      return next;
    });

  const unmarkDone = () =>
    setDoneSet(prev => {
      const next = new Set(prev);
      next.delete(currentStepKey);
      return next;
    });

  const headerTopic =
    steps.length > 0 && steps[0]?.title
      ? steps[0].title.replace(/^Step \d+:\s*/, "")
      : "";
    
  const handleSelectStep = (lessonNumber, stepIdx) => {
    setLesson(lessonNumber);
    setStepIndex(stepIdx);
    scrollToTop();
  };


  /* ---- MAIN LEFT CONTENT ---- */
  const leftPane = (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/projects/electric-status-board/learn")}
        >
          <Ionicons name="arrow-back" size={18} color="#c05454" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* EDITOR TOGGLE BUTTON */}
        <TouchableOpacity style={styles.editorToggleBtn} onPress={toggle}>
          <Text style={styles.editorToggleText}>{`</>`}</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleWrap}>
        <Text style={styles.h1}>{`Lesson ${lesson}: ${headerTopic}`}</Text>
        <Text style={styles.p}>Learn by completing each step below.</Text>
      </View>



      {/* Overall + per-lesson progress */}
      <View style={{ paddingHorizontal: 18 }}>
        <View style={styles.progressGroup}>
          <Text style={styles.progressHeader}>Overall progress</Text>
          <View style={styles.progressBarWrap}>
            <View
              style={[styles.progressBarFill, { width: `${overallProgress}%` }]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {overallProgress}% complete
          </Text>
        </View>

        <View style={[styles.progressGroup, { marginTop: 8 }]}>
          <Text style={styles.progressHeader}>This lesson</Text>
          <View style={styles.progressBarWrap}>
            <View
              style={[
                styles.progressBarFillSecondary,
                { width: `${lessonProgress}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {lessonProgress}% of steps
          </Text>
        </View>
      </View>

      {/* Step card + Sidebar */}
      <ScrollView 
        ref={scrollRef}  
        contentContainerStyle={styles.container}>
        {steps.length > 0 ? (
          <View style={styles.lessonLayoutRow}>
            <StepCard
              step={steps[safeStepIndex]}
              storageKey={`esb:coding:blanks:LOCAL:L${lesson}-S${safeStepIndex}`}
            />

            <LessonSidebar
              currentLesson={lesson}
              currentStepIndex={safeStepIndex}
              onSelectStep={handleSelectStep}
              fullWidth={!showEditor}
              isStepDone={(lessonNumber, stepIdx) =>
                doneSet.has(makeStepKey(lessonNumber, stepIdx))
              }
            />
          </View>
        ) : null}
      </ScrollView>


      {/* Footer: step navigation + done marker */}
      <View style={styles.footer}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>

          {/* PREVIOUS */}
          <TouchableOpacity
            style={[
              styles.navBtn,
              safeStepIndex === 0 && styles.navDisabled,
            ]}
            onPress={() => setStepIndex(i => Math.max(0, i - 1))}
            disabled={safeStepIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={safeStepIndex === 0 ? "#aaa" : "#c05454"}
            />
            <Text
              style={[
                styles.navText,
                safeStepIndex === 0 && { color: "#aaa" },
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          {/* RIGHT SIDE BUTTON GROUP */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>

            {/* MARK DONE — glued to the left of Next */}
            {isDone ? (
              <TouchableOpacity
                style={[styles.btn, { marginRight: 8 }]}
                onPress={unmarkDone}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.btnText}>Marked</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.btnGhost, { marginRight: 8 }]}
                onPress={markDone}
              >
                <Ionicons name="ellipse-outline" size={18} color="#c05454" />
                <Text style={styles.btnGhostText}>Mark done</Text>
              </TouchableOpacity>
            )}

            {/* NEXT */}
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => {
                if (safeStepIndex >= steps.length - 1) {
                  if (lesson < TOTAL_LESSONS) {
                    setLesson(lesson + 1);
                    setStepIndex(0);
                  }
                } else {
                  setStepIndex(i => Math.min(steps.length - 1, i + 1));
                }
                scrollToTop();
              }}
            >
              <Text style={styles.btnPrimaryText}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color="#c05454" />
            </TouchableOpacity>

          </View>

        </View>
      </View>
    </View>
  );

  /* ---- MAIN OUTER VIEW ---- */
  return (
    <View style={styles.screen}>
      {showEditor ? (
        <SplitView left={leftPane} right={<ArduinoEditor />} />
      ) : (
        leftPane
      )}
    </View>
  );
}


/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fafafa" },

  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#c05454",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  backText: { color: "#c05454", fontWeight: "700" },

  /* EDITOR BUTTON (top-right) */
  editorToggleBtn: {
    marginLeft: "auto",
    backgroundColor: "#0f172a",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  editorToggleText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
    fontFamily: "monospace",
  },

  titleWrap: { paddingHorizontal: 18, paddingTop: 8 },
  h1: { fontSize: 24, fontWeight: "800" },
  p: { fontSize: 15, color: "#444", marginTop: 2, lineHeight: 22 },

  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7bcbc",
  },
  tabBtnActive: { backgroundColor: "#c05454", borderColor: "#c05454" },
  tabText: { color: "#c05454", fontWeight: "700" },
  tabTextActive: { color: "#fff" },

  progressBarWrap: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBarFill: { height: 6, backgroundColor: "#c05454" },
  progressLabel: { color: "#666", fontSize: 12, paddingTop: 4 },

  progressGroup: {
    marginTop: 4,
  },
  progressHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  progressBarFillSecondary: {
    height: 6,
    backgroundColor: "#f97316", // orange-ish for lesson progress
  },
  container: { padding: 18 },

  stepOuter: {
    backgroundColor: "#ffe4e6",
    borderRadius: 16,
    padding: 10,
    width: "75%",        // only take 75% of the screen width
    alignSelf: "flex-start", // stick to the left, not centered
  },
  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 2,
  },

  stepHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  codeCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
    maxWidth: 1200
  },

  codeCardHeader: {
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: "#0b1223",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2a44",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  codeCardTitle: { color: "#cbd5e1", fontWeight: "700", fontSize: 14 },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  copyBtnText: { color: "#cbd5e1", fontSize: 12, fontWeight: "600" },

  codeBox: {
    padding: 14,
  },

  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fff8db",
    borderWidth: 1,
    borderColor: "#ecd892",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  hintText: { fontSize: 14, color: "#6a5c1d", flex: 1, lineHeight: 20 },

  footer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
  },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  navBtn: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#c05454",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navDisabled: { borderColor: "#ccc" },
  navText: { color: "#c05454", fontWeight: "700" },

  btnPrimary: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#c05454",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnPrimaryText: { color: "#c05454", fontWeight: "800" },

  btn: {
    backgroundColor: "#c05454",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  btnGhost: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#c05454",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnGhostText: { color: "#c05454", fontWeight: "700" },

  gifCard: {
    backgroundColor: "#fff8db",       // soft light-yellow background
    borderWidth: 1,
    borderColor: "#ecd892",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    alignSelf: "center",   // don’t stretch full width of parent
    width: "100%",         // still responsive on small screens
    maxWidth: 600,         // cap how wide it can get 
  },

  gifImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#e8e6e6ff",
  },

  gifCaption: {
    fontSize: 13,
    color: "#6a5c1d",
    marginTop: 6,
    fontStyle: "italic",
  },

  inlineCode: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),

    backgroundColor: "#e2e6f1ff",
    color: "#111827",
    paddingHorizontal: 4,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: "600",
  },

  boldGeneral: {
    fontWeight: "600",
    color: "#3a3c3fff",
  },

  boldWiring: {
    fontWeight: "800",
    color: "#c05454", // deep red
    fontFamily: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
  },

  boldSetup: {
    fontWeight: "800",
    color: "#0b82dd", // blue for setup
    fontFamily: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
  },

  boldLoop: {
    fontWeight: "800",
    color: "#16a34a", // green for loop
    fontFamily: Platform.select({
      ios: "Courier-Bold",
      android: "monospace",
      default: "monospace",
    }),
  },

  codeNormal: {
    color: "#808280ff",
    fontWeight: "400",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 14,
    lineHeight: 20,
  },

  // highlighted (WHITE) segments: ^^...^^
  codeHighlight: {
    color: "#dadadaff",
    fontWeight: "400",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 14,
    lineHeight: 20,
  },

  // editable blanks in the code
  codeBlankInput: {
    minWidth: 10,              // small default width
    paddingHorizontal: 0,
    paddingVertical: 0.5,
    marginHorizontal: 0,
    marginRight: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#5e6d8b6a",
    color: "#9c9f9cff",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",       // keeps typed text centered
    fontFamily: CODE_FONT,
  },

  codeBlankInputHighlight: {
    color: "#dadadaff",              // match highlighted code color
    borderBottomColor: "#5e6d8b6a",  // lighter underline in highlight
    fontFamily: CODE_FONT
  },

  codeLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
  },

  inlineCodeStrong: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),

    backgroundColor: "#d1d8f7",       // slightly brighter bubble
    color: "#000",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 16,                      // bigger
    fontWeight: "800",                 // MUCH bolder
  },

  stepDescBlock: {
    marginTop: 6,
    marginBottom: 8,
  },
  richTextLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  stepDescText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },
  inlineBlankInput: {
    minWidth: 45,
    paddingHorizontal: 4,
    paddingVertical: 1,
    flexShrink: 0,
    alignSelf: "flex-start",
    marginHorizontal: 0,
    marginRight: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#76aad78d",
    fontSize: 14,
    lineHeight: 20,
    color: "#111827",
    textAlign: "center",
    flexShrink: 1,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },

  lessonLayoutRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  lessonSidebar: {
    marginLeft: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexShrink: 1,
  },

  sidebarTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  sidebarLessonBlock: {
    marginBottom: 12,
  },

  sidebarLessonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 4,
  },
  sidebarLessonTitleActive: {
    color: "#c05454",
  },

  sidebarStepRow: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 2,
  },
  sidebarStepRowActive: {
    backgroundColor: "#fee2e2",
  },

  sidebarStepText: {
    fontSize: 13,
    color: "#374151",
  },
  sidebarStepTextActive: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  sidebarExpanded: {
    maxWidth: 500,       // expand when editor is hidden
    flexGrow: 1,         // take up available space
  },

  sidebarStepRowDone: {
    backgroundColor: "#eaf9f0ff",      // light green
  },

  sidebarStepTextDone: {
    color: "#15803d",
    fontWeight: "600",
  },

  topicTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 18,
    fontWeight: "600",
    color: "#7b221bff",      // dark slate
  },

  syntaxType: {
    color: "#4EC9B0",      // teal for void/int/bool/etc.
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  syntaxControl: {
    color: "#a1cd75ff",      // green for if/else/return
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  syntaxArduinoFunc: {
    color: "#ce9261ff",      // pinMode / Serial / etc.
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  syntaxComment: {
    color: "#82a8abff",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  syntaxString: {
    color: "#CE9178",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  syntaxNumber: {
    color: "#B5CEA8",
    fontFamily: CODE_FONT,
    fontSize: 14,
    lineHeight: 20,
  },

  blankCorrect: {
    borderBottomColor: "#16a34a", // green
  },

  blankIncorrect: {
    borderBottomColor: "#dc2626", // red
  },

  // NEW: wrapper + red dot + hint box styles
  blankWithDot: {
    flexDirection: "row",
    alignItems: "center",
  },

  errorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#dc2626",
    marginLeft: 4,
  },

  blankHintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  blankHintTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#991b1b",
    marginBottom: 2,
  },

  blankHintText: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
  },

  codeHeaderButtons: {
  flexDirection: "row",        
  alignItems: "center",
  gap: 8,
  },

  hintContent: {
  flex: 1,
},

aiHintDivider: {
  width: "100%",      // full width of the hint content column
  height: 1,
  backgroundColor: "#ab9a9aff",
  marginVertical: 8,
  marginTop: 6,
  marginBottom: 6,
  alignSelf: "stretch",
},

aiStageButton: {
  minWidth: 20,
  height: 20,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: "#2563eb",
  alignItems: "center",
  justifyContent: "center",
},
aiStageButtonText: {
  fontSize: 11,
  fontWeight: "700",
  color: "#2563eb",
},



});

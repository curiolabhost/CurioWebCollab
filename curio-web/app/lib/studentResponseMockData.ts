// app/lib/studentResponseMockData.ts
import { StudentResponseData } from "../contexts/StudentResponseContext";

export const mockStudentResponses: Record<number, StudentResponseData> = {
  1: {
    studentId: 1,
    projectName: "Electric Status Board",
    difficulty: "beginner",
    responses: [
      // Lesson 2, Step 1 - Understanding Arduino Basics
      {
        id: "resp_1_2_1",
        lessonId: 2,
        stepId: 1,
        codeBlockIndex: 0,
        responseType: "ai_chat",
        timestamp: "2024-01-05T10:15:00Z",
        data: {
          userMessage: "Why do we need the delay function?",
          aiResponse: "The delay() function is essential here because it controls how long the LED stays on or off. Without it, the LED would switch on and off so fast that you wouldn't be able to see it blinking - it would just appear dim. The delay(1000) pauses the program for 1000 milliseconds (1 second), making the blink visible to the human eye."
        }
      },
      // Lesson 3, Step 2 - Defining Display Size
      {
        id: "resp_1_3_2",
        lessonId: 3,
        stepId: 2,
        codeBlockIndex: 0,
        responseType: "code",
        timestamp: "2024-01-05T10:30:00Z",
        data: {
          blanks: {
            WIDTH: "128",
            HEIGHT: "64",
            HEIGHT2: "64"
          }
        }
      },
      // Lesson 3, Step 3 - Defining Button Pins
      {
        id: "resp_1_3_3",
        lessonId: 3,
        stepId: 3,
        codeBlockIndex: 0,
        responseType: "code",
        timestamp: "2024-01-05T10:45:00Z",
        data: {
          blanks: {
            PREVN: "3",
            NEXTN: "4",
            SEL: "SELECT",
            SELN: "5"
          }
        }
      },
      {
        id: "resp_1_3_3_ai",
        lessonId: 3,
        stepId: 3,
        codeBlockIndex: 0,
        responseType: "ai_chat",
        timestamp: "2024-01-05T10:47:00Z",
        data: {
          userMessage: "Can I use any pin number for the buttons?",
          aiResponse: "Good question! While you have flexibility, there are some restrictions. You should use digital pins (typically 2-13 on Arduino Uno). Avoid using pins 0 and 1 as they're reserved for Serial communication, and pins 13 has an onboard LED that might interfere. The pins you choose must match your actual circuit wiring. In your case, using pins 3, 4, and 5 is perfect!"
        }
      },
      // Lesson 3, Step 4 - Initialize Display & Buttons
      {
        id: "resp_1_3_4",
        lessonId: 3,
        stepId: 4,
        codeBlockIndex: 0,
        responseType: "code",
        timestamp: "2024-01-05T11:00:00Z",
        data: {
          blanks: {
            BEGIN: "begin",
            BEGINA: "SSD1306_SWITCHCAPVCC",
            BEGINB: "0x3C",
            NEXT: "NEXT",
            INPUT1: "INPUT_PULLUP",
            PINMODE: "pinMode",
            SELECT: "SELECT",
            INPUT2: "INPUT_PULLUP"
          }
        }
      },
      {
        id: "resp_1_3_4_text",
        lessonId: 3,
        stepId: 4,
        codeBlockIndex: 0,
        responseType: "text",
        timestamp: "2024-01-05T11:05:00Z",
        data: {
          text: "I initially forgot to set pinMode for all three buttons and only did it for PREV. The code didn't work until I added all three!"
        }
      },
      // Lesson 4, Step 1 - Welcome Screen
      {
        id: "resp_1_4_1_ai",
        lessonId: 4,
        stepId: 1,
        codeBlockIndex: 0,
        responseType: "ai_chat",
        timestamp: "2024-01-05T11:20:00Z",
        data: {
          userMessage: "What's the difference between print() and println()?",
          aiResponse: "Great question! print() writes text and keeps the cursor on the same line, so the next text continues right after it. println() does the same but then moves the cursor to the beginning of the next line, so the next text starts on a new line. Think of println() as 'print with a line break at the end'. On an OLED display, this affects how your text is positioned on the screen."
        }
      },
    ]
  },
  2: {
    studentId: 2,
    projectName: "Electric Status Board",
    difficulty: "intermediate",
    responses: [
      // Lesson 2, Step 1
      {
        id: "resp_2_2_1",
        lessonId: 2,
        stepId: 1,
        codeBlockIndex: 0,
        responseType: "ai_chat",
        timestamp: "2024-01-01T14:20:00Z",
        data: {
          userMessage: "What happens if I don't use pinMode()?",
          aiResponse: "If you don't call pinMode(), the pin will be in its default state which is INPUT. This means digitalWrite() won't work properly because the pin isn't configured as an OUTPUT. Always remember: you must configure a pin with pinMode() before using it with digitalWrite() or digitalRead()."
        }
      },
      // Lesson 3, Step 2
      {
        id: "resp_2_3_2",
        lessonId: 3,
        stepId: 2,
        codeBlockIndex: 0,
        responseType: "code",
        timestamp: "2024-01-01T14:35:00Z",
        data: {
          blanks: {
            WIDTH: "128",
            HEIGHT: "64",
            HEIGHT2: "64"
          }
        }
      },
      // Lesson 3, Step 3
      {
        id: "resp_2_3_3",
        lessonId: 3,
        stepId: 3,
        codeBlockIndex: 0,
        responseType: "code",
        timestamp: "2024-01-01T14:50:00Z",
        data: {
          blanks: {
            PREVN: "2",
            NEXTN: "3",
            SEL: "SEL",
            SELN: "4"
          }
        }
      },
    ]
  },
  3: {
    studentId: 3,
    projectName: "Electric Status Board",
    difficulty: "beginner",
    responses: [
      // Lesson 2, Step 1
      {
        id: "resp_3_2_1_ai",
        lessonId: 2,
        stepId: 1,
        codeBlockIndex: 0,
        responseType: "ai_chat",
        timestamp: "2024-01-06T09:15:00Z",
        data: {
          userMessage: "I'm confused about setup() and loop(). Can you explain again?",
          aiResponse: "Of course! Think of setup() as the 'preparation phase' - it runs only once when your Arduino turns on or resets. This is where you configure things like pin modes and initialize displays. loop() is the 'action phase' - it runs continuously, over and over, as long as the Arduino has power. Your main program logic goes in loop(). So: setup() = runs once at start, loop() = runs forever in a cycle."
        }
      },
      {
        id: "resp_3_2_1_ai_2",
        lessonId: 2,
        stepId: 1,
        codeBlockIndex: 0,
        responseType: "ai_chat",
        timestamp: "2024-01-06T09:18:00Z",
        data: {
          userMessage: "Thanks! That makes more sense now.",
          aiResponse: "You're welcome! This is a fundamental concept in Arduino programming, so it's great that you're making sure you understand it well. As you work through more examples, you'll see this pattern repeated - setup() for initialization, loop() for the main program. Feel free to ask if you have any more questions!"
        }
      },
      // Lesson 3, Step 2 - student made an error
      {
        id: "resp_3_3_2_attempt1",
        lessonId: 3,
        stepId: 2,
        codeBlockIndex: 0,
        responseType: "code",
        timestamp: "2024-01-06T09:30:00Z",
        data: {
          blanks: {
            WIDTH: "64", // Wrong!
            HEIGHT: "128", // Wrong!
            HEIGHT2: "128" // Wrong!
          }
        }
      },
      {
        id: "resp_3_3_2_ai",
        lessonId: 3,
        stepId: 2,
        codeBlockIndex: 0,
        responseType: "ai_chat",
        timestamp: "2024-01-06T09:32:00Z",
        data: {
          userMessage: "My code says it's wrong but I thought 64x128 was correct?",
          aiResponse: "I can see the confusion! The display dimensions should be WIDTH: 128 and HEIGHT: 64 (not the reverse). Most OLED displays are wider than they are tall - like a landscape orientation. Think of it like your computer screen: width is the horizontal dimension (128 pixels), height is the vertical dimension (64 pixels). Try swapping those values!"
        }
      },
      {
        id: "resp_3_3_2_attempt2",
        lessonId: 3,
        stepId: 2,
        codeBlockIndex: 0,
        responseType: "code",
        timestamp: "2024-01-06T09:35:00Z",
        data: {
          blanks: {
            WIDTH: "128",
            HEIGHT: "64",
            HEIGHT2: "64"
          }
        }
      },
    ]
  },
  4: {
    studentId: 4,
    projectName: "Electric Status Board",
    difficulty: "advanced",
    responses: [
      // Advanced level responses
      {
        id: "resp_4_2_1",
        lessonId: 2,
        stepId: 1,
        codeBlockIndex: 0,
        responseType: "code",
        timestamp: "2023-12-20T10:00:00Z",
        data: {
          blanks: {
            LIB_GFX: "<Adafruit_GFX.h>",
            LIB_SSD: "<Adafruit_SSD1306.h>",
            LIB_CLOCK: "<RTClib.h>"
          }
        }
      },
      {
        id: "resp_4_2_1_text",
        lessonId: 2,
        stepId: 1,
        codeBlockIndex: 0,
        responseType: "text",
        timestamp: "2023-12-20T10:05:00Z",
        data: {
          text: "The advanced track gives more freedom to organize code. I'm planning to structure mine with separate state management functions."
        }
      },
    ]
  },
};

export function getStudentResponseData(studentId: number): StudentResponseData | null {
  return mockStudentResponses[studentId] || null;
}

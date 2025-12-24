// app/data/projects.tsx

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type Category = "Electronics" | "Robotics" | "IoT";

export type Project = {
  // canonical fields (Figma-style)
  id: number;
  slug: string;
  title: string;

  description: string; // short blurb
  fullDescription: string; // long overview

  difficulty: Difficulty;
  category: Category;
  image: string;

  ageRange: string;
  hours: string;

  materials: string[];
  skills: string[];
  learningOutcomes: string[];
  prerequisites: string[];
  projectHighlights: string[];

  // backward-compat (computed, not duplicated)
  readonly shortDescription: string;
  readonly overview: string;
  readonly estimatedHours: string;
};

function withCompat(base: Omit<Project, "shortDescription" | "overview" | "estimatedHours">): Project {
  return {
    ...base,

    // computed aliases (NOT duplicated data)
    get shortDescription() {
      return base.description;
    },
    get overview() {
      return base.fullDescription;
    },
    get estimatedHours() {
      return base.hours;
    },
  } as Project;
}

export const PROJECTS: Project[] = [
  withCompat({
    id: 1,
    slug: "arduino-basics",
    title: "Arduino Basics",
    description:
      "Start your Arduino journey with this comprehensive introduction course. You'll learn the fundamentals of electronics, circuit building, and programming through hands-on projects.",
    fullDescription:
      "Start your Arduino journey with this comprehensive introduction course. You'll learn the fundamentals of electronics, circuit building, and programming through hands-on projects. By the end of this course, you'll have the confidence to explore more advanced Arduino projects and bring your creative ideas to life.",
    difficulty: "Beginner",
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1553408226-42ecf81a214c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ageRange: "10-18 years",
    hours: "8-10 hours",
    materials: [
      "Arduino Uno board",
      "USB cable",
      "Breadboard",
      "LED lights (5 pieces)",
      "Resistors (220Ω, 5 pieces)",
      "Jumper wires",
      "Push button",
    ],
    skills: [
      "Basic electronics knowledge",
      "Reading circuit diagrams",
      "Arduino programming basics",
      "Problem-solving",
    ],
    learningOutcomes: [
      "Understand Arduino board components and functions",
      "Write and upload simple Arduino code",
      "Build basic circuits on a breadboard",
      "Control LEDs and read button inputs",
      "Debug common Arduino issues",
    ],
    prerequisites: [
      "No prior coding experience required",
      "Basic computer skills",
      "Curiosity and willingness to learn",
    ],
    projectHighlights: [
      "Perfect introduction to electronics and programming",
      "Build 5 different mini-projects",
      "Comprehensive video tutorials and written guides",
      "Downloadable code and circuit diagrams",
    ],
  }),

  withCompat({
    id: 2,
    slug: "remote-controlled-car",
    title: "Remote Controlled Car",
    description:
      "Transform Arduino programming into an exciting robotics project! Build your own remote-controlled car from scratch and learn about motor control, wireless communication, and mechanical assembly.",
    fullDescription:
      "Transform Arduino programming into an exciting robotics project! Build your own remote-controlled car from scratch and learn about motor control, wireless communication, and mechanical assembly. This project combines electronics, programming, and hands-on building for a complete learning experience.",
    difficulty: "Intermediate",
    category: "Robotics",
    image:
      "https://images.unsplash.com/photo-1743495851178-56ace672e545?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ageRange: "12-18 years",
    hours: "15-20 hours",
    materials: [
      "Arduino Uno board",
      "Motor driver (L298N)",
      "DC motors (4 pieces)",
      "Wheels and chassis kit",
      "Bluetooth module (HC-05)",
      "Battery pack (9V)",
      "Jumper wires",
      "Screwdriver set",
    ],
    skills: [
      "Motor control programming",
      "Wireless communication basics",
      "Mechanical assembly",
      "Circuit debugging",
      "Mobile app integration",
    ],
    learningOutcomes: [
      "Control motors with Arduino and motor drivers",
      "Implement wireless Bluetooth communication",
      "Assemble mechanical components",
      "Write control algorithms for movement",
      "Integrate smartphone control via app",
    ],
    prerequisites: [
      "Completed Arduino Basics or equivalent knowledge",
      "Understanding of basic electronics",
      "Familiarity with Arduino IDE",
    ],
    projectHighlights: [
      "Build a fully functional RC car",
      "Control via smartphone app",
      "Customizable speed and direction controls",
      "Learn about motor drivers and power management",
    ],
  }),

  withCompat({
    id: 3,
    slug: "smart-speaker-system",
    title: "Smart Speaker System",
    description:
      "Create your own smart speaker system with Arduino! Learn about audio electronics, wireless communication, and IoT concepts by building a Bluetooth-enabled speaker.",
    fullDescription:
      "Create your own smart speaker system with Arduino! This project teaches you about audio electronics, wireless communication, and IoT concepts. You'll build a Bluetooth-enabled speaker that can play music, respond to voice commands, and integrate with other smart devices.",
    difficulty: "Intermediate",
    category: "IoT",
    image:
      "https://images.unsplash.com/photo-1512446816042-444d641267d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ageRange: "13-18 years",
    hours: "12-15 hours",
    materials: [
      "Arduino Mega or ESP32",
      "Audio amplifier module (PAM8403)",
      "Speaker (8Ω, 3W)",
      "Microphone module",
      "Bluetooth audio module",
      "Power supply (12V)",
      "Enclosure/case",
      "Jumper wires",
    ],
    skills: [
      "Audio signal processing basics",
      "Wireless audio streaming",
      "Sensor integration",
      "Enclosure design",
    ],
    learningOutcomes: [
      "Understand audio amplification circuits",
      "Implement Bluetooth audio streaming",
      "Process audio signals with Arduino",
      "Design and build a speaker enclosure",
      "Control audio playback programmatically",
    ],
    prerequisites: [
      "Intermediate Arduino knowledge",
      "Basic understanding of electronics",
      "Soldering skills (helpful but not required)",
    ],
    projectHighlights: [
      "Stream music wirelessly via Bluetooth",
      "Voice-activated controls",
      "Custom sound effects and notifications",
      "Professional-looking enclosure design",
    ],
  }),

  withCompat({
    id: 4,
    slug: "mini-drone",
    title: "Mini Drone",
    description:
      "Take your Arduino skills to new heights—literally! Build and program a mini drone while learning flight dynamics, sensor fusion, and PID control.",
    fullDescription:
      "Take your Arduino skills to new heights—literally! This advanced project guides you through building and programming a mini drone. You'll learn about flight dynamics, sensor fusion, PID control, and the engineering principles that make flight possible. Safety is paramount, and this course includes comprehensive safety guidelines.",
    difficulty: "Advanced",
    category: "Robotics",
    image:
      "https://images.unsplash.com/photo-1699084583993-16958aa157d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ageRange: "14-18 years",
    hours: "25-30 hours",
    materials: [
      "Arduino Nano or flight controller",
      "Brushless motors (4 pieces)",
      "ESCs (Electronic Speed Controllers)",
      "Propellers",
      "LiPo battery (11.1V)",
      "Gyroscope/accelerometer (MPU6050)",
      "Radio transmitter and receiver",
      "Drone frame kit",
    ],
    skills: [
      "Flight dynamics understanding",
      "PID control algorithms",
      "Sensor fusion and calibration",
      "Radio communication",
      "Advanced programming",
    ],
    learningOutcomes: [
      "Understand quadcopter flight principles",
      "Implement PID stabilization algorithms",
      "Calibrate and use IMU sensors",
      "Configure radio control systems",
      "Troubleshoot flight issues",
    ],
    prerequisites: [
      "Advanced Arduino programming skills",
      "Strong understanding of physics and math",
      "Completed intermediate projects",
      "Patience and attention to safety",
    ],
    projectHighlights: [
      "Build a real flying drone from scratch",
      "Learn advanced control algorithms",
      "Understand aerospace engineering basics",
      "Comprehensive safety training included",
    ],
  }),

  withCompat({
    id: 5,
    slug: "smart-home-hub",
    title: "Smart Home Hub",
    description:
      "Transform your home into a smart home! Build a central hub that controls devices, monitors sensors, and automates your living space.",
    fullDescription:
      "Transform your home into a smart home! Build a central hub that controls lights, monitors sensors, and automates your living space. This project introduces you to the Internet of Things (IoT) and teaches practical skills for creating connected devices that make life easier.",
    difficulty: "Advanced",
    category: "IoT",
    image:
      "https://images.unsplash.com/photo-1679356505858-bf4129177392?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ageRange: "13-18 years",
    hours: "20-25 hours",
    materials: [
      "Arduino Mega or ESP32",
      "Wi-Fi module (ESP8266)",
      "Relay modules (4-channel)",
      "Temperature/humidity sensor (DHT22)",
      "Motion sensor (PIR)",
      "OLED display",
      "Power supply (12V)",
      "Smart bulbs or devices",
    ],
    skills: [
      "IoT fundamentals",
      "Web server development",
      "Sensor integration",
      "Home automation logic",
      "Network programming",
    ],
    learningOutcomes: [
      "Create a web-based control interface",
      "Integrate multiple sensors and devices",
      "Implement automation rules and schedules",
      "Set up remote access and control",
      "Understand IoT security basics",
    ],
    prerequisites: [
      "Intermediate Arduino knowledge",
      "Basic understanding of networking",
      "Familiarity with HTML/web concepts helpful",
    ],
    projectHighlights: [
      "Control home devices remotely",
      "Monitor temperature, humidity, and motion",
      "Create custom automation rules",
      "Mobile-friendly web interface",
    ],
  }),

  withCompat({
    id: 6,
    slug: "led-light-show",
    title: "LED Light Show",
    description:
      "Light up your world with programmable LED displays! Create mesmerizing light shows using addressable RGB LEDs, patterns, and interactive controls.",
    fullDescription:
      "Light up your world with programmable LED displays! Learn to create mesmerizing light shows using addressable RGB LEDs. This project combines programming with visual art, teaching you about color theory, animation algorithms, and creative coding.",
    difficulty: "Beginner",
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1599380061663-01b03dff42df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ageRange: "10-18 years",
    hours: "10-12 hours",
    materials: [
      "Arduino Uno",
      "WS2812B LED strip (60 LEDs)",
      "Power supply (5V, 3A)",
      "Potentiometer",
      "Push buttons (3 pieces)",
      "Breadboard",
      "Jumper wires",
    ],
    skills: [
      "LED programming and control",
      "Animation algorithms",
      "Color theory basics",
      "Pattern design",
    ],
    learningOutcomes: [
      "Control addressable RGB LED strips",
      "Create custom animation patterns",
      "Implement color mixing and transitions",
      "Design interactive light displays",
      "Optimize code for smooth animations",
    ],
    prerequisites: [
      "Arduino Basics or equivalent knowledge",
      "Basic programming concepts",
      "Creativity and artistic sense",
    ],
    projectHighlights: [
      "Create stunning visual effects",
      "Music-reactive light shows",
      "Multiple animation modes",
      "Interactive button controls",
    ],
  }),

  withCompat({
    id: 7,
    slug: "weather-station",
    title: "Weather Station",
    description:
      "Build your own weather station and learn sensor calibration, data logging, and clean data display.",
    fullDescription:
      "Build your own professional-grade weather station! Track temperature, humidity, pressure, rainfall, and wind speed. Learn about meteorology, data science, and sensor integration while creating a practical device that provides real weather insights.",
    difficulty: "Intermediate",
    category: "IoT",
    image:
      "https://images.unsplash.com/photo-1762553025389-a0ee281d6744?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ageRange: "12-18 years",
    hours: "15-18 hours",
    materials: [
      "Arduino Uno or ESP32",
      "Temperature/humidity sensor (DHT22)",
      "Barometric pressure sensor (BMP280)",
      "Rain sensor",
      "Wind speed sensor (anemometer)",
      "OLED or LCD display",
      "Real-time clock module (RTC)",
      "SD card module",
    ],
    skills: [
      "Sensor data collection",
      "Data logging and storage",
      "Real-time monitoring",
      "Data visualization",
    ],
    learningOutcomes: [
      "Read and calibrate multiple sensors",
      "Log data to SD card",
      "Display real-time weather information",
      "Calculate weather trends",
      "Create weather forecasts from data",
    ],
    prerequisites: [
      "Basic Arduino programming",
      "Understanding of sensor basics",
      "Basic math skills",
    ],
    projectHighlights: [
      "Monitor real weather conditions",
      "Historical data logging",
      "Beautiful data display interface",
      "Optional online data sharing",
    ],
  }),

  withCompat({
    id: 8,
    slug: "robotic-arm",
    title: "Robotic Arm",
    description:
      "Step into industrial robotics: build and program a multi-axis robotic arm with precise movements and control.",
    fullDescription:
      "Step into the world of industrial robotics! Build and program a multi-axis robotic arm capable of precise movements and object manipulation. This advanced project teaches you about kinematics, servo control, and the engineering principles behind industrial automation.",
    difficulty: "Advanced",
    category: "Robotics",
    image:
      "https://images.unsplash.com/photo-1761195696590-3490ea770aa1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ageRange: "13-18 years",
    hours: "20-25 hours",
    materials: [
      "Arduino Mega",
      "Servo motors (6 pieces, various sizes)",
      "Servo driver board (PCA9685)",
      "Robotic arm kit or frame",
      "Joystick modules (2 pieces)",
      "Power supply (6V, 5A)",
      "Gripper mechanism",
      "Mounting hardware",
    ],
    skills: [
      "Servo motor control",
      "Inverse kinematics basics",
      "Mechanical assembly",
      "Coordinate systems",
      "Precision control",
    ],
    learningOutcomes: [
      "Control multiple servo motors simultaneously",
      "Implement coordinate-based movement",
      "Program pick-and-place operations",
      "Understand robotic kinematics",
      "Create smooth, controlled movements",
    ],
    prerequisites: [
      "Intermediate Arduino knowledge",
      "Understanding of geometry and trigonometry",
      "Mechanical aptitude",
    ],
    projectHighlights: [
      "Build a 6-axis robotic arm",
      "Joystick and programmatic control",
      "Pick and place objects precisely",
      "Learn industrial robotics concepts",
    ],
  }),

  withCompat({
    id: 9,
    slug: "game-controller",
    title: "Game Controller",
    description:
      "Design your ultimate gaming controller and learn to program Arduino as a USB HID device.",
    fullDescription:
      "Design your ultimate gaming controller! Learn to program Arduino as a USB Human Interface Device (HID) and create a custom controller tailored to your gaming preferences. This project combines electronics with gaming passion and teaches you about input devices and ergonomic design.",
    difficulty: "Intermediate",
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1650585680670-4b67e210fe21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ageRange: "11-18 years",
    hours: "12-15 hours",
    materials: [
      "Arduino Leonardo or Pro Micro",
      "Push buttons (10+ pieces)",
      "Analog joysticks (2 pieces)",
      "Accelerometer module (optional)",
      "Vibration motor",
      "Controller enclosure/case",
      "USB cable",
      "Wiring and components",
    ],
    skills: [
      "HID device programming",
      "Input handling",
      "Enclosure design",
      "User interface design",
    ],
    learningOutcomes: [
      "Program Arduino as a USB game controller",
      "Handle multiple input types",
      "Implement button debouncing",
      "Design ergonomic enclosures",
      "Customize controller functions",
    ],
    prerequisites: [
      "Basic Arduino programming",
      "Understanding of USB HID concepts helpful",
      "Gaming interest",
    ],
    projectHighlights: [
      "Create a fully functional game controller",
      "Compatible with PC and console games",
      "Customizable button layouts",
      "Optional motion controls",
    ],
  }),
];

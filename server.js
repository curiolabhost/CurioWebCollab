// server.js (CommonJS)
// npm i express cors
//
// Notes:
// - NO Ollama usage.
// - NO OpenAI usage.
// - Provides Arduino compile verification only.
// - Adds /health.
// - Uses ARDUINO_CLI env var if present, otherwise "/home/ubuntu/arduino-cli/bin/arduino-cli".
// - Uses ARDUINO_FQBN env var if present, otherwise "arduino:avr:uno".

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");

const app = express();

// ---------- middleware ----------
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ---- JSON parse error handler (prevents HTML stack traces) ----
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    console.error("❌ Invalid JSON body:", req.method, req.url);
    console.error("   content-type:", req.headers["content-type"]);
    return res.status(400).json({ ok: false, error: "Invalid JSON body." });
  }
  next(err);
});

// ---------- request logger ----------
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// ----------------------
// Config
// ----------------------
const PORT = Number(process.env.PORT || 4000);

// Arduino CLI
const ARDUINO_CLI =
  process.env.ARDUINO_CLI || "/home/ubuntu/arduino-cli/bin/arduino-cli";
// If you prefer PATH-based (recommended), set ARDUINO_CLI="arduino-cli" in env.
const FQBN = process.env.ARDUINO_FQBN || "arduino:avr:uno";

// ----------------------
// Crash guards
// ----------------------
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));

// ----------------------
// Stub headers
// ----------------------
const STUB_LIBRARY_HEADERS = {
  "Adafruit_GFX.h":
    "#pragma once\n" +
    "#include <stdint.h>\n" +
    "class Adafruit_GFX { public: Adafruit_GFX(int16_t,int16_t) {} };",

  "Adafruit_SSD1306.h":
    "#pragma once\n" +
    "#include <stdint.h>\n" +
    "class TwoWire;\n" +
    "class Adafruit_SSD1306 {\n" +
    "public:\n" +
    "  Adafruit_SSD1306(uint8_t,uint8_t,TwoWire*,int8_t) {}\n" +
    "  bool begin(uint8_t=0,uint8_t=0,bool=true,bool=true){return true;}\n" +
    "  void clearDisplay(){}\n" +
    "  void display(){}\n" +
    "};",
};

function extractIncludedHeadersFromCode(code) {
  const headers = [];
  const re = /^\s*#\s*include\s*[<"]([^>"]+)[>"]/gm;
  let m;
  while ((m = re.exec(code)) !== null) headers.push(m[1].trim());
  return headers;
}

// (Optional helper kept for future: not used right now)
function headerExistsInArduinoLibraries(headerName) {
  try {
    const userLibDir = path.join(os.homedir(), "Arduino", "libraries");
    if (!fs.existsSync(userLibDir)) return false;

    const stack = [userLibDir];
    while (stack.length) {
      const dir = stack.pop();
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) stack.push(p);
        else if (e.isFile() && e.name === headerName) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function ensureStubHeadersForIncludes(code, dir) {
  for (const h of extractIncludedHeadersFromCode(code)) {
    if (STUB_LIBRARY_HEADERS[h]) {
      fs.writeFileSync(path.join(dir, h), STUB_LIBRARY_HEADERS[h], "utf8");
    }
  }
}

// ----------------------
// Health check
// ----------------------
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    service: "curio-api (compile-only)",
    aiHelp: "handled by curio-web /api/help (OpenAI)",
    arduinoCli: ARDUINO_CLI,
    fqbn: FQBN,
  });
});

// ----------------------
// /verify-arduino
// ----------------------
app.post("/verify-arduino", (req, res) => {
  console.log("Verify Called!");
  const { code } = req.body || {};
  if (!code?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'code'." });
  }

  try {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arduino-"));
    const sketchDir = path.join(tmp, "Sketch");
    fs.mkdirSync(sketchDir);

    fs.writeFileSync(path.join(sketchDir, "Sketch.ino"), code, "utf8");

    const stubDir = path.join(tmp, "stubs");
    fs.mkdirSync(stubDir);
    ensureStubHeadersForIncludes(code, stubDir);

    const cmd = `${ARDUINO_CLI} compile --fqbn ${FQBN} --build-property compiler.cpp.extra_flags="-I${stubDir}" "${sketchDir}"`;
    console.log("VERIFY: cmd =", cmd);

    exec(cmd, { timeout: 20000 }, (err, _stdout, stderr) => {
      if (!err) return res.json({ ok: true, errors: [] });

      console.log("---- ARDUINO STDERR BEGIN ----");
      console.log(String(stderr || "").slice(0, 8000));
      console.log("---- ARDUINO STDERR END ----");

      const errors = [];

      for (const line of String(stderr || "").split("\n")) {
        const m = line.match(/Sketch\.ino:(\d+):(\d+):\s+error:\s+(.*)/);
        if (m) {
          errors.push({
            line: Number(m[1]),
            column: Number(m[2]),
            message: m[3],
          });
        }
      }

      if (!errors.length) {
        errors.push({
          line: 1,
          column: 1,
          message: "Compilation failed (unrecognized format).",
        });
      }

      res.json({ ok: false, errors });
    });
  } catch (e) {
    console.error("❌ verify crash:", e);
    res.status(500).json({ ok: false, error: "Internal error." });
  }
});

// ----------------------
// Start server (ONLY ONCE)
// ----------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log("  • GET  /health");
  console.log("  • POST /verify-arduino");
});

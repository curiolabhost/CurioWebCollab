// server.js
// node server.js

const { pipeline } = require("stream");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");

// Load env vars from .env.local (OPENAI_API_KEY)
dotenv.config({ path: ".env.local" });

let OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn(
    "⚠️  OPENAI_API_KEY not found in .env.local. Falling back to assets/APIKEY.txt"
  );
  OPENAI_API_KEY = fs.readFileSync('assets/APIKEY.txt', "utf8").trim();
}

// OpenAI client (only if key is present)
const openai = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
    })
  : null;

const app = express();
app.use(cors());
app.use(express.json());

const ARDUINO_CLI = '"/home/paul/bin/arduino-cli"';
const FQBN = "arduino:avr:uno";

// ----------------------
// Library stubs for syntax-only verification
// ----------------------
const STUB_LIBRARY_HEADERS = {
  "Adafruit_GFX.h": `#pragma once
#include <stdint.h>
class Adafruit_GFX {
public:
  Adafruit_GFX(int16_t, int16_t) {}
};`,
  "Adafruit_SSD1306.h": `#pragma once
#include <stdint.h>
class TwoWire;
class Adafruit_SSD1306 {
public:
  Adafruit_SSD1306(uint8_t, uint8_t, TwoWire*, int8_t) {}
  bool begin(uint8_t = 0, uint8_t = 0, bool = true, bool = true) { return true; }
  void clearDisplay() {}
  void display() {}
};`,
};

function ensureStubHeadersForIncludes(code, stubDir) {
  const includes = extractIncludedHeadersFromCode(code);
  const written = [];
  for (const header of includes) {
    const stub = STUB_LIBRARY_HEADERS[header];
    if (!stub) continue;
    const outPath = path.join(stubDir, header);
    try {
      fs.writeFileSync(outPath, stub, "utf8");
      written.push(header);
    } catch (e) {
      console.warn("⚠️ Could not write stub header:", header, e);
    }
  }
  return written;
}

function extractMissingHeaderName(lineOrMessage) {
  if (!lineOrMessage) return null;
  const s = String(lineOrMessage);
  const m1 = s.match(/fatal error:\s*([A-Za-z0-9_.-]+\.h)\s*:\s*No such file/i);
  if (m1) return m1[1];
  const m2 = s.match(/([A-Za-z0-9_.-]+\.h)\s*:\s*No such file/i);
  if (m2) return m2[1];
  return null;
}

function cleanArduinoStderr(text) {
  if (!text) return "";
  return (
    text
      .replace(
        /C:\\Users\\[^\\]+\\AppData\\Local\\Temp\\[^\\]+\\Sketch\\Sketch\.ino/gi,
        "Sketch.ino"
      )
      .replace(/C:\\Users\\[^\\]+\\Sketch\\Sketch\.ino/gi, "Sketch.ino")
      .trim()
  );
}

function extractIncludedHeadersFromCode(code) {
  const headers = [];
  const re = /^\s*#\s*include\s*[<"]([^>"]+)[>"]/gm;
  let m;
  while ((m = re.exec(code)) !== null) headers.push(m[1].trim());
  return headers;
}

function normalizeArduinoDiagnostics({ errors, rawStderr }) {
  const stderrLines = (rawStderr || "").split("\n");
  const rewrittenErrors = (errors || []).map((e) => {
    const header = extractMissingHeaderName(e.message);
    if (header) {
      return {
        ...e,
        message: `Header "${header}" was not found. Check spelling, and make sure you added the correct #include line.`,
      };
    }
    return e;
  });

  const rewrittenStderr = stderrLines
    .map((line) => {
      const header = extractMissingHeaderName(line);
      if (header) {
        return `fatal error: ${header}: No such file or directory (check spelling and #include)`;
      }
      return line;
    })
    .join("\n")
    .trim();

  return { errors: rewrittenErrors, rawStderr: rewrittenStderr, notices: [] };
}

// ----------------------
// /verify-arduino
// ----------------------
app.post("/verify-arduino", (req, res) => {
  const { code } = req.body || {};
  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'code'." });
  }

  try {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "arduino-verify-"));
    const sketchDir = path.join(tmpRoot, "Sketch");
    fs.mkdirSync(sketchDir);

    const sketchPath = path.join(sketchDir, "Sketch.ino");
    fs.writeFileSync(sketchPath, code, "utf8");

    const stubDir = path.join(tmpRoot, "stubs");
    fs.mkdirSync(stubDir);
    ensureStubHeadersForIncludes(code, stubDir);

    const cmd = `${ARDUINO_CLI} compile --fqbn ${FQBN} --build-property compiler.cpp.extra_flags="-I${stubDir}" --build-property compiler.c.extra_flags="-I${stubDir}" "${sketchDir}"`;
    console.log("🔧 Running:", cmd);

    exec(cmd, { timeout: 20000 }, (error, stdout, stderr) => {
      const cleanedStderr = cleanArduinoStderr(stderr?.toString() || "");

      if (!error) {
        return res.json({
          ok: true,
          errors: [],
          rawStdout: stdout,
          rawStderr: cleanedStderr,
          notices: [],
        });
      }

      const errors = [];
      const lines = cleanedStderr.split("\n");
      const regex = /Sketch\.ino:(\d+):(\d+):\s+error:\s+(.*)/;
      for (const line of lines) {
        const m = line.match(regex);
        if (m) {
          errors.push({
            line: parseInt(m[1], 10),
            column: parseInt(m[2], 10),
            message: m[3].trim(),
          });
        }
      }

      if (errors.length === 0) {
        errors.push({
          line: 1,
          column: 1,
          message: "Compilation failed, but the error format was unexpected. Check compiler output.",
        });
      }

      const normalized = normalizeArduinoDiagnostics({
        errors,
        rawStderr: cleanedStderr,
      });

      return res.json({
        ok: false,
        errors: normalized.errors,
        rawStdout: stdout,
        rawStderr: normalized.rawStderr,
        notices: normalized.notices,
      });
    });
  } catch (e) {
    console.error("❌ /verify-arduino crashed:", e);
    return res.status(500).json({
      ok: false,
      error: "Internal server error in /verify-arduino.",
    });
  }
});

// ----------------------
// /ai/help
// ----------------------
app.post("/ai/help", async (req, res) => {
  if (!openai) {
    return res.status(500).json({
      ok: false,
      error: "OPENAI_API_KEY is missing. Add it to .env.local.",
    });
  }

  const { mode, code, errors, language, question } = req.body || {};
  if (!mode) {
    return res.status(400).json({ ok: false, error: "Missing 'mode' in body." });
  }

  let systemPrompt = "";
  let userPrompt = "";

  if (mode === "arduino-verify") {
    if (typeof code !== "string" || !Array.isArray(errors) || errors.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "For mode 'arduino-verify', provide 'code' (string) and 'errors' (non-empty array).",
      });
    }

    const errorSummary = errors.map(e => `Line ${e.line}, Column ${e.column || 1}: ${e.message}`).join("\n");

    systemPrompt = `
You are a friendly Arduino tutor for beginners.
Explain compiler errors in simple, beginner-friendly language.
Reference line numbers when helpful.
Do not provide full solutions, just hints.
`;

    userPrompt = `
Arduino sketch:
\`\`\`cpp
${code}
\`\`\`
Errors:
${errorSummary}
Explain the errors and give 1-2 hints each without giving full code.
`;
  } else if (mode === "generic-code-help") {
    if (typeof code !== "string" || typeof question !== "string") {
      return res.status(400).json({
        ok: false,
        error: "For mode 'generic-code-help', provide 'code' and 'question'.",
      });
    }

    const langLabel = language || "code";
    systemPrompt = `
You are a helpful programming tutor.
Explain code in clear beginner-friendly language.
Suggest 1-2 ideas but do not give full solutions.
`;
    userPrompt = `
${langLabel} code:
\`\`\`${langLabel}
${code}
\`\`\`
Question: "${question}"
`;
  } else {
    return res.status(400).json({ ok: false, error: `Unknown mode '${mode}'.` });
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_output_tokens: 700,
    });

    const explanation = response.output_text || "Could not generate an explanation.";
    return res.json({ ok: true, explanation });
  } catch (err) {
    console.error("❌ OpenAI error:", err);
    return res.status(500).json({ ok: false, error: "AI request failed." });
  }
});

// ----------------------
// /api/blank-help & analytics
// ----------------------
const ANALYTICS_LOG_PATH = path.join(__dirname, "data", "blank_analytics.log");

app.post("/api/blank-help", async (req, res) => {
  if (!openai) return res.status(500).json({ explanation: "OPENAI_API_KEY missing." });
  const body = req.body || {};
  if (!body.blank || !body.blank.name) return res.status(400).json({ explanation: "Missing blank data." });

  return res.json({ explanation: "This is a placeholder blank helper." });
});

app.post("/api/blank-analytics", (req, res) => {
  const event = { ...req.body, timestamp: new Date().toISOString() };
  try {
    fs.mkdirSync(path.dirname(ANALYTICS_LOG_PATH), { recursive: true });
    fs.appendFileSync(ANALYTICS_LOG_PATH, JSON.stringify(event) + "\n", "utf8");
  } catch (err) {
    console.error("Analytics log error:", err);
    return res.status(500).json({ ok: false });
  }
  return res.json({ ok: true });
});

app.get("/api/progress-summary", (req, res) => {
  let lines = [];
  try {
    const raw = fs.readFileSync(ANALYTICS_LOG_PATH, "utf8");
    lines = raw.split("\n").filter(Boolean);
  } catch (err) {}
  return res.json({ ok: true, statsByBlank: {} });
});

app.get("/analytics", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "analytics.html"));
});

/**
 * POST /ai/help-stream
 * Body: { code: string, errors: Array<{line,column,message}> }
 *
 * Streams a beginner-friendly AI explanation of Arduino errors to the client.
 */
app.post("/ai/help-stream", async (req, res) => {
  if (!openai) {
    return res.status(500).json({
      ok: false,
      error:
        "OPENAI_API_KEY is missing. Add it to .env.local as OPENAI_API_KEY=your_key_here.",
    });
  }

  const { code, errors } = req.body || {};
  if (!code || !Array.isArray(errors) || errors.length === 0) {
    return res.status(400).json({
      ok: false,
      error: "Provide 'code' and a non-empty array of 'errors'.",
    });
  }

  // Set headers for streaming plain text
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders?.();

  try {
    // OpenAI streaming
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a friendly Arduino tutor for beginners (middle school / early high school).
Explain the student's compiler errors in simple, friendly language.
Do NOT give the full corrected code.
Reference line numbers and give 1-2 hints per error.
        `,
        },
        {
          role: "user",
          content: `
Arduino sketch:
\`\`\`cpp
${code}
\`\`\`

Compiler errors:
${errors
  .map((e) => `Line ${e.line}, Column ${e.column || 1}: ${e.message}`)
  .join("\n")}
          `,
        },
      ],
      temperature: 0.3,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        res.write(event.delta); // stream chunk
      }
    }

    res.end();
  } catch (err) {
    console.error("❌ Streaming AI error:", err);
    res.end("\nSomething went wrong while streaming the AI helper.");
  }
});

// ----------------------
// Start server
// ----------------------
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log("  • POST /verify-arduino");
  console.log("  • POST /ai/help");
  console.log("  • POST /api/blank-help");
  console.log("  • POST /api/blank-analytics");
  console.log("  • GET  /api/progress-summary");
});
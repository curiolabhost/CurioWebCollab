// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");
const { Ollama } = require("ollama");

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------
// Ollama config
// ----------------------
const OLLAMA_HOST = "http://127.0.0.1:11434";
const ollamaClient = new Ollama({ host: OLLAMA_HOST });

// ----------------------
// Arduino CLI config
// ----------------------
const ARDUINO_CLI = '"/home/paul/bin/arduino-cli"';
const FQBN = "arduino:avr:uno";

// ----------------------
// Stub headers
// ----------------------
const STUB_LIBRARY_HEADERS = {
  "Adafruit_GFX.h": `#pragma once
#include <stdint.h>
class Adafruit_GFX { public: Adafruit_GFX(int16_t,int16_t) {} };`,
  "Adafruit_SSD1306.h": `#pragma once
#include <stdint.h>
class TwoWire;
class Adafruit_SSD1306 {
public:
  Adafruit_SSD1306(uint8_t,uint8_t,TwoWire*,int8_t) {}
  bool begin(uint8_t=0,uint8_t=0,bool=true,bool=true){return true;}
  void clearDisplay(){}
  void display(){}
};`,
};

function extractIncludedHeadersFromCode(code) {
  const headers = [];
  const re = /^\s*#\s*include\s*[<"]([^>"]+)[>"]/gm;
  let m;
  while ((m = re.exec(code)) !== null) headers.push(m[1].trim());
  return headers;
}

function ensureStubHeadersForIncludes(code, dir) {
  for (const h of extractIncludedHeadersFromCode(code)) {
    if (STUB_LIBRARY_HEADERS[h]) {
      fs.writeFileSync(path.join(dir, h), STUB_LIBRARY_HEADERS[h], "utf8");
    }
  }
}

// ----------------------
// /verify-arduino
// ----------------------
app.post("/verify-arduino", (req, res) => {
  const { code } = req.body || {};
  if (!code?.trim()) return res.status(400).json({ ok: false, error: "Missing 'code'." });

  try {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arduino-"));
    const sketchDir = path.join(tmp, "Sketch");
    fs.mkdirSync(sketchDir);

    fs.writeFileSync(path.join(sketchDir, "Sketch.ino"), code, "utf8");

    const stubDir = path.join(tmp, "stubs");
    fs.mkdirSync(stubDir);
    ensureStubHeadersForIncludes(code, stubDir);

    const cmd = `${ARDUINO_CLI} compile --fqbn ${FQBN} --build-property compiler.cpp.extra_flags="-I${stubDir}" "${sketchDir}"`;

    exec(cmd, { timeout: 20000 }, (err, stdout, stderr) => {
      if (!err) return res.json({ ok: true, errors: [] });

      const errors = [];
      for (const line of stderr.split("\n")) {
        const m = line.match(/Sketch\.ino:(\d+):(\d+):\s+error:\s+(.*)/);
        if (m) errors.push({ line: Number(m[1]), column: Number(m[2]), message: m[3] });
      }
      if (!errors.length) errors.push({ line: 1, column: 1, message: "Compilation failed (unrecognized format)." });

      res.json({ ok: false, errors });
    });
  } catch (e) {
    console.error("❌ verify crash:", e);
    res.status(500).json({ ok: false, error: "Internal error." });
  }
});

// ----------------------
// /ai/help - proper Ollama streaming (Node SDK compatible)
// ----------------------
app.post("/ai/help", async (req, res) => {
  const {
    code = "",
    errors = [],
    mode = "arduino-verify",
    question = "",
    language = "cpp",
  } = req.body || {};

  if (!code.trim() && !question) {
    return res.status(400).json({ ok: false, error: "Provide either 'code' or 'question'." });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(": keep-alive\n\n");

  const prompt =
    mode === "arduino-verify"
      ? `You are a friendly Arduino tutor. Explain these errors with hints only. Do NOT give the students the answer. Limit your responses to only three sentences long.

Sketch:
\`\`\`cpp
${code.slice(0, 4000)}
\`\`\`

Errors:
${errors.map(e => `Line ${e.line || 1}: ${e.message}`).join("\n")}`
      : `You are a programming tutor. Explain clearly:

${language} code:
\`\`\`${language}
${code.slice(0, 4000)}
\`\`\`

Question:
${question}`;

  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  try {
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder:7b",
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!ollamaRes.body) {
      throw new Error("No Ollama stream");
    }

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;

        const json = JSON.parse(line);

        const token = json.message?.content;
        if (token) {
          res.write(
            `event: token\ndata: ${JSON.stringify({ token })}\n\n`
          );
        }

        if (json.done) {
          res.write(`event: done\ndata: {}\n\n`);
          res.end();
          return;
        }
      }
    }
    if (!aborted) {
      res.write(`event: done\ndata: {}\n\n`);
      res.end();
    }

  } catch (err) {
    console.error("❌ Ollama streaming error:", err);

    res.write(
      `event: error\ndata: ${JSON.stringify({
        error: "AI request failed. Check server logs.",
      })}\n\n`
    );
    res.end();
  }
});

// ----------------------
// Start server
// ----------------------
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log("  • POST /verify-arduino");
  console.log("  • POST /ai/help (streaming)");
});

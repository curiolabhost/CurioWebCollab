// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");
const { Ollama } = require("ollama");
const { request } = require("undici");

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
const ARDUINO_CLI = "/home/ubuntu/arduino-cli/bin/arduino-cli";
const FQBN = "arduino:avr:uno";

const { body } = await request(`${OLLAMA_HOST}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "qwen2.5-coder:1.5b",
    stream: true,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  }),
});

// ----------------------
// Stub headers
// ----------------------
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));

const PORT = process.env.PORT || 4000;

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
  console.log("Verify Called!")
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

    console.log("VERIFY: starting compile");
    console.log("VERIFY: cmd =", cmd);

    exec(cmd, { timeout: 20000 }, (err, stdout, stderr) => {
        console.log("VERIFY: done");
        console.log("VERIFY: err =", err?.message);
        console.log("VERIFY: stdout =", stdout);
        console.log("VERIFY: stderr =", stderr);

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
// /ai/help - streaming hints with error context
// ----------------------
app.post("/ai/help", async (req, res) => {
  console.log("🤖 POST /ai/help called");
  const { code = "", errors = [], mode = "arduino-verify", question = "", language = "cpp" } = req.body || {};

  if (!code.trim() && !question) {
    return res.status(400).json({ ok: false, error: "Provide either 'code' or 'question'." });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.write(": keep-alive\n\n");
  res.flushHeaders();

  const codeLines = code.split("\n");
  const contextSize = 5;
  let errorSnippets = "";

  if (mode === "arduino-verify") {
    errorSnippets = errors.map(e => {
      const lineNum = e.line || 1;
      const start = Math.max(0, lineNum - 1 - contextSize);
      const end = Math.min(codeLines.length, lineNum + contextSize);
      const snippet = codeLines.slice(start, end).join("\n");
      return `Line ${lineNum} snippet:\n\`\`\`cpp\n${snippet}\n\`\`\`\nError: ${e.message}`;
    }).join("\n\n");
  }

  const prompt = `SYSTEM RULES (MANDATORY):
- Output AT MOST 2 sentences.
- ONLY explain the cause of the compiler error.
- DO NOT rewrite code, give fixes, or explain how the code works.
- Do not add context or commentary.

${language} code:
\`\`\`${language}
${code.slice(0, 4000)}
\`\`\`

Please explain the root cause of this error:
${errorSnippets}`;

  let aborted = false;
  req.on("close", () => { aborted = true; });

  try {
    const ollamaRes = await request(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder:1.5b",
        stream: true,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!ollamaRes.body) throw new Error("No Ollama stream");

    // Make it a proper Node Readable stream
    const stream = ollamaRes.body;
    stream.setEncoding("utf8");

    let buffer = "";
    stream.on("data", chunk => {
      if (aborted) return;
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep last incomplete line

      for (const line of lines) {
        if (!line.trim()) continue;
        let json;
        try { json = JSON.parse(line); } catch { continue; }

        const token = json.message?.content;
        if (token) res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
        if (json.done) res.write(`event: done\ndata: {}\n\n`);
      }
    });

    stream.on("end", () => { if (!aborted) res.end(); });
    stream.on("error", err => { console.error("❌ Ollama stream error:", err); res.end(); });

  } catch (err) {
    console.error("❌ Ollama streaming error:", err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: "AI request failed. Check server logs." })}\n\n`);
    res.end();
  }
});
// ----------------------
// Start server
// ----------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log("  • POST /verify-arduino");
  console.log("  • POST /ai/help (streaming)");
});

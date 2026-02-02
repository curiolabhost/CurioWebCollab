// server.js (CommonJS)
// npm i express cors openai
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");
const { Ollama } = require("ollama");
const util = require('util');

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ---------- request logger ----------
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// ----------------------
// OpenAI config
// ----------------------
// IMPORTANT: Use a model you actually have access to.
// If you're unsure, start with "gpt-4.1-mini" (widely available).
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const openai = new OpenAI({
  apiKey: "REDACTED",
  // hard client timeout so calls can't hang forever
  timeout: 30000,
});

// ----------------------
// Arduino CLI config
// ----------------------
const ARDUINO_CLI = "/home/ubuntu/arduino-cli/bin/arduino-cli";
const FQBN = "arduino:avr:uno";

// ----------------------
// Crash guards
// ----------------------
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));

const PORT = process.env.PORT || 4000;


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

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
    openaiKeyPresent: !!process.env.OPENAI_API_KEY,
    model: OPENAI_MODEL,
    time: new Date().toISOString(),
  });
});

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
    console.log("VERIFY: cmd =", cmd);

    exec(cmd, { timeout: 20000 }, (err, _stdout, stderr) => {
      if (!err) return res.json({ ok: true, errors: [] });

      const errors = [];
      for (const line of String(stderr || "").split("\n")) {
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

  const {
    code = "",
    errors = [],
    mode = "arduino-verify",
    question = "",
    language = "cpp",
  } = req.body || {};

  console.log("AI: entered /ai/help");
  if (!process.env.OPENAI_API_KEY) {
    console.log("AI: missing OPENAI_API_KEY");
    return res.status(500).json({ ok: false, error: "Missing OPENAI_API_KEY env var." });
  }
  if (!code.trim() && !question) {
    console.log("AI: missing code/question");
    return res.status(400).json({ ok: false, error: "Provide either 'code' or 'question'." });
  }

  const codeLines = code.split("\n");
  const contextSize = 2; // lines before/after each error

  let errorSnippets = "";
  if (mode === "arduino-verify") {
    errorSnippets = errors.map(e => {
      const lineNum = e.line || 1;
      const start = Math.max(0, lineNum - 1 - contextSize);
      const end = Math.min(codeLines.length, lineNum + contextSize);
      const snippet = codeLines.slice(start, end).join("\n");
      return `Line ${lineNum} snippet:\n\`\`\`cpp\n${snippet}\n\`\`\`\nCompiler error: ${e.message}`;
    }).join("\n\n");
  }
  let codeString = typeof code === 'string' ? code : JSON.stringify(code);
  const formattedCode = `\`\`\`cpp
  ${codeString}
  \`\`\``;
  console.log("Errors: ", errors);
  console.log("Error Snippets: " + errorSnippets);
  console.log("Explaining: " + formattedCode);
  let prompt = `You are a friendly Arduino tutor. Explain these errors with hints only. Do NOT give the students the answer. Do not talk about the prompt in your answer.
 Keep your responses very short but helpful and up to 3 sentences long.
When analyzing C++ or Arduino code, assume whitespace is syntactically irrelevant except in preprocessor directives, string literals, and explicit line continuations. 
Do not cite whitespace as a cause of error unless one of those cases is present.
Do not provide generic explanations such as “whitespace issues” or “formatting problems.” Every claim must reference a concrete language rule or compiler behavior.
Do not invent or generalize language rules.
If an explanation cannot be traced to a real C++ grammar or standard construct, state that the cause is unknown or elsewhere.
Before claiming a syntax error, identify the exact invalid token, delimiter mismatch, or grammar violation.
If none can be identified, state that the code is syntactically valid.
Compiler error messages are authoritative.
Do not reinterpret, generalize, or replace them.
The explanation must directly follow the stated error message.
This is the relavent portion of the code:
${code}
These are the errors you must explain:
${errors}`
  let aborted = false;
  req.on("close", () => { aborted = true; });

  try {
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5-coder:1.5b",
        stream: true,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!ollamaRes.body) throw new Error("No Ollama stream");

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
          res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
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
  console.log("  • POST /ai/help (JSON default; SSE if Accept:text/event-stream or ?stream=1)");
});

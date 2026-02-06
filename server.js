// server.js (CommonJS)
// npm i express cors
//
// Notes:
// - No OpenAI usage.
// - Adds /health.
// - Uses OLLAMA_HOST env var if present, defaults to localhost.
// - Uses ARDUINO_CLI env var if present, otherwise "arduino-cli" on PATH.
// - Streams SSE tokens from Ollama's /api/chat stream.

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

// Ollama
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3-coder-next:cloud";

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
    ollamaHost: OLLAMA_HOST,
    ollamaModel: OLLAMA_MODEL,
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
  if (!code?.trim())
    return res.status(400).json({ ok: false, error: "Missing 'code'." });

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
        if (m)
          errors.push({
            line: Number(m[1]),
            column: Number(m[2]),
            message: m[3],
          });
      }
      if (!errors.length)
        errors.push({
          line: 1,
          column: 1,
          message: "Compilation failed (unrecognized format).",
        });

      res.json({ ok: false, errors });
    });
  } catch (e) {
    console.error("❌ verify crash:", e);
    res.status(500).json({ ok: false, error: "Internal error." });
  }
});

// ----------------------
// /ai/help - streaming SSE hints from Ollama
// ----------------------
app.post("/ai/help", async (req, res) => {
  console.log("🤖 POST /ai/help called");

  const {
    code = "",
    errors = [],
    mode = "arduino-verify",
    question = "",
    language = "cpp",
    verbosity = "brief",
    sentences = 3,
    instructions = null,
    userText = null,
    temperature = 0,
    max_output_tokens = 400,
  } = req.body || {};

  const modeNorm = String(mode).trim().toLowerCase();

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") res.flushHeaders();
  res.write(": keep-alive\n\n");

  // Keep-alive ping
  const ping = setInterval(() => {
    try { res.write(": ping\n\n"); } catch {}
  }, 15000);

  let aborted = false;
  req.on("close", () => {
    aborted = true;
    clearInterval(ping);
  });

  // Build the prompt
  let prompt = "";
  if (typeof instructions === "string" && typeof userText === "string") {
    prompt = `${instructions}\n\n${userText}`;
  } else {
    if (!code.trim() && !question.trim()) {
      clearInterval(ping);
      return res.status(400).json({ ok: false, error: "Provide either 'code' or 'question'." });
    }

    prompt =
      modeNorm === "arduino-verify"
        ? `You are a friendly Arduino tutor. Explain these errors with hints only. Do NOT give the students the answer. Keep your responses ${verbosity} and roughly ${sentences} sentences long.

When analyzing C++ or Arduino code, assume whitespace is syntactically irrelevant except in preprocessor directives, string literals, and explicit line continuations.
Do not cite whitespace as a cause of error unless one of those cases is present.
Compiler error messages are authoritative.

Sketch:
\`\`\`cpp
${String(code).slice(0, 4000)}
\`\`\`

Errors:
${(errors || []).map(e => `Line ${e?.line || 1}: ${e?.message || "Unknown error"}`).join("\n")}`
        : `You are a programming tutor. Explain clearly:

${language} code:
\`\`\`${language}
${String(code).slice(0, 4000)}
\`\`\`

Question:
${question}`;
  }

  if (!prompt.trim()) {
    clearInterval(ping);
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Prompt was empty. Check mode/question/instructions payload." })}\n\n`);
    res.end();
    return;
  }

  try {
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        temperature: Number(temperature) || 0,
        options: { num_predict: Math.max(16, Number(max_output_tokens) || 400) },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text().catch(() => "");
      throw new Error(`Ollama HTTP ${ollamaRes.status} ${ollamaRes.statusText} ${text}`);
    }
    if (!ollamaRes.body) throw new Error("No Ollama stream");

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (!aborted) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line) continue;

        let json;
        try {
          json = JSON.parse(line);
        } catch {
          buffer = line + "\n" + buffer; // partial JSON, wait for more
          break;
        }

        const token = json.message?.content;
        if (token) res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
      }
    }

    // Final flush of any remaining JSON
    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer);
        const token = json.message?.content;
        if (token) res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
      } catch {}
    }

    // End stream
    if (!aborted) {
      res.write(`event: done\ndata: {}\n\n`);
      clearInterval(ping);
      res.end();
    }
  } catch (err) {
    console.error("❌ Ollama streaming error:", err);
    clearInterval(ping);
    if (!aborted) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "AI request failed. Check server logs." })}\n\n`);
      res.end();
    }
  }
});

// ----------------------
// Start server (ONLY ONCE)
// ----------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log("  • GET  /health");
  console.log("  • POST /verify-arduino");
  console.log("  • POST /ai/help (streaming SSE)");
});

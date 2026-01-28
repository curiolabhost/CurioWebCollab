// server.js (CommonJS)
// npm i express cors openai
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");

// OpenAI (CommonJS-safe import)
const OpenAIModule = require("openai");
const OpenAI = OpenAIModule.default || OpenAIModule;

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
const ARDUINO_CLI = "arduino-cli";
const FQBN = "arduino:avr:uno";

// ----------------------
// Crash guards
// ----------------------
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));

// ----------------------
// Stub headers (safe strings)
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
    openaiKeyPresent: !!process.env.OPENAI_API_KEY,
    model: OPENAI_MODEL,
    time: new Date().toISOString(),
  });
});

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
// /ai/help
// - JSON by default (so normal fetch().json() won't spin forever)
// - SSE only if Accept: text/event-stream OR ?stream=1
// ----------------------
app.post("/ai/help", async (req, res) => {
  const {
    code = "",
    errors = [],
    mode = "arduino-verify",
    question = "",
    language = "cpp",
    verbosity = "brief",
    sentences = 3,
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

  const prompt =
    mode === "arduino-verify"
      ? `You are a friendly Arduino tutor. Explain these errors with hints only. Do NOT give the students the answer. Keep your responses ${verbosity} and roughly ${sentences} sentences long.

Sketch:
\`\`\`cpp
${String(code).slice(0, 4000)}
\`\`\`

Errors:
${(errors || []).map((e) => `Line ${e.line || 1}: ${e.message}`).join("\n")}`
      : `You are a programming tutor. Explain clearly:

${language} code:
\`\`\`${language}
${String(code).slice(0, 4000)}
\`\`\`

Question:
${question}`;

  const wantsSSE =
    (req.headers.accept || "").includes("text/event-stream") ||
    String(req.query.stream || "") === "1";

  // ---------- JSON mode (default) ----------
  if (!wantsSSE) {
    try {
      console.log("AI: JSON request -> calling OpenAI model:", OPENAI_MODEL);

      const r = await openai.responses.create({
        model: OPENAI_MODEL,
        input: [{ role: "user", content: prompt }],
        max_output_tokens: 350,
      });

      const text = (r.output_text && String(r.output_text)) || "";
      console.log("AI: OpenAI returned chars:", text.length);

      return res.json({ ok: true, text });
    } catch (err) {
      console.error("❌ AI: OpenAI JSON error:", err?.message || err);
      return res.status(500).json({
        ok: false,
        error: "OpenAI call failed",
        detail: err?.message || String(err),
      });
    }
  }

  // ---------- SSE mode (only if explicitly requested) ----------
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") res.flushHeaders();
  res.write(": keep-alive\n\n");

  let closed = false;
  const send = (eventName, payloadObj) => {
    if (closed) return;
    if (eventName) res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payloadObj)}\n\n`);
  };
  const done = () => {
    if (closed) return;
    closed = true;
    try {
      send("done", {});
      res.write(`data: [DONE]\n\n`);
    } catch {}
    try {
      res.end();
    } catch {}
  };

  const ping = setInterval(() => {
    if (closed) return;
    try {
      res.write(": ping\n\n");
    } catch {}
  }, 15000);

  const hardTimeout = setTimeout(() => {
    if (closed) return;
    send("error", { error: "AI request timed out." });
    done();
  }, 45000);

  req.on("close", () => {
    clearInterval(ping);
    clearTimeout(hardTimeout);
    done();
  });

  try {
    console.log("AI: SSE request -> calling OpenAI model:", OPENAI_MODEL);

    const stream = await openai.responses.create({
      model: OPENAI_MODEL,
      input: [{ role: "user", content: prompt }],
      stream: true,
      max_output_tokens: 350,
    });

    for await (const event of stream) {
      if (closed) break;

      if (event.type === "response.output_text.delta") {
        const token = event.delta || "";
        if (token) send("token", { token });
        continue;
      }

      if (
        event.type === "response.output_text.done" ||
        event.type === "response.completed" ||
        event.type === "response.failed" ||
        event.type === "response.incomplete"
      ) {
        break;
      }

      if (event.type === "error") {
        send("error", { error: event.error?.message || "AI request failed." });
        break;
      }
    }

    clearInterval(ping);
    clearTimeout(hardTimeout);
    done();
  } catch (err) {
    console.error("❌ AI: OpenAI SSE error:", err?.message || err);
    clearInterval(ping);
    clearTimeout(hardTimeout);
    send("error", { error: err?.message || "OpenAI call failed" });
    done();
  }
});

// ----------------------
// Start server
// ----------------------
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log("  • GET  /health");
  console.log("  • POST /verify-arduino");
  console.log("  • POST /ai/help (JSON default; SSE if Accept:text/event-stream or ?stream=1)");
});

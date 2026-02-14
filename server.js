
// server.js (CommonJS)
// npm i express cors
//
// Notes:
// - No OpenAI usage.
// - Adds /health.
// - Uses OLLAMA_HOST env var if present, defaults to localhost.
// - Uses ARDUINO_CLI env var if present, otherwise "arduino-cli" on PATH.  
// - Streams tokens from Ollama's /api/chat stream as JSON.

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

// Ollama
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";    
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

function headerExistsInArduinoLibraries(headerName) {
  try {
    // Arduino CLI stores libraries in ~/Arduino/libraries by default
    const userLibDir = path.join(os.homedir(), "Arduino", "libraries");
    if (!fs.existsSync(userLibDir)) return false;

    // Search recursively for the header
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

      console.log("---- ARDUINO STDERR BEGIN ----");
      console.log(String(stderr || "").slice(0, 8000));
      console.log("---- ARDUINO STDERR END ----");

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

// Ollama streaming:
app.post("/ai/help", async (req, res) => {
  console.log("🤖 POST /ai/help called");

  // Clear and set headers BEFORE any write
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8"); //  ✅ better MIME
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Transfer-Encoding", "chunked");
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  const ping = setInterval(() => {
    try { res.write(": ping\n"); } catch {}
  }, 15000);

  let aborted = false;
  req.on("close", () => {
    console.log("❌ Client disconnected");
    aborted = true;
    clearInterval(ping);
  });

  const {
    code = "",
    errors = [],
    mode = "arduino-verify",
    question = "",
    language = "cpp",
    verbosity = "brief",
    sentences = 3,
    temperature = 0.3,
    max_output_tokens = 400,
    instructions = null,
    userText = null,
  } = req.body || {};
  console.log("📝 Body parsed. Code length:", code?.length, "Mode:", mode); 
  console.log("📝 Received payload:", req.body);
  console.log("📝 Code:", code ? `"${code.substring(0, 50)}${code.length > 50 ? "..." : ""}"` : "(empty)");
  console.log("📝 Mode:", mode, typeof mode);
  console.log("✅ Full errors:", JSON.stringify(errors, null, 2));

  // ❗ Early validation — send clean JSON before starting stream
  if (!code?.trim() && !question?.trim()) {
    if (!aborted) {
      res.write(JSON.stringify({ error: "Missing 'code' or 'question'." }) + "\r\n");
      res.write(JSON.stringify({ done: true }) + "\r\n");
      res.end();
      console.log("📝 Early exit (no code).");
    }
    return;
  }

  // Build prompt (same as before)
  let prompt = "";
  if (instructions && userText) {
    prompt = `${instructions}\n${userText}`;
  } else {
    prompt = `You are a friendly Arduino tutor. Explain these errors with hints only. Do NOT give the students the answer. Keep your responses ${verbosity} and roughly ${sentences} sentences long.

Sketch:
\`\`\`cpp
${String(code).slice(0, 4000)}
\`\`\`

Errors:
${(errors || []).map(e => `Line ${e?.line || 1}: ${e?.message || "Unknown error"}`).join("\n")}

${language} code:
\`\`\`${language}
${String(code).slice(0, 4000)}
\`\`\`

Question:
${question}`;
  }
  console.log("📝 Prompt length:", prompt.length, "chars");
  console.log("📝 Prompt preview:", prompt.substring(0, 200));
  if (!prompt.trim()) {
    if (!aborted) {
      res.write(JSON.stringify({ error: "Prompt was empty." }) + "\r\n");   
      res.write(JSON.stringify({ done: true }) + "\r\n");
      res.end();
    }
    return;
  }
  console.log("📝 Calling Ollama at", `${OLLAMA_HOST}/api/generate`);
  try {
    console.log("📝 Got Ollama reader. Sending initial token...");

    // 1⃣ Ensure headers are flushed *first*
    if (!aborted && typeof res.flushHeaders === "function") {
      res.flushHeaders();
      console.log("✅ Headers flushed.");
    }

    // 2⃣ Small delay to let headers settle (critical!)
    await new Promise(resolve => setTimeout(resolve, 20)); // 20ms is enough

     // Don't send an initial token - let Ollama's first token be the first message
    console.log("✅ Headers flushed, waiting for Ollama...");
    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true, // ✅ critical
        temperature: Number(temperature) || 0,
        options: { num_predict: Math.max(16, Number(max_output_tokens) || 400) },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    console.log("📝 Ollama HTTP status:", ollamaRes.status, ollamaRes.ok);  
    if (!ollamaRes.ok) {
      const text = await ollamaRes.text().catch(() => "");
      console.error(`❌ Ollama HTTP ${ollamaRes.status}`, text);
      if (!aborted) {
        res.write(JSON.stringify({ error: `Ollama error: ${ollamaRes.status}` }) + "\r\n");
        res.write(JSON.stringify({ done: true }) + "\r\n");
        res.end();
      }
      return;
    }

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    while (!aborted) {
      const { value, done } = await reader.read();
      console.log("📝 Read chunk, done:", done, "len:", value?.length);     
      if (done) break;

      pending += decoder.decode(value, { stream: true });
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;

        let obj;
        try {
          obj = JSON.parse(line);
        } catch (e) {
          console.warn("⚠ Malformed Ollama chunk:", line);
          console.warn("error: ", e);
          continue;
        }
        const tokenChunk = JSON.stringify({ token: obj.message.content }) + "\n";
        console.log("📤 Chunk bytes:", Buffer.byteLength(tokenChunk), "content:", tokenChunk.substring(0, 50));
        if (obj.message?.content) {
          res.write(JSON.stringify({ token: obj.message.content }) + "\r\n");
        }

        if (obj.done === true) {
          res.write(JSON.stringify({ done: true }) + "\r\n");
          res.end(); // ✅ closes stream cleanly
          console.log("✅ AI stream complete");
          return;
        }
      }
   }

    // Fallback: if Ollama closes prematurely
    if (!aborted) {
      console.warn("⚠ Ollama stream ended early (unexpected EOF). Sending done.");
      res.write(JSON.stringify({ error: "Stream ended unexpectedly." }) + "\r\n");
      res.write(JSON.stringify({ done: true }) + "\r\n");
      res.end();
    }

  } catch (err) {
    console.error("❌ Server error in /ai/help:", err);
    if (!aborted) {
      res.write(JSON.stringify({ error: "Internal server error." }) + "\r\n");
      res.write(JSON.stringify({ done: true }) + "\r\n");
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
  console.log("  • POST /ai/help (streaming NDJSON)");
});
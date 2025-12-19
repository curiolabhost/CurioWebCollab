// server.js
// node server.js

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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn(
    "⚠️  OPENAI_API_KEY not found in .env.local. /ai/help and /api/blank-help will not work until you add it."
  );
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

// Path to your Arduino CLI exe
const ARDUINO_CLI = '"C:\\Users\\emily\\arduino-cli.exe"';
const FQBN = "arduino:avr:uno";

// ----------------------
// Library stubs for syntax-only verification
// ----------------------
// Goal: If a student correctly includes a common third-party header (spelled correctly),
// do NOT fail verification just because the server doesn't have that library installed.
// Instead, provide a minimal stub header so compilation can proceed and surface real
// syntax/logic errors. If the include is misspelled or missing, compilation should fail.

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

  // Matches:
  // fatal error: Adafruit_SSD1306.h: No such file or directory
  const m1 = s.match(/fatal error:\s*([A-Za-z0-9_.-]+\.h)\s*:\s*No such file/i);
  if (m1) return m1[1];

  // Matches:
  // Adafruit_SSD1306.h: No such file or directory
  const m2 = s.match(/([A-Za-z0-9_.-]+\.h)\s*:\s*No such file/i);
  if (m2) return m2[1];

  return null;
}

// Clean up noisy Windows temp paths so students just see "Sketch.ino"
function cleanArduinoStderr(text) {
  if (!text) return "";

  return (
    text
      // C:\Users\emily\AppData\Local\Temp\arduino-verify-XXXX\Sketch\Sketch.ino
      .replace(
        /C:\\Users\\[^\\]+\\AppData\\Local\\Temp\\[^\\]+\\Sketch\\Sketch\.ino/gi,
        "Sketch.ino"
      )
      // Any other C:\Users\...\Sketch\Sketch.ino patterns
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

// ----------------------
// Error normalization (make missing-header messages student-friendly)
// ----------------------

function normalizeArduinoDiagnostics({ errors, rawStderr }) {
  const stderrLines = (rawStderr || "").split("\n");
  const notices = [];

  // If the compiler reports a missing header, keep it as an error (actionable),
  // but rewrite into a clearer student-facing message.
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

  // Also rewrite rawStderr a bit (optional)
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

  return { errors: rewrittenErrors, rawStderr: rewrittenStderr, notices };
}



/* ==========================================================
   AI BLANK-HELP HELPERS (for /api/blank-help)
========================================================== */

/* ==========================================================
   AI BLANK-HELP HELPERS (for /api/blank-help)
========================================================== */

/**
 * Normalize difficulty mode. If the caller does not specify a mode,
 * we infer it from hintLevel (1 = gentle_nudge, 2 = conceptual_explanation, 3 = analogy_based).
 */
function normalizeMode(mode, hintLevel) {
  const valid = ["gentle_nudge", "conceptual_explanation", "analogy_based"];

  // If caller explicitly passed a valid mode, honor it
  if (valid.includes(mode)) {
    return mode;
  }

  // Otherwise, infer from hintLevel (1–3)
  if (typeof hintLevel === "number") {
    if (hintLevel <= 1) return "gentle_nudge";
    if (hintLevel === 2) return "conceptual_explanation";
    return "analogy_based";
  }

  // Fallback
  return "gentle_nudge";
}

/**
 * Build OpenAI messages for the blank-help endpoint.
 *
 * Expects body:
 * {
 *   lessonId,
 *   title,
 *   description,
 *   codeSnippet,          // raw code with __BLANK[...]__ + ^^ markers
 *   filledCodeSnippet?,   
 *   hintLevel?: 1 | 2 | 3,
 *   blank: {
 *     name: string,
 *     studentAnswer: string,
 *     rule: any,
 *     allBlanks: Record<string,string>,
 *     previousHint?: string   // <— last explanation shown in the UI for this blank
 *   },
 *   mode?: "gentle_nudge" | "conceptual_explanation" | "analogy_based"
 * }
 */
function buildBlankHelpMessages(body) {
  const mode = normalizeMode(body.mode, body.hintLevel);
  const { lessonId, title, description, codeSnippet, blank, allBlanks } = body;
  const previousHint = blank?.previousHint || null;

  const baseSystem = `
You are an AI assistant helping beginners learn Arduino/C-style coding using fill-in-the-blank code.
- Be kind, encouraging, and concrete.
- Do NOT give the final answer or exact code for the blank.
- Explicitly reference the student's current answer at least once.
- Assume middle/high school beginners.
- Respond with a single JSON object: { "explanation": "..." }.
`;

  let modeExtra = "";
  if (mode === "gentle_nudge") {
    modeExtra = `
HINT LEVEL: gentle_nudge
- Give a short, light nudge.
- Point out *one* thing to re-check or rethink.
- Do NOT explain the full concept.
`;
  } else if (mode === "conceptual_explanation") {
    modeExtra = `
HINT LEVEL: conceptual_explanation
- Explain the underlying concept that matters for this blank.
- Connect the concept back to the student's current answer.
- Keep it concise, but more detailed than a gentle nudge.
`;
  } else if (mode === "analogy_based") {
    modeExtra = `
HINT LEVEL: analogy_based
- Explain the idea using an analogy from everyday life.
- Then clearly map the analogy back to what needs to change in the code.
`;
  }

  // Strong anti-repeat instructions:
  const antiRepeat = previousHint
    ? `
You previously gave this hint for the same blank:

"${previousHint}"

Your NEW explanation MUST:
- Introduce at least one NEW idea or angle that is not in the previous hint.
- NOT reuse the same sentences or bullet structure.
- Focus on a different aspect (e.g., different part of the line, different reason it is wrong, or a different way to look at the same concept).
`
    : `
This is the FIRST hint for this blank.
Give the student an initial nudge, not a full solution.
`;

  const systemContent = baseSystem + modeExtra + antiRepeat;

  const userContent = JSON.stringify(
    {
      lessonId,
      lessonTitle: title,
      lessonDescription: description,
      codeSnippet,
      blank,
      allBlanks,
    },
    null,
    2
  );

  const messages = [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];

  // 🔥 EXTRA: also give the previous hint as an assistant message, so the model "sees" its own text
  if (previousHint) {
    messages.push({
      role: "assistant",
      content: JSON.stringify({ explanation: previousHint }),
    });

    messages.push({
      role: "user",
      content:
        "Please give a NEW, different hint that follows the system instructions and does not repeat the previous one.",
    });
  }

  return messages;
}



/* ==========================================================
   /verify-arduino
========================================================== */

/**
 * POST /verify-arduino
 * Body: { code: string }
 *
 * - Writes code to a temporary Sketch.ino
 * - Runs: arduino-cli compile --fqbn arduino:avr:uno <sketchDir>
 * - Returns:
 *   { ok: true, errors: [], rawStdout, rawStderr }  on success
 *   { ok: false, errors: [...], rawStdout, rawStderr } on failure
 */
app.post("/verify-arduino", (req, res) => {
  const { code } = req.body || {};
  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'code'." });
  }

  try {
    // 1) Create a temp dir for this compile
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "arduino-verify-"));
    const sketchDir = path.join(tmpRoot, "Sketch");
    fs.mkdirSync(sketchDir);

    // 2) Write Sketch.ino
    const sketchPath = path.join(sketchDir, "Sketch.ino");
    fs.writeFileSync(sketchPath, code, "utf8");

    // 2b) Create stub headers directory and write stubs for any correctly-included third-party libs
    const stubDir = path.join(tmpRoot, "stubs");
    fs.mkdirSync(stubDir);
    const stubbedHeaders = ensureStubHeadersForIncludes(code, stubDir);


    // 3) Build CLI command
    const cmd = `${ARDUINO_CLI} compile --fqbn ${FQBN} --build-property compiler.cpp.extra_flags="-I${stubDir}" --build-property compiler.c.extra_flags="-I${stubDir}" "${sketchDir}"`;
    console.log("🔧 Running:", cmd);

    exec(cmd, { timeout: 20000 }, (error, stdout, stderr) => {
      console.log("📤 stdout:");
      console.log(stdout);
      console.log("📥 stderr:");
      console.log(stderr);

      // 🔹 Clean the stderr so it doesn't show long temp paths
      const cleanedStderr = cleanArduinoStderr(stderr?.toString() || "");

      if (!error) {
        // Successful compile
        return res.json({
          ok: true,
          errors: [],
          rawStdout: stdout,
          rawStderr: cleanedStderr,
          notices: [],
        });
      }

      // Parse stderr into structured errors
      const errors = [];
      const lines = cleanedStderr.split("\n");

      // Expected format from arduino-cli:
      // Sketch.ino:7:3: error: 'foo' was not declared in this scope
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
          message:
            "Compilation failed, but the error format was unexpected. Check compiler output.",
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

/* ==========================================================
   /ai/help  (existing code-editor helper)
========================================================== */

/**
 * POST /ai/help
 *  mode: "arduino-verify" or "generic-code-help"
 *
 * For mode "arduino-verify":
 *   body: { mode: "arduino-verify", code: string, errors: Array<{line,column,message}> }
 *
 * For mode "generic-code-help":
 *   body: { mode: "generic-code-help", code: string, language?: string, question: string }
 */
app.post("/ai/help", async (req, res) => {
  if (!openai) {
    return res.status(500).json({
      ok: false,
      error:
        "OPENAI_API_KEY is missing. Add it to .env.local as OPENAI_API_KEY=your_key_here.",
    });
  }

  const { mode, code, errors, language, question } = req.body || {};
  if (!mode) {
    return res.status(400).json({ ok: false, error: "Missing 'mode' in body." });
  }

  let systemPrompt = "";
  let userPrompt = "";

  if (mode === "arduino-verify") {
    if (
      typeof code !== "string" ||
      !Array.isArray(errors) ||
      errors.length === 0
    ) {
      return res.status(400).json({
        ok: false,
        error:
          "For mode 'arduino-verify', provide 'code' (string) and 'errors' (non-empty array).",
      });
    }

    const errorSummary = errors
      .map((e) => `Line ${e.line}, Column ${e.column || 1}: ${e.message}`)
      .join("\n");

    systemPrompt = `
You are a friendly Arduino tutor for beginners (middle school / early high school).
You receive:
1) The full Arduino sketch
2) A list of compiler errors with line numbers

Your job:
- Explain in simple, friendly language what went wrong.
- Reference specific line numbers when helpful.
- Give 1–2 hints for how to fix each issue, but do NOT just paste the full corrected code.
- Avoid heavy jargon, or explain it briefly when needed.
`;

    userPrompt = `
Here is the student's Arduino sketch:

\`\`\`cpp
${code}
\`\`\`

Here are the compiler errors:

${errorSummary}

Please:
1. Briefly describe the main problems in plain English.
2. For each error, explain what it means in beginner-friendly language.
3. Give 1–2 hints the student can try to fix it, without writing the entire final solution.
`;
  } else if (mode === "generic-code-help") {
    if (typeof code !== "string" || typeof question !== "string") {
      return res.status(400).json({
        ok: false,
        error:
          "For mode 'generic-code-help', provide 'code' (string) and 'question' (string).",
      });
    }

    const langLabel = language || "code";

    systemPrompt = `
You are a helpful programming tutor.
You receive:
1) A code snippet
2) A natural-language question

Your job:
- Explain concepts in clear, beginner-friendly language.
- Point out likely issues or misconceptions.
- Suggest 1–2 concrete ideas to try, but do NOT just dump a full solution.
`;

    userPrompt = `
Here is the ${langLabel}:

\`\`\`${langLabel}
${code}
\`\`\`

Student's question:
"${question}"

Please explain what's going on and offer practical, beginner-friendly guidance.
`;
  } else {
    return res.status(400).json({
      ok: false,
      error: `Unknown mode '${mode}'. Use 'arduino-verify' or 'generic-code-help'.`,
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 700,
    });

    const explanation =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I couldn't generate an explanation this time.";

    return res.json({ ok: true, explanation });
  } catch (err) {
    console.error("❌ OpenAI error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to get explanation from OpenAI." });
  }
});

/* ==========================================================
   /api/blank-help  (code-blank AI helper for CurioLab)
========================================================== */

/**
 * POST /api/blank-help
 *
 * body:
 * {
 *   lessonId,
 *   title?,
 *   description?,
 *   codeSnippet?,        // raw code with __BLANK[...]__ and ^^ highlights
 *   filledCodeSnippet?,  // optional: code with student's answers inserted
 *   hintLevel?: 1 | 2 | 3,
 *   blank: {
 *     name: string,
 *     studentAnswer: string,
 *     rule: any,
 *     allBlanks: Record<string,string>
 *   },
 *   mode?: "gentle_nudge" | "conceptual_explanation" | "analogy_based"
 * }
 *
 * response:
 *   { explanation: string }
 */
/* ==========================================================
   /api/blank-help  (code-blank AI helper for CurioLab)
========================================================== */

app.post("/api/blank-help", async (req, res) => {
  if (!openai) {
    return res.status(500).json({
      explanation:
        "OPENAI_API_KEY is missing. Add it to .env.local as OPENAI_API_KEY=your_key_here.",
    });
  }

  const body = req.body || {};

  if (!body.blank || !body.blank.name) {
    return res.status(400).json({
      explanation:
        "Missing 'blank' data (name, studentAnswer, rule, allBlanks).",
    });
  }

  try {
    const messages = buildBlankHelpMessages(body);

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      response_format: { type: "json_object" },
      max_tokens: 250,
      temperature: 0.4,
    });

    const raw = completion.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback if model returns plain text instead of JSON
      parsed = { explanation: String(raw || "").trim() };
    }

    const explanation =
      typeof parsed.explanation === "string" &&
      parsed.explanation.trim().length > 0
        ? parsed.explanation.trim()
        : "Something went wrong generating a hint. Try checking your answer again or adjusting it slightly.";

    return res.json({ explanation });
  } catch (err) {
    console.error("❌ /api/blank-help error:", err);
    return res.status(500).json({
      explanation:
        "I had trouble generating a hint right now. Please try again in a moment.",
    });
  }
});


/* ==========================================================
   /api/blank-analytics  (simple event logger)
========================================================== */

const ANALYTICS_LOG_PATH = path.join(__dirname, "data", "blank_analytics.log");

app.post("/api/blank-analytics", (req, res) => {
  const event = req.body || {};

  // add a userId or sessionId here later 
  const enriched = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  try {
    fs.mkdirSync(path.dirname(ANALYTICS_LOG_PATH), { recursive: true });
    fs.appendFileSync(
      ANALYTICS_LOG_PATH,
      JSON.stringify(enriched) + "\n",
      "utf8"
    );
  } catch (err) {
    console.error("❌ /api/blank-analytics log error:", err);
    // Don't block the app if logging fails; just return ok:false
    return res.status(500).json({ ok: false });
  }

  return res.json({ ok: true });
});

/* ==========================================================
   /api/progress-summary (simple per-blank summary)
   - Optional query: ?stepId=...
========================================================== */

app.get("/api/progress-summary", (req, res) => {
  const { stepId, analyticsTag } = req.query;

  let lines;
  try {
    const raw = fs.readFileSync(ANALYTICS_LOG_PATH, "utf8");
    lines = raw.split("\n").filter(Boolean);
  } catch (err) {
    return res.json({ ok: true, stepId: stepId || null, statsByBlank: {} });
  }

  const statsByBlank = {};

  for (const line of lines) {
    let evt;
    try {
      evt = JSON.parse(line);
    } catch {
      continue;
    }

    if (stepId && evt.stepId && evt.stepId !== stepId) continue;

    // CHECK_BLANKS events with blanks[]
    if (evt.type === "CHECK_BLANKS" && Array.isArray(evt.blanks)) {
      evt.blanks.forEach((b) => {
        const name = b.name;
        if (!name) return;

        if (!statsByBlank[name]) {
          statsByBlank[name] = {
            difficulty: b.difficulty || null,
            checkEvents: 0,
            correctCount: 0,
            totalWrongAttempts: 0,
            hintCount: 0,
          };
        }

        const stat = statsByBlank[name];

        if (!stat.difficulty && b.difficulty) {
          stat.difficulty = b.difficulty;
        }

        stat.checkEvents += 1;
        if (b.isCorrect) stat.correctCount += 1;

        const attempts = Number(b.attemptsForThisBlank || 0);
        stat.totalWrongAttempts += attempts;
      });
    }

    // AI_HINT events with blankName
    if (evt.type === "AI_HINT" && evt.blankName) {
      const name = evt.blankName;

      if (!statsByBlank[name]) {
        statsByBlank[name] = {
          difficulty: evt.difficulty || null,
          checkEvents: 0,
          correctCount: 0,
          totalWrongAttempts: 0,
          hintCount: 0,
        };
      }

      const stat = statsByBlank[name];

      if (!stat.difficulty && evt.difficulty) {
        stat.difficulty = evt.difficulty;
      }

      stat.hintCount += 1;
    }
  }

  const result = {};
  Object.entries(statsByBlank).forEach(([name, stat]) => {
    const { difficulty, checkEvents, correctCount, totalWrongAttempts, hintCount } =
      stat;

    const accuracy =
      checkEvents > 0 ? Math.round((correctCount / checkEvents) * 100) : null;

    const avgWrongAttempts =
      checkEvents > 0
        ? Number((totalWrongAttempts / checkEvents).toFixed(2))
        : null;

    result[name] = {
      difficulty,
      checkEvents,
      correctCount,
      hintCount,
      totalWrongAttempts,
      accuracy,
      avgWrongAttempts,
    };
  });

  return res.json({ ok: true, stepId: stepId || null, analyticsTag: analyticsTag || null, statsByBlank: result });
});


/* ==========================================================
   Simple analytics page (static HTML)
========================================================== */

app.get("/analytics", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "analytics.html"));
});


/* ==========================================================
   START SERVER
========================================================== */

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log("  • POST /verify-arduino");
  console.log("  • POST /ai/help");
  console.log("  • POST /api/blank-help");
  console.log("  • POST /api/blank-analytics");
  console.log("  • GET  /api/progress-summary");
});

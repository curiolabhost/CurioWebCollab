import OpenAI from "openai";

export const runtime = "nodejs";

function sseEvent(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function buildPopupInstructions() {
  return [
    "You help debug Arduino/C++ compile errors.",
    "This is an INLINE popup for ultra-fast local debugging.",
    "",
    "Output format:",
    "- EXACTLY ONE sentence.",
    "- Include BOTH the cause and the location in the same sentence.",
    '- Example: "Spelling error for INPU at line 3."',
    "",
    "Rules:",
    "- Max 20 words.",
    "- No line breaks.",
    "- No code blocks.",
    "- No solution steps.",
    "- Do NOT tell the user what to type or change.",
    "- Avoid compiler jargon like \"undeclared identifier\" unless unavoidable.",
    "- Prefer human wording: spelling error, missing semicolon, wrong type, unmatched brace, etc.",
    "- Be concrete: include line number and symbol when possible.",
  ].join("\n");
}

function buildPopupMoreInstructions() {
  return [
    "You help debug Arduino/C++ compile errors.",
    "This is the INLINE popup 'Explain more' button.",
    "",
    "Output format:",
    "- 1–2 short sentences.",
    "- Must include location (line number) and the symbol when possible.",
    "",
    "Goal:",
    "- Give an actionable fix hint (allowed): e.g., \"Did you mean INPUT?\"",
    "- You may suggest the correct spelling or the intended Arduino keyword/function name.",
    "- Do NOT include code blocks or full rewritten code.",
    "",
    "Rules:",
    "- Keep it under 35 words.",
    "- No line breaks.",
    "- No filler.",
  ].join("\n");
}

function buildPopupLessonInstructions() {
  return [
    "You help debug Arduino/C++ compile errors.",
    "This is the INLINE popup 'Open full help' button.",
    "",
    "Output format:",
    "- 3–5 sentences.",
    "- Explain why the compiler throws this error in general, and tie it to this specific case.",
    "- Mention the location (line number) and the symbol/token when possible.",
    "",
    "Rules:",
    "- No code blocks.",
    "- No long lecture; keep it light and focused.",
  ].join("\n");
}

function buildVerifyInstructions(sentences: number, verbosity: string) {
  return [
    "You are an expert Arduino/C++ tutor helping a student debug code.",
    "Be concise, practical, and specific.",
    "Explain the *cause* of each error and where it is in the code.",
    "If describing a fix, keep it high-level; avoid writing exact corrected code unless explicitly asked.",
    `Target length: about ${sentences} sentences. Verbosity: ${verbosity}.`,
    "Avoid filler. Do not mention internal policies.",
  ].join("\n");
}

function buildProjectCoachInstructions(sentences: number, verbosity: string) {
  return [
    "You are an Arduino/C++ project coach.",
    "Return ONLY valid JSON. No markdown. No extra text.",
    "The response MUST be valid json.",
    "",
    "JSON schema (must match exactly):",
    "{",
    '  "summary": string,',
    '  "hasErrors": boolean,',
    '  "sections": [',
    '    { "title": string, "items": [',
    '      { "tag": "WARN"|"TIP"|"NEXT"|"IDEA", "line": number|null, "text": string, "why": string, "recommendation": string, "code": string|null }',
    "    ] }",
    "  ]",
    "}",
    "",
    "Rules:",
    `- Target ${sentences} to ${sentences + 6} items total. Verbosity: ${verbosity}.`,
    "- If compiler errors are provided, set hasErrors=true and include an 'Errors' section first.",
    "- If no errors:",
    "  - If the code is too minimal to infer intent, include ONLY an 'Ideas' section with 1 item explaining there isn't enough yet.",
    "  - Otherwise include sections like 'Improvements', 'Next steps', 'Ideas'.",
    "- NEVER include [OK] items. Do not use the OK tag at all.",
    "- 'line' should be the error line number if relevant, else null.",
    "- 'code' is optional and must be a SHORT snippet (max ~6 lines) or null.",
    "- Never output code fences. Never output markdown.",
  ].join("\n");
}

function buildBlankHelpInstructions(hintStyle: string, hintLevel: number) {
  return [
    "You are helping a student fill in ONE missing blank in an Arduino/C++ learning exercise.",
    "",
    "Hard rules:",
    "- Do NOT reveal internal blank names or identifiers.",
    '- Always refer to it as "the blank".',
    "- Do NOT output code blocks.",
    "- Keep it short and helpful.",
    "",
    "Hint style:",
    hintStyle === "gentle_nudge"
      ? "- Give a gentle nudge: point them to the concept and what to re-check."
      : hintStyle === "conceptual_explanation"
      ? "- Give a conceptual explanation: explain what this blank represents and how to reason to the answer."
      : "- Use a simple analogy to make the concept click, then guide them back to the blank.",
    "",
    `This is hint level ${hintLevel} (higher level = a bit more explicit).`,
    "",
    "Output format:",
    "- 3–6 sentences.",
    "- Mention what the blank is supposed to represent.",
    "- If the student's answer is wrong, explain WHY it's wrong and what kind of thing belongs there (without giving an exact final string if avoidable).",
  ].join("\n");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(sseEvent("error", { error: "Missing API KEY on server." }), {
      status: 500,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const {
    mode = "arduino-verify",
    code = "",
    errors = [],
    sentences = 3,
    verbosity = "brief",

    // blank-help extras
    blank = null,
    hintStyle = "gentle_nudge",
    hintLevel = 1,

    lessonId = null,
    title = null,
    description = null,
    codeSnippet = null,
  } = body ?? {};

  const modeNorm = String(mode).trim().toLowerCase();

  const instructions =
    modeNorm === "popup"
      ? buildPopupInstructions()
      : modeNorm === "popup-more"
      ? buildPopupMoreInstructions()
      : modeNorm === "popup-lesson"
      ? buildPopupLessonInstructions()
      : modeNorm === "project-coach"
      ? buildProjectCoachInstructions(Number(sentences) || 8, String(verbosity || "brief"))
      : modeNorm === "blank-help"
      ? buildBlankHelpInstructions(String(hintStyle || "gentle_nudge"), Number(hintLevel) || 1)
      : buildVerifyInstructions(Number(sentences) || 3, String(verbosity || "brief"));

  // Build user text (include the word "json" explicitly when we request json_object format)
  let userText =
    `Mode: ${modeNorm}\n\n` +
    `Compiler errors (if any):\n${JSON.stringify(errors, null, 2)}\n\n` +
    `Code:\n${code}`;

  if (modeNorm === "blank-help") {
    const safeBlank = blank
      ? {
          displayName: blank.displayName || "blank",
          studentAnswer: blank.studentAnswer ?? "",
          rule: blank.rule ?? null,
          previousHint: blank.previousHint ?? null,
        }
      : null;

    userText =
      `Mode: blank-help\n\n` +
      `Lesson context:\n${JSON.stringify({ lessonId, title, description }, null, 2)}\n\n` +
      `Code snippet:\n${codeSnippet || code}\n\n` +
      `Blank context (do not reveal internal names):\n${JSON.stringify(safeBlank, null, 2)}\n`;
  }

  if (modeNorm === "project-coach") {
    userText =
      `Mode: project-coach\n` +
      `You must output valid json.\n\n` +
      `Compiler errors (if any):\n${JSON.stringify(errors, null, 2)}\n\n` +
      `Code:\n${code}`;
  }

  console.log("[AI HELP] mode =", modeNorm, "sentences =", sentences, "verbosity =", verbosity);

  const encoder = new TextEncoder();

  const max_output_tokens =
    modeNorm === "popup"
      ? 80
      : modeNorm === "popup-more"
      ? 220
      : modeNorm === "popup-lesson"
      ? 520
      : modeNorm === "blank-help"
      ? 450
      : modeNorm === "project-coach"
      ? 1100
      : 450;

  const temperature =
    modeNorm === "popup"
      ? 0.2
      : modeNorm === "popup-more"
      ? 0.3
      : modeNorm === "popup-lesson"
      ? 0.4
      : modeNorm === "blank-help"
      ? 0.35
      : 0.4;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const createArgs: any = {
          model,
          instructions,
          input: [{ role: "user", content: userText }],
          stream: true,
          temperature,
          max_output_tokens,
        };

        // If project-coach, force JSON object output via Responses API
        if (modeNorm === "project-coach") {
          createArgs.text = { format: { type: "json_object" } };
        }

        const openaiStream = await client.responses.create(createArgs);

        for await (const event of openaiStream as any) {
          if (event.type === "response.output_text.delta") {
            const delta = event.delta ?? "";
            if (delta) controller.enqueue(encoder.encode(sseEvent("token", { token: delta })));
          }

          if (event.type === "response.completed") {
            controller.enqueue(encoder.encode(sseEvent("done", { ok: true })));
          }

          if (event.type === "response.failed" || event.type === "error") {
            const msg = event?.error?.message || event?.message || "AI request failed.";
            controller.enqueue(encoder.encode(sseEvent("error", { error: msg })));
            controller.enqueue(encoder.encode(sseEvent("done", { ok: false })));
          }
        }

        controller.close();
      } catch (err: any) {
        const msg = err?.message || "AI request crashed.";
        controller.enqueue(encoder.encode(sseEvent("error", { error: msg })));
        controller.enqueue(encoder.encode(sseEvent("done", { ok: false })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

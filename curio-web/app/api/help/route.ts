import OpenAI from "openai";

export const runtime = "nodejs";

function sseEvent(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function buildPopupInstructions() {
  return [
    "You help debug Arduino/C++ compile errors.",
    "This is an INLINE popup for ultra-fast local debugging.",

    "Output format:",
    "- EXACTLY ONE sentence.",
    "- Include BOTH the cause and the location in the same sentence.",
    '- Example: "Spelling error for INPU at line 3."',

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

    "Output format:",
    "- 1–2 short sentences.",
    "- Must include location (line number) and the symbol when possible.",

    "Goal:",
    "- Give an actionable fix hint (allowed): e.g., \"Did you mean INPUT?\"",
    "- You may suggest the correct spelling or the intended Arduino keyword/function name.",
    "- Do NOT include code blocks or full rewritten code.",

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

    "Output format:",
    "- 3–5 sentences.",
    "- Explain why the compiler throws this error in general, and tie it to this specific case.",
    "- Mention the location (line number) and the symbol/token when possible.",

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
    "Return ONLY valid json. No markdown. No extra text.",

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
    "Core rules:",
    "- If compiler errors are provided: hasErrors=true and include an 'Errors' section FIRST.",
    "- If NO compiler errors: hasErrors=false and DO NOT output any items with tag 'OK'. (No OK lines at all.)",
    "- When hasErrors=false, tags allowed are only: TIP, NEXT, IDEA, WARN (rare).",
    "- 'line' must be the relevant line number when you can point to a specific spot, otherwise null.",
    "- 'code' is optional and must be a SHORT snippet (max ~6 lines) or null.",
    "- Never output code fences. Never output markdown.",

    "",
    "Minimal-code rule (very important):",
    "- If the code is too short or only basic setup (e.g., empty loop, only pinMode, only boilerplate) and there is not enough context to infer the project goal:",
    '  - Return EXACTLY ONE section titled "Ideas".',
    "  - That section must contain EXACTLY ONE item:",
    '    - tag: "IDEA"',
    '    - line: null',
    '    - text: a short statement that there is not enough implemented yet to give meaningful project/logic suggestions.',
    '    - why: explain what information is missing (goal, inputs, outputs, behavior).',
    '    - recommendation: suggest 2–4 concrete next actions to add meaningful structure (e.g., define goal, pick inputs/outputs, add a state variable, add one behavior in loop).',
    "    - code: null",
    "- In this minimal-code case, DO NOT add any other items (no TIP/NEXT beyond that one IDEA item).",

    "",
    "Non-minimal code rule:",
    "- If there is enough code to understand intent, provide useful project/structural/logic suggestions.",
    "- Organize sections like: 'Improvements', 'Next steps', 'Ideas'.",
    `- Target ${sentences} to ${sentences + 6} items total (unless minimal-code rule triggers). Verbosity: ${verbosity}.`,

    "",
    "Error-detail rule (when hasErrors=true):",
    "- Each error item must be detailed:",
    "- text: start with 'Line N:' then describe what is wrong.",
    "- 1–2 sentences explaining why the compiler/runtime complains.",
    "- recommendation: 2–4 sentences describing the recommended fix at a high level.",
    "- code: include a short snippet around the line if helpful (max ~6 lines).",
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
      : buildVerifyInstructions(Number(sentences) || 3, String(verbosity || "brief"));

const wantsJson = modeNorm === "project-coach";

const userText =
  (wantsJson ? "Respond in json.\n\n" : "") + // required keyword for json_object
  `Mode: ${modeNorm}\n\n` +
  `Compiler errors (if any):\n${JSON.stringify(errors, null, 2)}\n\n` +
  `Code:\n${code}`;


  console.log("[AI HELP] mode =", modeNorm, "sentences =", sentences, "verbosity =", verbosity);

  const encoder = new TextEncoder();

  const max_output_tokens =
    modeNorm === "popup" ? 80 :
    modeNorm === "popup-more" ? 220 :
    modeNorm === "popup-lesson" ? 520 :
    modeNorm === "project-coach" ? 1200 :
    450;

  const temperature =
    modeNorm === "popup" ? 0.2 :
    modeNorm === "popup-more" ? 0.3 :
    modeNorm === "popup-lesson" ? 0.4 :
    modeNorm === "project-coach" ? 0.2 :
    0.4;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const openaiStream = await client.responses.create({
          model,
          instructions,
          input: [{ role: "user", content: userText }],
          stream: true,
          temperature,
          max_output_tokens,

          // forces valid JSON output for project-coach
          ...(wantsJson ? { text: { format: { type: "json_object" } } } : {}),
        });

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

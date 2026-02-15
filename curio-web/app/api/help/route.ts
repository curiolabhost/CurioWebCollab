//Fixing for using Open AI (final)

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
    '- Avoid compiler jargon like "undeclared identifier" unless unavoidable.',
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
    '- Give an actionable fix hint (allowed): e.g., "Did you mean INPUT?"',
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
    "Use Markdown, but keep it short (no code blocks).",
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

    "Format your response in Markdown:",
"- Use short headings if helpful (e.g., 'What happened', 'How to fix').",
"- Use bullet points for multiple errors.",
"- Use inline code for tokens/identifiers (like `pinMode`).",
"Do NOT use fenced code blocks unless you are showing a tiny snippet.",
  ].join("\n");
}

function buildProjectCoachInstructions(sentences: number, verbosity: string) {
  return [
    "You are an Arduino/C++ project coach.",
    "You MUST output NDJSON (JSON Lines): one JSON object per line.",
    "NO markdown. NO backticks. NO extra text. NO surrounding array/object.",
    "",
    "CRITICAL FORMAT RULES:",
    "- Each JSON object must be on ONE physical line.",
    "- Do NOT include real newline characters inside any string values.",
    "  If you need line breaks inside a string, write '\\\\n' (escaped).",
    "- Every line must be valid JSON by itself.",
    "",
    "Allowed line shapes ONLY:",
    `{"type":"summary","summary":string,"hasErrors":boolean}`,
    `{"type":"section","title":string}`,
    `{"type":"item","tag":"WARN"|"TIP"|"NEXT"|"IDEA","line":number|null,"text":string,"why":string,"recommendation":string,"code":string|null}`,
    `{"type":"done"}`,
    "",
    "ORDER REQUIREMENTS:",
    "1) First line MUST be summary.",
    "2) Then emit sections in this order when applicable:",
    "   - 'Errors' (only if compiler errors exist)",
    "   - 'Fix now' (highest impact actions)",
    "   - 'Improve' (readability/structure)",
    "   - 'Next steps' (optional)",
    "3) After each section line, emit its item lines.",
    "4) Final line MUST be {\"type\":\"done\"} and then stop.",
    "",
    "CONTENT RULES FOR EACH ITEM:",
    "- tag meanings:",
    "  WARN = must fix / likely breaks compile or behavior",
    "  TIP  = helpful improvement",
    "  NEXT = suggested next action",
    "  IDEA = optional enhancement",
    "- line: use a number ONLY if clearly supported by the compiler error list; otherwise null.",
    "- text: one short statement of the issue/opportunity (<= 90 chars).",
    "- why: 1 short sentence explaining impact/cause (<= 140 chars). Do NOT start with 'Why' or 'Because'.",
    "- recommendation: 1 short action sentence (<= 140 chars). Start with a verb.",
    "- code: either null OR a tiny snippet <= 6 lines. If included, it must be plain text (not fenced).",
    "",
    `TARGET: ${sentences} to ${sentences + 6} total items. Verbosity: ${verbosity}.`,
    "Be specific. Avoid filler. Never invent libraries or hardware the user didn’t mention.",
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
    return new Response(sseEvent("error", { error: "Missing OPENAI_API_KEY on server." }) + sseEvent("done", { ok: false }), {
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

  const max_output_tokens =
    modeNorm === "popup" ? 80
    : modeNorm === "popup-more" ? 220
    : modeNorm === "popup-lesson" ? 520
    : modeNorm === "blank-help" ? 450
    : modeNorm === "project-coach" ? 1100
    : 450;

  const temperature =
    modeNorm === "popup" ? 0.2
    : modeNorm === "popup-more" ? 0.3
    : modeNorm === "popup-lesson" ? 0.4
    : modeNorm === "blank-help" ? 0.35
    : 0.4;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const createArgs: any = {
          model,
          instructions,
          stream: true,
          temperature,
          max_output_tokens,
          input: [
            {
              role: "user",
              content: [{ type: "input_text", text: userText }],
            },
          ],
        };

        // Force a JSON object for project-coach
        const openaiStream = await client.responses.create(createArgs);

        for await (const event of openaiStream as any) {
          if (event?.type === "response.output_text.delta") {
            const delta = event.delta ?? "";
            if (delta) controller.enqueue(encoder.encode(sseEvent("token", { token: delta })));
            continue;
          }

          if (event?.type === "response.output_text.done") {
            // IMPORTANT:
            // Don't emit the final text again, because we've already streamed deltas.
            continue;
          }

          if (event?.type === "response.completed") {
            controller.enqueue(encoder.encode(sseEvent("done", { ok: true })));
            break;
          }

          if (event?.type === "response.failed" || event?.type === "error") {
            const msg = event?.error?.message || event?.message || "AI request failed.";
            controller.enqueue(encoder.encode(sseEvent("error", { error: msg })));
            controller.enqueue(encoder.encode(sseEvent("done", { ok: false })));
            break;
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
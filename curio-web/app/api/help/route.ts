import OpenAI from "openai";

export const runtime = "nodejs"; // important for streaming + node APIs

type VerifyError = { line?: number; message?: string };

function buildPrompt(opts: {
  code?: string;
  errors?: VerifyError[];
  verbosity?: string;
  sentences?: number;
}) {
  const code = (opts.code ?? "").slice(0, 4000);
  const errors = opts.errors ?? [];
  const verbosity = opts.verbosity ?? "brief";
  const sentences = opts.sentences ?? 3;

  return `You are a friendly Arduino tutor.
Explain the student's error(s) with hints only. Do NOT give the final answer.
Keep your response ${verbosity} and around ${sentences} sentences.

Sketch:
\`\`\`cpp
${code}
\`\`\`

Errors:
${errors.map((e) => `Line ${e.line ?? 1}: ${e.message ?? ""}`).join("\n")}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: "Missing OPENAI_API_KEY" })}\n\n`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      }
    );
  }

  const client = new OpenAI({ apiKey });

  const prompt =
    body?.mode === "arduino-verify"
      ? buildPrompt({
          code: body?.code ?? "",
          errors: body?.errors ?? [],
          verbosity: body?.verbosity ?? "brief",
          sentences: body?.sentences ?? 3,
        })
      : (body?.question ?? "Explain the following code.");

  const model = process.env.OPENAI_MODEL || "gpt-5.2";

  const stream = await client.responses.stream({
    model,
    input: prompt,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        send("token", { token: "" }); // optional: primes UI quickly

        for await (const event of stream) {
          // We only forward text deltas as "token"
          if (event.type === "response.output_text.delta") {
            send("token", { token: event.delta });
          }
        }

        send("done", {});
      } catch (e: any) {
        send("error", { error: e?.message ?? "AI request failed." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

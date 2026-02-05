export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // Tool server base (AWS)
  // NOTE: This env var is server-side only (no NEXT_PUBLIC_ prefix needed).
  const base =
    process.env.TOOL_SERVER_BASE_URL ||
    process.env.OLLAMA_BASE_URL || // keep backward compatibility if you already set it
    "http://3.150.166.11:4000";

  try {
    const upstream = await fetch(`${base}/ai/help`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // optional: keep from hanging forever
      signal: AbortSignal.timeout?.(30000),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return Response.json(
        { ok: false, error: `AI server error (${upstream.status}): ${text}`.slice(0, 500) },
        { status: 502 }
      );
    }

    if (!upstream.body) {
      return Response.json(
        { ok: false, error: "No response body from AI server" },
        { status: 502 }
      );
    }

    // Stream SSE back to frontend
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("❌ AI proxy error:", err);
    return Response.json(
      { ok: false, error: "AI server not reachable" },
      { status: 502 }
    );
  }
}

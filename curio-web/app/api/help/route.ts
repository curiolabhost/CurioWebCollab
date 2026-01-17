import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // Ollama server base
  const base = process.env.OLLAMA_BASE_URL || "http://localhost:4000";

  try {
    const upstream = await fetch(`${base}/ai/help`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!upstream.body) {
      return NextResponse.json(
        { ok: false, error: "No response body from AI server" },
        { status: 500 }
      );
    }

    // Stream SSE back to frontend
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
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
    return NextResponse.json(
      { ok: false, error: "Verification server not reachable" },
      { status: 500 }
    );
  }
}

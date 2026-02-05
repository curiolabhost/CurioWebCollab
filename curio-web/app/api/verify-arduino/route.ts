import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const base =
      process.env.TOOL_SERVER_BASE_URL ||
      process.env.OLLAMA_BASE_URL || // optional backward compat
      "http://3.150.166.11:4000";

    const upstream = await fetch(`${base}/verify-arduino`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout?.(30000),
    });

    // More robust: in case upstream returns non-JSON on error
    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: "Non-JSON response from tool server", raw: text.slice(0, 500) };
    }

    // If upstream failed, return 502 to indicate a bad gateway
    const status = upstream.ok ? 200 : 502;

    return NextResponse.json(data, { status });
  } catch (err: any) {
    console.error("❌ Verification route error:", err);
    return NextResponse.json(
      { ok: false, error: "Verification server not reachable" },
      { status: 502 }
    );
  }
}

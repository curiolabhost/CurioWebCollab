import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const base = process.env.API_BASE_URL;
  if (!base) {
    return NextResponse.json(
      { ok: false, error: "Missing API_BASE_URL" },
      { status: 500 }
    );
  }

  const upstream = await fetch(`${base}/verify-arduino`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

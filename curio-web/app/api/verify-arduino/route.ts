import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Directly point to your running Express server
    const upstream = await fetch("http://ec2-3-129-218-117.us-east-2.compute.amazonaws.com:4000/verify-arduino", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: any) {
    console.error("❌ Verification route error:", err);
    return NextResponse.json(
      { ok: false, error: "Verification server not reachable" },
      { status: 500 }
    );
  }
}

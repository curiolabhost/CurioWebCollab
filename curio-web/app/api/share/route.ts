import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const SHARES_DIR = path.join(process.cwd(), "data", "shares");

function ensureDir() {
  if (!fs.existsSync(SHARES_DIR)) fs.mkdirSync(SHARES_DIR, { recursive: true });
}

export async function POST(req: Request) {
  try {
    ensureDir();

    const body = await req.json();

    // minimal validation
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // create a short share id
    const id = crypto.randomBytes(6).toString("base64url"); // ~8 chars

    const file = path.join(SHARES_DIR, `${id}.json`);
    fs.writeFileSync(file, JSON.stringify(body), "utf8");

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

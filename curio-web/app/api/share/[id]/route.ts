import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SHARES_DIR = path.join(process.cwd(), "data", "shares");

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const file = path.join(SHARES_DIR, `${id}.json`);

    if (!fs.existsSync(file)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

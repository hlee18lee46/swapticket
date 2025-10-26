// app/api/tusky/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Tusky } from "@tusky-io/ts-sdk";

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.TUSKY_API_KEY!;
    if (!apiKey) return NextResponse.json({ error: "Missing TUSKY_API_KEY" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const uploadId = searchParams.get("uploadId"); // we’ll read by uploadId
    if (!uploadId) {
      return NextResponse.json({ error: "uploadId required" }, { status: 400 });
    }

    const tusky = await Tusky.init({ apiKey });
    const buf = await tusky.file.arrayBuffer(uploadId);
    const text = Buffer.from(buf).toString("utf8");

    // Try to parse JSON
    let json: unknown;
    try { json = JSON.parse(text); } catch {
      return NextResponse.json({ error: "Not valid JSON" }, { status: 415 });
    }

    return NextResponse.json(json);
  } catch (e: any) {
    console.error("Tusky read error:", e);
    return NextResponse.json({ error: e?.message || "Read failed" }, { status: 500 });
  }
}
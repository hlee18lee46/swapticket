import { NextRequest, NextResponse } from "next/server";
import { Tusky } from "@tusky-io/ts-sdk";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const uploadId = req.nextUrl.searchParams.get("uploadId");
    if (!uploadId) {
      return NextResponse.json({ error: "uploadId is required" }, { status: 400 });
    }
    const apiKey = process.env.TUSKY_API_KEY!;
    if (!apiKey) return NextResponse.json({ error: "Missing TUSKY_API_KEY" }, { status: 500 });

    const tusky = await Tusky.init({ apiKey });
    const info = await tusky.file.get(uploadId);
    return NextResponse.json(info, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
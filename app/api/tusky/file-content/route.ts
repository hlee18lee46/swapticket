// app/api/tusky/file-content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Tusky } from "@tusky-io/ts-sdk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const uploadId = req.nextUrl.searchParams.get("uploadId");
  if (!uploadId) {
    return NextResponse.json({ error: "uploadId required" }, { status: 400 });
  }
  try {
    const tusky = await Tusky.init({ apiKey: process.env.TUSKY_API_KEY! });
    // Pull the raw bytes and return JSON (your files are JSON blobs)
    const buf = await tusky.file.arrayBuffer(uploadId);
    return new NextResponse(Buffer.from(buf), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
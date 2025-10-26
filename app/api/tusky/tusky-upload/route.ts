import { NextRequest, NextResponse } from "next/server";
import { Tusky } from "@tusky-io/ts-sdk";

export const runtime = "nodejs"; // ensure this runs in Node.js

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided (form field 'file')" }, { status: 400 });
    }
    if (!process.env.TUSKY_API_KEY || !process.env.TUSKY_VAULT_ID) {
      return NextResponse.json({ error: "Server missing TUSKY_API_KEY or TUSKY_VAULT_ID" }, { status: 500 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const tusky = await Tusky.init({ apiKey: process.env.TUSKY_API_KEY });

    // ✅ FIX: remove `encrypted` field
    const { id: uploadId } = await tusky.file.upload(
      process.env.TUSKY_VAULT_ID,
      bytes,
      {
        name: file.name || "upload.bin",
        mimeType: file.type || "application/octet-stream",
      }
    );

    const meta = await tusky.file.get(uploadId);

    return NextResponse.json(
      {
        uploadId,
        blobId: meta.blobId ?? null,
        blobObjectId: meta.blobObjectId ?? null,
        url: meta.url ?? null,
        name: meta.name,
        mimeType: meta.mimeType,
        size: meta.size,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Tusky upload error:", err?.response?.data || err?.message || err);
    return NextResponse.json(
      { error: "Upload failed", detail: err?.response?.data || err?.message || String(err) },
      { status: 500 }
    );
  }
}
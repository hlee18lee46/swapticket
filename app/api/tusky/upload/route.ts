// app/api/tusky/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Tusky } from "@tusky-io/ts-sdk";

export const runtime = "nodejs";          // ensure Node runtime (not edge)
export const dynamic = "force-dynamic";   // allow env reads at runtime

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: NextRequest) {
  try {
    // --- required envs
    const API_KEY  = env("TUSKY_API_KEY");   // server-only
    const VAULT_ID = env("TUSKY_VAULT_ID");  // your Tusky vault UUID
    // optional: override base (defaults to https://api.tusky.io)
    const BASE_URL = process.env.TUSKY_BASE_URL;

    // --- read multipart form-data
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Expected a 'file' field in multipart/form-data." },
        { status: 400 },
      );
    }

    // infer name & mime
    const name = file.name || "upload.bin";
    const type = file.type || "application/octet-stream";

    // convert to Blob for SDK
    const bytes = await file.arrayBuffer();
    const blob = new Blob([bytes], { type });

    // --- init Tusky client
    const tusky = await Tusky.init({
      apiKey: API_KEY,
      ...(BASE_URL ? { baseUrl: BASE_URL } : {}),
    });

    // --- upload: returns a string uploadId
    const uploadId: string = await tusky.file.upload(VAULT_ID, blob, {
      name,
      mimeType: type,
      // parentId: "<folderId>", // optional
    });

    // --- fetch metadata (blobId/blobObjectId may populate asynchronously)
    const meta = await tusky.file.get(uploadId);

    return NextResponse.json(
      {
        uploadId,
        blobId: meta.blobId ?? null,           // Walrus blob id (off-chain)
        blobObjectId: meta.blobObjectId ?? null, // Sui object id (on-chain)
        url: meta.url ?? null,                 // Tusky viewer link (if available)
        name: meta.name ?? name,
        mimeType: meta.mimeType ?? type,
        size: meta.size ?? blob.size,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Tusky upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 },
    );
  }
}
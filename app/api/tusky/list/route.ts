// app/api/tusky/list/route.ts
import { NextResponse } from "next/server";
import { Tusky } from "@tusky-io/ts-sdk";

export async function GET() {
  try {
    const apiKey = process.env.TUSKY_API_KEY!;
    const vaultId = process.env.TUSKY_VAULT_ID!;
    if (!apiKey || !vaultId) {
      return NextResponse.json({ error: "Missing TUSKY_API_KEY or TUSKY_VAULT_ID" }, { status: 500 });
    }

    const tusky = await Tusky.init({ apiKey });
    const files = await tusky.file.listAll({ vaultId });

    // Normalize shape for client
    const out = files.map((f: any) => ({
      id: String(f.id),
      blobId: f.blobId ? String(f.blobId) : null,
      name: String(f.name),
      size: Number(f.size ?? 0),
      createdAt: String(f.createdAt ?? Date.now()),
    }));

    return NextResponse.json(out);
  } catch (e: any) {
    console.error("Tusky list error:", e);
    return NextResponse.json({ error: e?.message || "List failed" }, { status: 500 });
  }
}
// app/api/listings/route.ts
import { NextResponse } from "next/server";
import { Tusky } from "@tusky-io/ts-sdk";

export const dynamic = "force-dynamic";              // Next.js: no static caching
export const revalidate = 0;

export async function GET() {
  try {
    const tusky = await Tusky.init({ apiKey: process.env.TUSKY_API_KEY! });
    const vaultId = process.env.TUSKY_VAULT_ID!;
    // List all files in vault
    const files = await tusky.file.listAll({ vaultId });

    // Only show active (hide trashed/soft-deleted/etc.)
    const active = files.filter((f: any) => (f.status ?? "active") === "active");

    return new NextResponse(JSON.stringify(active), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ error: e?.message || String(e) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
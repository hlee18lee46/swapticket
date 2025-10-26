// app/api/loyalfan/list/route.ts
import { NextResponse } from "next/server";
import { Tusky } from "@tusky-io/ts-sdk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const tusky = await Tusky.init({ apiKey: process.env.TUSKY_API_KEY! });
    const vaultId = process.env.TUSKY_VAULT_ID!;
    const files = await tusky.file.listAll({ vaultId });

    // pull only our LoyalFan JSON docs
    const items = [];
    for (const f of files) {
      if ((f.status ?? "active") !== "active") continue;
      if (f.mimeType !== "application/json") continue;
      try {
        const buf = await tusky.file.arrayBuffer(f.id as any);
        const data = JSON.parse(Buffer.from(buf).toString("utf-8"));
        if (data?.kind === "loyalfan") {
          items.push({ file: f, data });
        }
      } catch {
        // ignore parse issues
      }
    }

    return NextResponse.json(items, {
      headers: { "cache-control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
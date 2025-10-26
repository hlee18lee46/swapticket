// app/api/tusky/listings/route.ts
import { NextResponse } from "next/server";
import { Tusky } from "@tusky-io/ts-sdk";

type Row = {
  uploadId: string;
  blobId: string | null;
  name: string;          // e.g. listing-<ticketId>.json
  createdAt: string;     // ISO
  size: number;
  ticketId: string;
  priceMist: string;     // stringified u64
};

export async function GET() {
  try {
    const apiKey = process.env.TUSKY_API_KEY!;
    const vaultId = process.env.TUSKY_VAULT_ID!;
    if (!apiKey || !vaultId) {
      return NextResponse.json({ error: "Missing TUSKY_API_KEY or TUSKY_VAULT_ID" }, { status: 500 });
    }

    const tusky = await Tusky.init({ apiKey });

    // list latest files under the vault
    const files = await tusky.file.listAll({ vaultId });

    // keep only listing-*.json
    const listingFiles = files.filter((f: any) =>
      typeof f?.name === "string" && f.name.startsWith("listing-") && f.name.endsWith(".json")
    );

    // fetch & parse JSON for each listing file
    const rows: Row[] = [];
    for (const f of listingFiles) {
      try {
        // download bytes, parse JSON
        const buf = await tusky.file.arrayBuffer(f.id);
        const text = Buffer.from(buf).toString("utf8");
        const j = JSON.parse(text);

        if (j?.kind !== "listing" || !j?.ticketId || !j?.price) continue;

        rows.push({
          uploadId: String(f.id),
          blobId: f.blobId ?? null,
          name: f.name,
          createdAt: new Date(Number(f.updatedAt || f.createdAt || Date.now())).toISOString(),
          size: Number(f.size || 0),
          ticketId: String(j.ticketId),
          priceMist: String(j.price),
        });
      } catch {
        // ignore bad/partial files
      }
    }

    // de-dupe by ticketId => newest first wins
    rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const seen = new Set<string>();
    const deduped: Row[] = [];
    for (const r of rows) {
      if (seen.has(r.ticketId)) continue;
      seen.add(r.ticketId);
      deduped.push(r);
    }

    return NextResponse.json({ items: deduped });
  } catch (e: any) {
    console.error("listings route error:", e);
    return NextResponse.json({ error: e?.message || "Failed to list listings" }, { status: 500 });
  }
}
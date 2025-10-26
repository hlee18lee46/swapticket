// components/ticket-hub.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { mistToSui } from "@/utils/price";
import { buyListing } from "@/utils/buy";

type TuskyFile = {
  id: string;                // uploadId
  blobId: string | null;
  name: string;
  size: number;
  createdAt: string;         // millis string
};

type AnyListingJSON = {
  // support both legacy and new shapes
  version?: number;
  kind?: string;             // "listing" | "ticket-listing"
  ticketId?: string;
  // prices can be: price (mist), price_mist (mist), or price_sui (human)
  price?: string;            // MIST
  price_mist?: string;       // MIST
  price_sui?: string;        // SUI (human string)
  // meta
  network?: string;
  createdAt?: string;        // ISO
  created_at?: string;       // ISO
  artist_code?: number;
  artist_name?: string;
  seat?: number;
  venue?: string;
};

// quick helpers
const inferArtist = (ticketId: string) => {
  const id = ticketId.toLowerCase();
  if (id.includes("90d5")) return "BILL";
  if (id.includes("6c63")) return "BTS";
  if (id.includes("d055")) return "MARO"; // add your own hints if needed
  return "SABR";
};
const inferSeat = (_: string) => "Seat ?";

function pickCreatedAt(meta: AnyListingJSON, file: TuskyFile): string {
  const iso = meta.created_at ?? meta.createdAt;
  if (iso) return new Date(iso).toLocaleString();
  return new Date(Number(file.createdAt || Date.now())).toLocaleString();
}

/** Return price in MIST as BigInt, accepting multiple shapes */
function pickPriceMist(meta: AnyListingJSON): bigint | null {
  // Priority: explicit mist field(s)
  if (meta.price_mist) {
    try { return BigInt(meta.price_mist); } catch {}
  }
  if (meta.price) {
    // in our old shape, price was already MIST
    try { return BigInt(meta.price); } catch {}
  }
  // Fallback: convert price_sui (string) → MIST
  if (meta.price_sui && /^[0-9]*\.?[0-9]*$/.test(meta.price_sui)) {
    const [whole = "0", fracRaw = ""] = meta.price_sui.split(".");
    const frac = (fracRaw + "000000000").slice(0, 9);
    try {
      return BigInt(whole || "0") * 1_000_000_000n + BigInt(frac || "0");
    } catch {}
  }
  return null;
}

export function TicketHub() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [files, setFiles] = useState<TuskyFile[]>([]);
  const [rows, setRows] = useState<{ file: TuskyFile; meta: AnyListingJSON | null }[]>([]);
  const [busyId, setBusyId] = useState<string>("");

  const pkg = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  const canBuy = useMemo(() => Boolean(account?.address), [account?.address]);

  // 1) list Tusky files via our API
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/tusky/list");
      if (!r.ok) return;
      const all: TuskyFile[] = await r.json();
      // keep our listing JSONs
      const listingFiles = all.filter((f) => /^listing-0x[0-9a-f]+\.json$/i.test(f.name));
      setFiles(listingFiles);
    })().catch(console.error);
  }, []);

  // 2) read each listing JSON
  useEffect(() => {
    (async () => {
      const out: { file: TuskyFile; meta: AnyListingJSON | null }[] = [];
      for (const f of files) {
        try {
          const r = await fetch(`/api/tusky/read?uploadId=${encodeURIComponent(f.id)}`);
          if (!r.ok) throw new Error(await r.text());
          const json = (await r.json()) as AnyListingJSON;

          const kind = (json.kind || "").toLowerCase();
          const isListing = kind === "listing" || kind === "ticket-listing";
          const hasTicket = !!json.ticketId;
          const hasPrice = pickPriceMist(json) !== null;

          out.push({ file: f, meta: isListing && hasTicket && hasPrice ? json : null });
        } catch {
          out.push({ file: f, meta: null });
        }
      }
      setRows(out);
    })();
  }, [files]);

  const onBuy = async (fileId: string, meta: AnyListingJSON) => {
    try {
      setBusyId(fileId);

      const priceMist = pickPriceMist(meta);
      if (priceMist === null) throw new Error("No price found in listing.");
      if (!meta.ticketId) throw new Error("No ticketId in listing.");

      const res = await buyListing(
        pkg,
        meta.ticketId,
        priceMist,
        { signAndExecuteTransaction: signAndExecute }
      );

      const digest =
        res?.digest ||
        res?.effectsDigest ||
        res?.effects?.transactionDigest ||
        res?.certificate?.transactionDigest;

      alert(`Bought successfully${digest ? `\nDigest: ${digest}` : ""}`);
    } catch (e: any) {
      alert(`Buy failed: ${e?.message || String(e)}`);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Ticket Hub</h2>

      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Artist</th>
              <th className="py-2 pr-4">Seat</th>
              <th className="py-2 pr-4">Ticket Id</th>
              <th className="py-2 pr-4">Price (SUI)</th>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-muted-foreground">
                  No listings yet.
                </td>
              </tr>
            )}

            {rows.map(({ file, meta }) => {
              const ticketId = meta?.ticketId ?? file.name.replace(/^listing-/, "").replace(/\.json$/, "");
              const artist =
                meta?.artist_name?.trim() ||
                (meta?.artist_code ? ["", "SABR", "BILL", "BTS", "MARO"][meta.artist_code] : undefined) ||
                inferArtist(ticketId);
              const seat =
                typeof meta?.seat === "number" && meta.seat > 0 ? `Seat ${meta.seat}` : inferSeat(ticketId);

              const priceMist = meta ? pickPriceMist(meta) : null;
              const priceSui = priceMist !== null ? mistToSui(priceMist) : "—";

              const created = meta ? pickCreatedAt(meta, file) : new Date().toLocaleString();

              return (
                <tr key={file.id} className="border-b">
                  <td className="py-2 pr-4">{artist}</td>
                  <td className="py-2 pr-4">{seat}</td>
                  <td className="py-2 pr-4 font-mono" title={ticketId}>
                    {ticketId.slice(0, 14)}…
                  </td>
                  <td className="py-2 pr-4">{priceSui}</td>
                  <td className="py-2 pr-4">{created}</td>
                  <td className="py-2 pr-4">
                    <button
                      disabled={!meta || !canBuy || busyId === file.id}
                      onClick={() => meta && onBuy(file.id, meta)}
                      className="rounded-md px-3 py-1 bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      {busyId === file.id ? "Buying…" : "Buy"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
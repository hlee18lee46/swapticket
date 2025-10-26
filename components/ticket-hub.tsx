// components/ticket-hub.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { mistToSui } from "@/utils/price";
import { buyListing } from "@/utils/buy";

// Temporary: infer artist/seat until on-chain metadata includes them
const inferArtist = (ticketId: string) => {
  const id = ticketId.toLowerCase();
  if (id.includes("90d5")) return "BILL";
  if (id.includes("6c63")) return "BTS";
  return "SABR";
};
const inferSeat = (_ticketId: string) => "Seat ?";

type TuskyFile = {
  id: string;                // uploadId
  blobId: string | null;
  name: string;
  size: number;
  createdAt: string;         // millis string
};

type ListingJSON = {
  kind: "listing";
  listingId: string;         // <-- REQUIRED for buy
  ticketId?: string;         // for display only
  price: string;             // u64 (MIST) as string
  network?: string;
  createdAt?: string;
};

export function TicketHub() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [files, setFiles] = useState<TuskyFile[]>([]);
  const [rows, setRows] = useState<{ file: TuskyFile; meta: ListingJSON | null }[]>([]);
  const [busyId, setBusyId] = useState<string>("");

  const pkg = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  const appNet = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet").toLowerCase();
  const canBuy = useMemo(() => Boolean(account?.address), [account?.address]);

  // 1) List files from Tusky (server route)
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/tusky/list");
      if (!r.ok) return;
      const all: TuskyFile[] = await r.json();
      // keep only listing JSONs we created: listing-0x...json
      const listingFiles = all.filter((f) => /^listing-0x[0-9a-f]+\.json$/i.test(f.name));
      setFiles(listingFiles);
    })().catch(console.error);
  }, []);

  // 2) For each file, read JSON by uploadId
  useEffect(() => {
    (async () => {
      const out: { file: TuskyFile; meta: ListingJSON | null }[] = [];
      for (const f of files) {
        try {
          const r = await fetch(`/api/tusky/read?uploadId=${encodeURIComponent(f.id)}`);
          if (!r.ok) throw new Error(await r.text());
          const json = (await r.json()) as ListingJSON;
          // Must have kind=listing, listingId, price; and (optional) network must match app
          const ok =
            json &&
            json.kind === "listing" &&
            typeof json.listingId === "string" &&
            typeof json.price === "string" &&
            (!json.network || json.network.toLowerCase() === appNet);

          out.push({ file: f, meta: ok ? json : null });
        } catch {
          out.push({ file: f, meta: null });
        }
      }
      setRows(out);
    })();
  }, [files, appNet]);

  const onBuy = async (fileId: string, meta: ListingJSON) => {
    try {
      setBusyId(fileId);
      // IMPORTANT: use listingId, not ticketId
      const res = await buyListing(
        pkg,
        meta.listingId,
        BigInt(meta.price),
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
              const created = new Date(Number(file.createdAt || Date.now())).toLocaleString();

              // For the table we still *display* the ticketId if present (nice UX),
              // but the buy call will use meta.listingId.
              const ticketId =
                meta?.ticketId ??
                file.name.replace(/^listing-/, "").replace(/\.json$/, "");

              const artist = inferArtist(ticketId);
              const seat = inferSeat(ticketId);
              const priceMist = meta ? BigInt(meta.price) : 0n;
              const priceSui = mistToSui(priceMist);

              return (
                <tr key={file.id} className="border-b">
                  <td className="py-2 pr-4">{artist}</td>
                  <td className="py-2 pr-4">{seat}</td>
                  <td className="py-2 pr-4 font-mono" title={ticketId}>
                    {ticketId.slice(0, 14)}…
                  </td>
                  <td className="py-2 pr-4">{meta ? priceSui : "—"}</td>
                  <td className="py-2 pr-4">{created}</td>
                  <td className="py-2 pr-4">
                    <button
                      disabled={!canBuy || !meta || busyId === file.id}
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
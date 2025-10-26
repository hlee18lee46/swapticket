"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { fetchOwnedTickets } from "@/utils/tickets";
import { createListing } from "@/utils/listing";

// precise SUI → MIST converter (no floating point)
function suiToMist(input: string): bigint {
  const s = input.trim();
  if (!s) throw new Error("Enter a price in SUI.");

  // allow forms like "0", "1", "1.", ".5", "0.123456789"
  const sign = s.startsWith("-") ? -1n : 1n;
  const raw = s.replace(/^[-+]/, "");
  if (!/^\d*\.?\d*$/.test(raw)) throw new Error("Invalid number format.");

  const [whole = "0", fracRaw = ""] = raw.split(".");
  const frac = (fracRaw + "000000000").slice(0, 9); // pad to 9 decimals

  const wholeBI = BigInt(whole || "0");
  const fracBI = BigInt(frac || "0");

  return sign * (wholeBI * 1_000_000_000n + fracBI);
}

export function ListingForm() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [priceSui, setPriceSui] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";

  useEffect(() => {
    if (!account?.address || !packageId) return;
    fetchOwnedTickets(account.address, packageId)
      .then(setTickets)
      .catch((e) => console.error(e));
  }, [account?.address, packageId]);

  const isDisabled = useMemo(
    () => !account?.address || !selected || !priceSui || busy,
    [account?.address, selected, priceSui, busy]
  );

// helper: build the JSON we want to store in Tusky
function buildListingJson(ticket: any, priceMist: bigint) {
  return {
    // minimal example — add anything else you want indexed
    version: 1,
    kind: "ticket-listing",
    ticketId: ticket.objectId,
    artist_code: ticket.artist_code,
    artist_name: ticket.artist_name ?? null,
    seat: ticket.seat,
    venue: ticket.venue ?? null,
    // store price in MIST (string to avoid JS number limits)
    price_mist: priceMist.toString(),
    // optional: human price for convenience
    price_sui: (Number(priceMist) / 1_000_000_000).toString(),
    // timestamp
    created_at: new Date().toISOString(),
  };
}

const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage("");
  try {
    if (!selected) throw new Error("Choose a ticket.");
    if (!priceSui) throw new Error("Enter a price in SUI.");

    const priceMist = suiToMist(priceSui); // BigInt in MIST
    if (priceMist < 0n) throw new Error("Price must be non-negative.");

    const ticket = tickets.find((t) => t.objectId === selected);
    if (!ticket) throw new Error("Selected ticket not found.");

    setBusy(true);

    // 1) Build listing metadata and upload to Tusky via our Next API route
    const json = buildListingJson(ticket, priceMist);
    const fd = new FormData();
    fd.append(
      "file",
      new Blob([JSON.stringify(json)], { type: "application/json" }),
      `listing-${ticket.objectId}.json`,
    );

    const upRes = await fetch("/api/tusky/upload", {
      method: "POST",
      body: fd,
    });

    if (!upRes.ok) {
      const errText = await upRes.text().catch(() => "");
      throw new Error(`Tusky upload failed: ${errText || upRes.statusText}`);
    }

    const up = await upRes.json(); // { uploadId, blobId?, ... }
    // Some deployments give blobId right away; if not, fetch by uploadId.
    let blobId: string | null = up.blobId ?? null;
    if (!blobId && up.uploadId) {
      const metaRes = await fetch(`/api/tusky/file?uploadId=${encodeURIComponent(up.uploadId)}`);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        blobId = meta.blobId ?? null;
      }
    }
    if (!blobId) throw new Error("Tusky returned no blobId.");

    // OPTIONAL: if your Move market expects metadata_url now,
    // construct a stable URL you serve (e.g., a proxy route):
    // const metadataUrl = `/api/tusky/download/${blobId}`;
    // and pass it into your transaction (requires Move + utils/listing.ts changes).

    // 2) Create the on-chain listing (current Move takes (ticket, price))
    const res = await createListing(
      packageId,
      selected,
      priceMist,
      { signAndExecuteTransaction: signAndExecute }
    );

    const digest =
      res?.digest ||
      res?.effectsDigest ||
      res?.effects?.transactionDigest ||
      res?.certificate?.transactionDigest;

    setMessage(
      `Listing created${digest ? ` · digest ${digest}` : ""}\nTusky blobId: ${blobId}`
    );

    // Optional: refresh tickets
    // fetchOwnedTickets(account!.address!, packageId).then(setTickets).catch(console.error);
  } catch (err: any) {
    console.error(err);
    setMessage(err?.message || String(err));
  } finally {
    setBusy(false);
  }
};

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <label className="block mb-2 font-medium">Select a Ticket</label>
        <select
          className="w-full rounded-md border bg-background p-3"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">— choose —</option>
          {tickets.map((t) => (
            <option key={t.objectId} value={t.objectId}>
              {(t.artist_name || `Artist #${t.artist_code}`)} — Seat {t.seat} — {t.venue}
            </option>
          ))}
        </select>
        {tickets.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            No tickets found for this wallet on {network}. Double-check your package id and network.
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 font-medium">
          Price (<span className="font-mono">SUI</span>)
        </label>
        <input
          type="text"
          inputMode="decimal"
          className="w-full rounded-md border bg-background p-3 font-mono"
          value={priceSui}
          onChange={(e) => setPriceSui(e.target.value)}
          placeholder="e.g. 0.25"
        />
        {!!priceSui && (() => {
          try {
            const mist = suiToMist(priceSui);
            return (
              <p className="mt-1 text-xs text-muted-foreground">
                {mist.toString()} MIST
              </p>
            );
          } catch {
            return (
              <p className="mt-1 text-xs text-destructive">
                Invalid SUI amount
              </p>
            );
          }
        })()}
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="rounded-2xl px-5 py-3 font-semibold shadow-md bg-primary text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create Listing"}
      </button>

      {message && (
        <p className="text-sm mt-2 whitespace-pre-wrap">{message}</p>
      )}
    </form>
  );
}
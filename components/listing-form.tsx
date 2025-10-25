"use client";

import { useEffect, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { fetchOwnedTickets } from "@/utils/tickets";
import { createListing } from "@/utils/listing";

export function ListingForm() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [price, setPrice] = useState<string>("");

  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;

  useEffect(() => {
    if (!account?.address || !packageId) return;
    fetchOwnedTickets(account.address, packageId).then(setTickets).catch(console.error);
  }, [account?.address, packageId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !price) return;
    const priceU64 = BigInt(price);
    await createListing(packageId, selected, priceU64, { signAndExecuteTransaction: signAndExecute });
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
              {t.artist_name || `Artist #${t.artist_code}`} — Seat {t.seat} — {t.venue}
            </option>
          ))}
        </select>
        {tickets.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            No tickets found for this wallet on {process.env.NEXT_PUBLIC_SUI_NETWORK}. 
            Double-check your package id and network.
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 font-medium">Price (u64)</label>
        <input
          type="number"
          className="w-full rounded-md border bg-background p-3"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 100000000 (MIST)"
          min="0"
        />
      </div>

      <button
        type="submit"
        className="rounded-2xl px-5 py-3 font-semibold shadow-md bg-primary text-primary-foreground"
      >
        Create Listing
      </button>
    </form>
  );
}
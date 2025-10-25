"use client";

import { useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { mintAllTicketsToSeller } from "@/utils/mint-tickets";

export function AdminMintAll() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  const [busy, setBusy] = useState(false);

  const pkg = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  const seller = process.env.NEXT_PUBLIC_SELLER_ADDRESS!;

  const run = async () => {
    try {
      setBusy(true);
      if (!account?.address) throw new Error("Connect wallet first");
      await mintAllTicketsToSeller({
        packageId: pkg,
        seller,
        signAndExecute,
      });
      alert("✅ Minted 40 tickets to seller wallet!");
    } catch (e: any) {
      console.error(e);
      alert(`Mint failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={run}
      disabled={busy}
      className="rounded-2xl px-4 py-2 font-semibold bg-primary text-primary-foreground shadow"
    >
      {busy ? "Minting…" : "Mint 40 tickets to seller"}
    </button>
  );
}
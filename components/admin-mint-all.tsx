// components/admin-mint-all.tsx
"use client";

import { useCallback, useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { mintTicketsForAllArtists } from "@/utils/mint-tickets";

export function AdminMintAll() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [busy, setBusy] = useState(false);

  const onMint = useCallback(async () => {
    if (!account?.address) return alert("Connect a wallet first.");
    setBusy(true);
    try {
      await mintTicketsForAllArtists({
        packageId: process.env.NEXT_PUBLIC_PACKAGE_ID!,
        seller: process.env.NEXT_PUBLIC_SELLER_ADDRESS!,
        signAndExecute,
      });
      alert("Minted 40 tickets to seller wallet 🎉");
    } catch (e: any) {
      console.error(e);
      alert(`Mint failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [account?.address, signAndExecute]);

  return (
    <button
      onClick={onMint}
      disabled={busy}
      className="rounded-2xl px-5 py-3 font-semibold shadow-md bg-primary text-primary-foreground disabled:opacity-60"
    >
      {busy ? "Minting…" : "Mint 40 tickets to seller"}
    </button>
  );
}
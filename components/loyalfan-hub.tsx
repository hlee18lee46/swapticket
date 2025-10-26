// components/loyalfan-hub.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { getCoinDecimals, formatUnits, KNOWN_TYPES, resolveHeldCoinType } from "@/utils/coins";
import { payWithCoin } from "@/utils/pay";
import { mintReceipt } from "@/utils/receipt";

type TuskyFile = {
  id: string;                // uploadId
  blobId: string | null;
  name: string;
  size: number;
  createdAt: string;         // millis string
};

type LoyalFanJSON = {
  kind: "loyalfan";
  seller: string;
  artist: "BILL" | "BTS" | "MARO" | "SABR" | string;
  coinType: string;
  priceUnits: string;        // u64 (base units)
  title: string;
  description?: string | null;
  image?: string | null;
  createdAt?: string;
  network?: string;
};

const shortAddr = (a: string) => {
  if (!a) return "";
  const s = a.startsWith("0x") ? a.slice(2) : a;
  return `0x${s.slice(0, 6)}…${s.slice(-4)}`;
};
const ticker = (t: string) => t.split("::").pop() || "COIN";

export function LoyalFanHub() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [files, setFiles] = useState<TuskyFile[]>([]);
  const [rows, setRows] = useState<{ file: TuskyFile; meta: LoyalFanJSON | null }[]>([]);
  const [busy, setBusy] = useState<string>("");
  const [decimalsMap, setDecimalsMap] = useState<Record<string, number>>({});

  const canPay = useMemo(() => Boolean(account?.address), [account?.address]);

  // 1) list Tusky files (hide anything marked SOLD)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/tusky/list");
        if (!r.ok) return;
        const all: TuskyFile[] = await r.json();
        const active = all.filter((f) => f.name.endsWith(".json") && !f.name.includes("-SOLD-"));
        setFiles(active);
      } catch (e) {
        console.error("Failed to fetch Tusky listings:", e);
      }
    })();
  }, []);

  // 2) read only kind=loyalfan JSONs
  useEffect(() => {
    (async () => {
      const out: { file: TuskyFile; meta: LoyalFanJSON | null }[] = [];
      for (const f of files) {
        try {
          const r = await fetch(`/api/tusky/read?uploadId=${encodeURIComponent(f.id)}`);
          if (!r.ok) throw new Error(await r.text());
          const json = (await r.json()) as LoyalFanJSON;
          out.push({ file: f, meta: json?.kind === "loyalfan" ? json : null });
        } catch {
          out.push({ file: f, meta: null });
        }
      }
      setRows(out);
    })();
  }, [files]);

  // 3) fetch decimals for distinct coin types (once)
  useEffect(() => {
    (async () => {
      const types = Array.from(
        new Set(rows.flatMap((r) => (r.meta?.coinType ? [r.meta.coinType] : [])))
      );
      const m: Record<string, number> = {};
      await Promise.all(
        types.map(async (t) => {
          try {
            m[t] = await getCoinDecimals(t);
          } catch {
            m[t] = 9; // fallback
          }
        })
      );
      setDecimalsMap(m);
    })();
  }, [rows]);

  // 4) pay with the coin type the wallet actually holds, then mint receipt, then settle the listing
  const onPay = async (row: { file: TuskyFile; meta: LoyalFanJSON }) => {
    const { file, meta } = row;
    try {
      if (!account?.address) throw new Error("Connect your wallet first.");
      setBusy(file.id);

      const amount = BigInt(meta.priceUnits);
      const candidates = KNOWN_TYPES[meta.artist as "BILL" | "BTS" | "MARO" | "SABR"];
      if (!candidates) throw new Error(`Unknown artist: ${meta.artist}`);

      const chosen = await resolveHeldCoinType(account.address, candidates, amount);
      if (!chosen) {
        throw new Error(
          `No spendable ${meta.artist} coins found for this wallet.\nRequired ≥ ${meta.priceUnits} base units.`
        );
      }

      // 4a) payment
      const payRes = await payWithCoin({
        owner: account.address,
        coinType: chosen,
        amount,
        recipient: meta.seller,
        signAndExecute,
      });

      const digest =
        payRes?.digest ||
        payRes?.effectsDigest ||
        payRes?.effects?.transactionDigest ||
        payRes?.certificate?.transactionDigest;

      // 4b) mint receipt (best-effort)
      try {
await mintReceipt({
  pkg: process.env.NEXT_PUBLIC_PACKAGE_ID!,
  buyer: account!.address!,
  seller: meta.seller,
  artist: meta.artist,
  title: meta.title,
  coinTicker: ticker(chosen),           // or ticker(meta.coinType)
  amountUnits: BigInt(meta.priceUnits),
  signAndExecute: async (tx) => {
    return await signAndExecute({ transaction: tx, chain: `sui:${process.env.NEXT_PUBLIC_SUI_NETWORK}` as any });
  },
});
      } catch (e) {
        console.warn("mintReceipt failed (continuing):", e);
      }

      // 4c) mark the listing as settled (server will delete/rename in Tusky)
      if (digest) {
        await fetch("/api/loyalfan/settle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uploadId: file.id,
            digest,
            expected: {
              seller: meta.seller,
              artist: meta.artist,
              coinType: chosen,                // use the coin type we actually used
              priceUnits: meta.priceUnits,
              title: meta.title,
            },
          }),
        }).catch(() => {});
      }

      alert(`Payment sent${digest ? `\nDigest: ${digest}` : ""}`);

      // remove the row locally so the button disappears without full refresh
      setRows((prev) => prev.filter((r) => r.file.id !== file.id));
    } catch (e: any) {
      alert(`Payment failed: ${e?.message || String(e)}`);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">LoyalFan Goods</h2>

      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Artist</th>
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Price</th>
              <th className="py-2 pr-4">Coin</th>
              <th className="py-2 pr-4">Seller</th>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.filter((r) => r.meta).length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-muted-foreground">
                  No LoyalFan goods yet.
                </td>
              </tr>
            )}

            {rows.filter((r) => r.meta).map(({ file, meta }) => {
              const created = meta!.createdAt
                ? new Date(meta!.createdAt).toLocaleString()
                : new Date(Number(file.createdAt || Date.now())).toLocaleString();

              const dec = decimalsMap[meta!.coinType] ?? 9;
              const human = formatUnits(BigInt(meta!.priceUnits), dec);

              return (
                <tr key={file.id} className="border-b align-top">
                  <td className="py-2 pr-4">{meta!.artist}</td>
                  <td className="py-2 pr-4">
                    <div className="font-medium">{meta!.title}</div>
                    {meta!.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2 max-w-[38ch]">
                        {meta!.description}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-mono">{human}</td>
                  <td className="py-2 pr-4">{ticker(meta!.coinType)}</td>
                  <td className="py-2 pr-4" title={meta!.seller}>{shortAddr(meta!.seller)}</td>
                  <td className="py-2 pr-4">{created}</td>
                  <td className="py-2 pr-4">
                    <button
                      disabled={!canPay || busy === file.id}
                      onClick={() => onPay({ file, meta: meta! })}
                      className="rounded-md px-3 py-1 bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      {busy === file.id ? "Paying…" : `Pay ${ticker(meta!.coinType)}`}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Prices are shown in human units based on each coin’s on-chain decimals.
      </p>
    </div>
  );
}
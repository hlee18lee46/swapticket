// components/loyalfan-hub.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { payWithCoin, getCoinMetadataCached, formatUnits } from "@/utils/pay";

type TuskyFile = {
  id: string;                // uploadId
  blobId: string | null;
  name: string;
  size: number;
  createdAt: string;         // millis string
};

type LoyalFanJSON = {
  kind: "loyalfan";
  seller: string;            // address
  artist: "BILL" | "BTS" | "MARO" | "SABR" | string;
  coinType: string;          // e.g. 0x..::bill::BILL
  priceUnits: string;        // u64 (string, base units of coin)
  title: string;
  description?: string | null;
  image?: string | null;
  createdAt?: string;
  network?: string;
};

function shortAddr(a: string) {
  if (!a) return "";
  const s = a.startsWith("0x") ? a.slice(2) : a;
  return `0x${s.slice(0, 6)}…${s.slice(-4)}`;
}

function coinTicker(coinType: string) {
  // last segment after '::' is good enough for a short ticker label
  const parts = coinType.split("::");
  return parts[parts.length - 1] || "COIN";
}

export function LoyalFanHub() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [files, setFiles] = useState<TuskyFile[]>([]);
  const [rows, setRows] = useState<{ file: TuskyFile; meta: LoyalFanJSON | null }[]>([]);
  const [busy, setBusy] = useState<string>("");

  const canPay = useMemo(() => Boolean(account?.address), [account?.address]);

  // 1) fetch list of Tusky files and keep only loyalfan JSONs
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/tusky/list");
      if (!r.ok) return;
      const all: TuskyFile[] = await r.json();

      // Example naming is free-form; we filter by JSON contents instead (next effect)
      setFiles(all.filter((f) => f.name.endsWith(".json")));
    })().catch(console.error);
  }, []);

  // 2) read each JSON and keep only { kind: "loyalfan" }
  useEffect(() => {
    (async () => {
      const out: { file: TuskyFile; meta: LoyalFanJSON | null }[] = [];
      for (const f of files) {
        try {
          const r = await fetch(`/api/tusky/read?uploadId=${encodeURIComponent(f.id)}`);
          if (!r.ok) throw new Error(await r.text());
          const json = (await r.json()) as LoyalFanJSON;
          if (json?.kind === "loyalfan" && json.seller && json.coinType && json.priceUnits) {
            out.push({ file: f, meta: json });
          } else {
            out.push({ file: f, meta: null });
          }
        } catch {
          out.push({ file: f, meta: null });
        }
      }
      setRows(out);
    })();
  }, [files]);

  // 3) prefetch coin metadata for distinct coin types so we can show human price
  const [decimalsMap, setDecimalsMap] = useState<Record<string, number>>({});
  useEffect(() => {
    (async () => {
      const types = Array.from(
        new Set(rows.flatMap((r) => (r.meta?.coinType ? [r.meta.coinType] : [])))
      );
      const map: Record<string, number> = {};
      for (const t of types) {
        try {
          const meta = await getCoinMetadataCached(t);
          map[t] = meta?.decimals ?? 9;
        } catch {
          map[t] = 9;
        }
      }
      setDecimalsMap(map);
    })();
  }, [rows]);

  const onPay = async (row: { file: TuskyFile; meta: LoyalFanJSON }) => {
    const meta = row.meta!;
    try {
      setBusy(row.file.id);
      const amount = BigInt(meta.priceUnits);
      const res = await payWithCoin({
        coinType: meta.coinType,
        amount,
        recipient: meta.seller,
        signAndExecute,
      });

      const digest =
        res?.digest ||
        res?.effectsDigest ||
        res?.effects?.transactionDigest ||
        res?.certificate?.transactionDigest;

      alert(`Payment sent${digest ? `\nDigest: ${digest}` : ""}`);
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
            {rows.filter(r => r.meta).length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-muted-foreground">
                  No LoyalFan goods yet.
                </td>
              </tr>
            )}

            {rows.filter(r => r.meta).map(({ file, meta }) => {
              const created = meta?.createdAt
                ? new Date(meta.createdAt).toLocaleString()
                : new Date(Number(file.createdAt || Date.now())).toLocaleString();

              const dec = decimalsMap[meta!.coinType] ?? 9;
              const amountHuman = meta
                ? formatUnits(BigInt(meta.priceUnits), dec)
                : "—";

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
                  <td className="py-2 pr-4 font-mono">{amountHuman}</td>
                  <td className="py-2 pr-4">{coinTicker(meta!.coinType)}</td>
                  <td className="py-2 pr-4" title={meta!.seller}>
                    {shortAddr(meta!.seller)}
                  </td>
                  <td className="py-2 pr-4">{created}</td>
                  <td className="py-2 pr-4">
                    <button
                      disabled={!canPay || busy === file.id}
                      onClick={() => onPay({ file, meta: meta! })}
                      className="rounded-md px-3 py-1 bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      {busy === file.id ? "Paying…" : `Pay ${coinTicker(meta!.coinType)}`}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Payments transfer the specified coin directly to the seller. Delivery/fulfillment of goods is off-chain.
      </p>
    </div>
  );
}
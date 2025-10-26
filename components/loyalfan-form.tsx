"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect, useMemo, useState } from "react";
import { sui } from "@/lib/sui"; // SuiClient instance with correct network

function toBaseUnits(input: string, decimals: number): bigint {
  const s = input.trim();
  if (!s) throw new Error("Enter a price.");
  if (!/^\d*\.?\d*$/.test(s)) throw new Error("Invalid number format.");
  const [whole = "0", fracRaw = ""] = s.split(".");
  const frac = (fracRaw + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(frac || "0");
}

// Map coin symbol -> Move type
function coinTypeOf(artist: "SABR" | "BILL" | "BTS" | "MARO"): string {
  const pkg = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  switch (artist) {
    case "SABR": return `${pkg}::sabr::SABR`;
    case "BILL": return `${pkg}::bill::BILL`;
    case "BTS":  return `${pkg}::bts::BTS`;
    case "MARO": return `${pkg}::maro::MARO`;
  }
}

export function LoyalFanForm() {
  const account = useCurrentAccount();

  const [artist, setArtist] = useState<"SABR" | "BILL" | "BTS" | "MARO">("SABR");
  const [title, setTitle]   = useState("");
  const [desc, setDesc]     = useState("");
  const [priceHuman, setPriceHuman] = useState("");
  const [image, setImage]   = useState<File | null>(null);
  const [msg, setMsg]       = useState("");
  const [busy, setBusy]     = useState(false);

  const seller   = account?.address || "";
  const allowed  = (process.env.NEXT_PUBLIC_SELLER_ADDRESS || "").toLowerCase();
  const canPost  = useMemo(() => !!seller && seller.toLowerCase() === allowed, [seller, allowed]);

  // NEW: fetch decimals for the selected coin
  const [decimals, setDecimals] = useState<number>(9);
  useEffect(() => {
    const coinType = coinTypeOf(artist);
    (async () => {
      try {
        const meta = await sui.getCoinMetadata({ coinType });
        setDecimals(meta?.decimals ?? 9);
      } catch {
        setDecimals(9);
      }
    })();
  }, [artist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    if (!canPost) {
      setMsg("Connected wallet is not authorized to post LoyalFan Goods.");
      return;
    }

    try {
      const coinType  = coinTypeOf(artist);
      const amount    = toBaseUnits(priceHuman, decimals);
      if (amount < 0n) throw new Error("Price must be non-negative.");

      const form = new FormData();
      form.set("seller", seller);
      form.set("title", title);
      form.set("description", desc);
      form.set("artist", artist);
      form.set("coinType", coinType);
      form.set("priceUnits", amount.toString()); // base units
      form.set("decimals", String(decimals));    // <-- save it
      if (image) form.set("image", image, image.name);

      setBusy(true);
      const res = await fetch("/api/loyalfan/create", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setMsg(`Posted! uploadId=${data.uploadId}${data.blobId ? ` · blobId=${data.blobId}` : ""}`);
      setTitle(""); setDesc(""); setPriceHuman(""); setImage(null);
    } catch (err: any) {
      setMsg(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  // Optional: preview the base units so you can sanity-check
  let preview = "";
  try {
    if (priceHuman) preview = toBaseUnits(priceHuman, decimals).toString();
  } catch { /* ignore */ }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!canPost && (
        <div className="rounded border p-3 text-sm text-destructive">
          Only seller {process.env.NEXT_PUBLIC_SELLER_ADDRESS} can create LoyalFan posts.
        </div>
      )}

      <div>
        <label className="block mb-2 font-medium">Artist Coin</label>
        <select
          value={artist}
          onChange={(e) => setArtist(e.target.value as any)}
          className="w-full rounded-md border bg-background p-3"
        >
          <option value="SABR">SABR</option>
          <option value="BILL">BILL</option>
          <option value="BTS">BTS</option>
          <option value="MARO">MARO</option>
        </select>
        <p className="mt-1 text-xs text-muted-foreground">Decimals: {decimals}</p>
      </div>

      <div>
        <label className="block mb-2 font-medium">Title</label>
        <input
          className="w-full rounded-md border bg-background p-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Signed poster, VIP bundle, etc."
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Description</label>
        <textarea
          className="w-full rounded-md border bg-background p-3"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Details about the special good/ticket"
          rows={4}
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">
          Price (<span className="font-mono">{artist}</span>)
        </label>
        <input
          type="text"
          inputMode="decimal"
          className="w-full rounded-md border bg-background p-3 font-mono"
          value={priceHuman}
          onChange={(e) => setPriceHuman(e.target.value)}
          placeholder="e.g. 12.5"
        />
        {!!preview && (
          <p className="mt-1 text-xs text-muted-foreground">
            Base units: <span className="font-mono">{preview}</span>
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 font-medium">Image (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
      </div>

      <button
        type="submit"
        disabled={!canPost || busy}
        className="rounded-2xl px-5 py-3 font-semibold shadow-md bg-primary text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Posting…" : "Create LoyalFan Good"}
      </button>

      {msg && <p className="text-sm mt-2 whitespace-pre-wrap">{msg}</p>}
    </form>
  );
}
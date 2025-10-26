// app/api/loyalfan/settle/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { fromB64 } from "@mysten/sui/utils";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { Tusky } from "@tusky-io/ts-sdk";

// OPTIONAL: server-minted receipt
const RECEIPT = {
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID!,
  target: "loyalfan::mint_receipt",
  adminCapId: process.env.SUI_ADMIN_CAP_ID || null,
};

const KNOWN_TYPES: Record<string, string[]> = {
  BILL: [ `${process.env.NEXT_PUBLIC_PACKAGE_ID}::bill::BILL` ],
  BTS:  [ `${process.env.NEXT_PUBLIC_PACKAGE_ID}::bts::BTS`  ],
  MARO: [ `${process.env.NEXT_PUBLIC_PACKAGE_ID}::maro::MARO` ],
  SABR: [ `${process.env.NEXT_PUBLIC_PACKAGE_ID}::sabr::SABR` ],
};

type OwnerShape =
  | string
  | { AddressOwner?: string }
  | { owner?: { AddressOwner?: string } }
  | { Address?: string };

function ownerToAddress(o: any): string | null {
  if (!o) return null;
  if (typeof o === "string") return o;
  if (o.owner?.AddressOwner) return o.owner.AddressOwner;
  if (o.AddressOwner) return o.AddressOwner;
  if (o.Address) return o.Address;
  return null;
}

async function verifyPayment(params: {
  digest: string;
  expectedSeller: string;
  expectedCoinTypes: string[];
  expectedAmount: bigint;
}) {
  const { digest, expectedSeller, expectedCoinTypes, expectedAmount } = params;
  const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as
    | "testnet" | "mainnet" | "devnet";
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  const tx = await client.getTransactionBlock({
    digest,
    options: { showEffects: true, showEvents: true, showInput: true, showBalanceChanges: true },
  });

  if (!tx.effects) {
    console.error("[settle] no effects on tx", digest);
    return { ok: false, why: "no effects" as const };
  }

  const sellerLower = expectedSeller.toLowerCase();

  // Prefer balanceChanges if present (SDK >= 1.5 added it widely)
  const changes: any[] = (tx.balanceChanges || (tx as any).effects?.balanceChanges || []) as any[];
  if (changes.length) {
    let inc = 0n;
    for (const ch of changes) {
      const coinType = ch.coinType || ch.type || "";
      if (!expectedCoinTypes.includes(coinType)) continue;
      const addr = ownerToAddress(ch.owner);
      if (!addr || addr.toLowerCase() !== sellerLower) continue;
      try {
        inc += BigInt(ch.amount); // positives = received
      } catch {}
    }
    if (inc >= expectedAmount) {
      return { ok: true as const, inc: inc.toString(), source: "balanceChanges" as const };
    }
    console.error("[settle] verify failed via balanceChanges", { inc: inc.toString(), expectedAmount: expectedAmount.toString() });
  }

  // Fallback: scan events for Coin<...> credits to seller (not perfect, but helpful)
  const evs = tx.events || [];
  let evHit = false;
  for (const ev of evs) {
    const parsed = ev.parsedJson as any;
    // Some wallets emit Transfer events with recipient
    const recipient = parsed?.recipient || parsed?.to || parsed?.toAddress;
    const coinType = ev.type?.match(/Coin<([^>]+)>/)?.[1];
    if (recipient && coinType && expectedCoinTypes.includes(coinType) && String(recipient).toLowerCase() === sellerLower) {
      evHit = true; break;
    }
  }
  if (evHit) {
    return { ok: true as const, inc: "unknown", source: "events" as const };
  }

  return { ok: false as const, why: "no matching balance increase or events" as const, dbg: { digest, expectedSeller, expectedCoinTypes, expectedAmount: expectedAmount.toString() } };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uploadId, digest, expected } = body as {
      uploadId: string;
      digest: string;
      expected: {
        seller: string;
        artist: "BILL"|"BTS"|"MARO"|"SABR"|string;
        coinType: string;
        priceUnits: string;  // u64 string
        title: string;
      };
    };

    if (!uploadId || !digest || !expected?.seller || !expected?.coinType || !expected?.priceUnits) {
      console.error("[settle] missing fields", body);
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const expectedAmount = BigInt(expected.priceUnits);
    const candidates = KNOWN_TYPES[expected.artist] ?? [expected.coinType];

    const v = await verifyPayment({
      digest,
      expectedSeller: expected.seller,
      expectedCoinTypes: candidates,
      expectedAmount,
    });

    if (!v.ok) {
      console.error("[settle] payment not verified", v);
      return NextResponse.json({ error: "payment not verified from digest", detail: v }, { status: 400 });
    }

    // Mark SOLD in Tusky
    const tusky = await Tusky.init({ apiKey: process.env.TUSKY_API_KEY! });
    const vaultId = process.env.TUSKY_VAULT_ID!;
    const soldDoc = {
      kind: "loyalfan",
      status: "sold",
      buyerDigest: digest,
      buyer: "unknown",
      ...expected,
      settledAt: new Date().toISOString(),
      network: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
      sourceUploadId: uploadId,
      verifySource: v,
    };
    await tusky.file.upload(vaultId, Buffer.from(JSON.stringify(soldDoc)), {
      name: `loyalfan-${expected.artist}-SOLD-${Date.now()}.json`,
      mimeType: "application/json",
    });

    // best-effort delete the original listing (OK if your plan disallows it)
    try { /* @ts-ignore */ await tusky.file.delete(uploadId); } catch (e) {
      console.warn("[settle] delete original failed (OK to ignore):", (e as any)?.message);
    }

    // Optional: mint a receipt NFT to the seller or buyer (requires your Move fn)
    let mintedObjectId: string | null = null;
    if (process.env.SUI_ADMIN_SECRET && RECEIPT.packageId && RECEIPT.target && RECEIPT.adminCapId) {
      const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as "mainnet"|"testnet"|"devnet";
      const client = new SuiClient({ url: getFullnodeUrl(network) });
      const keypair = Ed25519Keypair.fromSecretKey(fromB64(process.env.SUI_ADMIN_SECRET!));
      const tx = new Transaction();
      tx.moveCall({
        target: `${RECEIPT.packageId}::${RECEIPT.target}`,
        arguments: [
          tx.object(RECEIPT.adminCapId),
          tx.pure.address(expected.seller),               // change to buyer if you parse it
          tx.pure.string(expected.title),
          tx.pure.string(expected.artist),
          tx.pure.u64(expectedAmount),
        ],
      });
      const r = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx, options: { showEffects: true } });
      mintedObjectId = r.effects?.created?.[0]?.reference?.objectId ?? null;
    }

    return NextResponse.json({ ok: true, mintedObjectId, verifySource: (v as any).source ?? "unknown" });
  } catch (e: any) {
    console.error("[settle] fatal", e);
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { fromB64 } from "@mysten/sui/utils";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Tusky } from "@tusky-io/ts-sdk";

// OPTIONAL: only if you want to mint a receipt NFT
const RECEIPT = {
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID!,           // your gift_cards package
  target: "loyalfan::mint_receipt",                         // entry fun you add (see Move sketch below)
  // If your mint function needs an AdminCap object id, put it here:
  adminCapId: process.env.SUI_ADMIN_CAP_ID || null,
};

// coin metadata for verification (same shape you used to post the listing)
const KNOWN_TYPES: Record<string, string[]> = {
  BILL: [ `${process.env.NEXT_PUBLIC_PACKAGE_ID}::bill::BILL` ],
  BTS:  [ `${process.env.NEXT_PUBLIC_PACKAGE_ID}::bts::BTS`  ],
  MARO: [ `${process.env.NEXT_PUBLIC_PACKAGE_ID}::maro::MARO` ],
  SABR: [ `${process.env.NEXT_PUBLIC_PACKAGE_ID}::sabr::SABR` ],
};

// helper: verify tx contained transfer owner->seller of coinType and amount
async function verifyPayment(params: {
  digest: string;
  expectedSeller: string;
  expectedCoinTypes: string[];     // accept any of these (handles legacy mint packages)
  expectedAmount: bigint;
}) {
  const { digest, expectedSeller, expectedCoinTypes, expectedAmount } = params;
  const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as "mainnet"|"testnet"|"devnet";
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  const tx = await client.getTransactionBlock({ digest, options: { showEffects: true, showEvents: true, showInput: true } });

  // A robust way is to read coin balance changes from effects:
  const changes = tx.balanceChanges ?? [];
  // Sum up increases for the seller across expected coin types
  let sellerIncrease = 0n;
  for (const ch of changes) {
    if (!expectedCoinTypes.includes(ch.coinType)) continue;
    if (ch.owner?.AddressOwner?.toLowerCase() !== expectedSeller.toLowerCase()) continue;
    sellerIncrease += BigInt(ch.amount); // positive if increased
  }
  return sellerIncrease >= expectedAmount;
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
        priceUnits: string;               // u64 string
        title: string;
      };
    };

    if (!uploadId || !digest || !expected?.seller || !expected?.coinType || !expected?.priceUnits) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    // 1) verify the payment actually happened
    const ok = await verifyPayment({
      digest,
      expectedSeller: expected.seller,
      expectedCoinTypes: KNOWN_TYPES[expected.artist] ?? [expected.coinType],
      expectedAmount: BigInt(expected.priceUnits),
    });
    if (!ok) {
      return NextResponse.json({ error: "payment not verified from digest" }, { status: 400 });
    }

    // 2) mark sold on Tusky (or delete)
    const tusky = await Tusky.init({ apiKey: process.env.TUSKY_API_KEY! });
    const vaultId = process.env.TUSKY_VAULT_ID!;
    // A) safer: upload a SOLD shadow record (immutable history)
    const soldDoc = {
      kind: "loyalfan",
      status: "sold",
      buyerDigest: digest,
      buyer: "unknown",                // can be inferred from tx if desired
      ...expected,                     // title, artist, coinType, priceUnits, seller
      settledAt: new Date().toISOString(),
      network: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
      sourceUploadId: uploadId,
    };
    const buf = Buffer.from(JSON.stringify(soldDoc));
    await tusky.file.upload(vaultId, buf, {
      name: `loyalfan-${expected.artist}-SOLD-${Date.now()}.json`,
      mimeType: "application/json",
    });

    // Optional B) if your plan allows, delete the original listing:
    try { /* @ts-ignore */ await tusky.file.delete(uploadId); } catch {}

    // 3) (optional) mint an NFT receipt to the buyer using server signer
    let mintedObjectId: string | null = null;
    if (process.env.SUI_ADMIN_SECRET && RECEIPT.packageId && RECEIPT.target) {
      const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as "mainnet"|"testnet"|"devnet";
      const client = new SuiClient({ url: getFullnodeUrl(network) });
      const keypair = Ed25519Keypair.fromSecretKey(fromB64(process.env.SUI_ADMIN_SECRET!)); // base64 32-byte secret

      // You can parse buyer address from tx effects if you want to record it precisely:
      // For brevity we pass seller/title/amount and mint to the tx sender as "buyer" param you extract client-side.

      const tx = new Transaction();
      // If your Move function signature is something like:
      // public entry fun mint_receipt(cap: &AdminCap, to: address, title: string, artist: string, amount: u64, ctx: &mut TxContext)
      const args = [
        tx.object(RECEIPT.adminCapId!),                     // AdminCap object
        tx.pure.address(expected.seller),                   // mint to seller? change to buyer once you parse buyer addr
        tx.pure.string(expected.title),
        tx.pure.string(expected.artist),
        tx.pure.u64(BigInt(expected.priceUnits)),
      ];
      tx.moveCall({ target: `${RECEIPT.packageId}::${RECEIPT.target}`, arguments: args });

      const result = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx, options: { showEffects: true } });
      // pull created object id (if your receipt is `has key`)
      const created = result.effects?.created?.[0]?.reference?.objectId;
      if (created) mintedObjectId = created;
    }

    return NextResponse.json({ ok: true, mintedObjectId }, { status: 200 });
  } catch (e: any) {
    console.error("settle error", e);
    return NextResponse.json({ error: e?.message || "internal error" }, { status: 500 });
  }
}
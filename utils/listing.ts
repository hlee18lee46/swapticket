// utils/listing.ts
import { Transaction } from "@mysten/sui/transactions";

type SignAndExecute = (input: {
  transaction: Transaction;
  chain?: string;
  options?: { showEffects?: boolean; showEvents?: boolean; showObjectChanges?: boolean };
}) => Promise<any>;

function extractListingId(res: any): string | null {
  // Prefer modern objectChanges
  const oc = res?.objectChanges ?? [];
  const c = oc.find((x: any) => x?.type === "created" && String(x.objectType || "").endsWith("::market::Listing"));
  if (c?.objectId) return c.objectId;

  // Fallback to legacy effects.created (shared object)
  const created = res?.effects?.created ?? [];
  const shared = created.find((x: any) => x?.owner?.Shared && x?.reference?.objectId);
  return shared?.reference?.objectId ?? null;
}

export async function createListing(
  packageId: string,
  ticketId: string,
  priceMist: bigint,
  signer: { signAndExecuteTransaction: SignAndExecute }
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::market::create_listing`,
    arguments: [tx.object(ticketId), tx.pure.u64(priceMist)],
  });
  tx.setGasBudget(20_000_000);

  const res = await signer.signAndExecuteTransaction({
    transaction: tx,
    chain: `sui:${process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"}`,
    options: { showEffects: true, showEvents: true, showObjectChanges: true },
  });

  const listingId = extractListingId(res);
  if (!listingId) throw new Error("Could not find created Listing object id.");

  return { digest: res?.digest ?? res?.effectsDigest ?? null, listingId };
}
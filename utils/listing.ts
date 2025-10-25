// utils/listing.ts
// Dual-support for both SDKs (Transaction or TransactionBlock)
import * as txns from "@mysten/sui.js/transactions";

function makeTx(): any {
  // If new SDK, construct Transaction; otherwise TransactionBlock
  return (txns as any).Transaction
    ? new (txns as any).Transaction()
    : new (txns as any).TransactionBlock();
}

export async function createListing(
  packageId: string,
  ticketId: string,
  price: bigint,
  signer: { signAndExecuteTransaction: (args: any) => Promise<any> }
) {
  const tx = makeTx();

  // argument builders differ slightly between SDKs; normalize:
  const isNew = Boolean((txns as any).Transaction);
  const obj   = isNew ? (tx as any).object(ticketId)  : (tx as any).object(ticketId);
  const u64   = isNew ? (tx as any).pure.u64(price)   : (tx as any).pure(price, "u64");

  (tx as any).moveCall({
    target: `${packageId}::market::create_listing`,
    arguments: [obj, u64],
  });

  // optional
  if ((tx as any).setGasBudget) (tx as any).setGasBudget(20_000_000);

  return signer.signAndExecuteTransaction({
    transaction: tx,
    chain: "sui:testnet",           // change if you’re on mainnet
    options: { showEffects: true, showEvents: true },
  });
}
// utils/market.ts
import { Transaction } from "@mysten/sui/transactions";

type SignAndExecute = (input: {
  transaction: Transaction;
  chain?: string;
  options?: { showEffects?: boolean; showEvents?: boolean; showObjectChanges?: boolean };
}) => Promise<any>;

export async function buyListing(
  packageId: string,
  listingId: string,
  priceMist: bigint,
  signer: { signAndExecuteTransaction: SignAndExecute }
) {
  const tx = new Transaction();

  // Pay exact price in MIST from gas
  const payment = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);

  tx.moveCall({
    target: `${packageId}::market::buy`,
    arguments: [tx.object(listingId), payment],
  });

  tx.setGasBudget(20_000_000);

  return signer.signAndExecuteTransaction({
    transaction: tx,
    chain: `sui:${process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"}`,
    options: { showEffects: true, showEvents: true, showObjectChanges: true },
  });
}
// utils/buy.ts
import { Transaction } from "@mysten/sui/transactions";

type SignAndExecute = (args: {
  transaction: Transaction;
  chain?: string;
  options?: { showEffects?: boolean; showEvents?: boolean };
}) => Promise<any>;

export async function buyListing(
  packageId: string,
  listingId: string,
  priceMist: bigint,
  signer: { signAndExecuteTransaction: SignAndExecute },
) {
  const tx = new Transaction();

  // split exact amount from gas into a Coin<SUI>
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);

  // pass Listing object (shared) + payment coin
  tx.moveCall({
    target: `${packageId}::market::buy`,
    arguments: [tx.object(listingId), payment],
  });

  return signer.signAndExecuteTransaction({
    transaction: tx,
    chain: `sui:${process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"}`,
    options: { showEffects: true, showEvents: true },
  });
}
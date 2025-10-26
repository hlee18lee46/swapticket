import { Transaction } from "@mysten/sui/transactions";

type SignAndExecuteTransaction = (input: {
  transaction: Transaction;
  chain?: string;
  options?: {
    showEffects?: boolean;
    showEvents?: boolean;
  };
}) => Promise<any>;

export async function createListing(
  packageId: string,
  ticketId: string,
  price: bigint,
  signer: { signAndExecuteTransaction: SignAndExecuteTransaction }
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::market::create_listing`,
    arguments: [
      tx.object(ticketId),
      tx.pure.u64(price),
    ],
  });

  // Set gas budget if needed
  tx.setGasBudget(20_000_000);

  return signer.signAndExecuteTransaction({
    transaction: tx,
    chain: `sui:${process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"}`,
    options: { 
      showEffects: true, 
      showEvents: true 
    },
  });
}
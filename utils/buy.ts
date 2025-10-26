// utils/buy.ts
import { Transaction } from "@mysten/sui/transactions";

type SignAndExecute = (input: {
  transaction: Transaction;
  chain?: string;
  options?: { showEffects?: boolean; showEvents?: boolean };
}) => Promise<any>;

/**
 * Adjust target and arguments to match your Move entrypoint.
 * Common pattern: public entry fun buy(ticket: Ticket, payment: Coin<SUI>, ctx: &mut TxContext)
 */
export async function buyListing(
  packageId: string,
  ticketId: string,
  priceMist: bigint,
  signer: { signAndExecuteTransaction: SignAndExecute },
) {
  const tx = new Transaction();

  // Pay in SUI (MIST) out of gas coin
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);

  // If your market works on a Listing object instead of a raw Ticket,
  // change tx.object(ticketId) to the listing id.
  tx.moveCall({
    target: `${packageId}::market::buy`,
    arguments: [tx.object(ticketId), payment],
  });

  return signer.signAndExecuteTransaction({
    transaction: tx,
    chain: `sui:${process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"}`,
    options: { showEffects: true, showEvents: true },
  });
}
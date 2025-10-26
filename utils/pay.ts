// utils/pay.ts
import { Transaction } from "@mysten/sui/transactions";
import { sui } from "@/lib/sui";

type SignAndExecute = (input: {
  transaction: Transaction;
  chain?: string;
  options?: { showEffects?: boolean; showEvents?: boolean };
}) => Promise<any>;

export async function payWithCoin(opts: {
  owner: string;                 // connected wallet (sender)
  coinType: string;              // fully qualified: 0x...::mod::SYMBOL
  amount: bigint;                // base units (u64)
  recipient: string;             // 0x... address
  signAndExecute: SignAndExecute;
}) {
  const { owner, coinType, amount, recipient, signAndExecute } = opts;

  if (!owner) throw new Error("Missing owner (sender) address");
  if (!recipient) throw new Error("Missing recipient address");
  if (amount <= 0n) throw new Error("Amount must be greater than 0");
  if (!coinType.includes("::")) throw new Error(`Invalid coin type: ${coinType}`);

  // Gather enough coins of the requested type
  let cursor: string | null | undefined = undefined;
  const coins: { coinObjectId: string; balance: bigint }[] = [];
  let total = 0n;

  do {
    const page = await sui.getCoins({ owner, coinType, cursor, limit: 50 });
    for (const c of page.data ?? []) {
      const bal = BigInt(c.balance ?? "0");
      coins.push({ coinObjectId: c.coinObjectId, balance: bal });
      total += bal;
      if (total >= amount) break;
    }
    cursor = page.nextCursor;
  } while (cursor && total < amount);

  if (coins.length === 0) {
    throw new Error(`No coins of type ${coinType} found for ${owner}`);
  }
  if (total < amount) {
    throw new Error(
      `Insufficient balance of ${coinType}. Need ${amount}, have ${total}`
    );
  }

  // Build tx: merge -> split -> transfer
  const tx = new Transaction();

  // Make coin objects
  const coinObjs = coins.map((c) => tx.object(c.coinObjectId));
  const primary = coinObjs[0];

  if (coinObjs.length > 1) {
    tx.mergeCoins(primary, coinObjs.slice(1)); // only call if there are extras
  }

  // Split exactly one output for the payment amount
  const [payment] = tx.splitCoins(primary, [tx.pure.u64(amount)]);

  // Send payment to recipient
  tx.transferObjects([payment], tx.pure.address(recipient));

  // Let wallet set sender automatically; just be sure chain matches your env
  const chain = `sui:${process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"}`;

  return signAndExecute({
    transaction: tx,
    chain,
    options: { showEffects: true, showEvents: true },
  });
}
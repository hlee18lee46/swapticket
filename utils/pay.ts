// utils/pay.ts
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

export async function payWithCoin(opts: {
  owner: string;   // connected wallet address (used only for coin lookup)
  coinType: string;
  amount: bigint;  // base units
  recipient: string;
  signAndExecute: (input: { transaction: Transaction; chain?: string }) => Promise<any>;
}) {
  const { owner, coinType, amount, recipient, signAndExecute } = opts;
  if (amount <= 0n) throw new Error("Amount must be > 0");

  const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as
    | "mainnet" | "testnet" | "devnet";
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  // 1) Get coins of that type for the connected owner
  const { data: coins = [] } = await client.getCoins({ owner, coinType, limit: 200 });
  if (!coins.length) {
    throw new Error(`No coins of type ${coinType} for ${owner}`);
  }

  // 2) Pick ONE coin that already has enough to cover amount — no merges
  const bigEnough = coins.find(c => BigInt(c.balance) >= amount);
  if (!bigEnough) {
    // (Optional) You could fall back to merging here, but we avoid it to reduce mismatch risk.
    const total = coins.reduce((acc, c) => acc + BigInt(c.balance), 0n);
    throw new Error(
      `Insufficient balance: have ${total.toString()}, need ${amount.toString()} (${coinType}).`
    );
  }

  // 3) Build tx WITHOUT setting sender (wallet will inject it)
  const tx = new Transaction();
  const [toSend] = tx.splitCoins(tx.object(bigEnough.coinObjectId), [amount]);
  tx.transferObjects([toSend], tx.pure.address(recipient));

  // Don’t set gas budget or sender — let wallet handle them
  return signAndExecute({
    transaction: tx,
    chain: `sui:${network}`,
  });
}
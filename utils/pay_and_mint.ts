import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { getFullnodeUrl } from "@mysten/sui/client";

type SignAndExecute = (input: {
  transaction: Transaction;
  chain?: string;
  options?: { showEffects?: boolean; showEvents?: boolean };
}) => Promise<any>;

export async function payAndMintReceipt(params: {
  owner: string;
  coinType: string;         // resolved type the wallet actually holds
  amount: bigint;           // base units to pay
  seller: string;
  artist: string;           // e.g. "BILL"
  title: string;
  packageId: string;        // gift_cards package id (fresh after publish)
  signAndExecute: SignAndExecute;
}) {
  const { owner, coinType, amount, seller, artist, title, packageId, signAndExecute } = params;

  const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as "mainnet"|"testnet"|"devnet";
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  if (amount <= 0n) throw new Error("Amount must be > 0");

  // 1) collect coins of that type
  const coins: string[] = [];
  let total = 0n;
  let cursor: string | null = null;
  while (total < amount) {
    const page = await client.getCoins({ owner, coinType, cursor, limit: 50 });
    for (const c of page.data) {
      coins.push(c.coinObjectId);
      total += BigInt(c.balance);
      if (total >= amount) break;
    }
    if (!page.hasNextPage) break;
    cursor = page.nextCursor ?? null;
  }
  if (total < amount) throw new Error(`Not enough ${coinType} to pay`);

  // 2) build tx
  const tx = new Transaction();

  // merge all coins to one
  const primary = tx.object(coins[0]);
  for (let i = 1; i < coins.length; i++) {
    tx.mergeCoins(primary, [tx.object(coins[i])]);
  }

  // split exact payment
  const paySplit = tx.splitCoins(primary, [tx.pure.u64(amount)]);

  // transfer payment to seller
  tx.transferObjects([paySplit], tx.pure.address(seller));

  // OPTIONAL: send change (primary) back to owner explicitly (not required if gas coin equals primary, but good hygiene)
  tx.transferObjects([primary], tx.pure.address(owner));

  // 3) mint receipt NFT in same tx
  const coinTicker = coinType.split("::").pop() || "COIN";
  const nowMs = BigInt(Date.now());

  tx.moveCall({
    target: `${packageId}::receipt::mint_receipt`,
    arguments: [
      tx.pure.address(owner),        // mint to buyer (owner)
      tx.pure.address(seller),
      tx.pure.string(artist),
      tx.pure.string(title),
      tx.pure.string(coinTicker),
      tx.pure.u64(amount),
      tx.pure.u64(nowMs),
    ],
  });

  tx.setGasBudget(30_000_000);

  return signAndExecute({
    transaction: tx,
    chain: `sui:${network}`,
    options: { showEffects: true, showEvents: true },
  });
}
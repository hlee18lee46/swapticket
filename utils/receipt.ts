// utils/receipt.ts
import { Transaction } from "@mysten/sui/transactions";

type MintArgs = {
  pkg: string;                 // NEXT_PUBLIC_PACKAGE_ID
  buyer: string;               // account.address
  seller: string;
  artist: string;
  title: string;
  coinTicker: string;          // e.g. "BILL"
  amountUnits: bigint;         // base units
  signAndExecute: (tx: Transaction) => Promise<any>; // via dapp-kit mutateAsync wrapper
};

export async function mintReceipt(args: MintArgs) {
  const { pkg, buyer, seller, artist, title, coinTicker, amountUnits, signAndExecute } = args;

  const tx = new Transaction();
  // public fun mint_receipt(to: address, seller: address, artist: String, title: String, coin: String, amount: u64, now_ms: u64, ctx: &mut TxContext)
  tx.moveCall({
    target: `${pkg}::receipt::mint_receipt`,
    arguments: [
      tx.pure.address(buyer),
      tx.pure.address(seller),
      tx.pure.string(artist),
      tx.pure.string(title),
      tx.pure.string(coinTicker),
      tx.pure.u64(amountUnits),
      tx.pure.u64(BigInt(Date.now())),
    ],
  });

  return signAndExecute(tx);
}
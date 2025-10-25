// utils/mint-tickets.ts
import { Transaction } from "@mysten/sui/transactions";

type MintCtx = {
  packageId: string;
  seller: string; // recipient address
  // The mutate function from useSignAndExecuteTransaction
  signAndExecute: (args: { transaction: Transaction }) => Promise<any>;
};

// Keep your 4 artists; tweak names/venues/dates as you like
const ARTISTS = [
  { code: 1, name: "SABR", venue: "Blue Hall",  date: 1_735_680_000 },
  { code: 2, name: "BILL", venue: "Green Dome", date: 1_735_680_000 },
  { code: 3, name: "BTS",  venue: "Main Arena", date: 1_735_680_000 },
  { code: 4, name: "MARO", venue: "City Park",  date: 1_735_680_000 },
] as const;

// Batch helper: submit up to `N` seats per transaction to avoid oversized tx
async function mintBatch(
  { packageId, seller, signAndExecute }: MintCtx,
  artist: typeof ARTISTS[number],
  seats: number[],
) {
  const tx = new Transaction();
  for (const seat of seats) {
    tx.moveCall({
      target: `${packageId}::ticket::mint_ticket`,
      arguments: [
        tx.pure.u8(artist.code),
        tx.pure.u32(seat),
        tx.pure.string(artist.name),
        tx.pure.string(artist.venue),
        tx.pure.u64(artist.date),
        tx.pure.address(seller),   // assumes your Move fn takes `recipient: address`
      ],
    });
  }
  return signAndExecute({ transaction: tx });
}

/**
 * Mints 10 tickets per artist to the seller, batching per-artist to avoid tx size limits.
 * Total = 40 mints (4 artists × 10 seats).
 */
export async function mintTicketsForAllArtists(ctx: MintCtx) {
  // seats 1..10
  const seats = Array.from({ length: 10 }, (_, i) => i + 1);

  for (const artist of ARTISTS) {
    // One tx per artist (10 calls per tx) — safe size
    await mintBatch(ctx, artist, seats);
  }
}
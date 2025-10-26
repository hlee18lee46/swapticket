import { Transaction } from "@mysten/sui/transactions";

type SignAndExecute = (input: { transaction: Transaction }) => Promise<any>;

type Artist = {
  code: number;   // u8 on-chain
  name: string;
  venue: string;
  date: bigint;   // u64 unix seconds
};

type MintCtx = {
  packageId: string;
  seller: string;
  signAndExecute: SignAndExecute;
  seatsPerArtist?: number; // default 1
  price?: bigint;          // u64 MIST (default 0n)
  getMetadataUrl?: (args: { artist: Artist; seat: number }) => Promise<string> | string;
};

// ---------- helpers ----------
function reqStr(label: string, v: unknown): string {
  if (typeof v !== "string") throw new Error(`${label} must be a string`);
  const s = v.trim();
  if (!s) throw new Error(`${label} cannot be empty`);
  return s;
}
function toUnixSecsU64(v: number | bigint | Date): bigint {
  if (v instanceof Date) return BigInt(Math.floor(v.getTime() / 1000));
  if (typeof v === "number") return BigInt(Math.floor(v));
  if (typeof v === "bigint") return v;
  throw new Error("date must be number | bigint | Date");
}
// BCS-encode string (fallback if tx.pure.string misbehaves in some bundlers)
function bcsString(str: string): Uint8Array {
  const utf8 = new TextEncoder().encode(str);
  const len = utf8.length;
  if (len < 128) {
    const out = new Uint8Array(1 + len);
    out[0] = len;
    out.set(utf8, 1);
    return out;
  }
  const lenBytes: number[] = [];
  let n = len;
  while (n >= 128) {
    lenBytes.push((n & 0x7f) | 0x80);
    n >>= 7;
  }
  lenBytes.push(n);
  const out = new Uint8Array(lenBytes.length + len);
  out.set(lenBytes, 0);
  out.set(utf8, lenBytes.length);
  return out;
}
function pureString(tx: Transaction, s: string) {
  try {
    return (tx.pure as any).string(s);
  } catch {
    return (tx.pure as any)(bcsString(s));
  }
}

// ---------- catalog (edit freely) ----------
const ARTISTS: Artist[] = [
  { code: 1, name: "SABR", venue: "Seoul Olympic Gymnastics Arena", date: toUnixSecsU64(new Date("2025-12-01T19:00:00Z")) },
  { code: 2, name: "BILL", venue: "Crypto.com Arena, Los Angeles",  date: toUnixSecsU64(new Date("2025-12-05T20:00:00Z")) },
  { code: 3, name: "BTS",  venue: "Jamsil Olympic Stadium, Seoul",  date: toUnixSecsU64(new Date("2025-12-10T19:30:00Z")) },
  { code: 4, name: "MARO", venue: "Tokyo Dome",                    date: toUnixSecsU64(new Date("2025-12-15T18:30:00Z")) },
];

// ---------- mint seat (4-arg) ----------
async function mintSeat(
  ctx: MintCtx,
  artist: Artist,
  seat: number,
) {
  const pkg = reqStr("packageId", ctx.packageId);
  const seller = reqStr("seller", ctx.seller);
  const price = ctx.price ?? 0n;

  const metadataUrl =
    (await ctx.getMetadataUrl?.({ artist, seat })) ??
    `https://example.com/metadata/${artist.code}-${seat}.json`;

  const tx = new Transaction();
  // gift_cards::ticket::mint_ticket(artist, price, metadata_url, recipient, ctx)
  tx.moveCall({
    target: `${pkg}::ticket::mint_ticket`,
    arguments: [
      tx.pure.u8(artist.code),
      tx.pure.u64(price),
      pureString(tx, metadataUrl),
      tx.pure.address(seller),
    ],
  });

  await ctx.signAndExecute({ transaction: tx });
}

/** Mint N seats per artist (default 1). */
export async function mintTicketsForAllArtists(ctx: MintCtx) {
  const seatsPerArtist = ctx.seatsPerArtist ?? 1;
  for (const artist of ARTISTS) {
    for (let seat = 1; seat <= seatsPerArtist; seat++) {
      await mintSeat(ctx, artist, seat);
    }
  }
}
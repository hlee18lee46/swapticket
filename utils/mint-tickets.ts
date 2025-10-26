import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

type SignAndExecute = (input: { transaction: Transaction }) => Promise<any>;

type MintCtx = {
  packageId: string;
  seller: string;
  signAndExecute: SignAndExecute;
  network?: "testnet" | "mainnet" | "devnet" | (string & {});
  getMetadataUrl?: (args: { artist: typeof ARTISTS[number]; seat: number }) => string;
};

// ---------- small helpers ----------
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
  throw new Error("event_date must be number | bigint | Date");
}

// Manual BCS string encoding to work around SDK bug
function bcsString(str: string): Uint8Array {
  const utf8 = new TextEncoder().encode(str);
  const len = utf8.length;
  
  // BCS encodes length as ULEB128, but for strings < 128 chars, it's just one byte
  if (len < 128) {
    const result = new Uint8Array(1 + len);
    result[0] = len;
    result.set(utf8, 1);
    return result;
  }
  
  // For longer strings, encode length as ULEB128
  const lenBytes: number[] = [];
  let n = len;
  while (n >= 128) {
    lenBytes.push((n & 0x7f) | 0x80);
    n >>= 7;
  }
  lenBytes.push(n);
  
  const result = new Uint8Array(lenBytes.length + len);
  result.set(lenBytes, 0);
  result.set(utf8, lenBytes.length);
  return result;
}

// ---------- on-chain signature detection ----------
type MintVariant = "rich7" | "rich6" | "legacy";

async function detectMintVariant(client: SuiClient, pkg: string): Promise<MintVariant> {
  const normalized = await client.getNormalizedMoveFunction({
    package: pkg,
    module: "ticket",
    function: "mint_ticket",
  });

  const pureCount = normalized.parameters.length - 1;
  
  if (pureCount === 7) return "rich7";
  if (pureCount === 6) return "rich6";
  if (pureCount === 3) return "legacy";

  throw new Error(
    `Unknown ticket::mint_ticket signature with ${pureCount} pure args; expected 7, 6, or 3.`,
  );
}

// ---------- your catalog ----------
const ARTISTS = [
  {
    code: 1,
    name: "SABR",
    venue: "Seoul Olympic Gymnastics Arena",
    date: toUnixSecsU64(new Date("2025-12-01T19:00:00Z")),
  },
  {
    code: 2,
    name: "BILL",
    venue: "Crypto.com Arena, Los Angeles",
    date: toUnixSecsU64(new Date("2025-12-05T20:00:00Z")),
  },
  {
    code: 3,
    name: "BTS",
    venue: "Jamsil Olympic Stadium, Seoul",
    date: toUnixSecsU64(new Date("2025-12-10T19:30:00Z")),
  },
  {
    code: 4,
    name: "MARO",
    venue: "Tokyo Dome",
    date: toUnixSecsU64(new Date("2025-12-15T18:30:00Z")),
  },
] as const;

// ---------- core minting ----------
async function mintBatchForArtist(
  ctx: MintCtx,
  variant: MintVariant,
  artist: typeof ARTISTS[number],
  count = 10
) {
  const pkg = reqStr("packageId", ctx.packageId);
  const seller = reqStr("seller", ctx.seller);

  const artistName = reqStr("artist_name", artist.name);
  const venue = reqStr("venue", artist.venue);
  const eventDateU64 = toUnixSecsU64(artist.date);

  const tx = new Transaction();

  for (let seat = 1; seat <= count; seat++) {
    if (variant === "rich7") {
      const metadataUrl = ctx.getMetadataUrl?.({ artist, seat }) ?? 
        `https://example.com/metadata/${artist.code}-${seat}.json`;
      
      tx.moveCall({
        target: `${pkg}::ticket::mint_ticket`,
        arguments: [
          tx.pure.u8(artist.code),
          tx.pure.u32(seat),
          tx.pure(bcsString(artistName)),
          tx.pure(bcsString(venue)),
          tx.pure.u64(eventDateU64),
          tx.pure(bcsString(metadataUrl)),
          tx.pure.address(seller),
        ],
      });
    } else if (variant === "rich6") {
      tx.moveCall({
        target: `${pkg}::ticket::mint_ticket`,
        arguments: [
          tx.pure.u8(artist.code),
          tx.pure.u32(seat),
          tx.pure(bcsString(artistName)),
          tx.pure(bcsString(venue)),
          tx.pure.u64(eventDateU64),
          tx.pure.address(seller),
        ],
      });
    } else {
      tx.moveCall({
        target: `${pkg}::ticket::mint_ticket`,
        arguments: [
          tx.pure.u8(artist.code),
          tx.pure.u64(0n),
          tx.pure.address(seller),
        ],
      });
    }
  }

  await ctx.signAndExecute({ transaction: tx });
}

/** Public: mint 10 tickets per artist to seller. */
export async function mintTicketsForAllArtists(ctx: MintCtx, ticketsPerArtist = 10) {
  const pkg = reqStr("packageId", ctx.packageId);
  const network = (ctx.network ?? (process.env.NEXT_PUBLIC_SUI_NETWORK as any) ?? "testnet") as
    | "testnet"
    | "mainnet"
    | "devnet"
    | (string & {});

  const client = new SuiClient({ url: getFullnodeUrl(network as any) });

  const variant = await detectMintVariant(client, pkg);

  for (const artist of ARTISTS) {
    await mintBatchForArtist(ctx, variant, artist, ticketsPerArtist);
  }
}
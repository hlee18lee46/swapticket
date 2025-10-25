import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

type SignAndExecute = (input: { transaction: Transaction }) => Promise<any>;

type MintCtx = {
  packageId: string;              // NEXT_PUBLIC_PACKAGE_ID
  seller: string;                 // NEXT_PUBLIC_SELLER_ADDRESS
  signAndExecute: SignAndExecute; // from useSignAndExecuteTransaction
  network?: "testnet" | "mainnet" | "devnet" | (string & {});
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

// ---------- on-chain signature detection ----------
type MintVariant = "rich" | "legacy";

async function detectMintVariant(client: SuiClient, pkg: string): Promise<MintVariant> {
  // Get normalized function signature
  const mod = "ticket";
  const func = "mint_ticket";
  const normalized = await client.getNormalizedMoveFunction({
    package: pkg,
    module: mod,
    function: func,
  });

  // We only care about arg count/types at the beginning.
  // rich: 6 pure args (u8, u32, string, string, u64, address) + TxContext
  // legacy: 3 pure args (u8, u64, address) + TxContext
  const params = normalized.parameters; // array of types
  // last param is &mut TxContext in both versions
  const pureCount = params.length - 1;

  if (pureCount === 6) return "rich";
  if (pureCount === 3) return "legacy";

  throw new Error(
    `Unknown ticket::mint_ticket signature with ${pureCount} pure args; expected 6 (rich) or 3 (legacy).`,
  );
}

// ---------- your catalog ----------
const ARTISTS = [
  {
    code: 1, // SABR
    name: "SABR",
    venue: "Seoul Olympic Gymnastics Arena",
    date: toUnixSecsU64(new Date("2025-12-01T19:00:00Z")),
  },
  {
    code: 2, // BILL
    name: "BILL",
    venue: "Crypto.com Arena, Los Angeles",
    date: toUnixSecsU64(new Date("2025-12-05T20:00:00Z")),
  },
  {
    code: 3, // BTS
    name: "BTS",
    venue: "Jamsil Olympic Stadium, Seoul",
    date: toUnixSecsU64(new Date("2025-12-10T19:30:00Z")),
  },
  {
    code: 4, // MARO
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
    if (variant === "rich") {
      // (u8, u32, String, String, u64, address, ctx)
      tx.moveCall({
        target: `${pkg}::ticket::mint_ticket`,
        arguments: [
          tx.pure.u8(artist.code),
          tx.pure.u32(seat),
          tx.pure.string(artistName),
          tx.pure.string(venue),
          tx.pure.u64(eventDateU64),
          tx.pure.address(seller),
        ],
      });
    } else {
      // legacy: (u8, u64(price), address, ctx)
      // choose a default "price" for legacy mint; adjust if needed
      const price = 0n;
      tx.moveCall({
        target: `${pkg}::ticket::mint_ticket`,
        arguments: [
          tx.pure.u8(artist.code),
          tx.pure.u64(price),
          tx.pure.address(seller),
        ],
      });
    }
  }

  await ctx.signAndExecute({ transaction: tx });
}

/** Public: mint 10 tickets per artist to seller. */
export async function mintTicketsForAllArtists(ctx: MintCtx) {
  const pkg = reqStr("packageId", ctx.packageId);
  const network = (ctx.network ?? (process.env.NEXT_PUBLIC_SUI_NETWORK as any) ?? "testnet") as
    | "testnet"
    | "mainnet"
    | "devnet"
    | (string & {});

  const client = new SuiClient({ url: getFullnodeUrl(network as any) });

  const variant = await detectMintVariant(client, pkg);

  for (const artist of ARTISTS) {
    await mintBatchForArtist(ctx, variant, artist, 10);
  }
}
// utils/coins.ts
import { sui } from "@/lib/sui";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

export const PKG = process.env.NEXT_PUBLIC_PACKAGE_ID!; // <= your new package:
// 0x135c6f6aec2baa0702119e95c3dd25af277617c1e17e6e6a3480ea16b5e4dccc

// Put the CURRENT package first, then legacy ones you might still see in old JSON
export const KNOWN_TYPES: Record<"SABR"|"BILL"|"BTS"|"MARO", string[]> = {
  SABR: [
    `${PKG}::sabr::SABR`,
    "0x55f2580450c8c1ffc587f27173a633614dec3e2c9ff3f97986f9c22e6b388384::sabr::SABR",
    "0x32ce0a9f5153513ced41d0eb9f7e36aa0f9c4bc0806f1775f8e30bc3f31cc51f::sabr::SABR",
  ],
  BILL: [
    `${PKG}::bill::BILL`,
    "0x55f2580450c8c1ffc587f27173a633614dec3e2c9ff3f97986f9c22e6b388384::bill::BILL",
    "0x32ce0a9f5153513ced41d0eb9f7e36aa0f9c4bc0806f1775f8e30bc3f31cc51f::bill::BILL",
  ],
  BTS: [
    `${PKG}::bts::BTS`,
    "0x55f2580450c8c1ffc587f27173a633614dec3e2c9ff3f97986f9c22e6b388384::bts::BTS",
    "0x32ce0a9f5153513ced41d0eb9f7e36aa0f9c4bc0806f1775f8e30bc3f31cc51f::bts::BTS",
  ],
  MARO: [
    `${PKG}::maro::MARO`,
    "0x55f2580450c8c1ffc587f27173a633614dec3e2c9ff3f97986f9c22e6b388384::maro::MARO",
    "0x32ce0a9f5153513ced41d0eb9f7e36aa0f9c4bc0806f1775f8e30bc3f31cc51f::maro::MARO",
  ],
};

// Resolve which coin *type* the wallet actually holds enough of.
// Prefer using total balance; fall back to summing coins if needed.
export async function resolveHeldCoinType(
  owner: string,
  candidates: string[],
  minAmount: bigint,
): Promise<string | null> {
  for (const type of candidates) {
    try {
      // Fast path: total balance for that coin type
      const bal = await sui.getBalance({ owner, coinType: type });
      const total = BigInt(bal.totalBalance ?? "0");
      if (total >= minAmount) return type;
    } catch {
      // Fallback: sum balances from first few pages if getBalance isn’t available
      let cursor: string | null | undefined = undefined;
      let total = 0n;
      do {
        const page = await sui.getCoins({ owner, coinType: type, cursor, limit: 50 });
        for (const c of page.data ?? []) total += BigInt(c.balance ?? "0");
        cursor = page.nextCursor;
      } while (cursor && total < minAmount);
      if (total >= minAmount) return type;
    }
  }
  return null;
}

// ------- decimals & formatting -------

const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as
  | "testnet" | "mainnet" | "devnet" | (string & {});
const client = new SuiClient({ url: getFullnodeUrl(network as any) });

const DECIMALS_CACHE = new Map<string, number>();

export async function getCoinDecimals(coinType: string): Promise<number> {
  if (DECIMALS_CACHE.has(coinType)) return DECIMALS_CACHE.get(coinType)!;
  const meta = await client.getCoinMetadata({ coinType });
  const dec = meta?.decimals ?? 9;
  DECIMALS_CACHE.set(coinType, dec);
  return dec;
}

export function formatUnits(amount: bigint, decimals: number): string {
  const neg = amount < 0n;
  let n = neg ? -amount : amount;
  if (decimals === 0) return (neg ? "-" : "") + n.toString();
  const base = 10n ** BigInt(decimals);
  const whole = n / base;
  const frac = n % base;
  let fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return (neg ? "-" : "") + (fracStr ? `${whole}.${fracStr}` : whole.toString());
}
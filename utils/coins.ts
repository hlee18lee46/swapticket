// utils/coins.ts
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
// utils/coins.ts
import { sui } from "@/lib/sui";

export const KNOWN_TYPES: Record<"SABR"|"BILL"|"BTS"|"MARO", string[]> = {
  SABR: [
    "0x32ce0a9f5153513ced41d0eb9f7e36aa0f9c4bc0806f1775f8e30bc3f31cc51f::sabr::SABR",
    "0x55f2580450c8c1ffc587f27173a633614dec3e2c9ff3f97986f9c22e6b388384::sabr::SABR",
  ],
  BILL: [
    "0x32ce0a9f5153513ced41d0eb9f7e36aa0f9c4bc0806f1775f8e30bc3f31cc51f::bill::BILL",
    "0x55f2580450c8c1ffc587f27173a633614dec3e2c9ff3f97986f9c22e6b388384::bill::BILL",
  ],
  BTS:  [
    "0x32ce0a9f5153513ced41d0eb9f7e36aa0f9c4bc0806f1775f8e30bc3f31cc51f::bts::BTS",
    "0x55f2580450c8c1ffc587f27173a633614dec3e2c9ff3f97986f9c22e6b388384::bts::BTS",
  ],
  MARO: [
    "0x32ce0a9f5153513ced41d0eb9f7e36aa0f9c4bc0806f1775f8e30bc3f31cc51f::maro::MARO",
    "0x55f2580450c8c1ffc587f27173a633614dec3e2c9ff3f97986f9c22e6b388384::maro::MARO",
  ],
};

export async function resolveHeldCoinType(
  owner: string,
  candidates: string[],
  minAmount: bigint,
): Promise<string | null> {
  for (const type of candidates) {
    const { data } = await sui.getCoins({ owner, coinType: type, limit: 1 });
    const balance = (data?.[0]?.balance && BigInt(data[0].balance)) || 0n;
    if (balance >= minAmount) return type;
  }
  return null;
}
const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as
  | "testnet" | "mainnet" | "devnet" | (string & {});

const client = new SuiClient({ url: getFullnodeUrl(network as any) });

const DECIMALS_CACHE = new Map<string, number>();

export async function getCoinDecimals(coinType: string): Promise<number> {
  if (DECIMALS_CACHE.has(coinType)) return DECIMALS_CACHE.get(coinType)!;
  const meta = await client.getCoinMetadata({ coinType });
  // default to 9 if unknown
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
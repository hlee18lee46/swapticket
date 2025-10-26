// utils/pay.ts
import { Transaction } from "@mysten/sui/transactions";
import { sui } from "@/lib/sui";

// cache for coin metadata requests
const metaCache = new Map<string, { decimals: number; symbol?: string; name?: string }>();

export async function getCoinMetadataCached(coinType: string) {
  if (metaCache.has(coinType)) return metaCache.get(coinType)!;
  try {
    const meta = await sui.getCoinMetadata({ coinType });
    const out = {
      decimals: meta?.decimals ?? 9,
      symbol: meta?.symbol ?? undefined,
      name: meta?.name ?? undefined,
    };
    metaCache.set(coinType, out);
    return out;
  } catch {
    const out = { decimals: 9, symbol: undefined, name: undefined };
    metaCache.set(coinType, out);
    return out;
  }
}

export function formatUnits(amount: bigint, decimals = 9): string {
  const base = BigInt(10) ** BigInt(decimals);
  const whole = amount / base;
  const frac = amount % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

async function pickSingleCoinWithBalance(
  owner: string,
  coinType: string,
  minAmount: bigint,
): Promise<{ coinObjectId: string; balance: bigint } | null> {
  let next: string | null = null;
  do {
    const page = await sui.getCoins({ owner, coinType, cursor: next ?? undefined, limit: 50 });
    for (const c of page.data ?? []) {
      const bal = BigInt(c.balance);
      if (bal >= minAmount) {
        return { coinObjectId: c.coinObjectId, balance: bal };
      }
    }
    next = page.nextCursor ?? null;
  } while (next);
  return null;
}

type SignAndExecute = (input: { transaction: Transaction }) => Promise<any>;

/**
 * Transfer `amount` units of `coinType` to `recipient`.
 * Requires at least one coin object with sufficient balance.
 */
export async function payWithCoin(args: {
  coinType: string;
  amount: bigint;
  recipient: string;
  signAndExecute: SignAndExecute;
}) {
  const { coinType, amount, recipient, signAndExecute } = args;

  // who is the payer? (current wallet)
  // We can discover from sui client if needed, but dapp-kit signs with active account.
  // For selecting a coin we need the address — we can query via /sui.system.getLatestSuiSystemState? No.
  // In practice, passively rely on the active account in the wallet; however, getCoins needs owner address.
  // Workaround: require wallet/extension to provide account; caller component knows account.address.
  // For simplicity, throw if we can't infer.
  const owner = (window as any).__suiActiveAddress as string | undefined;
  // If you store account.address in context, consider threading it here instead.

  // If the component doesn’t set window.__suiActiveAddress, do it there (see note in component).
  if (!owner) {
    throw new Error("Missing active owner address for coin selection.");
  }

  const coin = await pickSingleCoinWithBalance(owner, coinType, amount);
  if (!coin) {
    const meta = await getCoinMetadataCached(coinType);
    throw new Error(
      `No single ${coinType} coin has enough balance. Need ${formatUnits(amount, meta.decimals)} units. ` +
      `Consolidate coins or receive more of this coin.`
    );
  }

  const tx = new Transaction();
  const coinInput = tx.object(coin.coinObjectId);
  const [toSend] = tx.splitCoins(coinInput, [tx.pure.u64(amount)]);
  tx.transferObjects([toSend], tx.pure.address(recipient));

  tx.setGasBudget(20_000_000);

  return signAndExecute({ transaction: tx });
}
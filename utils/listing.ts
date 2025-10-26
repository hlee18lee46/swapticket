// utils/listing.ts
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

type SignAndExecuteTransaction = (input: {
  transaction: Transaction;
  chain?: string;
  options?: {
    showEffects?: boolean;
    showEvents?: boolean;
    showObjectChanges?: boolean;
  };
}) => Promise<any>;

function findCreatedOfType(res: any, fullType: string): string | null {
  const changes: any[] = res?.objectChanges || res?.effects?.objectChanges || [];
  for (const ch of changes) {
    if (ch?.type === "created" && ch?.objectType === fullType && ch?.objectId) {
      return ch.objectId as string;
    }
  }
  return null;
}

async function getTxWithRetry(
  client: SuiClient,
  digest: string,
  maxAttempts = 8,
  initialDelayMs = 300
) {
  let attempt = 0;
  let delay = initialDelayMs;
  // simple backoff: 0.3s, 0.6s, 1.2s, 2.4s, ...
  while (true) {
    try {
      return await client.getTransactionBlock({
        digest,
        options: { showObjectChanges: true, showEffects: true, showEvents: true },
      });
    } catch (e: any) {
      attempt++;
      if (attempt >= maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, 2000);
    }
  }
}

export async function createListing(
  packageId: string,
  ticketId: string,
  price: bigint,
  signer: { signAndExecuteTransaction: SignAndExecuteTransaction }
) {
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
  const chain = `sui:${network}`;

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::market::create_listing`,
    arguments: [tx.object(ticketId), tx.pure.u64(price)],
  });
  tx.setGasBudget(20_000_000);

  const execRes = await signer.signAndExecuteTransaction({
    transaction: tx,
    chain,
    options: {
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
    },
  });

  const listingType = `${packageId}::market::Listing`;

  // try to extract right away
  let listingId = findCreatedOfType(execRes, listingType);

  // compute a digest we can poll with
  const digest =
    execRes?.digest ||
    execRes?.effectsDigest ||
    execRes?.effects?.transactionDigest ||
    execRes?.certificate?.transactionDigest;

  if (!listingId) {
    if (!digest) {
      throw new Error("Transaction succeeded but no digest was returned.");
    }
    // same network as sign step:
    const client = new SuiClient({ url: getFullnodeUrl(network as any) });
    // poll until the fullnode indexes this digest
    const full = await getTxWithRetry(client, digest);
    listingId = findCreatedOfType(full, listingType);
  }

  if (!listingId) {
    throw new Error("Could not detect Listing object id (re-check package id & module name).");
  }

  return { digest, listingId };
}
// utils/listing.ts
import { Transaction } from "@mysten/sui/transactions";
import { uploadListingJSON } from "./walrus";

type SignAndExecuteTransaction = (input: {
  transaction: Transaction;
  chain?: string;
  options?: { showEffects?: boolean; showEvents?: boolean };
}) => Promise<any>;

export async function createListing(
  packageId: string,
  ticketId: string,
  price: bigint,
  signer: { signAndExecuteTransaction: SignAndExecuteTransaction }
) {
  // 1) Prepare listing metadata payload
  const listingMetadata = {
    kind: "listing",
    ticketId,
    price: price.toString(),
    network: process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet",
    createdAt: new Date().toISOString(),
  };

  // 2) Upload JSON to Tusky (SDK via server route)
  const { uploadId, blobId } = await uploadListingJSON(listingMetadata, `listing-${ticketId}.json`);

  // Choose what you store on-chain as `metadata_url`
  const metadataUrl = blobId ?? uploadId;

  // 3) Create the Move txn (if your Move `market::create_listing` needs metadata_url, include it)
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::market::create_listing`,
    arguments: [
      tx.object(ticketId),
      tx.pure.u64(price),
      // If your market takes metadata_url: uncomment next line and update Move signature
      // tx.pure.string(metadataUrl),
    ],
  });

  tx.setGasBudget(20_000_000);

  return signer.signAndExecuteTransaction({
    transaction: tx,
    chain: `sui:${process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"}`,
    options: { showEffects: true, showEvents: true },
  });
}
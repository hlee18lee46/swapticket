// utils/walrus.ts
// Minimal Tusky uploader. Point NEXT_PUBLIC_TUSKY_BASE to your gateway, e.g.
// https://tusky.walrus.site (example) — exact path/response can differ by deployment.
// Adjust parseResponse() to your server's shape.

export type TuskyUploadOpts = {
  baseUrl?: string; // defaults to env
  contentType?: string; // defaults to application/json
};

/** Returns a public URL you can store on-chain. */
export async function uploadListingMetadataToTusky(
  metadata: Record<string, unknown>,
  opts: TuskyUploadOpts = {},
): Promise<string> {
  const base =
    opts.baseUrl ??
    process.env.NEXT_PUBLIC_TUSKY_BASE ??
    ""; // set this in .env

  if (!base) {
    throw new Error(
      "Tusky base URL not set. Define NEXT_PUBLIC_TUSKY_BASE (e.g. https://your-tusky.example)"
    );
  }

  // Common Tusky setups accept POST /store (JSON) and return an id / blobId / cid.
  // If your endpoint differs, adjust below.
  const res = await fetch(`${base.replace(/\/+$/, "")}/store`, {
    method: "POST",
    headers: {
      "content-type": opts.contentType ?? "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tusky upload failed: ${res.status} ${text}`);
  }

  const data = await res.json().catch(() => ({}));

  // ---- tweak this parser for your deployment ----
  const parseResponse = (obj: any): string | null =>
    obj?.url ||
    obj?.gatewayUrl ||
    (obj?.id ? `${base.replace(/\/+$/, "")}/ipfs/${obj.id}` : null) ||
    (obj?.blobId ? `${base.replace(/\/+$/, "")}/ipfs/${obj.blobId}` : null) ||
    (obj?.cid ? `${base.replace(/\/+$/, "")}/ipfs/${obj.cid}` : null);

  const url = parseResponse(data);
  if (!url) {
    throw new Error("Tusky response did not include a resolvable URL.");
  }
  return url;
}
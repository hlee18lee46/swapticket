// utils/walrus.ts
/**
 * Client-side helper that uploads a JSON blob to our Next.js API route,
 * which does the actual Tusky upload server-side.
 *
 * Returns: { uploadId, blobId, blobObjectId, url, name, mimeType, size }
 */
export async function uploadListingJSON(
  payload: unknown,
  filename = "listing.json",
): Promise<{
  uploadId: string;
  blobId: string | null;
  blobObjectId: string | null;
  url: string | null;
  name: string;
  mimeType: string;
  size: number;
}> {
  const json = JSON.stringify(payload);
  const blob = new Blob([json], { type: "application/json" });

  const form = new FormData();
  form.append("file", blob, filename);

  const res = await fetch("/api/tusky/upload", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Tusky upload route failed (${res.status}): ${msg || res.statusText}`);
  }

  const data = await res.json();
  // Basic shape validation
  if (!data || !data.uploadId) {
    throw new Error("Tusky upload route did not return uploadId");
  }
  return data;
}
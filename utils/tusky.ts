import { Tusky } from "@tusky-io/ts-sdk";

const API_KEY = process.env.TUSKY_API_KEY!;
const VAULT_ID = process.env.TUSKY_VAULT_ID!;
const VIEW_BASE = (process.env.NEXT_PUBLIC_TUSKY_VIEW_BASE || "").replace(/\/+$/, "");

if (!API_KEY) throw new Error("Missing TUSKY_API_KEY");
if (!VAULT_ID) throw new Error("Missing TUSKY_VAULT_ID");

let _client: Tusky | null = null;
export function tusky(): Tusky {
  if (!_client) _client = new Tusky({ apiKey: API_KEY });
  return _client!;
}

/** Upload a JSON object (returns uploadId immediately or waits for Walrus ids). */
export async function uploadJson(
  json: unknown,
  opts?: {
    filename?: string;
    folderId?: string;
    waitForWalrus?: boolean;
    waitTimeoutMs?: number;
    pollIntervalMs?: number;
  }
) {
  const name = opts?.filename ?? "data.json";
  const blob = new Blob([JSON.stringify(json)], { type: "application/json" });
  const uploadId = await tusky().file.upload(VAULT_ID, blob, {
    name,
    mimeType: "application/json",
    parentId: opts?.folderId,
  });

  if (!opts?.waitForWalrus) {
    return { uploadId, blobId: null as string | null, blobObjectId: null as string | null, url: VIEW_BASE ? `${VIEW_BASE}/${uploadId}` : null };
  }

  const timeout = opts?.waitTimeoutMs ?? 15_000;
  const interval = opts?.pollIntervalMs ?? 1_000;
  const start = Date.now();
  let meta: any;

  while (true) {
    meta = await tusky().file.get(uploadId);
    if (meta?.blobId) break;
    if (Date.now() - start > timeout) break;
    await new Promise((r) => setTimeout(r, interval));
  }

  return {
    uploadId,
    blobId: meta?.blobId ?? null,
    blobObjectId: meta?.blobObjectId ?? null,
    url: VIEW_BASE ? `${VIEW_BASE}/${uploadId}` : null,
  };
}

/** Upload from Node file path. */
export async function uploadFromPath(path: string, name?: string, mimeType?: string, folderId?: string) {
  const uploadId = await tusky().file.upload(VAULT_ID, path, { name, mimeType, parentId: folderId });
  return uploadId;
}

/** Upload from Node stream. */
export async function uploadFromStream(readable: NodeJS.ReadableStream, name: string, mimeType: string, folderId?: string) {
  const uploadId = await tusky().file.upload(VAULT_ID, readable, { name, mimeType, parentId: folderId });
  return uploadId;
}

/** Get file metadata (includes blobId/blobObjectId once ready). */
export async function getFile(uploadId: string) {
  return tusky().file.get(uploadId);
}

/** Download whole file into memory (Buffer/ArrayBuffer). */
export async function getArrayBuffer(fileId: string) {
  return tusky().file.arrayBuffer(fileId);
}

/** Stream a file (Node stream). */
export async function streamFile(fileId: string) {
  return tusky().file.stream(fileId);
}

/** Save a file to disk. */
export async function downloadTo(fileId: string, path: string) {
  await tusky().file.download(fileId, { path });
}

/** Create a folder and return its id. */
export async function createFolder(name: string, parentId?: string) {
  const { id } = await tusky().folder.create(VAULT_ID, name, { parentId });
  return id;
}

/** List files (all, by vault, or by folder). */
export async function listAll(params?: { vaultId?: string; parentId?: string }) {
  return tusky().file.listAll({ vaultId: params?.vaultId ?? VAULT_ID, parentId: params?.parentId });
}
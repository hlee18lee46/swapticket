// lib/format.ts
export function shortAddr(addr?: string, head = 6, tail = 4) {
  if (!addr) return "";
  return addr.length <= head + tail + 2
    ? addr
    : `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
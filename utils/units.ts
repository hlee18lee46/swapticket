// utils/units.ts
export function parseUnits(human: string, decimals: number): bigint {
  const s = human.trim();
  if (!/^\d*\.?\d*$/.test(s)) throw new Error("Invalid number");
  const [w = "0", f = ""] = s.split(".");
  const frac = (f + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(w || "0") * (10n ** BigInt(decimals)) + BigInt(frac || "0");
}
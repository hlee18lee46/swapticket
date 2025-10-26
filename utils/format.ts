// utils/format.ts
export function mistToSui(mist: bigint | string | number): string {
  const bi = typeof mist === "bigint" ? mist : BigInt(mist);
  const whole = bi / 1_000_000_000n;
  const frac = (bi % 1_000_000_000n).toString().padStart(9, "0");
  // trim trailing zeros for neatness
  return `${whole}.${frac}`.replace(/\.?0+$/, "");
}
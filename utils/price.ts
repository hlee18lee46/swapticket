// utils/price.ts
export function mistToSui(m: bigint): string {
  const neg = m < 0n ? "-" : "";
  const v = m < 0n ? -m : m;
  const whole = v / 1_000_000_000n;
  const frac = (v % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
  return neg + whole.toString() + (frac ? "." + frac : "");
}
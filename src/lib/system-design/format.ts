/** 1,250 -> "1.3k", 1_200_000 -> "1.2M". */
export function formatRps(value: number): string {
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  if (value >= 1000) return `${trim(value / 1000)}k`;
  return `${Math.round(value)}`;
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatInr(value: number): string {
  if (value === 0) return '—';
  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (abs >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value.toFixed(0)}`;
}

export function formatUsd(value: number): string {
  if (value === 0) return '—';
  const abs = Math.abs(value);
  if (abs >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-IN');
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

const formatters = new Map<number, Intl.NumberFormat>();

export function formatNumber(n: number, maxFractionDigits = 2): string {
  let f = formatters.get(maxFractionDigits);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFractionDigits });
    formatters.set(maxFractionDigits, f);
  }
  return f.format(n);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${formatNumber(val, 1)} ${sizes[i]}`;
}


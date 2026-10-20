const formatters = new Map<number, Intl.NumberFormat>();

export function formatNumber(n: number, maxFractionDigits = 2): string {
  let f = formatters.get(maxFractionDigits);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFractionDigits });
    formatters.set(maxFractionDigits, f);
  }
  return f.format(n);
}

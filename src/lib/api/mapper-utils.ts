export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function pickEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof v === 'string') {
    const up = v.trim().toUpperCase();
    const hit = allowed.find((a) => a === up);
    if (hit) return hit;
  }
  return fallback;
}

/** Counts from `{KEY: n}` maps or `[{key, count}]` arrays (groupBy shapes with `_count`). */
export function toCountEntries(
  raw: unknown,
  keyNames: readonly string[],
): { key: string; count: number; row: Record<string, unknown> | null }[] {
  const num = (v: unknown): number => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
    return 0;
  };
  if (Array.isArray(raw)) {
    return raw.flatMap((r) => {
      if (!isRecord(r)) return [];
      const key = keyNames.map((k) => r[k]).find((v) => typeof v === 'string' && v !== '');
      if (typeof key !== 'string') return [];
      const c = isRecord(r._count) ? Object.values(r._count)[0] : (r.count ?? r._count ?? r.total ?? r.value);
      return [{ key, count: num(c), row: r }];
    });
  }
  if (isRecord(raw)) {
    return Object.entries(raw).map(([key, v]) => ({
      key,
      count: isRecord(v) ? num(v.count ?? v.total) : num(v),
      row: isRecord(v) ? v : null,
    }));
  }
  return [];
}


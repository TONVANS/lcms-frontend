export interface ListQueryBase {
  page?: number;
  pageSize?: number | 'all';
  q?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface QueryCodecSpec<Q extends ListQueryBase> {
  defaults: Q & { page: number; pageSize: number; sort: string; order: 'asc' | 'desc' };
  /** Enum-valued filter params; unknown values fall back to unset. */
  enums: { [K in keyof Q]?: readonly string[] };
  sortKeys: readonly string[];
  pageSizes: readonly number[];
}

export interface QueryCodec<Q extends ListQueryBase> {
  defaults: QueryCodecSpec<Q>['defaults'];
  parse(sp: URLSearchParams): Q;
  serialize(q: Q): string;
}

export function createQueryCodec<Q extends ListQueryBase>(spec: QueryCodecSpec<Q>): QueryCodec<Q> {
  const { defaults, sortKeys, pageSizes } = spec;
  const enumKeys = Object.keys(spec.enums) as (keyof Q & string)[];
  const allowed = (k: keyof Q & string): readonly string[] => spec.enums[k] ?? [];

  function parse(sp: URLSearchParams): Q {
    const out: Record<string, unknown> = { ...(defaults as ListQueryBase) };

    const q = sp.get('q')?.trim();
    if (q) out.q = q;

    for (const k of enumKeys) {
      const v = sp.get(k);
      if (v !== null && allowed(k).includes(v)) out[k] = v;
    }

    const pageRaw = sp.get('page');
    if (
      pageRaw !== null &&
      /^\d+$/.test(pageRaw) &&
      Number.isSafeInteger(Number(pageRaw)) &&
      Number(pageRaw) >= 1
    ) {
      out.page = Number(pageRaw);
    }

    const sizeRaw = sp.get('pageSize');
    if (sizeRaw !== null && /^\d+$/.test(sizeRaw)) {
      const size = Number(sizeRaw);
      if (pageSizes.includes(size)) out.pageSize = size;
    }

    const sort = sp.get('sort');
    out.sort = sort !== null && sortKeys.includes(sort) ? sort : defaults.sort;
    const order = sp.get('order');
    out.order = order === 'asc' || order === 'desc' ? order : defaults.order;
    return out as Q;
  }

  function serialize(q: Q): string {
    const sp = new URLSearchParams();
    const text = q.q?.trim();
    if (text) sp.set('q', text);
    for (const k of enumKeys) {
      const v = q[k];
      if (typeof v === 'string' && v) sp.set(k, v);
    }
    if (q.page !== undefined && q.page !== defaults.page) sp.set('page', String(q.page));
    // 'all' is an export-only size and never reaches the URL.
    if (typeof q.pageSize === 'number' && q.pageSize !== defaults.pageSize) {
      sp.set('pageSize', String(q.pageSize));
    }
    if (q.sort !== undefined && q.sort !== defaults.sort) sp.set('sort', q.sort);
    if (q.order !== undefined && q.order !== defaults.order) sp.set('order', q.order);
    return sp.toString();
  }

  return { defaults, parse, serialize };
}

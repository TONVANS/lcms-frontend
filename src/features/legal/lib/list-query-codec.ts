export interface ListQueryBase {
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface QueryCodecSpec<Q extends ListQueryBase> {
  defaults: Q & { page: number; pageSize: number };
  /** Enum-valued filter params; unknown values fall back to unset. */
  enums?: { [K in keyof Q]?: readonly string[] };
  /** Integer-valued filter params (for example a year). */
  ints?: readonly (keyof Q & string)[];
  /** Free string filter params, accepted only when they match the given pattern. */
  strings?: { [K in keyof Q]?: RegExp };
  pageSizes: readonly number[];
}

export interface QueryCodec<Q extends ListQueryBase> {
  defaults: QueryCodecSpec<Q>['defaults'];
  parse(sp: URLSearchParams): Q;
  serialize(q: Q): string;
}

export function createQueryCodec<Q extends ListQueryBase>(spec: QueryCodecSpec<Q>): QueryCodec<Q> {
  const { defaults, pageSizes } = spec;
  const enums = (spec.enums ?? {}) as Record<string, readonly string[]>;
  const strings = (spec.strings ?? {}) as Record<string, RegExp>;
  const ints = (spec.ints ?? []) as readonly string[];

  function parse(sp: URLSearchParams): Q {
    const out: Record<string, unknown> = { ...(defaults as ListQueryBase) };

    const q = sp.get('q')?.trim();
    if (q) out.q = q;

    for (const [k, allowed] of Object.entries(enums)) {
      const v = sp.get(k);
      if (v !== null && allowed.includes(v)) out[k] = v;
    }
    for (const [k, re] of Object.entries(strings)) {
      const v = sp.get(k);
      if (v !== null && re.test(v)) out[k] = v;
    }
    for (const k of ints) {
      const v = sp.get(k);
      if (v !== null && /^\d{1,9}$/.test(v)) out[k] = Number(v);
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
    return out as Q;
  }

  function serialize(q: Q): string {
    const sp = new URLSearchParams();
    const rec = q as Record<string, unknown>;
    const text = q.q?.trim();
    if (text) sp.set('q', text);
    for (const k of [...Object.keys(enums), ...Object.keys(strings)]) {
      const v = rec[k];
      if (typeof v === 'string' && v) sp.set(k, v);
    }
    for (const k of ints) {
      const v = rec[k];
      if (typeof v === 'number' && Number.isFinite(v)) sp.set(k, String(v));
    }
    if (q.page !== undefined && q.page !== defaults.page) sp.set('page', String(q.page));
    if (q.pageSize !== undefined && q.pageSize !== defaults.pageSize) {
      sp.set('pageSize', String(q.pageSize));
    }
    return sp.toString();
  }

  return { defaults, parse, serialize };
}

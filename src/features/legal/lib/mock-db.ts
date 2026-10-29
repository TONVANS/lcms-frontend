/** Tiny in-memory table for mock handlers. Rows are plain backend-shaped records. */
export type MockRow = Record<string, unknown>;

export interface MockDb<T extends MockRow> {
  all(): T[];
  get(id: string): T | undefined;
  insert(row: T): T;
  update(id: string, patch: Partial<T>): T | undefined;
  remove(id: string): boolean;
  reset(now: Date): void;
}

export function createMockDb<T extends MockRow>(
  seed: (now: Date) => T[],
  keyOf: (row: T) => string,
): MockDb<T> {
  let rows: T[] = seed(new Date());
  return {
    all: () => rows.map((r) => ({ ...r })),
    get: (id) => {
      const hit = rows.find((r) => keyOf(r) === id);
      return hit ? { ...hit } : undefined;
    },
    insert(row) {
      rows = [row, ...rows];
      return { ...row };
    },
    update(id, patch) {
      const i = rows.findIndex((r) => keyOf(r) === id);
      if (i === -1) return undefined;
      rows[i] = { ...rows[i], ...patch };
      return { ...rows[i] };
    },
    remove(id) {
      const before = rows.length;
      rows = rows.filter((r) => keyOf(r) !== id);
      return rows.length !== before;
    },
    reset(now) {
      rows = seed(now);
    },
  };
}

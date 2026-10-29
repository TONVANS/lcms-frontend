export const LEGAL_PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;
/** Backend page size used when exporting every row. */
export const EXPORT_PAGE_SIZE = 100;
export const ALL_FILTER = 'all';
const ID_RE = /^[\w-]{1,64}$/;
export const ID_PARAM = ID_RE;
export const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;

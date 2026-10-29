import { toNum, toStr } from '@/lib/api/envelope';
import type { ContractTypeOption, Department } from '@/types/domain';

function rec(raw: unknown): Record<string, unknown> | null {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null;
}

/** Tolerates `{ id, name, code }` and the dropdown `{ value, label }` shape. */
export function toDepartment(raw: unknown): Department | null {
  const r = rec(raw);
  if (!r) return null;
  const id = toStr(r.id ?? r.value);
  const name = toStr(r.name ?? r.label ?? r.nameLo);
  if (id === null || name === null) return null;
  return { id, name, code: toStr(r.code) };
}

/** Tolerates `{ id, nameLo, nameEn }` and the dropdown `{ value, label }` shape. */
export function toContractTypeOption(raw: unknown): ContractTypeOption | null {
  const r = rec(raw);
  if (!r) return null;
  const id = toNum(r.id ?? r.value);
  const nameLo = toStr(r.nameLo ?? r.name ?? r.label);
  if (id === null || nameLo === null) return null;
  return { id, nameLo, nameEn: toStr(r.nameEn) };
}

/** Tolerates a plain string or `{ value | name | label }`. */
export function toProjectType(raw: unknown): string | null {
  if (typeof raw === 'string') return toStr(raw);
  const r = rec(raw);
  return r ? toStr(r.value ?? r.name ?? r.label) : null;
}

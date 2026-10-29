import { describe, expect, it } from 'vitest';
import { toContractTypeOption, toDepartment, toProjectType } from './lookups-mapper';

describe('toDepartment', () => {
  it('maps the canonical shape', () => {
    expect(toDepartment({ id: 'd1', name: 'A', code: 'X1' })).toEqual({ id: 'd1', name: 'A', code: 'X1' });
  });
  it('accepts value/label dropdown items and null code', () => {
    expect(toDepartment({ value: 'd2', label: 'B' })).toEqual({ id: 'd2', name: 'B', code: null });
  });
  it('returns null for unusable input', () => {
    expect(toDepartment(null)).toBeNull();
    expect(toDepartment({ id: 'd3' })).toBeNull();
    expect(toDepartment('x')).toBeNull();
  });
});

describe('toContractTypeOption', () => {
  it('maps nameLo/nameEn with a numeric id', () => {
    expect(toContractTypeOption({ id: '3', nameLo: 'lao', nameEn: 'En' })).toEqual({
      id: 3,
      nameLo: 'lao',
      nameEn: 'En',
    });
  });
  it('falls back to name then label, and value for id', () => {
    expect(toContractTypeOption({ id: 1, name: 'N' })?.nameLo).toBe('N');
    expect(toContractTypeOption({ value: 7, label: 'L' })).toEqual({ id: 7, nameLo: 'L', nameEn: null });
  });
  it('returns null without id or name', () => {
    expect(toContractTypeOption({ nameLo: 'x' })).toBeNull();
    expect(toContractTypeOption({ id: 1 })).toBeNull();
  });
});

describe('toProjectType', () => {
  it('accepts strings and { value|name|label } objects', () => {
    expect(toProjectType(' a ')).toBe('a');
    expect(toProjectType({ value: 'v' })).toBe('v');
    expect(toProjectType({ name: 'n' })).toBe('n');
    expect(toProjectType({ label: 'l' })).toBe('l');
    expect(toProjectType({})).toBeNull();
    expect(toProjectType(5)).toBeNull();
  });
});

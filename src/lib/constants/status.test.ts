import { expect, it } from 'vitest';
import { STATUS_META } from './status';

it('has meta for every contract status', () => {
  expect(STATUS_META.active).toEqual({ label: 'ມີຜົນບັງຄັບໃຊ້', tone: 'emerald' });
  expect(STATUS_META.pending_cod.tone).toBe('violet');
  expect(STATUS_META.expiring.tone).toBe('amber');
  expect(STATUS_META.expired.tone).toBe('rose');
  expect(STATUS_META.terminated).toEqual({ label: 'ຍົກເລີກ', tone: 'slate' });
  expect(Object.keys(STATUS_META)).toHaveLength(7);
});

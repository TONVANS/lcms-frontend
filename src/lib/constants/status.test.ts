import { expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { LEGACY_STATUS_META, STATUS_META } from './status';

it('has meta for every backend contract status', () => {
  expect(STATUS_META.DRAFT).toEqual({ label: 'ຮ່າງ', tone: 'slate' });
  expect(STATUS_META.ACTIVE).toEqual({ label: 'ມີຜົນບັງຄັບໃຊ້', tone: 'emerald' });
  expect(STATUS_META.EXPIRING_SOON).toEqual({ label: 'ໃກ້ໝົດອາຍຸ', tone: 'amber' });
  expect(STATUS_META.EXPIRED).toEqual({ label: 'ໝົດອາຍຸແລ້ວ', tone: 'rose' });
  expect(STATUS_META.TERMINATED).toEqual({ label: 'ຍົກເລີກກ່ອນກຳນົດ', tone: 'slate' });
  expect(Object.keys(STATUS_META)).toHaveLength(5);
  expect(lo.status.DRAFT).toBe('ຮ່າງ');
});

it('keeps the legacy meta for GC/PPA until they migrate', () => {
  expect(LEGACY_STATUS_META.active).toEqual({ label: 'ມີຜົນບັງຄັບໃຊ້', tone: 'emerald' });
  expect(LEGACY_STATUS_META.pending_cod.tone).toBe('violet');
  expect(LEGACY_STATUS_META.expiring.tone).toBe('amber');
  expect(LEGACY_STATUS_META.expired.tone).toBe('rose');
  expect(LEGACY_STATUS_META.terminated).toEqual({ label: 'ຍົກເລີກ', tone: 'slate' });
  expect(Object.keys(LEGACY_STATUS_META)).toHaveLength(7);
});

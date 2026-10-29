import { expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { STATUS_META } from './status';

it('has meta for every backend contract status', () => {
  expect(STATUS_META.DRAFT).toEqual({ label: 'ຮ່າງ', tone: 'slate' });
  expect(STATUS_META.ACTIVE).toEqual({ label: 'ມີຜົນບັງຄັບໃຊ້', tone: 'emerald' });
  expect(STATUS_META.EXPIRING_SOON).toEqual({ label: 'ໃກ້ໝົດອາຍຸ', tone: 'amber' });
  expect(STATUS_META.EXPIRED).toEqual({ label: 'ໝົດອາຍຸແລ້ວ', tone: 'rose' });
  expect(STATUS_META.TERMINATED).toEqual({ label: 'ຍົກເລີກກ່ອນກຳນົດ', tone: 'slate' });
  expect(Object.keys(STATUS_META)).toHaveLength(5);
  expect(lo.status.DRAFT).toBe('ຮ່າງ');
});

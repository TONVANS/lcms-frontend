import type { HistoryKind } from '../types';

/** Raw, live-like history rows (newest first). Field labels are backend-side Lao strings. */
export interface MockHistoryRow {
  id: string;
  action: string;
  createdAt: string;
  user: { fullName: string };
  changes: { field: string; label: string; oldValue: unknown; newValue: unknown }[];
}

const row = (
  id: string,
  action: string,
  createdAt: string,
  fullName: string,
  changes: MockHistoryRow['changes'] = [],
): MockHistoryRow => ({ id, action, createdAt, user: { fullName }, changes });

export const MOCK_HISTORY: Record<HistoryKind, MockHistoryRow[]> = {
  contracts: [
    row('h-c-5', 'UPLOAD_ATTACHMENT', '2026-03-12T13:20:00.000Z', 'Somchai Vong'),
    row('h-c-4', 'UPDATE_CONTRACT', '2026-03-05T09:10:00.000Z', 'Somchai Vong', [
      { field: 'status', label: 'ສະຖານະ', oldValue: 'DRAFT', newValue: 'ACTIVE' },
      { field: 'contractValue', label: 'ມູນຄ່າ', oldValue: 1000000, newValue: 1250000 },
    ]),
    row('h-c-3', 'UPDATE_CONTRACT', '2026-02-20T15:00:00.000Z', 'Noy Phommachanh', [
      { field: 'counterparty', label: 'ຄູ່ສັນຍາ', oldValue: null, newValue: 'ບໍລິສັດ ກ' },
    ]),
    row('h-c-2', 'UPDATE_CONTRACT', '2026-02-01T11:30:00.000Z', 'Noy Phommachanh', [
      { field: 'expirationDate', label: 'ວັນໝົດອາຍຸ', oldValue: '2026-12-31', newValue: '2027-12-31' },
    ]),
    row('h-c-1', 'CREATE_CONTRACT', '2026-01-10T08:00:00.000Z', 'Somchai Vong'),
  ],
  'power-contracts': [
    row('h-p-3', 'UPDATE_POWER_CONTRACT', '2026-04-02T10:00:00.000Z', 'Khamla Sihalath', [
      { field: 'installedCapacityMw', label: 'ກຳລັງຕິດຕັ້ງ (MW)', oldValue: 100, newValue: 120 },
    ]),
    row('h-p-2', 'UPLOAD_POWER_ATTACHMENT', '2026-03-15T14:00:00.000Z', 'Khamla Sihalath'),
    row('h-p-1', 'CREATE_POWER_CONTRACT', '2026-03-01T09:00:00.000Z', 'Khamla Sihalath'),
  ],
};

import { lo } from '@/lib/i18n/lo';

export interface MockDepartment {
  id: string;
  name: string;
  code: string;
}

export const MOCK_DEPARTMENTS: MockDepartment[] = [
  { id: '3f6c1a10-0001-4b8e-9a01-5d2e7c0a1001', name: 'ຫ້ອງການ ຝ່າຍກົດໝາຍ ແລະ ສັນຍາ', code: 'LEG' },
  { id: '3f6c1a10-0002-4b8e-9a01-5d2e7c0a1002', name: 'ຫ້ອງການ ຝ່າຍບໍລິຫານ ແລະ ຈັດຕັ້ງ', code: 'ADM' },
  { id: '3f6c1a10-0003-4b8e-9a01-5d2e7c0a1003', name: 'ຫ້ອງການ ຝ່າຍການເງິນ ແລະ ບັນຊີ', code: 'FIN' },
  { id: '3f6c1a10-0004-4b8e-9a01-5d2e7c0a1004', name: 'ຫ້ອງການ ຝ່າຍວາງແຜນ ແລະ ໂຄງການ', code: 'PLN' },
  { id: '3f6c1a10-0005-4b8e-9a01-5d2e7c0a1005', name: 'ຫ້ອງການ ຝ່າຍເຕັກນິກ ແລະ ວິສະວະກຳ', code: 'ENG' },
  { id: '3f6c1a10-0006-4b8e-9a01-5d2e7c0a1006', name: 'ຫ້ອງການ ຝ່າຍຈັດຊື້ ແລະ ພັດສະດຸ', code: 'PRC' },
  { id: '3f6c1a10-0007-4b8e-9a01-5d2e7c0a1007', name: 'ຫ້ອງການ ຝ່າຍເຕັກໂນໂລຊີຂໍ້ມູນຂ່າວສານ', code: 'ICT' },
  { id: '3f6c1a10-0008-4b8e-9a01-5d2e7c0a1008', name: 'ຫ້ອງການ ຝ່າຍບໍລິການລູກຄ້າ', code: 'CSV' },
  { id: '3f6c1a10-0009-4b8e-9a01-5d2e7c0a1009', name: 'ຫ້ອງການ ຝ່າຍຄວບຄຸມພາຍໃນ', code: 'AUD' },
];

export interface MockContractType {
  id: number;
  nameLo: string;
  nameEn: string;
}

/** The 14 backend contract types (FRONTEND_API_SUMMARY section 2.1); Lao labels reuse `lo.gc.types`. */
export const MOCK_CONTRACT_TYPES: MockContractType[] = [
  { id: 1, nameLo: lo.gc.types.om_service, nameEn: 'O&M service' },
  { id: 2, nameLo: lo.gc.types.equipment_lease, nameEn: 'Substation / transmission equipment lease' },
  { id: 3, nameLo: lo.gc.types.land_lease, nameEn: 'Land lease' },
  { id: 4, nameLo: lo.gc.types.epc, nameEn: 'EPC' },
  { id: 5, nameLo: lo.gc.types.pole_attachment, nameEn: 'Pole attachment' },
  { id: 6, nameLo: lo.gc.types.bill_collection, nameEn: 'Electricity bill collection' },
  { id: 7, nameLo: lo.gc.types.opgw_lease, nameEn: 'OPGW lease' },
  { id: 8, nameLo: lo.gc.types.current_deposit, nameEn: 'Current account deposit' },
  { id: 9, nameLo: lo.gc.types.edl_app_payment, nameEn: 'EDL App payment' },
  { id: 10, nameLo: lo.gc.types.cooperation, nameEn: 'Cooperation / joint venture' },
  { id: 11, nameLo: lo.gc.types.shareholding, nameEn: 'Shareholding' },
  { id: 12, nameLo: lo.gc.types.pta, nameEn: 'PTA' },
  { id: 13, nameLo: lo.gc.types.moa, nameEn: 'MOA' },
  { id: 14, nameLo: lo.gc.types.other_assigned, nameEn: 'Other assigned' },
];

/** FRONTEND_API_SUMMARY section 4.1, verbatim. */
export const MOCK_PROJECT_TYPES: string[] = [
  'ໄຟຟ້ານໍ້າຕົກ',
  'ພະລັງງານແສງຕາເວັນ',
  'ພະລັງງານລົມ',
  'ພະລັງງານຄວາມຮ້ອນ / ຖ່ານຫີນ',
  'ພະລັງງານຊີວະມວນ',
];

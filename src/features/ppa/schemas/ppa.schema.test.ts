import { describe, expect, it } from 'vitest';
import { ppaSchema } from './ppa.schema';

describe('ppaSchema', () => {
  it('validates a complete valid PPA contract input', () => {
    const validData = {
      contractNo: 'PPA-001',
      projectName: 'ເຂື່ອນໄຟຟ້າ ນ້ຳເທີນ 2',
      developerName: 'NTPC',
      energyType: 'hydro',
      capacityMw: 1080,
      tariffUsCentPerKwh: 5.85,
      annualEnergyGwh: 5000,
      market: 'export',
      signedDate: '2020-01-01',
      codDate: '2025-01-01',
      endDate: '2050-01-01',
      termYears: 25,
      status: 'active',
      notes: 'Test notes',
    };

    const result = ppaSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('fails when required fields are missing', () => {
    const invalidData = {
      contractNo: '',
      projectName: '',
    };

    const result = ppaSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.contractNo).toBeDefined();
      expect(fieldErrors.projectName).toBeDefined();
    }
  });

  it('fails when numbers are non-positive', () => {
    const invalidData = {
      contractNo: 'PPA-001',
      projectName: 'ໂຄງການ',
      developerName: 'ຜູ້ພັດທະນາ',
      energyType: 'solar',
      capacityMw: -10,
      tariffUsCentPerKwh: 0,
      market: 'domestic',
      signedDate: '2020-01-01',
      codDate: '2025-01-01',
      endDate: '2050-01-01',
      termYears: 0,
    };

    const result = ppaSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

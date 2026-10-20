import type MockAdapter from 'axios-mock-adapter';
import { MOCK_PPA_CONTRACTS } from '@/features/ppa/mocks/ppa.mock';
import type {
  EnergyType,
  KeyEvent,
  PpaContract,
  PpaContractInput,
  PpaDashboardSummary,
} from '@/features/ppa/types';
import { lo } from '@/lib/i18n/lo';
import { daysLeft } from '@/lib/utils/date';
import type { Paginated } from '@/types/api';
import type { Alert } from '@/types/domain';

let contracts: PpaContract[] = [...MOCK_PPA_CONTRACTS];

export function register(mock: MockAdapter) {
  // GET /ppa/dashboard
  mock.onGet('/ppa/dashboard').reply(() => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter((c) => c.status === 'active');
    const activeCapacityMw = activeContracts.reduce((sum, c) => sum + c.capacityMw, 0);

    // Expiring contracts within 90 days
    const today = new Date();
    const expiringContracts = contracts.filter((c) => {
      if (!c.endDate) return false;
      const d = daysLeft(c.endDate, today);
      return d !== null && d >= 0 && d <= 90;
    });

    const avgTariff =
      contracts.length > 0
        ? Number(
            (
              contracts.reduce((sum, c) => sum + c.tariffUsCentPerKwh, 0) /
              contracts.length
            ).toFixed(2),
          )
        : 0;

    // Energy breakdown
    const energyTypes: EnergyType[] = ['hydro', 'solar', 'wind', 'coal', 'biomass'];
    const totalCap = contracts.reduce((sum, c) => sum + c.capacityMw, 0);
    const energyBreakdown = energyTypes.map((type) => {
      const typeContracts = contracts.filter((c) => c.energyType === type);
      const cap = typeContracts.reduce((sum, c) => sum + c.capacityMw, 0);
      return {
        energyType: type,
        label: lo.energy[type as keyof typeof lo.energy] ?? type,
        count: typeContracts.length,
        capacityMw: cap,
        percentage: totalCap > 0 ? Math.round((cap / totalCap) * 100) : 0,
      };
    });

    // Status breakdown
    const statusKeys: PpaContract['status'][] = [
      'active',
      'negotiating',
      'pending_cod',
      'expiring',
      'expired',
      'draft',
      'terminated',
    ];
    const statusBreakdown = statusKeys.map((status) => ({
      status,
      count: contracts.filter((c) => c.status === status).length,
    }));

    // Monthly expiring (next 6 months)
    const monthlyExpiring = [
      { month: '10/2026', count: 1 },
      { month: '11/2026', count: 2 },
      { month: '12/2026', count: 1 },
      { month: '01/2027', count: 0 },
      { month: '02/2027', count: 1 },
      { month: '03/2027', count: 0 },
    ];

    // Upcoming alerts
    const upcomingAlerts: Alert[] = expiringContracts.slice(0, 5).map((c) => {
      const d = daysLeft(c.endDate, today) ?? 0;
      return {
        id: `alert-ppa-${c.id}`,
        module: 'ppa',
        entityType: 'ppa',
        entityId: c.id,
        title: `${c.projectName} - ສັນຍາໃກ້ໝົດອາຍຸ`,
        dueDate: c.endDate ?? new Date().toISOString(),
        daysLeft: d,
        read: false,
      };
    });

    const summary: PpaDashboardSummary = {
      kpis: {
        totalContracts,
        activeCapacityMw,
        expiringCount: expiringContracts.length,
        avgTariff,
      },
      energyBreakdown,
      statusBreakdown,
      monthlyExpiring,
      upcomingAlerts,
    };

    return [200, summary];
  });

  // GET /ppa/contracts/:id/history
  mock.onGet(/\/ppa\/contracts\/[^/]+\/history$/).reply((config) => {
    const id = config.url?.split('/')[3];
    const contract = contracts.find((c) => c.id === id);
    if (!contract) return [404, { message: 'Not found' }];

    const history: KeyEvent[] = [];
    if (contract.signedDate) {
      history.push({
        type: 'signed',
        label: 'ເຊັນສັນຍາ PPA',
        date: contract.signedDate,
      });
    }
    if (contract.codDate) {
      history.push({
        type: 'cod',
        label: 'ເລີ່ມດຳເນີນງານທາງການຄ້າ (COD)',
        date: contract.codDate,
      });
    }
    if (contract.endDate) {
      history.push({
        type: 'end',
        label: 'ກຳນົດສິ້ນສຸດສັນຍາ',
        date: contract.endDate,
      });
    }

    return [200, history];
  });

  // GET /ppa/contracts/:id
  mock.onGet(/\/ppa\/contracts\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    const contract = contracts.find((c) => c.id === id);
    if (!contract) return [404, { message: 'Not found' }];
    return [200, contract];
  });

  // DELETE /ppa/contracts/:id
  mock.onDelete(/\/ppa\/contracts\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    contracts = contracts.filter((c) => c.id !== id);
    return [204];
  });

  // PATCH /ppa/contracts/:id
  mock.onPatch(/\/ppa\/contracts\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    const idx = contracts.findIndex((c) => c.id === id);
    if (idx === -1) return [404, { message: 'Not found' }];

    const body = JSON.parse(config.data || '{}') as Partial<PpaContractInput>;
    const existing = contracts[idx];

    const updated: PpaContract = {
      ...existing,
      ...body,
      developer: body.developerName
        ? { id: existing.developer.id, name: body.developerName }
        : existing.developer,
    };
    contracts[idx] = updated;
    return [200, updated];
  });

  // POST /ppa/contracts
  mock.onPost('/ppa/contracts').reply((config) => {
    const body = JSON.parse(config.data || '{}') as PpaContractInput;
    const newContract: PpaContract = {
      id: `ppa-${Date.now()}`,
      contractNo: body.contractNo,
      projectName: body.projectName,
      developer: { id: `dev-${Date.now()}`, name: body.developerName },
      energyType: body.energyType,
      capacityMw: Number(body.capacityMw),
      tariffUsCentPerKwh: Number(body.tariffUsCentPerKwh),
      annualEnergyGwh: body.annualEnergyGwh ? Number(body.annualEnergyGwh) : undefined,
      market: body.market,
      signedDate: body.signedDate,
      codDate: body.codDate,
      endDate: body.endDate,
      termYears: body.termYears ? Number(body.termYears) : undefined,
      status: body.status ?? 'active',
      ownerUserId: 'ppa.user',
      alertDays: body.alertDays ?? [90, 30, 7],
      notes: body.notes,
    };
    contracts.unshift(newContract);
    return [201, newContract];
  });

  // GET /ppa/contracts
  mock.onGet(/\/ppa\/contracts/).reply((config) => {
    const urlParams = new URLSearchParams(config.url?.split('?')[1] ?? '');
    const p = (config.params ?? {}) as Record<string, string | number | undefined>;

    const q = (p.q ? String(p.q) : urlParams.get('q'))?.toLowerCase();
    const status = p.status ? String(p.status) : urlParams.get('status');
    const energyType = p.energyType ? String(p.energyType) : urlParams.get('energyType');
    const market = p.market ? String(p.market) : urlParams.get('market');
    const page = Number(p.page ?? urlParams.get('page') ?? 1);
    const pageSize = Number(p.pageSize ?? urlParams.get('pageSize') ?? 10);

    let filtered = [...contracts];

    if (q) {
      filtered = filtered.filter(
        (c) =>
          c.contractNo.toLowerCase().includes(q) ||
          c.projectName.toLowerCase().includes(q) ||
          c.developer.name.toLowerCase().includes(q),
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter((c) => c.status === status);
    }

    if (energyType && energyType !== 'all') {
      filtered = filtered.filter((c) => c.energyType === energyType);
    }

    if (market && market !== 'all') {
      filtered = filtered.filter((c) => c.market === market);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    const response: Paginated<PpaContract> = {
      items,
      total,
      page,
      pageSize,
    };

    return [200, response];
  });
}

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { PpaDashboardView } from './ppa-dashboard-view';

describe('PpaDashboardView', () => {
  beforeEach(() => {
    installMocks(api, { delay: 0 });
  });

  it('renders dashboard with KPI cards and breakdowns after loading', async () => {
    render(<PpaDashboardView />);
    expect(await screen.findByText('ພາບລວມ ສັນຍາຊື້-ຂາຍພະລັງງານ')).toBeInTheDocument();
    expect(await screen.findByText(/ກຳລັງຕິດຕັ້ງແຍກຕາມປະເພດພະລັງງານ/)).toBeInTheDocument();
  });
});

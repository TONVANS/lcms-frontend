import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { powerMockDb } from '../mocks/ppa.mock';
import { PpaDashboardView } from './ppa-dashboard-view';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  powerMockDb.reset();
});

describe('PpaDashboardView', () => {
  it('renders KPIs, breakdowns and the expiring list', async () => {
    setMockSession('ppa.user', false);
    render(<PpaDashboardView />);
    expect(await screen.findByText(lo.ppa.dashboard.kpiTotal)).toBeInTheDocument();
    expect(screen.getByText(lo.ppa.dashboard.kpiCapacity)).toBeInTheDocument();
    expect(screen.getAllByText(lo.ppa.dashboard.kpiExpiring).length).toBeGreaterThan(0);
    expect(screen.getByText(lo.ppa.dashboard.purchaseVsSale)).toBeInTheDocument();
    expect(screen.getByText(lo.ppa.dashboard.byStatus)).toBeInTheDocument();
    expect(screen.getByText(lo.ppa.dashboard.byProjectType)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Nam Theun 2/ })).toBeInTheDocument();
  });

  it('shows a retryable error when the request fails', async () => {
    render(<PpaDashboardView />);
    expect(await screen.findByRole('button', { name: lo.common.retry })).toBeInTheDocument();
  });
});

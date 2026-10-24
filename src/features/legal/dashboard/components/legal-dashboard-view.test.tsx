import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { formatNumber } from '@/lib/utils/number';
import { legalDashboardService } from '../api/legal-dashboard.service';
import type { LegalDashboard } from '../types';
import { LegalDashboardView } from './legal-dashboard-view';

const FIXTURE: LegalDashboard = {
  regulations: {
    total: 30,
    byStatus: {
      in_force: 23,
      repealed: 7,
    },
    unitCount: 8,
    byType: [
      { type: 'decision', count: 10 },
      { type: 'provision', count: 5 },
      { type: 'notice', count: 5 },
      { type: 'rule', count: 4 },
      { type: 'instruction', count: 4 },
      { type: 'other', count: 2 },
    ],
    byUnit: [
      { unit: 'legal_contract', count: 12 },
      { unit: 'accounting', count: 6 },
      { unit: 'ict', count: 4 },
    ],
  },
  cases: {
    total: 24,
    inProgress: 18,
    finished: 6,
    byStage: [
      { stage: 'first_instance', count: 10 },
      { stage: 'appeal', count: 5 },
      { stage: 'cassation', count: 3 },
      { stage: 'completed', count: 4 },
      { stage: 'closed', count: 2 },
    ],
    damage: { lak: 15000000, usd: 1000 },
    fine: { lak: 5000000, usd: 500 },
    recovered: { lak: 8000000, usd: 600 },
  },
};

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.spyOn(legalDashboardService, 'get').mockResolvedValue(FIXTURE);
});

describe('LegalDashboardView', () => {
  it('renders regulations KPIs: total, in force, repealed, units', async () => {
    session('legal.viewer');
    render(<LegalDashboardView />);

    await waitFor(() => expect(screen.queryByTestId('legal-dashboard-skeleton')).toBeNull());
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders cases KPIs: total, in progress, finished, damage+fine LAK, damage+fine USD, recovered LAK / USD', async () => {
    session('legal.viewer');
    render(<LegalDashboardView />);

    await waitFor(() => expect(screen.queryByTestId('legal-dashboard-skeleton')).toBeNull());
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getAllByText('6').length).toBeGreaterThan(0);

    // Damage + fine: 15M + 5M = 20M LAK; 1000 + 500 = 1500 USD
    expect(screen.getByText(formatNumber(20000000))).toBeInTheDocument();
    expect(screen.getByText(formatNumber(1500))).toBeInTheDocument();

    // Recovered: 8M LAK; 600 USD (appears in KPI card and BarList)
    expect(screen.getAllByText(formatNumber(8000000)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatNumber(600)).length).toBeGreaterThan(0);
  });

  it('by-type and by-unit BarLists use Lao labels', async () => {
    session('legal.viewer');
    render(<LegalDashboardView />);

    await waitFor(() => expect(screen.queryByTestId('legal-dashboard-skeleton')).toBeNull());
    expect(screen.getByText(lo.legal.regulationTypes.decision)).toBeInTheDocument();
    expect(screen.getByText(lo.legal.units.legal_contract)).toBeInTheDocument();
  });

  it('stage StackedStatusBar uses stage labels and CASE_STAGE_TONE', async () => {
    session('legal.viewer');
    render(<LegalDashboardView />);

    await waitFor(() => expect(screen.queryByTestId('legal-dashboard-skeleton')).toBeNull());
    const stageBar = screen.getByTestId('cases-stage-bar');
    expect(within(stageBar).getByText(new RegExp(lo.legal.caseStages.first_instance))).toBeInTheDocument();
    expect(within(stageBar).getByText(new RegExp(lo.legal.caseStages.completed))).toBeInTheDocument();
  });

  it('section headers link to /legal/regulations and /legal/cases', async () => {
    session('legal.viewer');
    render(<LegalDashboardView />);

    await waitFor(() => expect(screen.queryByTestId('legal-dashboard-skeleton')).toBeNull());
    const regLink = screen.getByRole('link', { name: new RegExp(lo.legal.dashboard.viewAllRegulations) });
    expect(regLink).toHaveAttribute('href', '/legal/regulations');

    const caseLink = screen.getByRole('link', { name: new RegExp(lo.legal.dashboard.viewAllCases) });
    expect(caseLink).toHaveAttribute('href', '/legal/cases');
  });

  it('skeleton while loading; error banner with retry', async () => {
    session('legal.viewer');
    const user = userEvent.setup();
    vi.spyOn(legalDashboardService, 'get').mockRejectedValueOnce({
      status: 500,
      code: 'HTTP_500',
      message: '',
    });
    render(<LegalDashboardView />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(lo.errors.server);

    await user.click(within(alert).getByRole('button', { name: lo.common.retry }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('gold new button links to /legal/new inside Can permission=create', async () => {
    // Viewer: no button
    session('legal.viewer');
    const { unmount } = render(<LegalDashboardView />);
    await waitFor(() => expect(screen.queryByTestId('legal-dashboard-skeleton')).toBeNull());
    expect(screen.queryByRole('link', { name: new RegExp(lo.legal.dashboard.new) })).toBeNull();
    unmount();

    // Editor: has gold button linking to /legal/new
    session('legal.editor');
    render(<LegalDashboardView />);
    await waitFor(() => expect(screen.queryByTestId('legal-dashboard-skeleton')).toBeNull());
    const newBtn = screen.getByRole('link', { name: new RegExp(lo.legal.dashboard.new) });
    expect(newBtn).toBeInTheDocument();
    expect(newBtn).toHaveAttribute('href', '/legal/new');
  });
});

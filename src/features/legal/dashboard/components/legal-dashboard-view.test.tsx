import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { legalCasesService } from '@/features/legal/cases/api/legal-cases.service';
import { legalDocumentsService } from '@/features/legal/documents/api/legal-documents.service';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { lo } from '@/lib/i18n/lo';
import { formatNumber } from '@/lib/utils/number';
import type { SystemModule, User } from '@/types/domain';
import { LegalDashboardView } from './legal-dashboard-view';

const DOCS = {
  total: 30,
  active: 23,
  inactive: 7,
  byType: [
    { docType: 'REGULATION' as const, count: 10 },
    { docType: 'MANUAL' as const, count: 20 },
  ],
  byDepartment: [{ departmentId: 'd1', name: 'Dept One', count: 30 }],
};
const money = (damage: number) => ({ damage, fine: 5, totalDue: damage + 5, recovered: 3 });
const CASES = {
  total: 24,
  byDisputeStatus: [
    { status: 'FIRST_INSTANCE' as const, count: 10 },
    { status: 'APPEAL' as const, count: 5 },
    { status: 'SUPREME' as const, count: 3 },
    { status: 'CLOSED' as const, count: 4 },
    { status: 'RESOLVED' as const, count: 2 },
  ],
  lak: money(15000000),
  usd: money(1000),
};

function login(modules: SystemModule[], username = 'legal.user') {
  const base = MOCK_USERS.find((u) => u.username === username)!;
  const user: User = { ...base, accessibleModules: modules };
  useAuthStore.setState({ user, status: 'authenticated' });
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(legalDocumentsService, 'dashboard').mockResolvedValue(DOCS);
  vi.spyOn(legalCasesService, 'dashboard').mockResolvedValue(CASES);
});

describe('LegalDashboardView', () => {
  it('renders both sections for a user with both SystemModules', async () => {
    login(['legal-documents', 'legal-cases']);
    render(<LegalDashboardView />);
    expect(screen.getByRole('heading', { level: 2, name: lo.legal.dashboard.regulationsSection })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: lo.legal.dashboard.casesSection })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(lo.legal.docTypes.MANUAL)).toBeInTheDocument());
    expect(screen.getByText('Dept One')).toBeInTheDocument();
    expect(screen.getByText(formatNumber(15000005))).toBeInTheDocument();
    expect(screen.getByTestId('cases-stage-bar')).toHaveTextContent(lo.legal.disputeStatus.APPEAL);
  });

  it('renders only the documents section without legal-cases', async () => {
    login(['legal-documents']);
    render(<LegalDashboardView />);
    expect(screen.getByRole('heading', { level: 2, name: lo.legal.dashboard.regulationsSection })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: lo.legal.dashboard.casesSection })).toBeNull();
    await waitFor(() => expect(legalDocumentsService.dashboard).toHaveBeenCalled());
    expect(legalCasesService.dashboard).not.toHaveBeenCalled();
  });

  it('renders only the cases section without legal-documents', async () => {
    login(['legal-cases']);
    render(<LegalDashboardView />);
    expect(screen.queryByRole('heading', { level: 2, name: lo.legal.dashboard.regulationsSection })).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: lo.legal.dashboard.casesSection })).toBeInTheDocument();
    await waitFor(() => expect(legalCasesService.dashboard).toHaveBeenCalled());
    expect(legalDocumentsService.dashboard).not.toHaveBeenCalled();
  });

  it('a failing section shows its own retry without hiding the other', async () => {
    login(['legal-documents', 'legal-cases']);
    vi.mocked(legalDocumentsService.dashboard).mockRejectedValueOnce(new Error('boom'));
    const user = userEvent.setup();
    render(<LegalDashboardView />);
    const retry = await screen.findByRole('button', { name: lo.common.retry });
    await waitFor(() => expect(screen.getByTestId('cases-stage-bar')).toBeInTheDocument());
    await user.click(retry);
    await waitFor(() => expect(screen.getByText(lo.legal.docTypes.MANUAL)).toBeInTheDocument());
  });

  it('shows the add button only to users who can create', async () => {
    login(['legal-documents', 'legal-cases'], 'legal.viewer');
    const { unmount } = render(<LegalDashboardView />);
    expect(screen.queryByRole('link', { name: lo.legal.dashboard.new })).toBeNull();
    unmount();
    login(['legal-documents', 'legal-cases'], 'legal.editor');
    render(<LegalDashboardView />);
    expect(screen.getByRole('link', { name: lo.legal.dashboard.new })).toHaveAttribute('href', '/legal/new');
  });
});

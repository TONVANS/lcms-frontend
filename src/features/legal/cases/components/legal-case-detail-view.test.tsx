import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { formatMoney } from '@/lib/utils/money';
import { legalCasesMockDb } from '../mocks/legal-cases.mock';
import { disputeStepNumber, LegalCaseDetailView } from './legal-case-detail-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/legal/cases/case-1',
  useSearchParams: () => new URLSearchParams(),
}));

const D = lo.legal.cases.detail;
const L = lo.legal.cases.list;

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({ user: MOCK_USERS.find((u) => u.username === username)!, status: 'authenticated' });
}

beforeEach(() => {
  installMocks(api, { delay: 0 });
  legalCasesMockDb.reset(new Date());
});

describe('disputeStepNumber', () => {
  it('maps FIRST_INSTANCE -> APPEAL -> SUPREME -> CLOSED/RESOLVED to 1..4', () => {
    expect(['FIRST_INSTANCE', 'APPEAL', 'SUPREME', 'CLOSED', 'RESOLVED'].map((s) => disputeStepNumber(s as never))).toEqual([
      1, 2, 3, 4, 4,
    ]);
  });
});

describe('LegalCaseDetailView', () => {
  it('shows info, the stage stepper, the money table and attachments of case-1', async () => {
    session('legal.user');
    render(<LegalCaseDetailView id="case-1" />);
    const raw = legalCasesMockDb.get('case-1')!;
    expect(await screen.findByRole('heading', { name: D.info })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: raw.defendant })).toBeInTheDocument();
    const stepper = screen.getByRole('navigation', { name: lo.stepper.nav });
    expect(stepper).toHaveTextContent(lo.legal.disputeStatus.FIRST_INSTANCE);
    expect(stepper).toHaveTextContent(lo.legal.disputeStatus.APPEAL);
    expect(stepper).toHaveTextContent(lo.legal.disputeStatus.SUPREME);

    const table = screen.getByRole('region', { name: D.amounts });
    expect(within(table).getByText(lo.legal.fields.totalDue)).toBeInTheDocument();
    expect(
      within(table).getAllByText(formatMoney({ amount: Number(raw.totalDueLak), currency: 'LAK' })).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText('Case-1-Court-Summons.pdf')).toBeInTheDocument();
  });

  it('shows the resolved stage on the last step', async () => {
    session('legal.user');
    legalCasesMockDb.update('case-1', { disputeStatus: 'RESOLVED' });
    render(<LegalCaseDetailView id="case-1" />);
    await screen.findByRole('heading', { name: D.info });
    expect(screen.getByRole('navigation', { name: lo.stepper.nav })).toHaveTextContent(
      lo.legal.disputeStatus.RESOLVED,
    );
  });

  it('viewer has no edit or delete buttons; editor has both', async () => {
    session('legal.viewer');
    const { unmount } = render(<LegalCaseDetailView id="case-1" />);
    await screen.findByRole('heading', { name: D.info });
    expect(screen.queryByRole('button', { name: L.edit })).toBeNull();
    expect(screen.queryByRole('button', { name: L.delete })).toBeNull();
    unmount();
    session('legal.editor');
    render(<LegalCaseDetailView id="case-1" />);
    expect(await screen.findByRole('button', { name: L.edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: L.delete })).toBeInTheDocument();
  });

  it('shows not found for an unknown id', async () => {
    session('legal.user');
    render(<LegalCaseDetailView id="nope" />);
    expect(await screen.findByText(D.notFound)).toBeInTheDocument();
  });
});

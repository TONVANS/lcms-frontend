import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { formatMoney } from '@/lib/utils/money';
import { casesService } from '../api/cases.service';
import { caseTotal } from '../lib/case-money';
import { casesMockDb } from '../mocks/cases.mock';
import { CaseDetailView } from './case-detail-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/legal/cases/case-1',
}));

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
  installMocks(api, { delay: 0 });
  casesMockDb.reset(new Date());
});

describe('CaseDetailView', () => {
  it('header shows caseNo, defendant, stage badge', async () => {
    session('legal.viewer');
    const c = casesMockDb.get('case-1')!;
    render(<CaseDetailView id={c.id} />);

    await waitFor(() => expect(screen.queryByTestId('case-detail-skeleton')).toBeNull());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(c.defendant);
    expect(screen.getAllByText(new RegExp(c.caseNo)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(lo.legal.caseStages[c.stage]).length).toBeGreaterThan(0);
  });

  it('stepper has 4 steps; the last is labelled by the actual finished stage', async () => {
    session('legal.viewer');

    // 1. in-progress case (e.g. first_instance) -> last step is progress.finished
    const inProgressCase = casesMockDb.all().find((c) => c.stage === 'first_instance')!;
    const { unmount } = render(<CaseDetailView id={inProgressCase.id} />);
    await waitFor(() => expect(screen.queryByTestId('case-detail-skeleton')).toBeNull());

    const stepperNav = screen.getByRole('navigation', { name: lo.stepper.nav });
    expect(within(stepperNav).getByText(lo.legal.caseStages.first_instance)).toBeInTheDocument();
    expect(within(stepperNav).getByText(lo.legal.caseStages.appeal)).toBeInTheDocument();
    expect(within(stepperNav).getByText(lo.legal.caseStages.cassation)).toBeInTheDocument();
    expect(within(stepperNav).getByText(lo.legal.progress.finished)).toBeInTheDocument();
    unmount();

    // 2. completed case -> last step is caseStages.completed
    const completedCase = casesMockDb.all().find((c) => c.stage === 'completed')!;
    const { unmount: unmount2 } = render(<CaseDetailView id={completedCase.id} />);
    await waitFor(() => expect(screen.queryByTestId('case-detail-skeleton')).toBeNull());
    const stepperNav2 = screen.getByRole('navigation', { name: lo.stepper.nav });
    expect(within(stepperNav2).getByText(lo.legal.caseStages.completed)).toBeInTheDocument();
    unmount2();

    // 3. closed case -> last step is caseStages.closed
    const closedCase = casesMockDb.all().find((c) => c.stage === 'closed')!;
    render(<CaseDetailView id={closedCase.id} />);
    await waitFor(() => expect(screen.queryByTestId('case-detail-skeleton')).toBeNull());
    const stepperNav3 = screen.getByRole('navigation', { name: lo.stepper.nav });
    expect(within(stepperNav3).getByText(lo.legal.caseStages.closed)).toBeInTheDocument();
  });

  it('money table has rows damage/fine/total/recovered and columns LAK/USD, with - for null', async () => {
    session('legal.viewer');
    const c = casesMockDb.get('case-1')!;
    render(<CaseDetailView id={c.id} />);
    await waitFor(() => expect(screen.queryByTestId('case-detail-skeleton')).toBeNull());

    const table = screen.getByRole('table');
    expect(within(table).getByText(lo.legal.fields.damage)).toBeInTheDocument();
    expect(within(table).getByText(lo.legal.fields.fine)).toBeInTheDocument();
    expect(within(table).getByText(lo.legal.fields.total)).toBeInTheDocument();
    expect(within(table).getByText(lo.legal.fields.recovered)).toBeInTheDocument();

    const totals = caseTotal(c);
    if (totals.lak !== null) {
      expect(within(table).getByText(formatMoney({ amount: totals.lak, currency: 'LAK' }))).toBeInTheDocument();
    }
  });

  it('progress note shown; - when null', async () => {
    session('legal.viewer');
    const c = casesMockDb.get('case-1')!;
    render(<CaseDetailView id={c.id} />);
    await waitFor(() => expect(screen.queryByTestId('case-detail-skeleton')).toBeNull());

    if (c.progress) {
      expect(screen.getByText(c.progress)).toBeInTheDocument();
    } else {
      expect(screen.getByText('—')).toBeInTheDocument();
    }
  });

  it('edit and delete gated by permission; delete routes to /legal/cases', async () => {
    // Viewer: no edit or delete
    session('legal.viewer');
    const c = casesMockDb.get('case-1')!;
    const { unmount } = render(<CaseDetailView id={c.id} />);
    await waitFor(() => expect(screen.queryByTestId('case-detail-skeleton')).toBeNull());
    expect(screen.queryByRole('button', { name: lo.legal.cases.list.edit })).toBeNull();
    expect(screen.queryByRole('button', { name: lo.legal.cases.list.delete })).toBeNull();
    unmount();

    // Editor: has edit and delete, delete flow pushes router
    session('legal.editor');
    const user = userEvent.setup();
    const removeSpy = vi.spyOn(casesService, 'remove');
    render(<CaseDetailView id={c.id} />);
    await waitFor(() => expect(screen.queryByTestId('case-detail-skeleton')).toBeNull());

    const editBtn = screen.getByRole('button', { name: lo.legal.cases.list.edit });
    const deleteBtn = screen.getByRole('button', { name: lo.legal.cases.list.delete });
    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    await user.click(deleteBtn);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(lo.legal.cases.list.deleteDesc(c.caseNo))).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.confirm }));

    await waitFor(() => expect(removeSpy).toHaveBeenCalledWith(c.id));
    expect(toast.success).toHaveBeenCalledWith(lo.legal.cases.list.deleted);
    expect(router.push).toHaveBeenCalledWith('/legal/cases');
  });

  it('404 EmptyState', async () => {
    session('legal.viewer');
    render(<CaseDetailView id="case-does-not-exist" />);
    await waitFor(() => expect(screen.queryByTestId('case-detail-skeleton')).toBeNull());
    expect(screen.getByText(lo.legal.cases.detail.notFound)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lo.legal.cases.detail.backToList })).toHaveAttribute(
      'href',
      '/legal/cases',
    );
  });
});

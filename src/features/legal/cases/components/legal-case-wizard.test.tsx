import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { legalCasesService } from '../api/legal-cases.service';
import { legalCasesMockDb } from '../mocks/legal-cases.mock';
import { LegalCaseWizard } from './legal-case-wizard';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => '/legal/new',
  useSearchParams: () => new URLSearchParams('kind=case'),
}));

const F = lo.legal.fields;
const W = lo.legal.wizard;
const WC = W.cases;
const label = (t: string) => screen.getByLabelText(new RegExp(t));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  legalCasesMockDb.reset(new Date());
  setMockSession('legal.editor', false);
  useAuthStore.setState({ user: MOCK_USERS.find((u) => u.username === 'legal.editor')!, status: 'authenticated' });
});

describe('LegalCaseWizard', () => {
  it('blocks step 1 until code, defendant and date are given', async () => {
    const user = userEvent.setup();
    render(<LegalCaseWizard />);
    await user.click(screen.getByRole('button', { name: W.next }));
    expect((await screen.findAllByText(lo.legal.validation.required)).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole('heading', { level: 2, name: WC.step1 })).toBeInTheDocument();
  });

  it('walks three steps with amounts and creates the case', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(legalCasesService, 'create');
    render(<LegalCaseWizard />);

    await user.type(label(F.caseCode), 'WIZ-001');
    await user.type(label(F.defendant), 'Wizard Defendant');
    await user.click(screen.getByRole('button', { name: new RegExp(F.date) }));
    await user.click(await screen.findByRole('button', { name: new RegExp('^' + lo.datePicker.today + ', ') }));
    await user.click(screen.getByRole('button', { name: W.next }));

    expect(await screen.findByRole('heading', { level: 2, name: WC.step2 })).toBeInTheDocument();
    await user.type(screen.getByLabelText(new RegExp(F.damage + '.*LAK')), '5000000');
    await user.click(screen.getByRole('button', { name: W.next }));

    expect(await screen.findByRole('heading', { level: 2, name: WC.step3 })).toBeInTheDocument();
    expect(screen.getAllByText('Wizard Defendant').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: WC.submit }));

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0]).toMatchObject({ caseCode: 'WIZ-001', damageLak: 5000000, fineLak: 0 });
    const created = await create.mock.results[0].value;
    expect(push).toHaveBeenCalledWith('/legal/cases/' + created.id);
  });

  it('returns to step 1 on a duplicate case code', async () => {
    const user = userEvent.setup();
    render(<LegalCaseWizard />);
    await user.type(label(F.caseCode), legalCasesMockDb.all()[0].caseCode);
    await user.type(label(F.defendant), 'Dup');
    await user.click(screen.getByRole('button', { name: new RegExp(F.date) }));
    await user.click(await screen.findByRole('button', { name: new RegExp('^' + lo.datePicker.today + ', ') }));
    await user.click(screen.getByRole('button', { name: W.next }));
    await user.click(await screen.findByRole('button', { name: W.next }));
    await user.click(await screen.findByRole('button', { name: WC.submit }));
    expect(await screen.findByText(lo.legal.validation.caseCodeDuplicate)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

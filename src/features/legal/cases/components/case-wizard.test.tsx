import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { casesService } from '../api/cases.service';
import { casesMockDb } from '../mocks/cases.mock';
import { CaseWizard } from './case-wizard';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
}));

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

const F = lo.legal.fields;
const W = lo.legal.wizard;
const WC = lo.legal.wizard.cases;

type User = ReturnType<typeof userEvent.setup>;

const nextBtn = () => screen.getByRole('button', { name: W.next });
const submitBtn = () => screen.getByRole('button', { name: new RegExp(`^(${WC.submit}|${lo.legal.cases.form.saving})$`) });

async function fillStep1(user: User, defendant = 'Defendant Company X') {
  await user.type(screen.getByLabelText(new RegExp(F.defendant)), defendant);
  await user.type(screen.getByLabelText(new RegExp(F.allegation)), 'Breach of contract');
  await user.type(screen.getByLabelText(new RegExp(F.handlingUnit)), 'Legal Department');
}

async function fillStep2(user: User) {
  const damageLak = screen.getByLabelText(new RegExp(`${F.damage}.*LAK`));
  await user.type(damageLak, '10,000,000');
  const fineLak = screen.getByLabelText(new RegExp(`${F.fine}.*LAK`));
  await user.type(fineLak, '2,000,000');
}

async function toReview(user: User, defendant = 'Defendant Company X') {
  await fillStep1(user, defendant);
  await user.click(nextBtn());
  await screen.findByRole('heading', { level: 2, name: WC.step2 });
  await fillStep2(user);
  await user.click(nextBtn());
  await screen.findByRole('heading', { level: 2, name: WC.step3 });
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  casesMockDb.reset(new Date());
  nav.push = vi.fn();
  nav.replace = vi.fn();
  session('legal.editor');
});

describe('CaseWizard', () => {
  it('renders step 1 with initial fields and live summary aside', () => {
    render(<CaseWizard />);

    expect(screen.getByRole('heading', { level: 1, name: WC.title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: WC.step1 })).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(F.defendant))).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(F.allegation))).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(F.handlingUnit))).toBeInTheDocument();

    const aside = screen.getByRole('complementary', { name: WC.summary });
    expect(aside).toBeInTheDocument();
  });

  it('blocks Next until step-1 required fields are valid and focuses first invalid field', async () => {
    const user = userEvent.setup();
    render(<CaseWizard />);

    await user.click(nextBtn());

    expect(screen.getByRole('heading', { level: 2, name: WC.step1 })).toBeInTheDocument();
    const defendant = screen.getByLabelText(new RegExp(F.defendant));
    expect(defendant).toHaveAttribute('aria-invalid', 'true');
    expect(defendant).toHaveFocus();
  });

  it('step 2 shows live total calculation from entered damage and fine', async () => {
    const user = userEvent.setup();
    render(<CaseWizard />);

    await fillStep1(user);
    await user.click(nextBtn());
    await screen.findByRole('heading', { level: 2, name: WC.step2 });

    await fillStep2(user);

    const totalRegion = screen.getByRole('region', { name: F.total });
    expect(within(totalRegion).getByText('12,000,000')).toBeInTheDocument();
  });

  it('advances through steps and shows review of entered values on step 3', async () => {
    const user = userEvent.setup();
    render(<CaseWizard />);

    await toReview(user, 'Acme Corp');

    expect(screen.getByRole('heading', { level: 3, name: W.review })).toBeInTheDocument();
    const review = screen.getByRole('heading', { level: 3, name: W.review }).closest('section')!;
    const dd = (label: string) => within(review).getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement;
    expect(dd(F.defendant)).toHaveTextContent('Acme Corp');
    expect(dd(F.allegation)).toHaveTextContent('Breach of contract');
    expect(dd(F.handlingUnit)).toHaveTextContent('Legal Department');
  });

  it('submit creates once and routes to the detail page', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(casesService, 'create');

    render(<CaseWizard />);
    await toReview(user, 'Beta LLC');

    await user.click(submitBtn());

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(nav.push).toHaveBeenCalledTimes(1));
    const createdId = (await create.mock.results[0].value).id;
    expect(nav.push).toHaveBeenCalledWith(`/legal/cases/${createdId}`);
    expect(toast.success).toHaveBeenCalledWith(WC.created);
  });

  it('double-click on submit creates once (synchronous busyRef lock)', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(casesService, 'create');

    render(<CaseWizard />);
    await toReview(user, 'Gamma Inc');

    const btn = submitBtn();
    fireEvent.click(btn);
    fireEvent.click(btn);

    await waitFor(() => expect(nav.push).toHaveBeenCalled());
    expect(create).toHaveBeenCalledTimes(1);
  });
});

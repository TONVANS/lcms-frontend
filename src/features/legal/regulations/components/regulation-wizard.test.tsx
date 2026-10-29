import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { type Attachment, documentsService } from '@/features/documents';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { regulationsService } from '../api/regulations.service';
import { regulationsMockDb } from '../mocks/regulations.mock';
import { RegulationWizard } from './regulation-wizard';

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
const WR = lo.legal.wizard.regulations;

type User = ReturnType<typeof userEvent.setup>;

const nextBtn = () => screen.getByRole('button', { name: W.next });
const submitBtn = () => screen.getByRole('button', { name: new RegExp(`^(${WR.submit}|${lo.legal.regulations.form.saving})$`) });
const fileInput = () => screen.getByLabelText(lo.dropzone.prompt);
const pdf = (name: string) => new File(['x'], name, { type: 'application/pdf' });

async function pickIssuedDate(user: User, day: number) {
  await user.click(screen.getByRole('button', { name: new RegExp(F.issuedDate) }));
  const dialog = await screen.findByRole('dialog');
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  const dd = String(day).padStart(2, '0');
  const regex = new RegExp(`(^|,\\s*)${dd}/${mm}/${yyyy}`);
  await user.click(within(dialog).getByRole('button', { name: regex }));
}

async function fillStep1(user: User, number = 'REG-WZ-999') {
  await user.type(screen.getByLabelText(new RegExp(F.title)), 'Regulation wizard test title');
  await user.type(screen.getByLabelText(new RegExp(F.number)), number);
  await pickIssuedDate(user, 10);
}

async function fillStep2(user: User) {
  await user.type(screen.getByLabelText(new RegExp(F.responsible)), 'Somphone');
  await user.type(screen.getByLabelText(new RegExp(F.purpose)), 'Purpose test for regulation wizard');
}

async function toReview(user: User, number = 'REG-WZ-999') {
  await fillStep1(user, number);
  await user.click(nextBtn());
  await screen.findByRole('heading', { level: 2, name: WR.step2 });
  await fillStep2(user);
  await user.click(nextBtn());
  await screen.findByRole('heading', { level: 2, name: WR.step3 });
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  regulationsMockDb.reset(new Date());
  nav.push = vi.fn();
  nav.replace = vi.fn();
  session('legal.editor');
});

describe('RegulationWizard', () => {
  it('renders step 1 with initial fields and live summary aside', () => {
    render(<RegulationWizard />);

    expect(screen.getByRole('heading', { level: 1, name: WR.title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: WR.step1 })).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(F.title))).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(F.number))).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(F.issuedDate))).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(F.year))).toBeInTheDocument();

    const aside = screen.getByRole('complementary', { name: WR.summary });
    expect(aside).toBeInTheDocument();
  });

  it('blocks Next until step-1 fields are valid and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    render(<RegulationWizard />);

    await user.click(nextBtn());

    expect(screen.getByRole('heading', { level: 2, name: WR.step1 })).toBeInTheDocument();
    const title = screen.getByLabelText(new RegExp(F.title));
    expect(title).toHaveAttribute('aria-invalid', 'true');
    expect(title).toHaveFocus();
  });

  it('advances through steps and shows review of entered values on step 3', async () => {
    const user = userEvent.setup();
    render(<RegulationWizard />);

    await toReview(user, 'REG-WZ-100');

    expect(screen.getByRole('heading', { level: 3, name: W.review })).toBeInTheDocument();
    const review = screen.getByRole('heading', { level: 3, name: W.review }).closest('section')!;
    const dd = (label: string) => within(review).getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement;
    expect(dd(F.title)).toHaveTextContent('Regulation wizard test title');
    expect(dd(F.number)).toHaveTextContent('REG-WZ-100');
    expect(dd(F.responsible)).toHaveTextContent('Somphone');
    expect(dd(F.status)).toHaveTextContent(lo.legal.regulationStatus.in_force);
  });

  it('submit creates, uploads staged files to legal-documents, and routes to detail', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(regulationsService, 'create');
    const upload = vi.spyOn(documentsService, 'upload').mockResolvedValue({} as Attachment);

    render(<RegulationWizard />);
    await toReview(user, 'REG-WZ-200');

    await user.upload(fileInput(), [pdf('spec.pdf')]);
    await user.click(submitBtn());

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(upload).toHaveBeenCalledWith('legal-documents', expect.any(String), expect.any(File));
    await waitFor(() => expect(nav.push).toHaveBeenCalledTimes(1));
    const createdId = (await create.mock.results[0].value).id;
    expect(nav.push).toHaveBeenCalledWith(`/legal/regulations/${createdId}`);
    expect(toast.success).toHaveBeenCalledWith(WR.created);
  });

  it('double-click on submit creates once (synchronous busyRef lock)', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(regulationsService, 'create');
    vi.spyOn(documentsService, 'upload').mockResolvedValue({} as Attachment);

    render(<RegulationWizard />);
    await toReview(user, 'REG-WZ-300');

    const btn = submitBtn();
    fireEvent.click(btn);
    fireEvent.click(btn);

    await waitFor(() => expect(nav.push).toHaveBeenCalled());
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('shows server 409 duplicate number error on the number field and returns to step 1', async () => {
    const user = userEvent.setup();
    render(<RegulationWizard />);

    const duplicateNo = regulationsMockDb.all()[0].number;
    await toReview(user, duplicateNo);
    await user.click(submitBtn());

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: WR.step1 })).toBeInTheDocument();
    });
    const numberInput = screen.getByLabelText(new RegExp(F.number));
    expect(numberInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(lo.legal.validation.numberDuplicate)).toBeInTheDocument();
  });
});

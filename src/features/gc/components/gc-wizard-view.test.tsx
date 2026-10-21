import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewPage from '@/app/(app)/contracts/new/page';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { documentsService, type DocumentFile } from '@/features/documents';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import type { ApiError } from '@/types/api';
import { gcService } from '../api/gc.service';
import { gcMockDb } from '../mocks/gc.mock';
import { GcWizardView } from './gc-wizard-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const nav = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
}));

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

const F = lo.gc.fields;
const W = lo.gc.wizard;
const now = new Date();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const yyyy = String(now.getFullYear());
const ymd = (day: number) => `${yyyy}-${mm}-${String(day).padStart(2, '0')}`;

type User = ReturnType<typeof userEvent.setup>;

const heading = (name: string) => screen.findByRole('heading', { level: 2, name });
const nextBtn = () => screen.getByRole('button', { name: W.next });
const submitBtn = () => screen.getByRole('button', { name: new RegExp(`^(${W.submit}|${lo.gc.form.saving})$`) });

async function pickDate(user: User, label: string, day: number) {
  await user.click(screen.getByRole('button', { name: new RegExp(label) }));
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: new RegExp(`${String(day).padStart(2, '0')}/${mm}/${yyyy}`) }));
}

async function fillGeneral(user: User, contractNo = 'WZ-001') {
  await user.type(screen.getByLabelText(new RegExp(F.title)), 'Wizard contract');
  await user.type(screen.getByLabelText(new RegExp(F.contractNo)), contractNo);
}

async function fillDates(user: User) {
  await pickDate(user, F.signedDate, 5);
  await pickDate(user, F.effectiveDate, 10);
  await pickDate(user, F.endDate, 20);
}

async function toReview(user: User, contractNo = 'WZ-001') {
  await fillGeneral(user, contractNo);
  await user.click(nextBtn());
  await heading(W.step2);
  await fillDates(user);
  await user.click(nextBtn());
  await heading(W.step3);
  await user.type(screen.getByLabelText(F.value), '1500');
  await user.click(nextBtn());
  await heading(W.step4);
}

const pdf = (name: string) => new File(['x'], name, { type: 'application/pdf' });
const fileInput = () => screen.getByLabelText(lo.dropzone.prompt);

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  gcMockDb.reset(new Date());
  nav.replace = vi.fn();
  session('gc.editor');
});

describe('GcWizardView route', () => {
  it('viewer is redirected to /forbidden', () => {
    session('gc.viewer');
    render(<NewPage />);
    expect(nav.replace).toHaveBeenCalledWith('/forbidden');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('editor sees the wizard', async () => {
    render(<NewPage />);
    expect(await screen.findByRole('heading', { level: 1, name: W.title })).toBeInTheDocument();
  });
});

describe('GcWizardView steps', () => {
  it('next validates only the current step and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    render(<GcWizardView />);
    await user.click(nextBtn());
    const title = screen.getByLabelText(new RegExp(F.title));
    await waitFor(() => expect(title).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(title).toHaveFocus());
    expect(screen.getByRole('heading', { level: 2, name: W.step1 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(F.signedDate) })).not.toBeInTheDocument();
  });

  it('a successful next moves focus to the new step heading', async () => {
    const user = userEvent.setup();
    render(<GcWizardView />);
    await fillGeneral(user);
    await user.click(nextBtn());
    const h = await heading(W.step2);
    await waitFor(() => expect(h).toHaveFocus());
    expect(h).toHaveAttribute('tabindex', '-1');
  });

  it('dates step reports end must be after effective, and focuses it', async () => {
    const user = userEvent.setup();
    render(<GcWizardView />);
    await fillGeneral(user);
    await user.click(nextBtn());
    await heading(W.step2);
    await pickDate(user, F.signedDate, 5);
    await pickDate(user, F.effectiveDate, 10);
    await pickDate(user, F.endDate, 10);
    await user.click(nextBtn());
    const end = screen.getByRole('button', { name: new RegExp(F.endDate) });
    await waitFor(() => expect(end).toHaveAttribute('aria-invalid', 'true'));
    expect(document.getElementById(end.getAttribute('aria-describedby') as string)).toHaveTextContent(
      lo.gc.validation.endAfterEffective,
    );
    expect(end).toHaveFocus();
    expect(screen.getByRole('heading', { level: 2, name: W.step2 })).toBeInTheDocument();
  });

  it('back keeps entered values', async () => {
    const user = userEvent.setup();
    render(<GcWizardView />);
    await fillGeneral(user, 'KEEP-1');
    await user.click(nextBtn());
    await heading(W.step2);
    await user.click(screen.getByRole('button', { name: W.back }));
    await heading(W.step1);
    expect(screen.getByLabelText(new RegExp(F.title))).toHaveValue('Wizard contract');
    expect(screen.getByLabelText(new RegExp(F.contractNo))).toHaveValue('KEEP-1');
  });

  it('stepper: completed steps are clickable, future steps are disabled and named as not reached', async () => {
    const user = userEvent.setup();
    render(<GcWizardView />);
    const nav1 = screen.getByRole('navigation', { name: lo.stepper.nav });
    const step = (n: number, label: string, state: 'done' | 'current' | 'todo') =>
      within(nav1).getByRole('button', { name: lo.stepper.stepName(n, label, state) });
    expect(step(3, W.step3, 'todo')).toBeDisabled();
    expect(step(4, W.step4, 'todo')).toBeDisabled();
    await fillGeneral(user);
    await user.click(nextBtn());
    await heading(W.step2);
    expect(step(1, W.step1, 'done')).toBeEnabled();
    expect(step(3, W.step3, 'todo')).toBeDisabled();
    await user.click(step(1, W.step1, 'done'));
    await heading(W.step1);
    expect(screen.getByLabelText(new RegExp(F.title))).toHaveValue('Wizard contract');
  });

  it('live summary: progressbar exposes value, range and label; fill animates transform only', async () => {
    const user = userEvent.setup();
    render(<GcWizardView />);
    const bar = screen.getByRole('progressbar', { name: W.progress });
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '4');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    await fillGeneral(user);
    await user.click(nextBtn());
    await heading(W.step2);
    expect(screen.getByRole('progressbar', { name: W.progress })).toHaveAttribute('aria-valuenow', '1');
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.style.transform).toBe('scaleX(0.25)');
    expect(fill.style.width).toBe('');
    expect(fill.className).toContain('transition-transform');
    expect(fill.className).toContain('motion-reduce:transition-none');
    const aside = screen.getByRole('complementary', { name: W.summary });
    expect(within(aside).getByText('Wizard contract')).toBeInTheDocument();
  });
});

describe('GcWizardView review and submit', () => {
  it('review shows formatted values with lo labels and edit links that jump to the step', async () => {
    const user = userEvent.setup();
    render(<GcWizardView />);
    await toReview(user);
    const dd = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement;
    expect(dd(F.title)).toHaveTextContent('Wizard contract');
    expect(dd(F.type)).toHaveTextContent(lo.gc.types.om_service);
    expect(dd(F.signedDate)).toHaveTextContent(formatDate(ymd(5)));
    expect(dd(F.effectiveDate)).toHaveTextContent(formatDate(ymd(10)));
    expect(dd(F.endDate)).toHaveTextContent(formatDate(ymd(20)));
    expect(dd(F.value)).toHaveTextContent('1,500 LAK');
    expect(dd(F.equity)).toHaveTextContent('—');
    expect(dd(F.counterparty)).toHaveTextContent('—');
    await user.click(screen.getByRole('button', { name: W.editSection(W.step2) }));
    await heading(W.step2);
  });

  it('review shows open-ended when there is no end date', async () => {
    const user = userEvent.setup();
    render(<GcWizardView />);
    await fillGeneral(user);
    await user.click(nextBtn());
    await heading(W.step2);
    await pickDate(user, F.signedDate, 5);
    await pickDate(user, F.effectiveDate, 10);
    await user.click(nextBtn());
    await heading(W.step3);
    await user.click(nextBtn());
    await heading(W.step4);
    const dt = screen.getByText(F.endDate, { selector: 'dt' });
    expect(dt.nextElementSibling).toHaveTextContent(lo.gc.openEnded);
  });

  it('submits, uploads staged files with entityType gc, and navigates to the detail page', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(gcService, 'create');
    const upload = vi.spyOn(documentsService, 'upload').mockResolvedValue({} as DocumentFile);
    render(<GcWizardView />);
    await toReview(user);
    await user.upload(fileInput(), [pdf('a.pdf'), pdf('b.pdf')]);
    await user.click(submitBtn());
    await waitFor(() => expect(nav.replace).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledTimes(1);
    const created = await create.mock.results[0].value;
    expect(nav.replace).toHaveBeenCalledWith(`/contracts/${created.id}`);
    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload.mock.calls.map((c) => [c[0].name, c[1], c[2]])).toEqual([
      ['a.pdf', 'gc', created.id],
      ['b.pdf', 'gc', created.id],
    ]);
    expect(toast.success).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('a failed upload still creates once, toasts the failed file and navigates', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(gcService, 'create');
    vi.spyOn(documentsService, 'upload').mockImplementation((file) =>
      file.name === 'bad.pdf' ? Promise.reject(new Error('boom')) : Promise.resolve({} as DocumentFile),
    );
    render(<GcWizardView />);
    await toReview(user);
    await user.upload(fileInput(), [pdf('good.pdf'), pdf('bad.pdf')]);
    await user.click(submitBtn());
    await waitFor(() => expect(nav.replace).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(1);
    const text = vi.mocked(toast.error).mock.calls[0][0] as string;
    expect(text).toContain('bad.pdf');
    expect(text).not.toContain('good.pdf');
    const created = await create.mock.results[0].value;
    expect(nav.replace).toHaveBeenCalledWith(`/contracts/${created.id}`);
  });

  it('locks submit while in flight and never POSTs twice, even after a second click', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(gcService, 'create');
    let release!: () => void;
    vi.spyOn(documentsService, 'upload').mockImplementation(
      () => new Promise((r) => (release = () => r({} as DocumentFile))),
    );
    render(<GcWizardView />);
    await toReview(user);
    await user.upload(fileInput(), [pdf('a.pdf')]);
    await user.click(submitBtn());
    await waitFor(() => expect(submitBtn()).toBeDisabled());
    await user.click(submitBtn());
    expect(create).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(release).toBeTypeOf('function'));
    release();
    await waitFor(() => expect(nav.replace).toHaveBeenCalledTimes(1));
    // Navigation did not unmount the view here; a further click must not create again.
    await user.click(submitBtn());
    await waitFor(() => expect(submitBtn()).toBeEnabled());
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('a staged file can be removed before submit', async () => {
    const user = userEvent.setup();
    const upload = vi.spyOn(documentsService, 'upload').mockResolvedValue({} as DocumentFile);
    render(<GcWizardView />);
    await toReview(user);
    await user.upload(fileInput(), [pdf('a.pdf'), pdf('b.pdf')]);
    await user.click(screen.getByRole('button', { name: lo.dropzone.deleteFile('a.pdf') }));
    expect(screen.queryByText('a.pdf')).not.toBeInTheDocument();
    await user.click(submitBtn());
    await waitFor(() => expect(nav.replace).toHaveBeenCalled());
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0][0].name).toBe('b.pdf');
  });

  it('rejects files of an unsupported type and does not stage them', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<GcWizardView />);
    await toReview(user);
    await user.upload(fileInput(), [new File(['x'], 'evil.exe', { type: 'application/octet-stream' })]);
    expect(screen.queryByText('evil.exe', { selector: 'p' })).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
  });

  it('duplicate number returns to step 1 with the field error and focus', async () => {
    const user = userEvent.setup();
    const dup = gcMockDb.all()[0].contractNo;
    render(<GcWizardView />);
    await toReview(user, dup);
    await user.click(submitBtn());
    await heading(W.step1);
    const no = screen.getByLabelText(new RegExp(F.contractNo));
    await waitFor(() => expect(no).toHaveAttribute('aria-invalid', 'true'));
    expect(document.getElementById(no.getAttribute('aria-describedby') as string)).toHaveTextContent(
      lo.gc.errors.duplicateNo,
    );
    await waitFor(() => expect(no).toHaveFocus());
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('a server field error on another step jumps to that step and focuses the field', async () => {
    const user = userEvent.setup();
    const err: ApiError = { status: 409, code: 'X', message: '', fieldErrors: { value: 'ມູນຄ່າບໍ່ຖືກຕ້ອງ' } };
    vi.spyOn(gcService, 'create').mockRejectedValue(err);
    render(<GcWizardView />);
    await toReview(user);
    await user.click(submitBtn());
    await heading(W.step3);
    const value = screen.getByLabelText(F.value);
    await waitFor(() => expect(value).toHaveFocus());
    expect(screen.getByText('ມູນຄ່າບໍ່ຖືກຕ້ອງ')).toBeInTheDocument();
  });

  it('unmatched server keys show a rose banner on the review step', async () => {
    const user = userEvent.setup();
    const err: ApiError = { status: 409, code: 'X', message: '', fieldErrors: { documents: 'bad' } };
    vi.spyOn(gcService, 'create').mockRejectedValue(err);
    render(<GcWizardView />);
    await toReview(user);
    await user.click(submitBtn());
    expect(await screen.findByRole('alert')).toHaveTextContent(lo.errors.unknown);
    expect(screen.getByRole('heading', { level: 2, name: W.step4 })).toBeInTheDocument();
    expect(submitBtn()).toBeEnabled();
  });

  it('a 403 shows the forbidden banner and allows another attempt', async () => {
    const user = userEvent.setup();
    const err: ApiError = { status: 403, code: 'HTTP_403', message: '' };
    const create = vi.spyOn(gcService, 'create').mockRejectedValue(err);
    render(<GcWizardView />);
    await toReview(user);
    await user.click(submitBtn());
    expect(await screen.findByRole('alert')).toHaveTextContent(lo.errors.forbidden);
    await waitFor(() => expect(submitBtn()).toBeEnabled());
    expect(create).toHaveBeenCalledTimes(1);
  });
});

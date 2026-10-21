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
import { formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/money';
import type { ApiError } from '@/types/api';
import { gcService } from '../api/gc.service';
import { deriveGcStatus } from '../lib/derive-status';
import { gcMockDb } from '../mocks/gc.mock';
import { GcContractDetailView } from './gc-contract-detail-view';

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
const heading = (c: { title: string }) => screen.findByRole('heading', { level: 1, name: c.title });
/** The dd that follows a given dt label. */
function valueOf(label: string): HTMLElement {
  const dt = screen.getByText(label, { selector: 'dt' });
  return dt.nextElementSibling as HTMLElement;
}
const downloadBtns = () => screen.queryAllByRole('button', { name: new RegExp(`^${lo.dropzone.download} `) });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  gcMockDb.reset(new Date());
  nav.replace = vi.fn();
});

describe('GcContractDetailView', () => {
  it('renders fields and status for a seeded expiring contract', async () => {
    session('gc.viewer');
    const c = gcMockDb.get('gc-010')!;
    expect(deriveGcStatus(c)).toBe('expiring');
    render(<GcContractDetailView id="gc-010" />);
    await heading(c);
    expect(screen.getByText(`GC · ${c.contractNo}`)).toBeInTheDocument();
    expect(screen.getAllByText(lo.gc.status.expiring).length).toBeGreaterThan(0);
    expect(valueOf(F.endDate)).toHaveTextContent(formatDate(c.endDate));
    expect(valueOf(F.signedDate)).toHaveTextContent(formatDate(c.signedDate));
    expect(valueOf(F.type)).toHaveTextContent(lo.gc.types[c.type]);
    expect(valueOf(F.contractNo)).toHaveTextContent(c.contractNo);
    expect(valueOf(F.value)).toHaveTextContent(formatMoney(c.value!));
    expect(valueOf(F.equity)).toHaveTextContent('—');
    expect(screen.getByRole('link', { name: new RegExp(lo.gc.detail.backToList) })).toHaveAttribute(
      'href',
      '/contracts/list',
    );
  });

  it('shows equity as a percent or as money', async () => {
    session('gc.viewer');
    const pct = gcMockDb.all().find((x) => x.equity?.kind === 'percent')!;
    const { unmount } = render(<GcContractDetailView id={pct.id} />);
    await heading(pct);
    expect(valueOf(F.equity)).toHaveTextContent(
      `${(pct.equity as { percent: number }).percent}%`,
    );
    unmount();
    const amt = gcMockDb.all().find((x) => x.equity?.kind === 'amount')!;
    render(<GcContractDetailView id={amt.id} />);
    await heading(amt);
    expect(valueOf(F.equity)).toHaveTextContent(
      formatMoney((amt.equity as { money: { amount: number; currency: 'LAK' | 'USD' | 'CNY' } }).money),
    );
  });

  it('timeline lists alert points before the end date', async () => {
    session('gc.viewer');
    const c = gcMockDb.get('gc-010')!;
    render(<GcContractDetailView id="gc-010" />);
    await heading(c);
    const region = screen.getByRole('region', { name: lo.gc.detail.keyDates });
    const items = within(region).getAllByRole('listitem');
    const text = items.map((i) => i.textContent ?? '');
    const idx = (label: string) => text.findIndex((t) => t.includes(label));
    expect(idx(lo.gc.detail.alertAt(60))).toBeGreaterThan(-1);
    expect(idx(lo.gc.detail.alertAt(30))).toBeGreaterThan(idx(lo.gc.detail.alertAt(60)));
    expect(idx(lo.gc.detail.alertAt(7))).toBeGreaterThan(idx(lo.gc.detail.alertAt(30)));
    expect(idx(F.endDate)).toBeGreaterThan(idx(lo.gc.detail.alertAt(7)));
    // exactly one current item, announced in text
    expect(within(region).getAllByText(lo.timeline.status.current)).toHaveLength(1);
  });

  it('open-ended contract shows the open-ended label and no alert points', async () => {
    session('gc.viewer');
    const c = gcMockDb.get('gc-019')!;
    expect(c.endDate).toBeNull();
    render(<GcContractDetailView id="gc-019" />);
    await heading(c);
    expect(valueOf(F.endDate)).toHaveTextContent(lo.gc.openEnded);
    const region = screen.getByRole('region', { name: lo.gc.detail.keyDates });
    expect(within(region).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText(lo.gc.detail.alertAt(60))).toBeNull();
  });

  it('viewer cannot download, edit or delete', async () => {
    session('gc.viewer');
    render(<GcContractDetailView id="gc-001" />);
    await screen.findByText('GC-2026-001-Contract-Signed.pdf');
    expect(downloadBtns()).toHaveLength(0);
    expect(screen.queryByRole('button', { name: lo.dropzone.deleteFile('GC-2026-001-Contract-Signed.pdf') })).toBeNull();
    expect(screen.queryByRole('button', { name: lo.gc.list.edit })).toBeNull();
    expect(screen.queryByRole('button', { name: lo.gc.list.delete })).toBeNull();
  });

  it('main user can download', async () => {
    session('gc.user');
    render(<GcContractDetailView id="gc-001" />);
    await screen.findByText('GC-2026-001-Contract-Signed.pdf');
    expect(downloadBtns()).toHaveLength(1);
    expect(screen.getByRole('button', { name: lo.gc.list.edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.gc.list.delete })).toBeInTheDocument();
  });

  it('editor can upload and delete documents but not download', async () => {
    session('gc.editor');
    render(<GcContractDetailView id="gc-004" />);
    await screen.findByText('GC-2026-004-Annex-A.pdf');
    expect(downloadBtns()).toHaveLength(0);
    expect(
      screen.getByRole('button', { name: lo.dropzone.deleteFile('GC-2026-004-Annex-A.pdf') }),
    ).toBeInTheDocument();
    expect(screen.getByText(lo.dropzone.prompt)).toBeInTheDocument();
  });

  it('unknown id shows not-found with a back link', async () => {
    session('gc.viewer');
    render(<GcContractDetailView id="nope" />);
    expect(await screen.findByText(lo.gc.detail.notFound)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(lo.gc.detail.backToList) })).toHaveAttribute(
      'href',
      '/contracts/list',
    );
  });

  it('shows a skeleton while loading', () => {
    session('gc.viewer');
    vi.spyOn(gcService, 'get').mockReturnValue(new Promise(() => {}));
    render(<GcContractDetailView id="gc-001" />);
    expect(screen.getByTestId('gc-detail-skeleton')).toBeInTheDocument();
  });

  it('shows a rose banner for a server error and retry reloads', async () => {
    session('gc.viewer');
    const c = gcMockDb.get('gc-001')!;
    const err: ApiError = { status: 500, code: 'HTTP_500', message: 'boom' };
    const spy = vi.spyOn(gcService, 'get').mockRejectedValueOnce(err);
    const user = userEvent.setup();
    render(<GcContractDetailView id="gc-001" />);
    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent(lo.errors.server);
    await user.click(within(banner).getByRole('button', { name: lo.common.retry }));
    await heading(c);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the forbidden message for a 403 from the server', async () => {
    session('gc.viewer');
    const err: ApiError = { status: 403, code: 'HTTP_403', message: 'no' };
    vi.spyOn(gcService, 'get').mockRejectedValue(err);
    render(<GcContractDetailView id="gc-001" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(lo.errors.forbidden);
  });

  it('edit replaces the shown contract without a reload', async () => {
    session('gc.user');
    const c = gcMockDb.get('gc-001')!;
    expect(deriveGcStatus(c)).toBe('expiring');
    const user = userEvent.setup();
    render(<GcContractDetailView id="gc-001" />);
    await heading(c);
    await user.click(screen.getByRole('button', { name: lo.gc.list.edit }));
    const dialog = await screen.findByRole('dialog');
    const title = within(dialog).getByLabelText(new RegExp(F.title));
    await user.clear(title);
    await user.type(title, 'Renamed contract');
    // push the end date a year out so the derived status changes
    const nextEnd = `${new Date().getFullYear() + 3}-01-15`;
    const upd = vi.spyOn(gcService, 'update');
    const get = vi.spyOn(gcService, 'get');
    upd.mockImplementationOnce(async (id, body) => ({
      ...gcMockDb.get(id)!,
      ...body,
      title: 'Renamed contract',
      endDate: nextEnd,
    }));
    await user.click(within(dialog).getByRole('button', { name: lo.gc.form.save }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Renamed contract' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(valueOf(F.endDate)).toHaveTextContent(formatDate(nextEnd));
    expect(screen.getAllByText(lo.gc.status.active).length).toBeGreaterThan(0);
    expect(screen.queryByText(lo.gc.status.expiring)).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  async function openDelete() {
    session('gc.user');
    const c = gcMockDb.get('gc-001')!;
    const user = userEvent.setup();
    render(<GcContractDetailView id="gc-001" />);
    await heading(c);
    await user.click(screen.getByRole('button', { name: lo.gc.list.delete }));
    const dialog = await screen.findByRole('dialog');
    return { c, user, dialog };
  }

  it('delete confirms, removes, toasts and navigates to the list', async () => {
    const { c, user, dialog } = await openDelete();
    expect(dialog).toHaveTextContent(lo.gc.list.deleteDesc(c.contractNo));
    expect(within(dialog).getByRole('button', { name: lo.confirm.confirm })).toHaveClass('to-rose-700');
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/contracts/list'));
    expect(toast.success).toHaveBeenCalledWith(lo.gc.list.deleted);
    expect(gcMockDb.get('gc-001')).toBeUndefined();
  });

  it('delete failure keeps the dialog open and shows an error toast', async () => {
    const err: ApiError = { status: 500, code: 'HTTP_500', message: 'boom' };
    const remove = vi.spyOn(gcService, 'remove').mockRejectedValue(err);
    const { user, dialog } = await openDelete();
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(lo.errors.server));
    expect(remove).toHaveBeenCalledWith('gc-001');
    expect(nav.replace).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByText(lo.gc.list.deleteDesc('GC-2026-001'))).toBeInTheDocument();
  });
});

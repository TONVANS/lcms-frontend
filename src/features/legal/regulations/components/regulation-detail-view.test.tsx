import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { DocumentManager } from '@/features/documents';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { hasPermission } from '@/lib/auth/permissions';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import type { ApiError } from '@/types/api';
import { regulationsService } from '../api/regulations.service';
import { regulationsMockDb } from '../mocks/regulations.mock';
import { RegulationDetailView } from './regulation-detail-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/features/documents', async (orig) => {
  const actual = await orig<typeof import('@/features/documents')>();
  return { ...actual, DocumentManager: vi.fn(actual.DocumentManager) };
});

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn() }),
}));

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

const F = lo.legal.fields;
const D = lo.legal.regulations.detail;
const valueOf = (label: string) =>
  screen.getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  regulationsMockDb.reset(new Date());
  nav.push = vi.fn();
});

describe('RegulationDetailView', () => {
  it('shows number, title, status badge and every field label from lo.legal.fields', async () => {
    session('legal.viewer');
    const r = regulationsMockDb.get('reg-1')!;
    render(<RegulationDetailView id="reg-1" />);
    expect(await screen.findByRole('heading', { level: 1, name: r.title })).toBeInTheDocument();
    expect(screen.getByText(`LEGAL · ${r.number}`)).toBeInTheDocument();
    expect(screen.getAllByText(lo.legal.regulationStatus[r.status]).length).toBeGreaterThan(0);
    for (const label of [
      F.title,
      F.type,
      F.number,
      F.issuedDate,
      F.year,
      F.purpose,
      F.responsible,
      F.unit,
      F.status,
      F.createdAt,
      F.updatedAt,
      F.createdBy,
    ]) {
      expect(screen.getByText(label, { selector: 'dt' })).toBeInTheDocument();
    }
    expect(valueOf(F.type)).toHaveTextContent(lo.legal.regulationTypes[r.type]);
    expect(valueOf(F.number)).toHaveTextContent(r.number);
    expect(valueOf(F.issuedDate)).toHaveTextContent(formatDate(r.issuedDate));
    expect(valueOf(F.year)).toHaveTextContent(String(r.year));
    expect(valueOf(F.unit)).toHaveTextContent(lo.legal.units[r.unit]);
    expect(valueOf(F.createdAt)).toHaveTextContent(formatDate(r.createdAt));
    expect(valueOf(F.updatedAt)).toHaveTextContent(formatDate(r.updatedAt));
    expect(valueOf(F.createdBy)).toHaveTextContent(r.createdBy);
    expect(screen.getByRole('link', { name: new RegExp(D.backToList) })).toHaveAttribute(
      'href',
      '/legal/regulations',
    );
  });

  it("type 'other' shows typeOther; null purpose and responsible show a dash", async () => {
    session('legal.viewer');
    const other = regulationsMockDb.get('reg-17')!;
    const { unmount } = render(<RegulationDetailView id="reg-17" />);
    await screen.findByRole('heading', { level: 1, name: other.title });
    expect(valueOf(F.type)).toHaveTextContent(other.typeOther!);
    unmount();
    const nulls = regulationsMockDb.all().find((x) => x.purpose === null && x.responsible === null)!;
    render(<RegulationDetailView id={nulls.id} />);
    await screen.findByRole('heading', { level: 1, name: nulls.title });
    expect(valueOf(F.purpose)).toHaveTextContent('—');
    expect(valueOf(F.responsible)).toHaveTextContent('—');
  });

  it('external links render as anchors with target _blank and rel noopener noreferrer', async () => {
    session('legal.viewer');
    const r = regulationsMockDb.get('reg-7')!;
    expect(r.externalLinks).toHaveLength(2);
    render(<RegulationDetailView id="reg-7" />);
    await screen.findByRole('heading', { level: 1, name: r.title });
    for (const url of r.externalLinks) {
      const a = screen.getByRole('link', { name: url });
      expect(a).toHaveAttribute('href', url);
      expect(a).toHaveAttribute('target', '_blank');
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('renders only https links as anchors; other entries are plain text', async () => {
    session('legal.viewer');
    const r = {
      ...regulationsMockDb.get('reg-1')!,
      externalLinks: ['https://drive.google.com/x', 'http://a.la', 'javascript:alert(1)'],
    };
    vi.spyOn(regulationsService, 'get').mockResolvedValue(r);
    render(<RegulationDetailView id="reg-1" />);
    await screen.findByRole('heading', { level: 1, name: r.title });
    const region = screen.getByRole('region', { name: D.links });
    const links = within(region).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://drive.google.com/x');
    expect(within(region).getByText('http://a.la').closest('a')).toBeNull();
    expect(within(region).getByText('javascript:alert(1)').closest('a')).toBeNull();
  });

  it('shows the no-links text when there are none', async () => {
    session('legal.viewer');
    const r = regulationsMockDb.get('reg-1')!;
    expect(r.externalLinks).toHaveLength(0);
    render(<RegulationDetailView id="reg-1" />);
    await screen.findByRole('heading', { level: 1, name: r.title });
    expect(screen.getByText(D.noLinks)).toBeInTheDocument();
  });

  it.each(['legal.viewer', 'legal.editor', 'legal.user'])(
    'DocumentManager gets legal-regulation and permissions for %s',
    async (username) => {
      session(username);
      const me = MOCK_USERS.find((u) => u.username === username)!;
      const r = regulationsMockDb.get('reg-1')!;
      render(<RegulationDetailView id="reg-1" />);
      await screen.findByRole('heading', { level: 1, name: r.title });
      const props = vi.mocked(DocumentManager).mock.calls.at(-1)![0];
      expect(props.entityType).toBe('legal-regulation');
      expect(props.entityId).toBe('reg-1');
      const can = (p: 'create' | 'download' | 'delete') => hasPermission(me, 'legal', p);
      expect(props.canUpload).toBe(can('create'));
      expect(props.canDownload).toBe(can('download'));
      expect(props.canDelete).toBe(can('delete'));
    },
  );

  it('edit opens the dialog prefilled and the saved record replaces the shown one', async () => {
    session('legal.user');
    const r = regulationsMockDb.get('reg-1')!;
    const user = userEvent.setup();
    render(<RegulationDetailView id="reg-1" />);
    await screen.findByRole('heading', { level: 1, name: r.title });
    const get = vi.spyOn(regulationsService, 'get');
    await user.click(screen.getByRole('button', { name: lo.legal.regulations.list.edit }));
    const dialog = await screen.findByRole('dialog');
    const title = within(dialog).getByLabelText(new RegExp(F.title));
    expect(title).toHaveValue(r.title);
    await user.type(title, ' EDITED');
    await user.click(within(dialog).getByRole('button', { name: lo.legal.regulations.form.save }));
    expect(
      await screen.findByRole('heading', { level: 1, name: `${r.title} EDITED` }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(get).not.toHaveBeenCalled();
  });

  async function openDelete() {
    session('legal.user');
    const r = regulationsMockDb.get('reg-1')!;
    const user = userEvent.setup();
    render(<RegulationDetailView id="reg-1" />);
    await screen.findByRole('heading', { level: 1, name: r.title });
    await user.click(screen.getByRole('button', { name: lo.legal.regulations.list.delete }));
    const dialog = await screen.findByRole('dialog');
    return { r, user, dialog };
  }

  it('delete confirms, removes, toasts and routes to /legal/regulations', async () => {
    const { r, user, dialog } = await openDelete();
    expect(dialog).toHaveTextContent(lo.legal.regulations.list.deleteDesc(r.number));
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/legal/regulations'));
    expect(toast.success).toHaveBeenCalledWith(lo.legal.regulations.list.deleted);
    expect(regulationsMockDb.get('reg-1')).toBeUndefined();
  });

  it('delete failure shows an error toast and stays', async () => {
    const err: ApiError = { status: 500, code: 'HTTP_500', message: 'boom' };
    const remove = vi.spyOn(regulationsService, 'remove').mockRejectedValue(err);
    const { user, dialog } = await openDelete();
    await user.click(within(dialog).getByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(lo.errors.server));
    expect(remove).toHaveBeenCalledWith('reg-1');
    expect(nav.push).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('404 shows an EmptyState with a link back to the list', async () => {
    session('legal.viewer');
    render(<RegulationDetailView id="nope" />);
    expect(await screen.findByText(D.notFound)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(D.backToList) })).toHaveAttribute(
      'href',
      '/legal/regulations',
    );
  });

  it('shows a rose banner for a server error and retry reloads', async () => {
    session('legal.viewer');
    const r = regulationsMockDb.get('reg-1')!;
    const err: ApiError = { status: 500, code: 'HTTP_500', message: 'boom' };
    const spy = vi.spyOn(regulationsService, 'get').mockRejectedValueOnce(err);
    const user = userEvent.setup();
    render(<RegulationDetailView id="reg-1" />);
    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent(lo.errors.server);
    await user.click(within(banner).getByRole('button', { name: lo.common.retry }));
    await screen.findByRole('heading', { level: 1, name: r.title });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('shows a skeleton while loading', () => {
    session('legal.viewer');
    vi.spyOn(regulationsService, 'get').mockReturnValue(new Promise(() => {}));
    render(<RegulationDetailView id="reg-1" />);
    expect(screen.getByTestId('regulation-detail-skeleton')).toBeInTheDocument();
  });

  it('viewer sees no edit or delete', async () => {
    session('legal.viewer');
    const r = regulationsMockDb.get('reg-1')!;
    render(<RegulationDetailView id="reg-1" />);
    await screen.findByRole('heading', { level: 1, name: r.title });
    expect(screen.queryByRole('button', { name: lo.legal.regulations.list.edit })).toBeNull();
    expect(screen.queryByRole('button', { name: lo.legal.regulations.list.delete })).toBeNull();
  });
});

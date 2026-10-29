import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { legalDocumentsMockDb } from '../mocks/legal-documents.mock';
import { LegalDocumentDetailView } from './legal-document-detail-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/legal/regulations/reg-1',
  useSearchParams: () => new URLSearchParams(),
}));

const D = lo.legal.regulations.detail;
const L = lo.legal.regulations.list;

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({ user: MOCK_USERS.find((u) => u.username === username)!, status: 'authenticated' });
}

beforeEach(() => {
  installMocks(api, { delay: 0 });
  legalDocumentsMockDb.reset(new Date());
});

describe('LegalDocumentDetailView', () => {
  it('shows the fields, the external link and the attachments of reg-1', async () => {
    session('legal.user');
    render(<LegalDocumentDetailView id="reg-1" />);
    const doc = legalDocumentsMockDb.get('reg-1')!;
    expect(await screen.findByRole('heading', { name: D.info })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: doc.docTitle })).toBeInTheDocument();
    expect(screen.getAllByText(doc.docNumberDate).length).toBeGreaterThan(0);
    expect(screen.getByText(doc.department.name)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: doc.externalUrl! });
    expect(link).toHaveAttribute('href', doc.externalUrl);
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(await screen.findByText('Regulation-351-KPIs-Signed.pdf')).toBeInTheDocument();
  });

  it('does not render a javascript: link as an anchor', async () => {
    session('legal.user');
    legalDocumentsMockDb.update('reg-1', { externalUrl: 'javascript:alert(1)' });
    render(<LegalDocumentDetailView id="reg-1" />);
    await screen.findByRole('heading', { name: D.info });
    expect(screen.queryByRole('link', { name: 'javascript:alert(1)' })).toBeNull();
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
  });

  it('viewer has no edit or delete buttons; editor has both', async () => {
    session('legal.viewer');
    const { unmount } = render(<LegalDocumentDetailView id="reg-1" />);
    await screen.findByRole('heading', { name: D.info });
    expect(screen.queryByRole('button', { name: L.edit })).toBeNull();
    expect(screen.queryByRole('button', { name: L.delete })).toBeNull();
    unmount();
    session('legal.editor');
    render(<LegalDocumentDetailView id="reg-1" />);
    expect(await screen.findByRole('button', { name: L.edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: L.delete })).toBeInTheDocument();
  });

  it('shows a not-found state with a way back for an unknown id', async () => {
    session('legal.user');
    render(<LegalDocumentDetailView id="nope" />);
    expect(await screen.findByText(D.notFound)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: D.backToList })).toBeInTheDocument());
  });
});

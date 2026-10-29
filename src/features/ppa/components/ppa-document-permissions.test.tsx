import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { PpaContractDetailView } from './ppa-contract-detail-view';
import { PpaDocumentsView } from './ppa-documents-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const DOC = 'PPA-NamTheun2-Agreement-Signed.pdf';

// The backend has no ppa viewer fixture in the shared mock users; register one for this suite.
const PPA_VIEWER = {
  ...MOCK_USERS.find((u) => u.username === 'ppa.user')!,
  id: 'u-ppa-viewer',
  username: 'ppa.viewer',
  role: 'VIEWER' as const,
  canUpload: false,
  canEdit: false,
  canDelete: false,
  canDownload: false,
};

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

beforeEach(() => {
  MOCK_USERS.push(PPA_VIEWER);
  installMocks(api, { delay: 0 });
});

afterEach(() => {
  MOCK_USERS.splice(MOCK_USERS.indexOf(PPA_VIEWER), 1);
});

describe('PPA document controls follow the module role', () => {
  it('detail: a ppa viewer sees the file but no upload, download or delete', async () => {
    session('ppa.viewer');
    render(<PpaContractDetailView id="ppa-1" />);
    expect(await screen.findByText(DOC)).toBeInTheDocument();
    expect(screen.queryByText(lo.dropzone.prompt)).toBeNull();
    expect(screen.queryByRole('button', { name: lo.dropzone.downloadFile(DOC) })).toBeNull();
    expect(screen.queryByRole('button', { name: lo.dropzone.deleteFile(DOC) })).toBeNull();
  });

  it('detail: a ppa main user (ppa.user) sees upload, download and delete', async () => {
    session('ppa.user');
    render(<PpaContractDetailView id="ppa-1" />);
    expect(await screen.findByText(DOC)).toBeInTheDocument();
    expect(screen.getByText(lo.dropzone.prompt)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.dropzone.downloadFile(DOC) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.dropzone.deleteFile(DOC) })).toBeInTheDocument();
  });

  it('documents page: a ppa viewer gets no upload zone, a main user does', async () => {
    session('ppa.viewer');
    const { unmount } = render(<PpaDocumentsView />);
    expect(await screen.findByText(lo.dropzone.empty)).toBeInTheDocument();
    expect(screen.queryByText(lo.dropzone.prompt)).toBeNull();
    unmount();

    session('ppa.user');
    render(<PpaDocumentsView />);
    expect(await screen.findByText(lo.dropzone.prompt)).toBeInTheDocument();
  });
});

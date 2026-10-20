import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { lo } from '@/lib/i18n/lo';
import { documentsService } from '../api/documents.service';
import { DocumentManager } from './document-manager';

describe('DocumentManager', () => {
  beforeEach(() => {
    installMocks(api, { delay: 0 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows error with retry on load failure', async () => {
    vi.spyOn(documentsService, 'list').mockRejectedValueOnce({ status: 0, code: 'NETWORK', message: '' });
    const user = userEvent.setup();
    render(<DocumentManager entityType="ppa" entityId="ppa-1" canUpload canDownload canDelete />);
    expect(await screen.findByRole('alert')).toHaveTextContent(lo.errors.network);
    await user.click(screen.getByRole('button', { name: lo.common.retry }));
    expect((await screen.findAllByText(/\.pdf/)).length).toBeGreaterThan(0);
  });

  it('hides download and delete without permission', async () => {
    render(
      <DocumentManager entityType="ppa" entityId="ppa-1" canUpload={false} canDownload={false} canDelete={false} />,
    );
    await screen.findAllByText(/\.pdf/);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('downloads a blob via a temporary link and revokes the URL', async () => {
    const user = userEvent.setup();
    const create = vi.fn(() => 'blob:x');
    const revoke = vi.fn();
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const downloads: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
    render(<DocumentManager entityType="ppa" entityId="ppa-1" canUpload canDownload canDelete />);
    await user.click(
      await screen.findByRole('button', { name: lo.dropzone.downloadFile('PPA-NamTheun2-Agreement-Signed.pdf') }),
    );
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:x'));
    expect(create).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(downloads).toEqual(['PPA-NamTheun2-Agreement-Signed.pdf']);
    Object.assign(URL, { createObjectURL: origCreate, revokeObjectURL: origRevoke });
  });

  it('confirms before deleting', async () => {
    const user = userEvent.setup();
    const del = vi.spyOn(documentsService, 'delete');
    render(<DocumentManager entityType="ppa" entityId="ppa-1" canUpload canDownload canDelete />);
    await user.click(
      await screen.findByRole('button', { name: lo.dropzone.deleteFile('PPA-NamTheun2-Agreement-Signed.pdf') }),
    );
    expect(del).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(del).toHaveBeenCalledWith('doc-1'));
    await waitFor(() => expect(screen.queryByText('PPA-NamTheun2-Agreement-Signed.pdf')).toBeNull());
  });
});

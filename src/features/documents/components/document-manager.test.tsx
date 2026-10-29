import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { documentsService } from '../api/documents.service';
import { DocumentManager } from './document-manager';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const FIRST = 'PPA-NamTheun2-Agreement-Signed.pdf';

function stubUrls() {
  const create = vi.fn(() => 'blob:x');
  const revoke = vi.fn();
  const orig = { c: URL.createObjectURL, r: URL.revokeObjectURL };
  Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
  return {
    create,
    revoke,
    restore: () => Object.assign(URL, { createObjectURL: orig.c, revokeObjectURL: orig.r }),
  };
}

describe('DocumentManager', () => {
  beforeEach(() => {
    installMocks(api, { delay: 0 });
    setMockSession('ppa.user', false);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    clearMockSession();
  });

  const renderPpa = (props: Partial<{ canUpload: boolean; canDownload: boolean; canDelete: boolean }> = {}) =>
    render(
      <DocumentManager
        module="power-contracts"
        entityId="ppa-1"
        canUpload={props.canUpload ?? true}
        canDownload={props.canDownload ?? true}
        canDelete={props.canDelete ?? true}
      />,
    );

  it('lists name, size, uploaded date (dd/mm/yyyy) and uploader', async () => {
    renderPpa();
    const row = (await screen.findByText(FIRST)).closest('li')!;
    expect(row).toHaveTextContent('4.3 MB');
    expect(row).toHaveTextContent('15/01/2026');
    expect(row).toHaveTextContent('admin');
  });

  it('shows error with retry on load failure', async () => {
    vi.spyOn(documentsService, 'list').mockRejectedValueOnce({ status: 0, code: 'NETWORK', message: '' });
    const user = userEvent.setup();
    renderPpa();
    expect(await screen.findByRole('alert')).toHaveTextContent(lo.errors.network);
    await user.click(screen.getByRole('button', { name: lo.common.retry }));
    expect((await screen.findAllByText(/\.pdf/)).length).toBeGreaterThan(0);
  });

  it('hides upload, download and delete without permission but keeps preview', async () => {
    renderPpa({ canUpload: false, canDownload: false, canDelete: false });
    await screen.findByText(FIRST);
    expect(document.querySelector('input[type=file]')).toBeNull();
    expect(screen.queryByRole('button', { name: lo.dropzone.downloadFile(FIRST) })).toBeNull();
    expect(screen.queryByRole('button', { name: lo.dropzone.deleteFile(FIRST) })).toBeNull();
    expect(screen.getByRole('button', { name: lo.dropzone.previewFile(FIRST) })).toBeInTheDocument();
  });

  it('downloads a blob via a temporary link and revokes the URL', async () => {
    const user = userEvent.setup();
    const urls = stubUrls();
    const downloads: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
    const spy = vi.spyOn(documentsService, 'download');
    renderPpa();
    await user.click(await screen.findByRole('button', { name: lo.dropzone.downloadFile(FIRST) }));
    await waitFor(() => expect(urls.revoke).toHaveBeenCalledWith('blob:x'));
    expect(spy).toHaveBeenCalledWith('power-contracts', expect.any(String));
    expect(click).toHaveBeenCalled();
    expect(downloads).toEqual([FIRST]);
    urls.restore();
  });

  it('previews a PDF in an iframe and revokes the object URL on close', async () => {
    const user = userEvent.setup();
    const urls = stubUrls();
    renderPpa();
    await user.click(await screen.findByRole('button', { name: lo.dropzone.previewFile(FIRST) }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(FIRST)).toBeInTheDocument();
    await waitFor(() => expect(dialog.querySelector('iframe')).toHaveAttribute('src', 'blob:x'));
    expect(dialog.querySelector('img')).toBeNull();
    await user.click(within(dialog).getByRole('button', { name: lo.common.close }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(urls.revoke).toHaveBeenCalledWith('blob:x');
    urls.restore();
  });

  it('previews an image with <img>', async () => {
    const user = userEvent.setup();
    const urls = stubUrls();
    vi.spyOn(documentsService, 'list').mockResolvedValue([
      { id: 'i1', fileName: 'pic.png', mimeType: 'image/png', fileSize: 10, createdAt: '2026-01-01', uploadedBy: null },
    ]);
    vi.spyOn(documentsService, 'preview').mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
    renderPpa();
    await user.click(await screen.findByRole('button', { name: lo.dropzone.previewFile('pic.png') }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.querySelector('img')).toHaveAttribute('src', 'blob:x'));
    expect(dialog.querySelector('iframe')).toBeNull();
    urls.restore();
  });

  it('shows a toast and no dialog when preview fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(documentsService, 'preview').mockRejectedValue({ status: 500, code: 'HTTP_500', message: '' });
    renderPpa();
    await user.click(await screen.findByRole('button', { name: lo.dropzone.previewFile(FIRST) }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('rejects files of unsupported type or size without uploading', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const upload = vi.spyOn(documentsService, 'upload');
    renderPpa();
    await screen.findByText(FIRST);
    const doc = new File(['x'], 'a.docx');
    const big = new File([new Uint8Array(26 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(lo.dropzone.prompt), [doc, big]);
    expect(upload).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(lo.dropzone.badType('a.docx'));
    expect(toast.error).toHaveBeenCalledWith(lo.dropzone.tooLarge('big.pdf', 25));
  });

  it('uploads a valid file with (module, entityId, file) and refreshes the list', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const upload = vi.spyOn(documentsService, 'upload');
    renderPpa();
    await screen.findByText(FIRST);
    const f = new File(['x'], 'fresh.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(lo.dropzone.prompt), f);
    expect(upload).toHaveBeenCalledWith('power-contracts', 'ppa-1', f);
    expect(await screen.findByText('fresh.png')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(lo.dropzone.fileUploaded);
  });

  it('confirms before deleting', async () => {
    const user = userEvent.setup();
    const del = vi.spyOn(documentsService, 'remove');
    renderPpa();
    await user.click(await screen.findByRole('button', { name: lo.dropzone.deleteFile(FIRST) }));
    expect(del).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() => expect(del).toHaveBeenCalledWith('power-contracts', 'att-ppa-1-a'));
    await waitFor(() => expect(screen.queryByText(FIRST)).toBeNull());
  });
});

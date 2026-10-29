import { beforeEach, describe, expect, it } from 'vitest';
import { documentsService } from '@/features/documents/api/documents.service';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
});

const pdf = () => new File(['x'], 'a.pdf', { type: 'application/pdf' });

it('401 without a session, with a Nest-style body', async () => {
  await expect(documentsService.list('contracts', 'gc-001')).rejects.toMatchObject({ status: 401 });
});

describe('attachments permissions', () => {
  it('download needs the download permission; preview only needs view', async () => {
    setMockSession('gc.editor', false);
    const [first] = await documentsService.list('contracts', 'gc-001');
    await expect(documentsService.preview('contracts', first.id)).resolves.toBeInstanceOf(Blob);
    await expect(documentsService.download('contracts', first.id)).rejects.toMatchObject({ status: 403 });
    setMockSession('gc.user', false);
    await expect(documentsService.download('contracts', first.id)).resolves.toBeInstanceOf(Blob);
  });

  it('list needs view; upload needs create; delete needs delete', async () => {
    setMockSession('ppa.user', false);
    await expect(documentsService.list('contracts', 'gc-001')).rejects.toMatchObject({ status: 403 });
    setMockSession('gc.viewer', false);
    const [first] = await documentsService.list('contracts', 'gc-001');
    await expect(documentsService.upload('contracts', 'gc-001', pdf())).rejects.toMatchObject({ status: 403 });
    await expect(documentsService.remove('contracts', first.id)).rejects.toMatchObject({ status: 403 });
    setMockSession('gc.editor', false);
    await expect(documentsService.upload('contracts', 'gc-001', pdf())).resolves.toMatchObject({ fileName: 'a.pdf' });
    await expect(documentsService.remove('contracts', first.id)).resolves.toBeUndefined();
  });

  it('maps every module to its UI module key', async () => {
    setMockSession('legal.user', false);
    await expect(documentsService.list('legal-documents', 'reg-1')).resolves.toHaveLength(2);
    await expect(documentsService.list('legal-cases', 'case-1')).resolves.toBeDefined();
    await expect(documentsService.list('power-contracts', 'ppa-1')).rejects.toMatchObject({ status: 403 });
    setMockSession('ppa.user', false);
    await expect(documentsService.list('power-contracts', 'ppa-1')).resolves.toHaveLength(2);
  });

  it('upload keeps the real mime/size and the returned blob has the file type', async () => {
    setMockSession('gc.user', false);
    const png = new File(['hello world'], 'pic.png', { type: 'image/png' });
    const att = await documentsService.upload('contracts', 'gc-003', png);
    expect(att).toMatchObject({ fileName: 'pic.png', mimeType: 'image/png', fileSize: png.size });
    const blob = await documentsService.preview('contracts', att.id);
    expect(blob.type).toBe('image/png');
  });

  it('404 for an unknown attachment', async () => {
    setMockSession('gc.user', false);
    await expect(documentsService.download('contracts', 'nope')).rejects.toMatchObject({ status: 404 });
  });
});

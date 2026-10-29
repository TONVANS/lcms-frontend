import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { documentsService } from './documents.service';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  setMockSession('gc.user', false);
});
afterEach(() => clearMockSession());

describe('documentsService', () => {
  it('list maps attachments for a module + entity', async () => {
    const items = await documentsService.list('contracts', 'gc-001');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toMatchObject({
      id: expect.any(String),
      fileName: expect.stringMatching(/\.pdf$/),
      mimeType: 'application/pdf',
      fileSize: expect.any(Number),
    });
  });

  it('upload posts multipart field "file" and returns the mapped attachment', async () => {
    const file = new File(['hello'], 'new.pdf', { type: 'application/pdf' });
    const att = await documentsService.upload('contracts', 'gc-002', file);
    expect(att).toMatchObject({ fileName: 'new.pdf', mimeType: 'application/pdf', fileSize: 5 });
    const list = await documentsService.list('contracts', 'gc-002');
    expect(list.map((a) => a.id)).toContain(att.id);
  });

  it('preview and download resolve to Blobs', async () => {
    const [first] = await documentsService.list('contracts', 'gc-001');
    await expect(documentsService.preview('contracts', first.id)).resolves.toBeInstanceOf(Blob);
    await expect(documentsService.download('contracts', first.id)).resolves.toBeInstanceOf(Blob);
  });

  it('remove deletes the attachment', async () => {
    setMockSession('ppa.user', false);
    const file = new File(['x'], 'tmp.pdf', { type: 'application/pdf' });
    const att = await documentsService.upload('power-contracts', 'ppa-9', file);
    await documentsService.remove('power-contracts', att.id);
    expect(await documentsService.list('power-contracts', 'ppa-9')).toEqual([]);
  });
});

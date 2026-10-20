import { beforeEach, describe, expect, it } from 'vitest';
import { documentsService } from '@/features/documents/api/documents.service';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
});

it('401 without a session', async () => {
  await expect(documentsService.list('ppa', 'ppa-1')).rejects.toMatchObject({ status: 401 });
});

describe('documents permissions', () => {
  const gcDocId = 'doc-gc-1';

  it('download needs the download permission', async () => {
    setMockSession('gc.editor', false);
    await expect(documentsService.download(gcDocId)).rejects.toMatchObject({ status: 403 });
    setMockSession('gc.user', false);
    await expect(documentsService.download(gcDocId)).resolves.toBeInstanceOf(Blob);
  });

  it('list needs view; upload needs create; delete needs delete', async () => {
    setMockSession('ppa.user', false);
    await expect(documentsService.list('gc', 'gc-001')).rejects.toMatchObject({ status: 403 });
    setMockSession('gc.viewer', false);
    await expect(documentsService.list('gc', 'gc-001')).resolves.toHaveLength(1);
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    await expect(documentsService.upload(file, 'gc', 'gc-001')).rejects.toMatchObject({ status: 403 });
    await expect(documentsService.delete(gcDocId)).rejects.toMatchObject({ status: 403 });
    setMockSession('gc.editor', false);
    await expect(documentsService.upload(file, 'gc', 'gc-001')).resolves.toMatchObject({
      entityType: 'gc',
    });
    await expect(documentsService.delete(gcDocId)).resolves.not.toThrow();
  });

  it('ppa documents keep working for ppa users', async () => {
    setMockSession('ppa.user', false);
    await expect(documentsService.download('doc-3')).resolves.toBeInstanceOf(Blob);
    setMockSession('gc.user', false);
    await expect(documentsService.download('doc-3')).rejects.toMatchObject({ status: 403 });
  });
});

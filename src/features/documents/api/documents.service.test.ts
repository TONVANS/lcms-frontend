import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { documentsService } from './documents.service';

describe('documentsService', () => {
  beforeEach(() => {
    installMocks(api, { delay: 0 });
  });

  it('lists documents for an entity', async () => {
    const docs = await documentsService.list('ppa', 'ppa-1');
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].entityType).toBe('ppa');
  });

  it('uploads a document', async () => {
    const file = new File(['content'], 'test-contract.pdf', { type: 'application/pdf' });
    const uploaded = await documentsService.upload(file, 'ppa', 'ppa-1');
    expect(uploaded.name).toBe('test-contract.pdf');
    expect(uploaded.id).toBeDefined();
  });

  it('deletes a document', async () => {
    await expect(documentsService.delete('doc-1')).resolves.not.toThrow();
  });

  it('routes list, download and delete to distinct mock handlers', async () => {
    const docs = await documentsService.list('ppa', 'ppa-1');
    expect(docs.every((d) => d.entityId === 'ppa-1')).toBe(true);
    const blob = await documentsService.download('doc-3');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain('wordprocessingml');
    await documentsService.delete('doc-2');
    const after = await documentsService.list('ppa', 'ppa-1');
    expect(after.find((d) => d.id === 'doc-2')).toBeUndefined();
  });
});

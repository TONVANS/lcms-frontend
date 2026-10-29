import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { legalDocumentsMockDb } from '../mocks/legal-documents.mock';
import {
  legalDocumentsQueryCodec as codec,
  useLegalDocumentsListStore as store,
} from './legal-documents-list.store';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  legalDocumentsMockDb.reset(new Date());
  store.getState().reset();
});

describe('legal documents list store', () => {
  it('codec carries docType, status, issueYear and departmentId through the URL', () => {
    const q = codec.parse(
      new URLSearchParams('docType=MANUAL&status=INACTIVE&issueYear=2024&departmentId=abc-1&sort=x'),
    );
    expect(q).toEqual({
      page: 1,
      pageSize: 10,
      docType: 'MANUAL',
      status: 'INACTIVE',
      issueYear: 2024,
      departmentId: 'abc-1',
    });
    expect(codec.serialize(q)).toBe('docType=MANUAL&status=INACTIVE&departmentId=abc-1&issueYear=2024');
  });

  it('fetches a filtered page through the service', async () => {
    setMockSession('legal.user', false);
    store.getState().setQuery({ docType: 'MANUAL' });
    await store.getState().fetch();
    const s = store.getState();
    expect(s.status).toBe('ready');
    expect(s.items.length).toBeGreaterThan(0);
    expect(s.items.every((d) => d.docType === 'MANUAL')).toBe(true);
  });
});

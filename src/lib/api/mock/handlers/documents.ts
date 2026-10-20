import type MockAdapter from 'axios-mock-adapter';
import { MOCK_DOCUMENTS } from '@/features/documents/mocks/documents.mock';
import type { DocumentFile } from '@/features/documents/types';

let documents = [...MOCK_DOCUMENTS];

export function register(mock: MockAdapter) {
  // GET /documents?entityType=&entityId=
  mock.onGet(/^\/documents(\?.*)?$/).reply((config) => {
    const params = new URLSearchParams(config.url?.split('?')[1] ?? '');
    const entityType = params.get('entityType');
    const entityId = params.get('entityId');

    let filtered = documents;
    if (entityType) {
      filtered = filtered.filter((d) => d.entityType === entityType);
    }
    if (entityId) {
      filtered = filtered.filter((d) => d.entityId === entityId);
    }
    return [200, filtered];
  });

  // GET /documents/:id/download
  mock.onGet(/^\/documents\/[^/]+\/download$/).reply((config) => {
    const id = config.url?.split('/')[2];
    const doc = documents.find((d) => d.id === id);
    if (!doc) return [404, { code: 'NOT_FOUND', message: '' }];
    return [200, new Blob([`Mock content of ${doc.name}`], { type: doc.mime })];
  });

  // POST /documents
  mock.onPost('/documents').reply((config) => {
    let name = 'Uploaded-Document.pdf';
    let entityType = 'ppa';
    let entityId = 'ppa-1';

    if (config.data instanceof FormData) {
      const file = config.data.get('file') as File | null;
      if (file) name = file.name;
      entityType = (config.data.get('entityType') as string) || entityType;
      entityId = (config.data.get('entityId') as string) || entityId;
    }

    const newDoc: DocumentFile = {
      id: `doc-${Date.now()}`,
      name,
      mime: 'application/pdf',
      size: 1024 * 1024 * 2.5,
      version: '1.0',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'currentUser',
      entityType,
      entityId,
    };
    documents.unshift(newDoc);
    return [201, newDoc];
  });

  // DELETE /documents/:id
  mock.onDelete(/^\/documents\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop();
    documents = documents.filter((d) => d.id !== id);
    return [204];
  });
}

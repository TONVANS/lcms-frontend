import type MockAdapter from 'axios-mock-adapter';
import { MOCK_DOCUMENTS } from '@/features/documents/mocks/documents.mock';
import type { DocumentFile } from '@/features/documents/types';
import { hasPermission } from '@/lib/auth/permissions';
import type { ModuleKey, Permission, User } from '@/types/domain';
import { getMockSessionUser } from '../session';

let documents = [...MOCK_DOCUMENTS];
/** Real File objects for documents uploaded in this session; seeded documents have none. */
const uploaded = new Map<string, File>();

/** entityType -> owning module. Unknown types map to null and are always refused. */
function moduleOf(entityType: string): ModuleKey | null {
  if (entityType === 'gc' || entityType === 'gc-contract') return 'gc';
  if (entityType.startsWith('ppa')) return 'ppa';
  if (entityType.startsWith('legal')) return 'legal';
  return null;
}

function can(user: User, entityType: string, permission: Permission): boolean {
  const m = moduleOf(entityType);
  return m !== null && hasPermission(user, m, permission);
}

const UNAUTHENTICATED: [number, unknown] = [401, { code: 'UNAUTHENTICATED', message: '' }];
const FORBIDDEN: [number, unknown] = [403, { code: 'FORBIDDEN', message: '' }];

export function register(mock: MockAdapter) {
  // GET /documents?entityType=&entityId=
  mock.onGet(/^\/documents(\?.*)?$/).reply((config) => {
    const user = getMockSessionUser();
    if (!user) return UNAUTHENTICATED;
    const params = new URLSearchParams(config.url?.split('?')[1] ?? '');
    const entityType = params.get('entityType');
    const entityId = params.get('entityId');

    if (entityType && !can(user, entityType, 'view')) return FORBIDDEN;

    let filtered = documents;
    if (entityType) {
      filtered = filtered.filter((d) => d.entityType === entityType);
    } else {
      filtered = filtered.filter((d) => can(user, d.entityType, 'view'));
    }
    if (entityId) {
      filtered = filtered.filter((d) => d.entityId === entityId);
    }
    return [200, filtered];
  });

  // GET /documents/:id/download
  mock.onGet(/^\/documents\/[^/]+\/download$/).reply((config) => {
    const user = getMockSessionUser();
    if (!user) return UNAUTHENTICATED;
    const id = config.url?.split('/')[2];
    const doc = documents.find((d) => d.id === id);
    if (!doc) return [404, { code: 'NOT_FOUND', message: '' }];
    if (!can(user, doc.entityType, 'download')) return FORBIDDEN;
    const stored = uploaded.get(doc.id);
    return [200, stored ?? new Blob([`Mock content of ${doc.name}`], { type: doc.mime })];
  });

  // POST /documents
  mock.onPost('/documents').reply((config) => {
    const user = getMockSessionUser();
    if (!user) return UNAUTHENTICATED;
    let name = 'Uploaded-Document.pdf';
    let mime = 'application/pdf';
    let size = 1024 * 1024 * 2.5;
    let entityType = 'ppa';
    let entityId = 'ppa-1';
    let file: File | null = null;

    if (config.data instanceof FormData) {
      file = config.data.get('file') as File | null;
      if (file) {
        name = file.name;
        mime = file.type || 'application/octet-stream';
        size = file.size;
      }
      entityType = (config.data.get('entityType') as string) || entityType;
      entityId = (config.data.get('entityId') as string) || entityId;
    }
    if (!can(user, entityType, 'create')) return FORBIDDEN;

    const newDoc: DocumentFile = {
      id: `doc-${Date.now()}`,
      name,
      mime,
      size,
      version: '1.0',
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.username,
      entityType,
      entityId,
    };
    if (file) uploaded.set(newDoc.id, file);
    documents.unshift(newDoc);
    return [201, newDoc];
  });

  // DELETE /documents/:id
  mock.onDelete(/^\/documents\/[^/]+$/).reply((config) => {
    const user = getMockSessionUser();
    if (!user) return UNAUTHENTICATED;
    const id = config.url?.split('/').pop();
    const doc = documents.find((d) => d.id === id);
    if (!doc) return [404, { code: 'NOT_FOUND', message: '' }];
    if (!can(user, doc.entityType, 'delete')) return FORBIDDEN;
    documents = documents.filter((d) => d.id !== id);
    uploaded.delete(doc.id);
    return [204];
  });
}

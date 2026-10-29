import type MockAdapter from 'axios-mock-adapter';
import {
  MOCK_ATTACHMENTS,
  MOCK_PDF_BYTES,
  mockPngBytes,
} from '@/features/documents/mocks/documents.mock';
import { hasPermission } from '@/lib/auth/permissions';
import type { AttachmentModule, ModuleKey, Permission, User } from '@/types/domain';
import { getMockSessionUser } from '../session';

interface Stored {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: string;
  /** Real file for attachments uploaded in this session; seeded ones synthesise a blob. */
  file?: File;
}

const MODULE_KEY: Record<AttachmentModule, ModuleKey> = {
  contracts: 'gc',
  'legal-documents': 'legal',
  'legal-cases': 'legal',
  'power-contracts': 'ppa',
};

const store = new Map<string, Stored[]>();
const keyOf = (module: AttachmentModule, entityId: string) => `${module}::${entityId}`;

for (const s of MOCK_ATTACHMENTS) {
  const k = keyOf(s.module, s.entityId);
  store.set(k, [...(store.get(k) ?? []), s]);
}

const NEST = {
  401: { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' },
  403: { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' },
  404: { statusCode: 404, message: 'Attachment not found', error: 'Not Found' },
} as const;

const MODULES = '(contracts|legal-documents|legal-cases|power-contracts)';
const LIST_RE = new RegExp(`^/${MODULES}/([^/?]+)/attachments$`);
const PREVIEW_RE = new RegExp(`^/${MODULES}/attachments/([^/?]+)/preview$`);
const DOWNLOAD_RE = new RegExp(`^/${MODULES}/attachments/([^/?]+)/download$`);
const ITEM_RE = new RegExp(`^/${MODULES}/attachments/([^/?]+)$`);

const param = (v: string) => decodeURIComponent(v);

function find(module: AttachmentModule, attId: string): { list: Stored[]; item: Stored } | null {
  for (const [k, list] of store) {
    if (!k.startsWith(`${module}::`)) continue;
    const item = list.find((a) => a.id === attId);
    if (item) return { list, item };
  }
  return null;
}

function blobOf(a: Stored): Blob {
  if (a.file) return a.file;
  const bytes = a.mimeType.startsWith('image/') ? mockPngBytes() : MOCK_PDF_BYTES;
  return new Blob([bytes as BlobPart], { type: a.mimeType });
}

/** Live-like raw shape: numeric size as a string (Prisma BigInt), uploader as a nested user. */
const toRaw = (a: Stored) => ({
  id: a.id,
  originalName: a.fileName,
  mimeType: a.mimeType,
  fileSize: String(a.fileSize),
  createdAt: a.createdAt,
  uploadedBy: { fullName: a.uploadedBy },
});

type Guard = [number, unknown] | null;

function guard(module: AttachmentModule, permission: Permission): { user: User } | { error: Guard } {
  const user = getMockSessionUser();
  if (!user) return { error: [401, NEST[401]] };
  if (!hasPermission(user, MODULE_KEY[module], permission)) return { error: [403, NEST[403]] };
  return { user };
}

export function register(mock: MockAdapter): void {
  // GET /:module/:id/attachments
  mock.onGet(LIST_RE).reply((config) => {
    const [, module, id] = LIST_RE.exec(config.url ?? '')!;
    const g = guard(module as AttachmentModule, 'view');
    if ('error' in g) return g.error!;
    const items = store.get(keyOf(module as AttachmentModule, param(id))) ?? [];
    return [200, { data: items.map(toRaw) }];
  });

  // POST /:module/:id/attachments  (multipart field `file`)
  mock.onPost(LIST_RE).reply((config) => {
    const [, module, id] = LIST_RE.exec(config.url ?? '')!;
    const g = guard(module as AttachmentModule, 'create');
    if ('error' in g) return g.error!;
    const file = config.data instanceof FormData ? (config.data.get('file') as File | null) : null;
    const created: Stored = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: file?.name ?? 'Uploaded-Document.pdf',
      mimeType: file?.type || 'application/pdf',
      fileSize: file?.size ?? 0,
      createdAt: new Date().toISOString(),
      uploadedBy: g.user.fullName,
      file: file ?? undefined,
    };
    const k = keyOf(module as AttachmentModule, param(id));
    store.set(k, [created, ...(store.get(k) ?? [])]);
    return [201, { data: toRaw(created) }];
  });

  // GET /:module/attachments/:attId/preview
  mock.onGet(PREVIEW_RE).reply((config) => {
    const [, module, attId] = PREVIEW_RE.exec(config.url ?? '')!;
    const g = guard(module as AttachmentModule, 'view');
    if ('error' in g) return g.error!;
    const hit = find(module as AttachmentModule, param(attId));
    return hit ? [200, blobOf(hit.item)] : [404, NEST[404]];
  });

  // GET /:module/attachments/:attId/download
  mock.onGet(DOWNLOAD_RE).reply((config) => {
    const [, module, attId] = DOWNLOAD_RE.exec(config.url ?? '')!;
    const g = guard(module as AttachmentModule, 'download');
    if ('error' in g) return g.error!;
    const hit = find(module as AttachmentModule, param(attId));
    return hit ? [200, blobOf(hit.item)] : [404, NEST[404]];
  });

  // DELETE /:module/attachments/:attId
  mock.onDelete(ITEM_RE).reply((config) => {
    const [, module, attId] = ITEM_RE.exec(config.url ?? '')!;
    const g = guard(module as AttachmentModule, 'delete');
    if ('error' in g) return g.error!;
    const hit = find(module as AttachmentModule, param(attId));
    if (!hit) return [404, NEST[404]];
    hit.list.splice(hit.list.indexOf(hit.item), 1);
    return [200, { data: { success: true } }];
  });
}

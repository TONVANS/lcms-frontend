import type { AttachmentModule } from '@/types/domain';

/** Smallest valid single-page PDF. */
export const MOCK_PDF_BYTES: Uint8Array = new TextEncoder().encode(
  '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n' +
    'trailer<</Root 1 0 R/Size 4>>\n%%EOF\n',
);

/** 1x1 transparent PNG. */
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export function mockPngBytes(): Uint8Array {
  const bin = atob(PNG_BASE64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export interface MockAttachmentSeed {
  id: string;
  module: AttachmentModule;
  entityId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: string;
}

const pdf = (
  id: string,
  module: AttachmentModule,
  entityId: string,
  fileName: string,
  fileSize: number,
  createdAt: string,
  uploadedBy: string,
): MockAttachmentSeed => ({
  id,
  module,
  entityId,
  fileName,
  mimeType: 'application/pdf',
  fileSize,
  createdAt,
  uploadedBy,
});

/** Seeded for ids the existing GC / legal / PPA mocks use. */
export const MOCK_ATTACHMENTS: MockAttachmentSeed[] = [
  pdf('att-ppa-1-a', 'power-contracts', 'ppa-1', 'PPA-NamTheun2-Agreement-Signed.pdf', 4520000, '2026-01-15T10:00:00.000Z', 'admin'),
  pdf('att-ppa-1-b', 'power-contracts', 'ppa-1', 'Environmental-Impact-Assessment-NT2.pdf', 12400000, '2026-02-01T14:30:00.000Z', 'ppa.user'),
  pdf('att-ppa-2-a', 'power-contracts', 'ppa-2', 'Technical-Specifications-NamNgum1.pdf', 2150000, '2026-02-20T09:15:00.000Z', 'ppa.user'),
  pdf('att-gc-001-a', 'contracts', 'gc-001', 'GC-2026-001-Contract-Signed.pdf', 3200000, '2026-03-10T09:00:00.000Z', 'gc.user'),
  pdf('att-gc-004-a', 'contracts', 'gc-004', 'GC-2026-004-Annex-A.pdf', 910000, '2026-03-12T13:20:00.000Z', 'gc.editor'),
  pdf('att-reg-1-a', 'legal-documents', 'reg-1', 'Regulation-351-KPIs-Signed.pdf', 1280000, '2026-06-23T09:00:00.000Z', 'legal.user'),
  pdf('att-reg-1-b', 'legal-documents', 'reg-1', 'Regulation-351-KPIs-Annex.pdf', 640000, '2026-06-23T09:30:00.000Z', 'legal.user'),
  pdf('att-reg-2-a', 'legal-documents', 'reg-2', 'Regulation-Personnel-Appointment.pdf', 450000, '2026-07-05T10:15:00.000Z', 'legal.user'),
  pdf('att-case-1-a', 'legal-cases', 'case-1', 'Case-1-Court-Summons.pdf', 530000, '2026-07-10T08:45:00.000Z', 'legal.user'),
];

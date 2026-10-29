import type { StatusTone } from '@/lib/constants/status';
import type { Department } from '@/types/domain';

export const DOC_TYPES = [
  'REGULATION',
  'PROVISION',
  'AGREEMENT',
  'NOTIFICATION',
  'INSTRUCTION',
  'PROPOSAL',
  'CONTRACT',
  'MANUAL',
  'OTHER',
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

export const DOC_STATUS_TONE: Record<DocStatus, StatusTone> = {
  ACTIVE: 'emerald',
  INACTIVE: 'slate',
};

export interface LegalDocument {
  id: string;
  docTitle: string;
  docType: DocType;
  issueYear: number | null;
  docNumberDate: string;
  status: DocStatus;
  responsiblePerson: string | null;
  departmentId: string | null;
  department: Department | null;
  purpose: string | null;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /legal-documents (CreateLegalDocumentDto); optional text is omitted when empty. */
export interface LegalDocumentPayload {
  docTitle: string;
  docType: DocType;
  issueYear: number;
  docNumberDate: string;
  status: DocStatus;
  departmentId: string;
  responsiblePerson?: string;
  purpose?: string;
  externalUrl?: string;
}

/** Body of PATCH: only changed keys; a cleared optional field is `null`. */
export type LegalDocumentPatch = {
  [K in keyof LegalDocumentPayload]?: LegalDocumentPayload[K] | null;
};

export interface LegalDocumentsDashboard {
  total: number;
  active: number;
  inactive: number;
  byType: { docType: DocType; count: number }[];
  byDepartment: { departmentId: string; name: string; count: number }[];
}

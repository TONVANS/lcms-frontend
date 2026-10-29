import { toNum, toStr } from '@/lib/api/envelope';
import type { Attachment } from '@/types/domain';

function rec(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function uploader(v: unknown): string | null {
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    return toStr(o.fullName ?? o.name ?? o.username);
  }
  return toStr(v);
}

/** Tolerant raw → `Attachment`; never throws, missing text becomes '' and missing numbers 0. */
export function toAttachment(raw: unknown): Attachment {
  const r = rec(raw);
  return {
    id: toStr(r.id ?? r.attachmentId) ?? '',
    fileName: toStr(r.originalName ?? r.fileName ?? r.filename ?? r.name) ?? '',
    mimeType: toStr(r.mimeType ?? r.mimetype ?? r.fileType ?? r.contentType) ?? '',
    fileSize: toNum(r.fileSize ?? r.size) ?? 0,
    createdAt: toStr(r.createdAt ?? r.uploadedAt) ?? '',
    uploadedBy: uploader(r.uploadedBy) ?? toStr(r.uploadedByName),
  };
}

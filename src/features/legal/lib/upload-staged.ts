import { type AttachmentModule, documentsService } from '@/features/documents';

/** Uploads every staged file; one failure never stops the others. Resolves with the files that failed. */
export async function uploadStaged(
  files: File[],
  module: AttachmentModule,
  entityId: string,
): Promise<{ failed: File[] }> {
  const results = await Promise.allSettled(
    files.map((file) => documentsService.upload(module, entityId, file)),
  );
  return { failed: files.filter((_, i) => results[i].status === 'rejected') };
}

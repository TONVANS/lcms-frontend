import { api } from '@/lib/api/client';
import { unwrap, unwrapPage } from '@/lib/api/envelope';
import { endpoints } from '@/lib/api/endpoints';
import type { Attachment, AttachmentModule } from '@/types/domain';
import { toAttachment } from '../lib/documents-mapper';

export const documentsService = {
  list: (module: AttachmentModule, entityId: string): Promise<Attachment[]> =>
    api
      .get(endpoints.attachments.list(module, entityId))
      .then((r) => unwrapPage(r.data, { page: 1, pageSize: 1000 }, toAttachment).items),

  /** Multipart field `file`. Resolves with the created attachment (mapped). */
  upload: (module: AttachmentModule, entityId: string, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post(endpoints.attachments.upload(module, entityId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => toAttachment(unwrap<unknown>(r.data)));
  },

  remove: (module: AttachmentModule, attachmentId: string): Promise<void> =>
    api.delete(endpoints.attachments.remove(module, attachmentId)).then(() => undefined),

  /** Fetched through `api` so the Bearer header is sent; never put the token in a URL. */
  preview: (module: AttachmentModule, attachmentId: string): Promise<Blob> =>
    api
      .get<Blob>(endpoints.attachments.preview(module, attachmentId), { responseType: 'blob' })
      .then((r) => r.data),

  download: (module: AttachmentModule, attachmentId: string): Promise<Blob> =>
    api
      .get<Blob>(endpoints.attachments.download(module, attachmentId), { responseType: 'blob' })
      .then((r) => r.data),
};

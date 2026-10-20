import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { DocumentFile } from '../types';

export const documentsService = {
  list: (entityType: string, entityId: string): Promise<DocumentFile[]> =>
    api.get<DocumentFile[]>(endpoints.documents.list(entityType, entityId)).then((r) => r.data),

  upload: (file: File, entityType: string, entityId: string): Promise<DocumentFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    return api
      .post<DocumentFile>(endpoints.documents.upload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  delete: (id: string): Promise<void> =>
    api.delete<void>(endpoints.documents.detail(id)).then((r) => r.data),

  download: (id: string): Promise<Blob> =>
    api
      .get<Blob>(endpoints.documents.download(id), { responseType: 'blob' })
      .then((r) => r.data),
};

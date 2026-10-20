export interface DocumentFile {
  id: string;
  name: string;
  mime: string;
  size: number;
  version: string;
  uploadedAt: string;
  uploadedBy: string;
  entityType: string;
  entityId: string;
  url?: string;
}

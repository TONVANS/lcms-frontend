'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList } from '@/components/shared/file-list';
import { lo } from '@/lib/i18n/lo';
import { documentsService } from '../api/documents.service';
import type { DocumentFile } from '../types';

export interface DocumentManagerProps {
  entityType: string;
  entityId: string;
  initialDocuments?: DocumentFile[];
  readonly?: boolean;
  className?: string;
}

export function DocumentManager({
  entityType,
  entityId,
  initialDocuments,
  readonly = false,
  className,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>(initialDocuments ?? []);
  const [prevInitial, setPrevInitial] = useState(initialDocuments);
  const [isLoading, setIsLoading] = useState(!initialDocuments);
  const [isUploading, setIsUploading] = useState(false);

  if (initialDocuments !== prevInitial) {
    setPrevInitial(initialDocuments);
    if (initialDocuments) {
      setDocuments(initialDocuments);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (initialDocuments) return;

    let active = true;
    documentsService
      .list(entityType, entityId)
      .then((docs) => {
        if (active) {
          setDocuments(docs);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load documents:', err);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [entityType, entityId, initialDocuments]);

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    try {
      for (const file of files) {
        const uploaded = await documentsService.upload(file, entityType, entityId);
        setDocuments((prev) => [uploaded, ...prev]);
      }
      toast.success(lo.dropzone.fileUploaded);
    } catch {
      toast.error(lo.errors.unknown);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (file: { id: string }) => {
    try {
      await documentsService.delete(file.id);
      setDocuments((prev) => prev.filter((d) => d.id !== file.id));
      toast.success(lo.dropzone.fileDeleted);
    } catch {
      toast.error(lo.errors.unknown);
    }
  };

  const handleDownload = (file: { name: string }) => {
    toast.info(`${lo.dropzone.download}: ${file.name}`);
  };

  return (
    <div className={className}>
      {!readonly && (
        <div className="mb-5">
          <FileDropzone onFilesSelected={handleFilesSelected} disabled={isUploading} />
        </div>
      )}

      {isLoading ? (
        <div className="py-6 text-center text-xs text-[var(--text-muted)]">
          {lo.common.loading}
        </div>
      ) : (
        <FileList
          files={documents}
          onDownload={handleDownload}
          onDelete={readonly ? undefined : handleDelete}
        />
      )}
    </div>
  );
}

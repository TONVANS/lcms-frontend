'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/shared/alert-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList } from '@/components/shared/file-list';
import { Button } from '@/components/ui/button';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { documentsService } from '../api/documents.service';
import type { DocumentFile } from '../types';

export interface DocumentManagerProps {
  entityType: string;
  entityId: string;
  initialDocuments?: DocumentFile[];
  canUpload: boolean;
  canDownload: boolean;
  canDelete: boolean;
  className?: string;
}

export function DocumentManager({
  entityType,
  entityId,
  initialDocuments,
  canUpload,
  canDownload,
  canDelete,
  className,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>(initialDocuments ?? []);
  const [prevInitial, setPrevInitial] = useState(initialDocuments);
  const [isLoading, setIsLoading] = useState(!initialDocuments);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DocumentFile | null>(null);

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
          setLoadError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setLoadError(toUserMessage(normalizeError(err)) || lo.errors.unknown);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [entityType, entityId, initialDocuments, reloadKey]);

  const retry = useCallback(() => {
    setLoadError(null);
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    try {
      for (const file of files) {
        const uploaded = await documentsService.upload(file, entityType, entityId);
        setDocuments((prev) => [uploaded, ...prev]);
      }
      toast.success(lo.dropzone.fileUploaded);
    } catch (err) {
      toast.error(toUserMessage(normalizeError(err)) || lo.errors.unknown);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReject = (messages: string[]) => {
    for (const m of messages) toast.error(m);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const file = pendingDelete;
    try {
      await documentsService.delete(file.id);
    } catch (err) {
      toast.error(toUserMessage(normalizeError(err)) || lo.errors.unknown);
      throw err; // keep the dialog open
    }
    setDocuments((prev) => prev.filter((d) => d.id !== file.id));
    toast.success(lo.dropzone.fileDeleted);
  };

  const handleDownload = async (file: { id: string; name: string }) => {
    let url: string | null = null;
    try {
      const blob = await documentsService.download(file.id);
      url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast.error(toUserMessage(normalizeError(err)) || lo.errors.unknown);
    } finally {
      if (url) {
        const toRevoke = url;
        setTimeout(() => URL.revokeObjectURL(toRevoke), 0);
      }
    }
  };

  return (
    <div className={className}>
      {canUpload && (
        <div className="mb-5">
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            onReject={handleReject}
            disabled={isUploading}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label={lo.common.loading}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--surface-inset)]" />
          ))}
        </div>
      ) : loadError ? (
        <AlertBanner
          tone="rose"
          title={lo.documents.loadError}
          description={loadError}
          action={
            <Button type="button" variant="ghost" onClick={retry}>
              {lo.common.retry}
            </Button>
          }
        />
      ) : (
        <FileList
          files={documents}
          onDownload={canDownload ? handleDownload : undefined}
          onDelete={canDelete ? (f) => setPendingDelete(documents.find((d) => d.id === f.id) ?? null) : undefined}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={lo.confirm.deleteTitle}
        description={lo.confirm.deleteDesc}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

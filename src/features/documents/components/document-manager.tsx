'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/shared/alert-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList } from '@/components/shared/file-list';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { env } from '@/config/env';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import type { Attachment, AttachmentModule } from '@/types/domain';
import { documentsService } from '../api/documents.service';

export interface DocumentManagerProps {
  module: AttachmentModule;
  entityId: string;
  canUpload: boolean;
  canDownload: boolean;
  canDelete: boolean;
  className?: string;
}

/** PDF + images, matching the backend whitelist. */
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.gif,.webp';

type PreviewKind = 'pdf' | 'image' | 'other';

interface PreviewState {
  name: string;
  url: string;
  kind: PreviewKind;
}

function previewKind(a: Attachment): PreviewKind {
  const mime = a.mimeType.toLowerCase();
  const ext = a.fileName.split('.').pop()?.toLowerCase() ?? '';
  if (mime.includes('pdf') || ext === 'pdf') return 'pdf';
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
  return 'other';
}

const errorText = (err: unknown) => toUserMessage(normalizeError(err)) || lo.errors.unknown;

export function DocumentManager({
  module,
  entityId,
  canUpload,
  canDownload,
  canDelete,
  className,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Attachment | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    let active = true;
    documentsService
      .list(module, entityId)
      .then((docs) => {
        if (!active) return;
        setDocuments(docs);
        setLoadError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(errorText(err));
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [module, entityId, reloadKey]);

  // Revoke a still-open preview URL on unmount.
  useEffect(() => {
    if (!preview) return;
    const url = preview.url;
    return () => URL.revokeObjectURL(url);
  }, [preview]);

  const retry = useCallback(() => {
    setLoadError(null);
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    let ok = 0;
    for (const file of files) {
      try {
        await documentsService.upload(module, entityId, file);
        ok += 1;
      } catch (err) {
        toast.error(errorText(err));
      }
    }
    if (ok > 0) {
      toast.success(lo.dropzone.fileUploaded);
      try {
        setDocuments(await documentsService.list(module, entityId));
      } catch (err) {
        toast.error(errorText(err));
      }
    }
    setIsUploading(false);
  };

  const handleReject = (messages: string[]) => {
    for (const m of messages) toast.error(m);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const file = pendingDelete;
    try {
      await documentsService.remove(module, file.id);
    } catch (err) {
      toast.error(errorText(err));
      throw err; // keep the dialog open
    }
    setDocuments((prev) => prev.filter((d) => d.id !== file.id));
    toast.success(lo.dropzone.fileDeleted);
  };

  const handleDownload = async (att: Attachment) => {
    let url: string | null = null;
    try {
      const blob = await documentsService.download(module, att.id);
      url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      if (url) {
        const toRevoke = url;
        setTimeout(() => URL.revokeObjectURL(toRevoke), 0);
      }
    }
  };

  const handlePreview = async (att: Attachment) => {
    try {
      const blob = await documentsService.preview(module, att.id);
      setPreview({ name: att.fileName, url: URL.createObjectURL(blob), kind: previewKind(att) });
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const byId = (id: string) => documents.find((d) => d.id === id) ?? null;

  return (
    <div className={className}>
      {canUpload && (
        <div className="mb-5">
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            onReject={handleReject}
            accept={ACCEPT}
            maxSizeMb={env.NEXT_PUBLIC_MAX_UPLOAD_MB}
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
          files={documents.map((d) => ({
            id: d.id,
            name: d.fileName,
            size: d.fileSize,
            mime: d.mimeType,
            uploadedAt: d.createdAt || undefined,
            uploadedBy: d.uploadedBy,
          }))}
          onPreview={(f) => {
            const att = byId(f.id);
            if (att) void handlePreview(att);
          }}
          onDownload={
            canDownload
              ? (f) => {
                  const att = byId(f.id);
                  if (att) void handleDownload(att);
                }
              : undefined
          }
          onDelete={canDelete ? (f) => setPendingDelete(byId(f.id)) : undefined}
        />
      )}

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-3">
          <DialogHeader>
            <DialogTitle className="truncate">{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview?.kind === 'pdf' && (
            <iframe
              src={preview.url}
              title={lo.documents.previewTitle(preview.name)}
              className="min-h-0 w-full flex-1 rounded-lg bg-white"
            />
          )}
          {preview?.kind === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL, not optimisable
            <img
              src={preview.url}
              alt={preview.name}
              className="min-h-0 w-full flex-1 object-contain"
            />
          )}
          {preview?.kind === 'other' && (
            <p className="text-sm text-[var(--text-muted)]">{lo.documents.previewUnsupported}</p>
          )}
        </DialogContent>
      </Dialog>

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

'use client';

import {
  Download,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import { formatBytes } from '@/lib/utils/number';

export type PreviewKind = 'pdf' | 'image' | 'other';

export interface DocumentPreviewItem {
  id?: string;
  name: string;
  url: string;
  kind: PreviewKind;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
}

export interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: DocumentPreviewItem | null;
  canDownload?: boolean;
  onDownload?: () => void;
}

function getPreviewBadge(kind: PreviewKind, name: string) {
  const ext = name.split('.').pop()?.toUpperCase() ?? '';

  if (kind === 'pdf') {
    return {
      icon: FileText,
      label: 'PDF',
      tileClass:
        'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:border-rose-400/30 dark:bg-rose-400/15 dark:text-rose-300',
    };
  }
  if (kind === 'image') {
    return {
      icon: ImageIcon,
      label: ext || 'IMG',
      tileClass:
        'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300',
    };
  }
  if (['XLS', 'XLSX', 'CSV'].includes(ext)) {
    return {
      icon: FileSpreadsheet,
      label: ext,
      tileClass:
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300',
    };
  }
  return {
    icon: File,
    label: ext || 'FILE',
    tileClass:
      'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:border-slate-400/30 dark:bg-slate-400/15 dark:text-slate-300',
  };
}

interface DocumentPreviewInnerProps {
  preview: DocumentPreviewItem;
  canDownload: boolean;
  onDownload?: () => void;
  onClose: () => void;
}

function DocumentPreviewInner({
  preview,
  canDownload,
  onDownload,
  onClose,
}: DocumentPreviewInnerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const badge = getPreviewBadge(preview.kind, preview.name);
  const BadgeIcon = badge.icon;

  const handleZoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const handleZoomReset = () => setZoom(1);

  const handleOpenNewTab = () => {
    if (preview.url) {
      window.open(preview.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <DialogContent
      showCloseButton={false}
      className={cn(
        'flex flex-col gap-0 overflow-hidden rounded-[26px] border border-[var(--border-glass)] bg-(image:--surface-modal) p-0 shadow-2xl backdrop-blur-[28px] transition-all duration-200',
        isFullscreen
          ? 'h-[96vh] max-h-[96vh] w-[98vw] max-w-[98vw] sm:max-w-[98vw] md:max-w-[98vw] lg:max-w-[98vw] xl:max-w-[98vw] 2xl:max-w-[98vw]'
          : 'h-[88vh] max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:w-[94vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1360px]',
      )}
    >
      {/* Header Toolbar */}
      <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 sm:px-6 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-xs',
              badge.tileClass,
            )}
            aria-hidden="true"
          >
            <BadgeIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle
              className="truncate font-heading text-base font-semibold text-[var(--text-strong)] sm:text-lg"
              title={preview.name}
            >
              {preview.name}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="font-semibold uppercase tracking-wider text-[var(--text-dim)]">
                {badge.label}
              </span>
              {preview.fileSize ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{formatBytes(preview.fileSize)}</span>
                </>
              ) : null}
              {preview.uploadedAt ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{formatDate(preview.uploadedAt)}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {preview.kind === 'image' && (
            <div
              role="group"
              aria-label={badge.label}
              className="mr-1 hidden items-center gap-0.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)]/60 p-0.5 sm:flex"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                aria-label={lo.documents.zoomOut}
                className="size-8 text-[var(--text-secondary)] hover:text-[var(--text)]"
              >
                <ZoomOut className="size-4" aria-hidden="true" />
              </Button>
              <button
                type="button"
                onClick={handleZoomReset}
                title={lo.documents.resetZoom}
                aria-label={lo.documents.resetZoom}
                className="px-2 font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text)]"
              >
                {Math.round(zoom * 100)}%
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                aria-label={lo.documents.zoomIn}
                className="size-8 text-[var(--text-secondary)] hover:text-[var(--text)]"
              >
                <ZoomIn className="size-4" aria-hidden="true" />
              </Button>
              {zoom !== 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleZoomReset}
                  aria-label={lo.documents.resetZoom}
                  className="size-8 text-[var(--text-secondary)] hover:text-[var(--text)]"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleOpenNewTab}
            aria-label={lo.documents.openInNewTab}
            title={lo.documents.openInNewTab}
            className="size-8 sm:size-9 text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </Button>

          {canDownload && onDownload && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onDownload}
              aria-label={lo.dropzone.download}
              title={lo.dropzone.download}
              className="size-8 sm:size-9 text-[var(--text-secondary)] hover:text-[var(--text)]"
            >
              <Download className="size-4" aria-hidden="true" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-label={isFullscreen ? lo.documents.exitFullscreen : lo.documents.fullscreen}
            title={isFullscreen ? lo.documents.exitFullscreen : lo.documents.fullscreen}
            className="size-8 sm:size-9 text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="size-4" aria-hidden="true" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={lo.common.close}
            title={lo.common.close}
            className="size-8 sm:size-9 text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            <X className="size-4.5" aria-hidden="true" />
          </Button>
        </div>
      </DialogHeader>

      {/* Content Body */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[var(--surface-inset)]/40 p-2 sm:p-4">
        {preview.kind === 'pdf' && (
          <div className="relative size-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-white shadow-xs">
            <iframe
              src={preview.url}
              title={lo.documents.previewTitle(preview.name)}
              className="size-full border-0"
            />
          </div>
        )}

        {preview.kind === 'image' && (
          <div
            className="relative flex size-full items-center justify-center overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[radial-gradient(var(--border-subtle)_1px,transparent_1px)] [background-size:16px_16px]"
            onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 1.75))}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- blob URL */}
            <img
              src={preview.url}
              alt={preview.name}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="max-h-full max-w-full select-none object-contain transition-transform duration-150 ease-out"
              draggable={false}
            />
          </div>
        )}

        {preview.kind === 'other' && (
          <div className="flex max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-glass)] p-6 sm:p-8 text-center shadow-lg backdrop-blur-md">
            <div
              className={cn(
                'flex size-16 items-center justify-center rounded-2xl border shadow-xs',
                badge.tileClass,
              )}
              aria-hidden="true"
            >
              <BadgeIcon className="size-8" />
            </div>
            <div className="space-y-1.5">
              <h3
                className="break-all font-heading text-base font-semibold text-[var(--text-strong)]"
                title={preview.name}
              >
                {preview.name}
              </h3>
              {preview.fileSize ? (
                <p className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                  {formatBytes(preview.fileSize)}
                </p>
              ) : null}
              <p className="pt-1 text-sm text-[var(--text-muted)]">
                {lo.documents.previewUnsupported}
              </p>
            </div>
            {canDownload && onDownload ? (
              <Button variant="secondary" onClick={onDownload} className="mt-2">
                <Download className="size-4" aria-hidden="true" />
                {lo.dropzone.download}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </DialogContent>
  );
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  preview,
  canDownload = false,
  onDownload,
}: DocumentPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {preview && (
        <DocumentPreviewInner
          key={preview.url}
          preview={preview}
          canDownload={canDownload}
          onDownload={onDownload}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}

'use client';

import { Download, File, FileSpreadsheet, FileText, Trash2 } from 'lucide-react';
import { BADGE_TONE_CLASS } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/number';
import { cn } from '@/lib/utils/cn';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  mime?: string;
  uploadedAt?: string;
  url?: string;
}

export interface FileListProps {
  files: FileItem[];
  onDownload?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  className?: string;
}

const TILE_BASE = 'border-transparent';

function getFileTile(name: string, mime?: string) {
  const ext = name.split('.').pop()?.toLowerCase();

  if (ext === 'pdf' || mime?.includes('pdf')) {
    return {
      icon: FileText,
      label: 'PDF',
      className: cn(TILE_BASE, 'dark:border-[rgba(251,113,133,0.30)]', BADGE_TONE_CLASS.rose),
    };
  }
  if (['doc', 'docx'].includes(ext ?? '') || mime?.includes('word')) {
    return {
      icon: FileText,
      label: 'DOC',
      className: cn(TILE_BASE, 'dark:border-[rgba(96,165,250,0.30)]', BADGE_TONE_CLASS.blue),
    };
  }
  if (['xls', 'xlsx'].includes(ext ?? '') || mime?.includes('sheet')) {
    return {
      icon: FileSpreadsheet,
      label: 'XLS',
      className: cn(TILE_BASE, 'dark:border-[rgba(52,211,153,0.30)]', BADGE_TONE_CLASS.emerald),
    };
  }
  return {
    icon: File,
    label: ext?.toUpperCase() ?? 'FILE',
    className: cn(TILE_BASE, 'dark:border-[rgba(148,163,184,0.30)]', BADGE_TONE_CLASS.slate),
  };
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${formatNumber(val, 1)} ${sizes[i]}`;
}

export function FileList({ files, onDownload, onDelete, className }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-[var(--text-muted)]">
        {lo.dropzone.empty}
      </div>
    );
  }

  return (
    <ul className={cn('flex flex-col gap-2', className)}>
      {files.map((file) => {
        const tile = getFileTile(file.name, file.mime);
        const Icon = tile.icon;

        return (
          <li
            key={file.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3 transition-colors hover:border-[var(--border-glass)] hover:bg-white/[0.04]"
          >
            <div className="flex min-w-0 items-center gap-3">
              {/* Type tile */}
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border text-[10px] font-bold tracking-wider',
                  tile.className,
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="leading-none">{tile.label}</span>
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[var(--text-strong)]" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[11px] tabular-nums text-[var(--text-muted)]">
                  {formatBytes(file.size)}
                  {file.uploadedAt && ` • ${formatDate(file.uploadedAt)}`}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {onDownload && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={lo.dropzone.downloadFile(file.name)}
                  onClick={() => onDownload(file)}
                  className="size-11 text-[var(--text-secondary)] hover:text-[var(--text)]"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={lo.dropzone.deleteFile(file.name)}
                  onClick={() => onDelete(file)}
                  className="size-11 text-[#BE123C] hover:bg-rose-500/10 dark:text-[#FDA4AF]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

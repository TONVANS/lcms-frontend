'use client';

import { UploadCloud } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useState } from 'react';
import { env } from '@/config/env';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';

export interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onReject?: (messages: string[]) => void;
  maxSizeMb?: number;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

function matchesAccept(file: File, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return tokens.some((t) => {
    if (t.startsWith('.')) return name.endsWith(t);
    if (t.endsWith('/*')) return mime.startsWith(t.slice(0, -1));
    return mime === t;
  });
}

export function FileDropzone({
  onFilesSelected,
  onReject,
  maxSizeMb = env.NEXT_PUBLIC_MAX_UPLOAD_MB,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  disabled = false,
  className,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;
    const valid: File[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      if (!matchesAccept(file, accept)) rejected.push(lo.dropzone.badType(file.name));
      else if (file.size > maxSizeMb * 1024 * 1024) rejected.push(lo.dropzone.tooLarge(file.name, maxSizeMb));
      else valid.push(file);
    }
    if (rejected.length > 0) onReject?.(rejected);
    if (valid.length > 0) onFilesSelected(valid);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    handleFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer select-none',
        'border-[rgba(212,179,122,0.45)] bg-[rgba(212,179,122,0.03)] hover:bg-[rgba(212,179,122,0.06)] hover:border-[#d4b37a]',
        'focus-within:outline-solid focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--focus-ring)',
        isDragOver && 'border-[#d4b37a] bg-[rgba(212,179,122,0.1)] scale-[1.01]',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <input
        type="file"
        multiple
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
        disabled={disabled}
        aria-label={lo.dropzone.prompt}
      />

      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#d4b37a]/30 bg-[#d4b37a]/10 text-[#d4b37a] transition-transform duration-200 group-hover:scale-110">
        <UploadCloud className="h-6 w-6 stroke-[1.8]" />
      </div>

      <p className="mt-3 text-sm font-semibold text-[var(--text-strong)]">
        {isDragOver ? lo.dropzone.dragActive : lo.dropzone.prompt}
      </p>

      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {lo.dropzone.hint(maxSizeMb)}
      </p>
    </label>
  );
}

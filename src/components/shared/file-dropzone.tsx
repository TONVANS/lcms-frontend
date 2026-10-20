'use client';

import { UploadCloud } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';

export interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxSizeMb?: number;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

export function FileDropzone({
  onFilesSelected,
  maxSizeMb = 50,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
  disabled = false,
  className,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={cn(
        'group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer select-none',
        'border-[rgba(212,179,122,0.45)] bg-[rgba(212,179,122,0.03)] hover:bg-[rgba(212,179,122,0.06)] hover:border-[#d4b37a]',
        'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)',
        isDragOver && 'border-[#d4b37a] bg-[rgba(212,179,122,0.1)] scale-[1.01]',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
        disabled={disabled}
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
    </div>
  );
}

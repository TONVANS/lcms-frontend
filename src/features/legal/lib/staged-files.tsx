'use client';

import { useCallback, useId, useState } from 'react';
import { toast } from 'sonner';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList, type FileItem } from '@/components/shared/file-list';
import { lo } from '@/lib/i18n/lo';

export interface StagedFile {
  id: string;
  file: File;
}

let stagedSeq = 0;

export function useStagedFiles(): {
  staged: StagedFile[];
  add: (files: File[]) => void;
  remove: (id: string) => void;
} {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const add = useCallback(
    (files: File[]) =>
      setStaged((prev) => [...prev, ...files.map((file) => ({ id: `staged-${++stagedSeq}`, file }))]),
    [],
  );
  const remove = useCallback((id: string) => setStaged((prev) => prev.filter((s) => s.id !== id)), []);
  return { staged, add, remove };
}

/** Dropzone + list for files that are uploaded after the record is created. */
export function StagedFilesSection({
  staged,
  onAdd,
  onRemove,
  disabled,
  hint,
  headingLevel = 3,
}: {
  staged: StagedFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  hint: string;
  headingLevel?: 2 | 3;
}) {
  const headingId = useId();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const items: FileItem[] = staged.map((s) => ({
    id: s.id,
    name: s.file.name,
    size: s.file.size,
    type: s.file.type,
    uploadedAt: new Date().toISOString(),
  }));
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <Heading id={headingId} className="text-base font-semibold text-(--text-strong)">
        {lo.legal.fields.documents}
      </Heading>
      <FileDropzone
        disabled={disabled}
        onFilesSelected={onAdd}
        onReject={(messages) => toast.error(messages.join(' · '))}
      />
      <p className="text-xs text-(--text-muted)">{hint}</p>
      {staged.length > 0 ? (
        <FileList files={items} onDelete={disabled ? undefined : (file) => onRemove(file.id)} />
      ) : null}
    </section>
  );
}

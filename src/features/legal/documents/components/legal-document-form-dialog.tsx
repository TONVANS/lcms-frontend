'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ScrollText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';
import { useCan } from '@/components/guards/can';
import { AlertBanner } from '@/components/shared/alert-banner';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { FormDialogShell, useShellApi } from '../../lib/form-dialog-shell';
import { StagedFilesSection, useStagedFiles } from '../../lib/staged-files';
import { uploadStaged } from '../../lib/upload-staged';
import { legalDocumentsService } from '../api/legal-documents.service';
import { diffLegalDocumentPayload, toLegalDocumentPayload } from '../lib/legal-document-mapper';
import {
  emptyLegalDocumentForm,
  fromLegalDocument,
  legalDocumentFormSchema,
  type LegalDocumentFormValues,
} from '../schemas/legal-document.schema';
import type { LegalDocument } from '../types';
import { LegalDocumentFormFields, firstInvalidLegalDocumentFieldId } from './legal-document-form-fields';

const L = lo.legal.regulations.form;

export interface LegalDocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: LegalDocument;
  onSaved: (d: LegalDocument) => void;
}

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

function FormBody({
  doc,
  onSaved,
}: {
  doc?: LegalDocument;
  onSaved: (d: LegalDocument) => void;
}) {
  const api = useShellApi();
  const form = useForm<LegalDocumentFormValues>({
    resolver: zodResolver(legalDocumentFormSchema),
    defaultValues: doc ? fromLegalDocument(doc) : emptyLegalDocumentForm(),
    shouldFocusError: false,
  });
  const canCreate = useCan('legal', 'create');
  const [banner, setBanner] = useState<string | null>(null);
  const files = useStagedFiles();
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const onInvalid = (errors: FieldErrors<LegalDocumentFormValues>) =>
    focusById(firstInvalidLegalDocumentFieldId(errors));

  const onValid = async (values: LegalDocumentFormValues) => {
    if (!api.tryStart()) return;
    setBanner(null);
    try {
      const payload = toLegalDocumentPayload(values);
      let saved: LegalDocument;
      if (doc) {
        const prev = toLegalDocumentPayload(fromLegalDocument(doc));
        saved = await legalDocumentsService.update(doc.id, diffLegalDocumentPayload(payload, prev));
      } else {
        saved = await legalDocumentsService.create(payload);
        if (canCreate && files.staged.length > 0) {
          const { failed } = await uploadStaged(
            files.staged.map((s) => s.file),
            'legal-documents',
            saved.id,
          );
          if (failed.length > 0) toast.error(L.uploadFailed(failed.map((f) => f.name).join(', ')));
        }
      }
      api.finish();
      onSaved(saved);
      if (!alive.current) return;
      toast.success(L.saved);
      api.close(false);
    } catch (e) {
      if (!alive.current) return;
      const text = toUserMessage(normalizeError(e));
      if (text) setBanner(text);
    } finally {
      api.finish();
    }
  };

  const saving = form.formState.isSubmitting;
  return (
    <form
      noValidate
      aria-busy={saving}
      onSubmit={(e) => {
        void form.handleSubmit(onValid, onInvalid)(e);
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
        <LegalDocumentFormFields form={form} />
        {!doc && canCreate ? (
          <StagedFilesSection
            staged={files.staged}
            onAdd={files.add}
            onRemove={files.remove}
            disabled={saving}
            hint={L.stagedHint}
          />
        ) : null}
        {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      </div>
      <DialogFooter className="mx-0 mb-0 flex shrink-0 items-center justify-between border-t border-(--border-subtle) bg-white/[0.02] px-6 py-4 sm:px-8">
        <span className="hidden text-xs text-(--text-muted) sm:inline">{L.requiredHint}</span>
        <div className="ml-auto flex items-center gap-2.5">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => api.close(false)}>
            {L.cancel}
          </Button>
          <Button type="submit" variant="gold" disabled={saving} className="min-w-28 gap-2">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>{L.saving}</span>
              </>
            ) : (
              L.save
            )}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function LegalDocumentFormDialog({ open, onOpenChange, document: doc, onSaved }: LegalDocumentFormDialogProps) {
  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={doc ? L.editTitle : L.createTitle}
      description={L.requiredHint}
      icon={ScrollText}
      accent="legal"
    >
        <FormBody key={doc?.id ?? 'new'} doc={doc} onSaved={onSaved} />
    </FormDialogShell>
  );
}

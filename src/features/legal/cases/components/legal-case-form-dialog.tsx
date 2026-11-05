'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2, Scale } from 'lucide-react';
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
import { legalCasesService } from '../api/legal-cases.service';
import { diffLegalCasePayload, toLegalCasePayload } from '../lib/legal-case-mapper';
import { applyLegalCaseServerError } from '../lib/legal-case-server-errors';
import {
  emptyLegalCaseForm,
  fromLegalCase,
  legalCaseFormSchema,
  type LegalCaseFormValues,
} from '../schemas/legal-case.schema';
import type { LegalCase } from '../types';
import { LegalCaseFormFields, firstInvalidLegalCaseFieldId } from './legal-case-form-fields';

const L = lo.legal.cases.form;

export interface LegalCaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legalCase?: LegalCase;
  onSaved: (c: LegalCase) => void;
}

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

function FormBody({
  legalCase,
  onSaved,
}: {
  legalCase?: LegalCase;
  onSaved: (c: LegalCase) => void;
}) {
  const api = useShellApi();
  const form = useForm<LegalCaseFormValues>({
    resolver: zodResolver(legalCaseFormSchema),
    defaultValues: legalCase ? fromLegalCase(legalCase) : emptyLegalCaseForm(),
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

  const onInvalid = (errors: FieldErrors<LegalCaseFormValues>) =>
    focusById(firstInvalidLegalCaseFieldId(errors));

  const onValid = async (values: LegalCaseFormValues) => {
    if (!api.tryStart()) return;
    setBanner(null);
    try {
      const payload = toLegalCasePayload(values);
      let saved: LegalCase;
      if (legalCase) {
        const prev = toLegalCasePayload(fromLegalCase(legalCase));
        saved = await legalCasesService.update(legalCase.id, diffLegalCasePayload(payload, prev));
      } else {
        saved = await legalCasesService.create(payload);
        if (canCreate && files.staged.length > 0) {
          const { failed } = await uploadStaged(
            files.staged.map((s) => s.file),
            'legal-cases',
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
      const err = normalizeError(e);
      const field = applyLegalCaseServerError(form, err);
      if (field) {
        focusById(firstInvalidLegalCaseFieldId({ [field]: { type: 'server' } }));
      } else {
        const text = toUserMessage(err);
        if (text) setBanner(text);
      }
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
        <LegalCaseFormFields form={form} />
        {!legalCase && canCreate ? (
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
      {/* Design.md section 6: Dialog footer (Cancel ghost, Save gold primary) */}
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
              <>
                <Check className="size-4 stroke-[2.5]" aria-hidden="true" />
                <span>{L.save}</span>
              </>
            )}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function LegalCaseFormDialog({ open, onOpenChange, legalCase, onSaved }: LegalCaseFormDialogProps) {
  return (
    <FormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={legalCase ? L.editTitle : L.createTitle}
      description={L.requiredHint}
      icon={Scale}
      accent="litigation"
    >
      <FormBody key={legalCase?.id ?? 'new'} legalCase={legalCase} onSaved={onSaved} />
    </FormDialogShell>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Scale } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/shared/alert-banner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { casesService } from '../api/cases.service';
import {
  caseFormSchema,
  emptyCaseForm,
  fromCase,
  toCasePayload,
  type CaseFormValues,
} from '../schemas/case.schema';
import type { LegalCase } from '../types';
import {
  CASE_FIELD_ORDER,
  CaseFormFields,
  firstInvalidCaseFieldId,
  type CaseFormFieldName,
} from './case-form-fields';

const L = lo.legal.cases.form;
const FIELD_NAMES: ReadonlySet<string> = new Set(CASE_FIELD_ORDER);

export interface CaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legalCase?: LegalCase;
  onSaved: (c: LegalCase) => void;
}

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

interface BodyProps {
  legalCase?: LegalCase;
  onOpenChange: (open: boolean) => void;
  onSaved: (c: LegalCase) => void;
  busyRef: RefObject<boolean>;
  onBusyChange: (busy: boolean) => void;
}

function CaseFormBody({ legalCase, onOpenChange, onSaved, busyRef, onBusyChange }: BodyProps) {
  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: legalCase ? fromCase(legalCase) : emptyCaseForm(),
    shouldFocusError: false,
  });

  const { handleSubmit, formState } = form;
  const [banner, setBanner] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const onInvalid = (errors: FieldErrors<CaseFormValues>) => {
    focusById(firstInvalidCaseFieldId(errors));
  };

  const applyServerErrors = (fieldErrors: Record<string, string> | undefined) => {
    let unmatched = false;
    const matched: CaseFormFieldName[] = [];
    for (const [key, message] of Object.entries(fieldErrors ?? {})) {
      if (!FIELD_NAMES.has(key)) {
        unmatched = true;
        continue;
      }
      matched.push(key as CaseFormFieldName);
      form.setError(key as CaseFormFieldName, { type: 'server', message });
    }
    if (matched.length > 0) {
      focusById(firstInvalidCaseFieldId(form.formState.errors));
    }
    return unmatched;
  };

  const onSubmit = async (values: CaseFormValues) => {
    if (busyRef.current) return;
    busyRef.current = true;
    onBusyChange(true);
    setBanner(null);

    try {
      const payload = toCasePayload(values);
      const saved = legalCase
        ? await casesService.update(legalCase.id, payload)
        : await casesService.create(payload);

      if (!alive.current) {
        onSaved(saved);
        return;
      }

      toast.success(L.saved);
      onSaved(saved);
      busyRef.current = false;
      onBusyChange(false);
      onOpenChange(false);
    } catch (err) {
      if (!alive.current) return;
      const apiErr = normalizeError(err);
      const unmatched = applyServerErrors(apiErr.fieldErrors);
      if (unmatched || !apiErr.fieldErrors || Object.keys(apiErr.fieldErrors).length === 0) {
        setBanner(toUserMessage(apiErr));
      }
      busyRef.current = false;
      onBusyChange(false);
    }
  };

  const isSaving = formState.isSubmitting;

  return (
    <form
      noValidate
      aria-busy={isSaving}
      onSubmit={(e) => {
        void handleSubmit(onSubmit, onInvalid)(e);
      }}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
        <CaseFormFields form={form} legalCase={legalCase} />
        {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      </div>

      <DialogFooter className="mx-0 mb-0 flex shrink-0 items-center justify-between border-t border-(--border-subtle) bg-white/[0.02] px-6 py-4 sm:px-8">
        <span className="hidden text-xs text-(--text-muted) sm:inline">{L.requiredHint}</span>
        <div className="ml-auto flex items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            {L.cancel}
          </Button>
          <Button type="submit" variant="gold" disabled={isSaving} className="min-w-28 gap-2">
            {isSaving ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
            {isSaving ? L.saving : L.save}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function CaseFormDialog({ open, onOpenChange, legalCase, onSaved }: CaseFormDialogProps) {
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const returnFocus = useReturnFocus(open);

  const handleOpenChange = (next: boolean) => {
    if (!next && busyRef.current) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!busy}
        onCloseAutoFocus={returnFocus}
        className="flex max-h-[90vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[26px] border border-(--border-glass) bg-(image:--surface-modal) p-0 shadow-2xl sm:max-w-[780px]"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center gap-3.5 border-b border-(--border-subtle) px-6 py-4.5 sm:px-8">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-(--legal)/30 bg-(--legal)/15 text-(--legal) shadow-xs"
          >
            <Scale className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="font-serif text-xl font-semibold text-(--text-strong)">
              {legalCase ? L.editTitle : L.createTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-(--text-muted)">
              {L.requiredHint}
            </DialogDescription>
          </div>
        </DialogHeader>

        {open ? (
          <CaseFormBody
            key={legalCase?.id ?? 'create'}
            legalCase={legalCase}
            onOpenChange={handleOpenChange}
            onSaved={onSaved}
            busyRef={busyRef}
            onBusyChange={setBusy}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

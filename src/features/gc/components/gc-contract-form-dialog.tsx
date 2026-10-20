'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileTextIcon } from 'lucide-react';
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
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { gcService } from '../api/gc.service';
import {
  emptyGcForm,
  fromGcContract,
  gcFormSchema,
  toGcPayload,
  type GcFormValues,
} from '../schemas/gc.schema';
import type { GeneralContract } from '../types';
import {
  GC_FIELD_ORDER,
  GcFormFieldGroup,
  firstInvalidFieldId,
  type GcFormFieldName,
} from './gc-contract-form-fields';

export interface GcContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: GeneralContract;
  onSaved: (c: GeneralContract) => void;
}

const FIELD_NAMES: ReadonlySet<string> = new Set(GC_FIELD_ORDER);

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

interface BodyProps {
  contract?: GeneralContract;
  onOpenChange: (open: boolean) => void;
  onSaved: (c: GeneralContract) => void;
  busyRef: RefObject<boolean>;
  onBusyChange: (busy: boolean) => void;
}

/** Mounted fresh each time the dialog opens (and per contract), so no value leaks between openings. */
function GcContractFormBody({ contract, onOpenChange, onSaved, busyRef, onBusyChange }: BodyProps) {
  const form = useForm<GcFormValues>({
    resolver: zodResolver(gcFormSchema),
    defaultValues: contract ? fromGcContract(contract) : emptyGcForm(),
    shouldFocusError: false,
  });
  const { handleSubmit, setError, formState } = form;
  const [banner, setBanner] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const onInvalid = (errors: FieldErrors<GcFormValues>) => {
    focusById(firstInvalidFieldId(errors));
  };

  const onValid = async (values: GcFormValues) => {
    if (busyRef.current) return;
    busyRef.current = true;
    onBusyChange(true);
    setBanner(null);
    try {
      const payload = toGcPayload(values);
      const saved = contract
        ? await gcService.update(contract.id, payload)
        : await gcService.create(payload);
      busyRef.current = false;
      onBusyChange(false);
      onSaved(saved);
      if (!alive.current) return;
      toast.success(lo.gc.form.saved);
      onOpenChange(false);
    } catch (e) {
      if (!alive.current) return;
      const err = normalizeError(e);
      let unmatched = false;
      const serverErrors: FieldErrors<GcFormValues> = {};
      let matchedAny = false;
      for (const [key, message] of Object.entries(err.fieldErrors ?? {})) {
        if (!FIELD_NAMES.has(key)) {
          unmatched = true;
          continue;
        }
        const name = key as GcFormFieldName;
        const text =
          name === 'contractNo' && message === 'DUPLICATE_CONTRACT_NO'
            ? lo.gc.errors.duplicateNo
            : message;
        setError(name, { type: 'server', message: text });
        (serverErrors as Record<string, unknown>)[name] = { type: 'server', message: text };
        matchedAny = true;
      }
      if (matchedAny) focusById(firstInvalidFieldId(serverErrors));
      if (!matchedAny || unmatched) {
        const text = toUserMessage(err);
        if (text) setBanner(text);
      }
    } finally {
      busyRef.current = false;
      onBusyChange(false);
    }
  };

  const saving = formState.isSubmitting;

  return (
    <form
      noValidate
      aria-busy={saving}
      onSubmit={(e) => {
        void handleSubmit(onValid, onInvalid)(e);
      }}
      className="flex flex-col gap-5"
    >
      <GcFormFieldGroup group="general" form={form} />
      <GcFormFieldGroup group="dates" form={form} />
      <GcFormFieldGroup group="money" form={form} />
      <GcFormFieldGroup group="notes" form={form} />
      {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      <DialogFooter className="mx-0 mb-0 rounded-none border-t border-(--border-subtle) bg-transparent p-0 pt-4">
        <Button type="button" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>
          {lo.gc.form.cancel}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? lo.gc.form.saving : lo.gc.form.save}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function GcContractFormDialog({ open, onOpenChange, contract, onSaved }: GcContractFormDialogProps) {
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  // A request in flight cannot be abandoned: closing is ignored until it settles.
  const handleOpenChange = (next: boolean) => {
    if (!next && busyRef.current) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!busy}
        className="max-h-[90vh] max-w-[calc(100%-2rem)] gap-5 overflow-y-auto rounded-[26px] bg-(image:--surface-modal) p-6 sm:max-w-[780px] sm:p-8"
      >
        <DialogHeader className="flex-row items-center gap-3 border-b border-(--border-subtle) pb-4">
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-(--gc)/30 bg-(--gc)/12 text-(--gc)"
          >
            <FileTextIcon className="size-5" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <DialogTitle className="font-serif text-xl font-semibold text-(--text-strong)">
              {contract ? lo.gc.form.editTitle : lo.gc.form.createTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-(--text-muted)">
              {lo.gc.form.requiredHint}
            </DialogDescription>
          </div>
        </DialogHeader>
        <GcContractFormBody
          key={contract?.id ?? 'new'}
          contract={contract}
          onOpenChange={handleOpenChange}
          onSaved={onSaved}
          busyRef={busyRef}
          onBusyChange={setBusy}
        />
      </DialogContent>
    </Dialog>
  );
}

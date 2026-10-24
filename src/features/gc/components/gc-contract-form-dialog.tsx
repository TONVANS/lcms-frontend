'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileTextIcon, Loader2 } from 'lucide-react';
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
import { gcService } from '../api/gc.service';
import {
  emptyGcForm,
  fromGcContract,
  gcFormSchema,
  toGcPayload,
  type GcFormValues,
} from '../schemas/gc.schema';
import type { GeneralContract } from '../types';
import { GcFormFieldGroup, firstInvalidFieldId } from './gc-contract-form-fields';
import { applyGcServerErrors } from './gc-server-errors';

export interface GcContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: GeneralContract;
  onSaved: (c: GeneralContract) => void;
}

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
  const { handleSubmit, formState } = form;
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
      const { matched, unmatched, focusId } = applyGcServerErrors(form, err);
      focusById(focusId);
      if (matched.length === 0 || unmatched) {
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
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
        <GcFormFieldGroup group="general" form={form} />
        <GcFormFieldGroup group="dates" form={form} />
        <GcFormFieldGroup group="money" form={form} />
        <GcFormFieldGroup group="notes" form={form} />
        {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex items-center justify-between border-t border-(--border-subtle) bg-white/[0.02] px-6 py-4 sm:px-8">
        <span className="text-xs text-(--text-muted) hidden sm:inline">
          {lo.gc.form.requiredHint}
        </span>
        <div className="flex items-center gap-2.5 ml-auto">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>
            {lo.gc.form.cancel}
          </Button>
          <Button type="submit" disabled={saving} className="min-w-28 gap-2">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>{lo.gc.form.saving}</span>
              </>
            ) : (
              lo.gc.form.save
            )}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function GcContractFormDialog({ open, onOpenChange, contract, onSaved }: GcContractFormDialogProps) {
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const returnFocus = useReturnFocus(open);

  // A request in flight cannot be abandoned: closing is ignored until it settles.
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
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-(--gc)/30 bg-(--gc)/15 text-(--gc) shadow-xs"
          >
            <FileTextIcon className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
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

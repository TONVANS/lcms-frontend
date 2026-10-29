'use client';

import { Loader2, Zap } from 'lucide-react';
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
import { useProjectTypes } from '@/features/lookups';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { normalizeError } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { ppaService } from '../api/ppa.service';
import {
  diffPayload,
  emptyPowerForm,
  fromPowerContract,
  toPowerContractPayload,
  type PowerFormValues,
} from '../schemas/ppa.schema';
import type { PowerContract } from '../types';
import { PpaFormFieldGroup, firstInvalidFieldId } from './ppa-contract-form-fields';
import { applyPpaServerError, makePowerResolver } from './ppa-form-support';

export interface PpaContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: PowerContract;
  onSaved: (c: PowerContract) => void;
}

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

interface BodyProps {
  contract?: PowerContract;
  onOpenChange: (open: boolean) => void;
  onSaved: (c: PowerContract) => void;
  busyRef: RefObject<boolean>;
  onBusyChange: (busy: boolean) => void;
}

/** Mounted fresh each time the dialog opens (and per contract), so no value leaks between openings. */
function PpaContractFormBody({ contract, onOpenChange, onSaved, busyRef, onBusyChange }: BodyProps) {
  const projectTypes = useProjectTypes();
  const initial = contract?.projectTypeOrCustomer ?? '';

  const form = useForm<PowerFormValues>({
    resolver: makePowerResolver({ types: projectTypes.items, ready: projectTypes.status === 'ready', initial }),
    defaultValues: contract ? fromPowerContract(contract) : emptyPowerForm(),
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

  const onInvalid = (errors: FieldErrors<PowerFormValues>) => focusById(firstInvalidFieldId(errors));

  const onValid = async (values: PowerFormValues) => {
    if (busyRef.current) return;
    busyRef.current = true;
    onBusyChange(true);
    setBanner(null);
    try {
      const payload = toPowerContractPayload(values);
      const saved = contract
        ? await ppaService.update(contract.id, diffPayload(payload, contract))
        : await ppaService.create(payload);
      busyRef.current = false;
      onBusyChange(false);
      onSaved(saved);
      if (!alive.current) return;
      toast.success(lo.ppa.form.saved);
      onOpenChange(false);
    } catch (e) {
      if (!alive.current) return;
      const applied = applyPpaServerError(form, normalizeError(e));
      focusById(applied.focusId);
      if (applied.banner) setBanner(applied.banner);
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
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
        <PpaFormFieldGroup group="general" form={form} />
        <PpaFormFieldGroup group="dates" form={form} />
        <PpaFormFieldGroup group="tech" form={form} />
        <PpaFormFieldGroup group="notes" form={form} />
        {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      </div>

      <DialogFooter className="mx-0 mb-0 flex shrink-0 items-center justify-between border-t border-(--border-subtle) bg-white/[0.02] px-6 py-4 sm:px-8">
        <span className="hidden text-xs text-(--text-muted) sm:inline">{lo.ppa.form.requiredHint}</span>
        <div className="ml-auto flex items-center gap-2.5">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>
            {lo.ppa.form.cancel}
          </Button>
          <Button type="submit" disabled={saving} className="min-w-28 gap-2">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>{lo.ppa.form.saving}</span>
              </>
            ) : (
              lo.ppa.form.save
            )}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function PpaContractFormDialog({ open, onOpenChange, contract, onSaved }: PpaContractFormDialogProps) {
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
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-(--ppa)/30 bg-(--ppa)/15 text-(--ppa) shadow-xs"
          >
            <Zap className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="font-serif text-xl font-semibold text-(--text-strong)">
              {contract ? lo.ppa.form.editTitle : lo.ppa.form.createTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-(--text-muted)">
              {lo.ppa.form.requiredHint}
            </DialogDescription>
          </div>
        </DialogHeader>
        <PpaContractFormBody
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

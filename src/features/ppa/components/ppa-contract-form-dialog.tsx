'use client';

import { Loader2, Paperclip, Zap } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';
import { useCan } from '@/components/guards/can';
import { AlertBanner } from '@/components/shared/alert-banner';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList, type FileItem } from '@/components/shared/file-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { env } from '@/config/env';
import { documentsService } from '@/features/documents';
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
import type { PowerContract, PowerContractType } from '../types';
import { PpaFormFieldGroup, SectionCard, firstInvalidFieldId } from './ppa-contract-form-fields';
import { applyPpaServerError, makePowerResolver } from './ppa-form-support';

const ACCEPT_ATTACHMENTS = '.pdf,.png,.jpg,.jpeg,.gif,.webp';

export interface StagedFile {
  id: string;
  file: File;
}

let stagedSeq = 0;

export interface PpaContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: PowerContract;
  defaultType?: PowerContractType;
  onSaved: (c: PowerContract) => void;
}

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

interface BodyProps {
  contract?: PowerContract;
  defaultType?: PowerContractType;
  onOpenChange: (open: boolean) => void;
  onSaved: (c: PowerContract) => void;
  busyRef: RefObject<boolean>;
  onBusyChange: (busy: boolean) => void;
}

/** Mounted fresh each time the dialog opens (and per contract), so no value leaks between openings. */
function PpaContractFormBody({ contract, defaultType, onOpenChange, onSaved, busyRef, onBusyChange }: BodyProps) {
  const projectTypes = useProjectTypes();
  const initial = contract?.projectTypeOrCustomer ?? '';

  const form = useForm<PowerFormValues>({
    resolver: makePowerResolver({ types: projectTypes.items, ready: projectTypes.status === 'ready', initial }),
    defaultValues: contract ? fromPowerContract(contract) : emptyPowerForm(defaultType ?? 'PURCHASE'),
    shouldFocusError: false,
  });
  const { handleSubmit, formState } = form;
  const canUpload = useCan('ppa', 'create');
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const createdIdRef = useRef<string | null>(contract?.id ?? null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const addFiles = (files: File[]) => {
    setStaged((prev) => [...prev, ...files.map((file) => ({ id: `staged-${++stagedSeq}`, file }))]);
  };

  const stagedItems: FileItem[] = staged.map((s) => ({
    id: s.id,
    name: s.file.name,
    size: s.file.size,
    mime: s.file.type,
  }));

  const onInvalid = (errors: FieldErrors<PowerFormValues>) => focusById(firstInvalidFieldId(errors));

  const onValid = async (values: PowerFormValues) => {
    if (busyRef.current) return;
    busyRef.current = true;
    onBusyChange(true);
    setBanner(null);
    try {
      const payload = toPowerContractPayload(values);
      let saved: PowerContract;
      if (contract) {
        const patch = diffPayload(payload, contract);
        saved = Object.keys(patch).length > 0 ? await ppaService.update(contract.id, patch) : contract;
        createdIdRef.current = saved.id;
      } else if (createdIdRef.current !== null) {
        saved = await ppaService.update(createdIdRef.current, payload);
      } else {
        saved = await ppaService.create(payload);
        createdIdRef.current = saved.id;
      }

      if (staged.length > 0) {
        setUploadingFiles(true);
        const results = await Promise.allSettled(
          staged.map((s) => documentsService.upload('power-contracts', saved.id, s.file)),
        );
        const failed = staged.filter((_, i) => results[i].status === 'rejected');
        if (failed.length > 0) {
          toast.error(lo.ppa.wizard.uploadFailed(failed.map((s) => s.file.name).join(', ')));
        }
        if (!alive.current) return;
        setStaged(failed);
        if (failed.length > 0) {
          onSaved(saved);
          return;
        }
      }

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
      if (alive.current) {
        setUploadingFiles(false);
      }
    }
  };

  const isBusy = formState.isSubmitting || uploadingFiles;

  return (
    <form
      noValidate
      aria-busy={isBusy}
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

        <SectionCard icon={Paperclip} title={lo.ppa.form.sectionDocs}>
          {canUpload ? (
            <div className="flex flex-col gap-3">
              <FileDropzone
                disabled={isBusy}
                accept={ACCEPT_ATTACHMENTS}
                maxSizeMb={env.NEXT_PUBLIC_MAX_UPLOAD_MB}
                onFilesSelected={addFiles}
                onReject={(messages) => toast.error(messages.join(' · '))}
              />
              <p className="text-xs text-(--text-muted)">{lo.ppa.wizard.stagedHint}</p>
            </div>
          ) : null}
          {stagedItems.length > 0 ? (
            <FileList
              files={stagedItems}
              onDelete={
                isBusy ? undefined : (file) => setStaged((prev) => prev.filter((s) => s.id !== file.id))
              }
            />
          ) : null}
        </SectionCard>

        {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      </div>

      <DialogFooter className="mx-0 mb-0 flex shrink-0 items-center justify-between border-t border-(--border-subtle) bg-white/[0.02] px-6 py-4 sm:px-8">
        <span className="hidden text-xs text-(--text-muted) sm:inline">{lo.ppa.form.requiredHint}</span>
        <div className="ml-auto flex items-center gap-2.5">
          <Button type="button" variant="ghost" disabled={isBusy} onClick={() => onOpenChange(false)}>
            {lo.ppa.form.cancel}
          </Button>
          <Button type="submit" disabled={isBusy} className="min-w-28 gap-2">
            {isBusy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>{uploadingFiles ? lo.dropzone.uploading : lo.ppa.form.saving}</span>
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

export function PpaContractFormDialog({ open, onOpenChange, contract, defaultType, onSaved }: PpaContractFormDialogProps) {
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
          key={contract?.id ?? `new-${defaultType ?? 'default'}`}
          contract={contract}
          defaultType={defaultType}
          onOpenChange={handleOpenChange}
          onSaved={onSaved}
          busyRef={busyRef}
          onBusyChange={setBusy}
        />
      </DialogContent>
    </Dialog>
  );
}

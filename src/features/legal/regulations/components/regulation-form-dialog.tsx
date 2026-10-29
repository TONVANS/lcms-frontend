'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ScrollText } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';
import { useCan } from '@/components/guards/can';
import { AlertBanner } from '@/components/shared/alert-banner';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList } from '@/components/shared/file-list';
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
import { uploadStaged } from '../../lib/upload-staged';
import { applyRegulationServerErrors } from '../lib/regulation-server-errors';
import { regulationsService } from '../api/regulations.service';
import {
  emptyRegulationForm,
  fromRegulation,
  regulationFormSchema,
  toRegulationPayload,
  type RegulationFormValues,
} from '../schemas/regulation.schema';
import type { Regulation } from '../types';
import {
  RegulationFormFields,
  firstInvalidRegulationFieldId,
} from './regulation-form-fields';

const L = lo.legal.regulations.form;

export interface RegulationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regulation?: Regulation;
  onSaved: (r: Regulation) => void;
}

interface StagedFile {
  id: string;
  file: File;
}

let stagedSeq = 0;

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

interface BodyProps {
  regulation?: Regulation;
  onOpenChange: (open: boolean) => void;
  onSaved: (r: Regulation) => void;
  busyRef: RefObject<boolean>;
  onBusyChange: (busy: boolean) => void;
}

/** Mounted fresh each time the dialog opens (and per regulation), so no value leaks between openings. */
function RegulationFormBody({ regulation, onOpenChange, onSaved, busyRef, onBusyChange }: BodyProps) {
  const form = useForm<RegulationFormValues>({
    resolver: zodResolver(regulationFormSchema),
    defaultValues: regulation ? fromRegulation(regulation) : emptyRegulationForm(),
    shouldFocusError: false,
  });
  const { handleSubmit, formState } = form;
  const canCreate = useCan('legal', 'create');
  const [banner, setBanner] = useState<string | null>(null);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const onInvalid = (errors: FieldErrors<RegulationFormValues>) => {
    focusById(firstInvalidRegulationFieldId(errors));
  };

  const onValid = async (values: RegulationFormValues) => {
    if (busyRef.current) return;
    busyRef.current = true;
    onBusyChange(true);
    setBanner(null);
    try {
      const payload = toRegulationPayload(values);
      const saved = regulation
        ? await regulationsService.update(regulation.id, payload)
        : await regulationsService.create(payload);
      if (!regulation && canCreate && staged.length > 0) {
        const { failed } = await uploadStaged(
          staged.map((s) => s.file),
          'legal-documents',
          saved.id,
        );
        if (failed.length > 0) toast.error(L.uploadFailed(failed.map((f) => f.name).join(', ')));
      }
      busyRef.current = false;
      onBusyChange(false);
      onSaved(saved);
      if (!alive.current) return;
      toast.success(L.saved);
      onOpenChange(false);
    } catch (e) {
      if (!alive.current) return;
      const err = normalizeError(e);
      const { matched, unmatched, focusId } = applyRegulationServerErrors(form, err);
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
  const showFiles = !regulation && canCreate;

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
        <RegulationFormFields form={form} />
        {showFiles ? (
          <section aria-labelledby="reg-form-files" className="flex min-w-0 flex-col gap-3">
            <h3 id="reg-form-files" className="text-base font-semibold text-(--text-strong)">
              {lo.legal.fields.documents}
            </h3>
            <FileDropzone
              disabled={saving}
              onFilesSelected={(files) =>
                setStaged((prev) => [...prev, ...files.map((file) => ({ id: `staged-${++stagedSeq}`, file }))])
              }
              onReject={(messages) => toast.error(messages.join(' · '))}
            />
            <p className="text-xs text-(--text-muted)">{L.stagedHint}</p>
            {staged.length > 0 ? (
              <FileList
                files={staged.map((s) => ({ id: s.id, name: s.file.name, size: s.file.size, mime: s.file.type }))}
                onDelete={saving ? undefined : (file) => setStaged((prev) => prev.filter((s) => s.id !== file.id))}
              />
            ) : null}
          </section>
        ) : null}
        {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      </div>

      <DialogFooter className="mx-0 mb-0 flex shrink-0 items-center justify-between border-t border-(--border-subtle) bg-white/[0.02] px-6 py-4 sm:px-8">
        <span className="hidden text-xs text-(--text-muted) sm:inline">{L.requiredHint}</span>
        <div className="ml-auto flex items-center gap-2.5">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>
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

export function RegulationFormDialog({ open, onOpenChange, regulation, onSaved }: RegulationFormDialogProps) {
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
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-(--legal)/30 bg-(--legal)/15 text-(--legal) shadow-xs"
          >
            <ScrollText className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="font-serif text-xl font-semibold text-(--text-strong)">
              {regulation ? L.editTitle : L.createTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-(--text-muted)">{L.requiredHint}</DialogDescription>
          </div>
        </DialogHeader>
        <RegulationFormBody
          key={regulation?.id ?? 'new'}
          regulation={regulation}
          onOpenChange={handleOpenChange}
          onSaved={onSaved}
          busyRef={busyRef}
          onBusyChange={setBusy}
        />
      </DialogContent>
    </Dialog>
  );
}

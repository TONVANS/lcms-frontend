'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/shared/alert-banner';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { supportService } from '../api/support.service';
import {
  TICKET_IMAGE_ACCEPT,
  ticketFormSchema,
  type TicketFormValues,
} from '../schemas/support.schema';
import { TICKET_PRIORITIES, type SupportTicket } from '../types';
import { FieldError, NATIVE_SELECT } from './form-bits';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (t: SupportTicket) => void;
}

function Body({ onOpenChange, onCreated }: Omit<Props, 'open'>) {
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: { subject: '', description: '', priority: 'MEDIUM', file: undefined },
  });
  const { register, handleSubmit, control, formState, setValue, setError } = form;
  const [banner, setBanner] = useState<string | null>(null);
  const file = useWatch({ control, name: 'file' });

  const onValid = async (v: TicketFormValues) => {
    setBanner(null);
    try {
      const created = await supportService.createTicket({
        subject: v.subject.trim(),
        description: v.description.trim(),
        priority: v.priority,
        file: v.file,
      });
      toast.success(lo.support.created);
      onCreated(created);
      onOpenChange(false);
    } catch (e) {
      setBanner(toUserMessage(normalizeError(e)) || lo.errors.unknown);
    }
  };

  const saving = formState.isSubmitting;
  const { errors } = formState;

  return (
    <form noValidate aria-busy={saving} onSubmit={(e) => void handleSubmit(onValid)(e)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticket-subject">{lo.support.subject}</Label>
        <Input
          id="ticket-subject"
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'ticket-subject-err' : undefined}
          {...register('subject')}
        />
        <FieldError id="ticket-subject-err" message={errors.subject?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticket-description">{lo.support.descriptionLabel}</Label>
        <Textarea
          id="ticket-description"
          rows={4}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'ticket-description-err' : undefined}
          {...register('description')}
        />
        <FieldError id="ticket-description-err" message={errors.description?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticket-priority">{lo.support.priority}</Label>
        <select id="ticket-priority" className={NATIVE_SELECT} {...register('priority')}>
          {TICKET_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {lo.support.priorities[p]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{lo.support.attachment}</span>
        {file ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-(--border-subtle) bg-(--surface-inset) px-3 py-2 text-sm">
            <span className="min-w-0 truncate">{file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={lo.support.attachmentRemove}
              onClick={() => setValue('file', undefined, { shouldValidate: true })}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Controller
            control={control}
            name="file"
            render={() => (
              <FileDropzone
                accept={TICKET_IMAGE_ACCEPT}
                className="p-5"
                onFilesSelected={(files) => setValue('file', files[0], { shouldValidate: true })}
                onReject={(msgs) => setError('file', { message: msgs[0] })}
              />
            )}
          />
        )}
        <FieldError id="ticket-file-err" message={errors.file?.message} />
      </div>
      {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      <DialogFooter className="flex-row justify-end gap-2">
        <Button type="button" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>
          {lo.support.cancel}
        </Button>
        <Button type="submit" disabled={saving} className="min-w-28 gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {saving ? lo.support.submitting : lo.support.submit}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TicketFormDialog({ open, onOpenChange, onCreated }: Props) {
  const returnFocus = useReturnFocus(open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={returnFocus} className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{lo.support.report}</DialogTitle>
          <DialogDescription>{lo.support.reportDescription}</DialogDescription>
        </DialogHeader>
        <Body onOpenChange={onOpenChange} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  );
}

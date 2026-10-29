'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { supportService } from '../api/support.service';
import { contactFormSchema, type ContactFormValues } from '../schemas/support.schema';
import type { ContactChannel } from '../types';
import { FieldError } from './form-bits';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (c: ContactChannel) => void;
}

function Body({ onOpenChange, onCreated }: Omit<Props, 'open'>) {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { channelName: '', contactInfo: '', description: '' },
  });
  const { register, handleSubmit, formState } = form;
  const [banner, setBanner] = useState<string | null>(null);
  const { errors } = formState;

  const onValid = async (v: ContactFormValues) => {
    setBanner(null);
    try {
      const desc = v.description?.trim();
      const created = await supportService.createContact({
        channelName: v.channelName.trim(),
        contactInfo: v.contactInfo.trim(),
        ...(desc ? { description: desc } : {}),
      });
      toast.success(lo.support.contactSaved);
      onCreated(created);
      onOpenChange(false);
    } catch (e) {
      setBanner(toUserMessage(normalizeError(e)) || lo.errors.unknown);
    }
  };
  const saving = formState.isSubmitting;

  return (
    <form noValidate onSubmit={(e) => void handleSubmit(onValid)(e)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-name">{lo.support.channelName}</Label>
        <Input
          id="contact-name"
          aria-invalid={!!errors.channelName}
          aria-describedby={errors.channelName ? 'contact-name-err' : undefined}
          {...register('channelName')}
        />
        <FieldError id="contact-name-err" message={errors.channelName?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-info">{lo.support.contactInfo}</Label>
        <Input
          id="contact-info"
          aria-invalid={!!errors.contactInfo}
          aria-describedby={errors.contactInfo ? 'contact-info-err' : undefined}
          {...register('contactInfo')}
        />
        <FieldError id="contact-info-err" message={errors.contactInfo?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-description">{lo.support.contactDescription}</Label>
        <Input id="contact-description" {...register('description')} />
      </div>
      {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      <DialogFooter className="flex-row justify-end gap-2">
        <Button type="button" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>
          {lo.support.cancel}
        </Button>
        <Button type="submit" disabled={saving} className="min-w-28 gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {lo.support.save}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ContactFormDialog({ open, onOpenChange, onCreated }: Props) {
  const returnFocus = useReturnFocus(open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={returnFocus} className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{lo.support.addContact}</DialogTitle>
          <DialogDescription>{lo.support.addContactDescription}</DialogDescription>
        </DialogHeader>
        <Body onOpenChange={onOpenChange} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  );
}

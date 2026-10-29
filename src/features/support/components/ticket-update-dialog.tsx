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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { supportService } from '../api/support.service';
import { ticketUpdateSchema, type TicketUpdateValues } from '../schemas/support.schema';
import { TICKET_STATUSES, type SupportTicket } from '../types';
import { FieldError, NATIVE_SELECT } from './form-bits';

interface Props {
  ticket: SupportTicket | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (t: SupportTicket) => void;
}

function Body({ ticket, onOpenChange, onUpdated }: { ticket: SupportTicket } & Omit<Props, 'ticket'>) {
  const form = useForm<TicketUpdateValues>({
    resolver: zodResolver(ticketUpdateSchema),
    defaultValues: { status: ticket.status, adminNote: ticket.adminNote ?? '' },
  });
  const [banner, setBanner] = useState<string | null>(null);
  const { register, handleSubmit, formState } = form;

  const onValid = async (v: TicketUpdateValues) => {
    setBanner(null);
    try {
      const updated = await supportService.updateTicket(ticket.id, {
        status: v.status,
        adminNote: v.adminNote?.trim() ?? '',
      });
      toast.success(lo.support.updateSaved);
      onUpdated(updated);
      onOpenChange(false);
    } catch (e) {
      setBanner(toUserMessage(normalizeError(e)) || lo.errors.unknown);
    }
  };
  const saving = formState.isSubmitting;

  return (
    <form noValidate onSubmit={(e) => void handleSubmit(onValid)(e)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticket-status">{lo.support.colStatus}</Label>
        <select id="ticket-status" className={NATIVE_SELECT} {...register('status')}>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {lo.support.statuses[s]}
            </option>
          ))}
        </select>
        <FieldError id="ticket-status-err" message={formState.errors.status?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticket-admin-note">{lo.support.adminNote}</Label>
        <Textarea id="ticket-admin-note" rows={4} {...register('adminNote')} />
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

export function TicketUpdateDialog({ ticket, onOpenChange, onUpdated }: Props) {
  const returnFocus = useReturnFocus(ticket !== null);
  return (
    <Dialog open={ticket !== null} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={returnFocus} className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{lo.support.updateTitle}</DialogTitle>
          <DialogDescription>{ticket?.subject}</DialogDescription>
        </DialogHeader>
        {ticket ? (
          <Body key={ticket.id} ticket={ticket} onOpenChange={onOpenChange} onUpdated={onUpdated} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

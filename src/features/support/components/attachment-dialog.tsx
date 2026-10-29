'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { lo } from '@/lib/i18n/lo';
import { supportService } from '../api/support.service';
import type { SupportTicket } from '../types';

interface Props {
  ticket: SupportTicket | null;
  onOpenChange: (open: boolean) => void;
}

function AttachmentImage({ ticket, onFail }: { ticket: SupportTicket; onFail: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const failRef = useRef(onFail);
  useEffect(() => {
    failRef.current = onFail;
  });

  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    supportService
      .ticketAttachment(ticket.id)
      .then((blob) => {
        if (!alive) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => {
        if (!alive) return;
        toast.error(lo.support.attachmentLoadError);
        failRef.current();
      });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [ticket.id]);

  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- blob URL
    <img src={src} alt={ticket.subject} className="max-h-[70vh] w-full rounded-xl object-contain" />
  ) : (
    <Skeleton className="h-48 w-full rounded-xl" aria-busy="true" />
  );
}

export function AttachmentDialog({ ticket, onOpenChange }: Props) {
  const returnFocus = useReturnFocus(ticket !== null);
  return (
    <Dialog open={ticket !== null} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={returnFocus} className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{lo.support.attachmentTitle}</DialogTitle>
          <DialogDescription>{ticket?.subject}</DialogDescription>
        </DialogHeader>
        {ticket ? (
          <AttachmentImage key={ticket.id} ticket={ticket} onFail={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

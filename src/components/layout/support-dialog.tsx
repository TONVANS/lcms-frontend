'use client';

import { Mail, Phone } from 'lucide-react';
import type { RefObject } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SUPPORT_CONTACTS, supportMailHref, supportTelHref } from '@/config/support';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';

const LINK_BASE =
  'min-w-0 break-all rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2';

/** The phone and email rows, shared by the dialog and the dashboard SupportCard. */
export function SupportContactList({ onDark = false }: { onDark?: boolean }) {
  const ring = onDark ? 'focus-visible:outline-[#d4b37a]' : 'focus-visible:outline-(--focus-ring)';
  return (
    <ul className="flex flex-col gap-3">
      <li className="flex items-center gap-3">
        <Phone aria-hidden="true" className="size-4 shrink-0" />
        <span className="shrink-0 text-[13px] opacity-80">{lo.support.phone}</span>
        <a href={supportTelHref(SUPPORT_CONTACTS.phone)} className={cn(LINK_BASE, ring)}>
          {SUPPORT_CONTACTS.phone}
        </a>
      </li>
      <li className="flex items-center gap-3">
        <Mail aria-hidden="true" className="size-4 shrink-0" />
        <span className="shrink-0 text-[13px] opacity-80">{lo.support.email}</span>
        <a href={supportMailHref(SUPPORT_CONTACTS.email)} className={cn(LINK_BASE, ring)}>
          {SUPPORT_CONTACTS.email}
        </a>
      </li>
    </ul>
  );
}

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Element to refocus on close when the opener was unmounted (e.g. a closed menu item). */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function SupportDialog({ open, onOpenChange, returnFocusRef }: SupportDialogProps) {
  const fallbackReturn = useReturnFocus(open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(e) => {
          const el = returnFocusRef?.current;
          if (el?.isConnected) {
            e.preventDefault();
            el.focus();
          } else {
            fallbackReturn(e);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{lo.support.title}</DialogTitle>
          <DialogDescription>{lo.support.intro}</DialogDescription>
        </DialogHeader>
        <SupportContactList />
      </DialogContent>
    </Dialog>
  );
}

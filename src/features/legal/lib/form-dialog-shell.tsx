'use client';

import type { LucideIcon } from 'lucide-react';
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { cn } from '@/lib/utils/cn';

export interface ShellApi {
  /** Marks a save as in flight; false when one already is. */
  tryStart: () => boolean;
  /** Marks the save as settled. */
  finish: () => void;
  /** Close request that is ignored while a request is in flight. */
  close: (open: boolean) => void;
}

const ShellContext = createContext<ShellApi | null>(null);

/** The save-in-flight controls of the surrounding FormDialogShell. */
export function useShellApi(): ShellApi {
  const api = useContext(ShellContext);
  if (!api) throw new Error('useShellApi must be used inside FormDialogShell');
  return api;
}

/** Glass dialog frame shared by the document and case forms. The body is mounted fresh on every open. */
export function FormDialogShell({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  accent,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: 'legal' | 'litigation';
  children: ReactNode;
}) {
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const returnFocus = useReturnFocus(open);

  const close = (next: boolean) => {
    if (!next && busyRef.current) return;
    onOpenChange(next);
  };

  const api: ShellApi = {
    tryStart: () => {
      if (busyRef.current) return false;
      busyRef.current = true;
      setBusy(true);
      return true;
    },
    finish: () => {
      busyRef.current = false;
      setBusy(false);
    },
    close,
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        showCloseButton={!busy}
        onCloseAutoFocus={returnFocus}
        className="flex max-h-[90vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[26px] border border-(--border-glass) bg-(image:--surface-modal) p-0 shadow-2xl sm:max-w-[780px]"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center gap-3.5 border-b border-(--border-subtle) px-6 py-4.5 sm:px-8">
          <div
            aria-hidden="true"
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-xs',
              accent === 'legal'
                ? 'border-(--legal)/30 bg-(--legal)/15 text-(--legal)'
                : 'border-(--litigation)/30 bg-(--litigation)/15 text-(--litigation)',
            )}
          >
            <Icon className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="font-serif text-xl font-semibold text-(--text-strong)">{title}</DialogTitle>
            <DialogDescription className="text-xs text-(--text-muted)">{description}</DialogDescription>
          </div>
        </DialogHeader>
        <ShellContext.Provider value={api}>{children}</ShellContext.Provider>
      </DialogContent>
    </Dialog>
  );
}

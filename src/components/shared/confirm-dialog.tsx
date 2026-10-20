'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  icon?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = lo.confirm.title,
  description,
  confirmLabel = lo.confirm.confirm,
  cancelLabel = lo.confirm.cancel,
  tone = 'danger',
  onConfirm,
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const busy = isLoading || pending;

  const handleConfirm = async () => {
    if (busy) return;
    setPending(true);
    try {
      await onConfirm();
    } catch {
      // The caller surfaces its own error; keep the dialog open.
      return;
    } finally {
      setPending(false);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] rounded-[26px] border border-[var(--border-glass)] bg-(image:--surface-modal) p-6 shadow-2xl backdrop-blur-[28px]">
        <DialogHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {icon ?? (
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                  tone === 'danger'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                    : 'border-blue-500/30 bg-blue-500/10 text-blue-500',
                )}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <DialogTitle className="text-lg font-semibold text-[var(--text-strong)]">
              {title}
            </DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-sm leading-relaxed text-[var(--text-muted)]">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'primary' : 'primary'}
            disabled={busy}
            onClick={handleConfirm}
            className={cn(
              tone === 'danger' &&
                'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-rose-900/40 hover:from-rose-500 hover:to-rose-600',
            )}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

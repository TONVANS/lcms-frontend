'use client';

import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-modal)] p-6 shadow-2xl backdrop-blur-2xl">
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
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'primary' : 'primary'}
            disabled={isLoading}
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
            className={cn(
              tone === 'danger' &&
                'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-rose-900/40 hover:from-rose-500 hover:to-rose-600',
            )}
          >
            {isLoading ? lo.common.loading : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

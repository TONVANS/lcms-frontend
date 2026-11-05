'use client';

import { KeyRound, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { usersService } from '../api/users.service';
import type { AdminUser } from '../types';

const L = lo.users;

export interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
}

export function ResetPasswordDialog({ open, onOpenChange, user }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNewPassword('');
      setErrorBanner(null);
    }
  }, [open]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorBanner(null);

    try {
      await usersService.resetPassword(user.id, newPassword.trim() || undefined);
      toast.success(L.resetSuccess);
      onOpenChange(false);
    } catch (err) {
      const parsed = normalizeError(err);
      setErrorBanner(toUserMessage(parsed) || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultHint = user.employeeCode ? L.resetPasswordDefaultHint(user.employeeCode) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[26px] border border-(--border-glass) bg-(image:--surface-modal) p-0 shadow-2xl sm:max-w-[480px]">
        <DialogHeader className="flex shrink-0 flex-row items-center gap-3.5 border-b border-(--border-subtle) px-6 py-4.5 sm:px-8">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400"
          >
            <KeyRound className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="font-serif text-xl font-semibold text-(--text-strong)">
              {L.resetPasswordTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-(--text-muted)">
              {L.resetPasswordDesc(user.fullName, user.employeeCode ?? '—')}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 px-6 py-6 sm:px-8">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
              {defaultHint}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-new-password" className="text-xs text-(--text-secondary)">
                {L.newPasswordOptional}
              </Label>
              <Input
                id="admin-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="ປ້ອນລະຫັດໃໝ່ ຫຼື ປະວ່າງເພື່ອໃຊ້ຄ່າເລີ່ມຕົ້ນ"
                autoComplete="new-password"
              />
            </div>

            {errorBanner ? <AlertBanner tone="rose" title={errorBanner} /> : null}
          </div>

          <DialogFooter className="mx-0 mb-0 flex shrink-0 items-center justify-end gap-2.5 border-t border-(--border-subtle) bg-white/[0.02] px-6 py-4 sm:px-8">
            <Button
              type="button"
              variant="ghost"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              {lo.users.form.cancel}
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-28 gap-2">
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  <span>{lo.users.form.saving}</span>
                </>
              ) : (
                L.resetPassword
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


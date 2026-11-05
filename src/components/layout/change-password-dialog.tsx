'use client';

import { Key, Loader2 } from 'lucide-react';
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
import { usersService } from '@/features/users';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';

const L = lo.users;

export interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorBanner(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorBanner(lo.users.validation.required);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorBanner(L.passwordMismatch);
      return;
    }
    if (newPassword.length < 6) {
      setErrorBanner('ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ');
      return;
    }

    setSubmitting(true);
    setErrorBanner(null);

    try {
      await usersService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success(L.changeSuccess);
      onOpenChange(false);
    } catch (err) {
      const parsed = normalizeError(err);
      setErrorBanner(toUserMessage(parsed) || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[26px] border border-(--border-glass) bg-(image:--surface-modal) p-0 shadow-2xl sm:max-w-[480px]">
        <DialogHeader className="flex shrink-0 flex-row items-center gap-3.5 border-b border-(--border-subtle) px-6 py-4.5 sm:px-8">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/15 text-sky-400"
          >
            <Key className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="font-serif text-xl font-semibold text-(--text-strong)">
              {L.changePasswordTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-(--text-muted)">
              {L.changePasswordDesc}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-curr-pass" className="text-xs text-(--text-secondary)">
                {L.currentPassword} <span className="text-(--gold)">*</span>
              </Label>
              <Input
                id="user-curr-pass"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-new-pass" className="text-xs text-(--text-secondary)">
                {L.newPassword} <span className="text-(--gold)">*</span>
              </Label>
              <Input
                id="user-new-pass"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-confirm-pass" className="text-xs text-(--text-secondary)">
                {L.confirmPassword} <span className="text-(--gold)">*</span>
              </Label>
              <Input
                id="user-confirm-pass"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                L.changePassword
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


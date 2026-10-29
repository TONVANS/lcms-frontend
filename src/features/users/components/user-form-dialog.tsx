'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/shared/alert-banner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { usersService } from '../api/users.service';
import {
  diffUserUpdate,
  hrmToFormPatch,
  impliesAllPermissions,
  toCreatePayload,
} from '../lib/user-mapper';
import {
  emptyUserForm,
  fromAdminUser,
  userCreateSchema,
  userEditSchema,
  type UserFormValues,
} from '../schemas/user.schema';
import { DIVISIONS, PERMISSION_KEYS, USER_ROLES, type AdminUser } from '../types';

const F = lo.users.form;
const NO_DIVISION = '__none__';

export interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode. */
  user?: AdminUser;
  onSaved: (u: AdminUser) => void;
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-(--text-secondary)">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-(--gold)">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-(--text-error)">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FormBody({
  user,
  onSaved,
  onCancel,
  registerBusy,
}: {
  user?: AdminUser;
  onSaved: (u: AdminUser) => void;
  onCancel: () => void;
  registerBusy: (busy: boolean) => void;
}) {
  const editing = Boolean(user);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(editing ? userEditSchema : userCreateSchema),
    defaultValues: user ? fromAdminUser(user) : emptyUserForm(),
    shouldFocusError: true,
  });
  const { register, control, handleSubmit, setValue, getValues, setError, clearErrors, formState } = form;
  const { errors, isSubmitting } = formState;
  const [banner, setBanner] = useState<string | null>(null);
  const [hrmNotice, setHrmNotice] = useState<'failed' | 'filled' | null>(null);
  const [looking, setLooking] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => registerBusy(isSubmitting), [isSubmitting, registerBusy]);

  const role = useWatch({ control, name: 'role' });
  const implied = impliesAllPermissions(role);

  const lookup = async () => {
    const code = getValues('employeeCode').trim();
    if (!code) {
      setError('employeeCode', { type: 'required', message: lo.users.validation.required });
      return;
    }
    clearErrors('employeeCode');
    setLooking(true);
    setHrmNotice(null);
    try {
      const emp = await usersService.hrmLookup(code);
      if (!alive.current) return;
      const patch = hrmToFormPatch(emp);
      for (const [k, v] of Object.entries(patch)) {
        setValue(k as keyof typeof patch, v, { shouldDirty: true, shouldValidate: false });
      }
      setHrmNotice('filled');
    } catch {
      // HRM being unreachable is not fatal: the backend falls back to the manual fields.
      if (alive.current) setHrmNotice('failed');
    } finally {
      if (alive.current) setLooking(false);
    }
  };

  const onValid = async (values: UserFormValues) => {
    setBanner(null);
    try {
      const saved = user
        ? await usersService.update(user.id, diffUserUpdate(values, user))
        : await usersService.create(toCreatePayload(values));
      onSaved(saved);
      if (!alive.current) return;
      toast.success(user ? F.updated : F.created);
      onCancel();
    } catch (e) {
      if (!alive.current) return;
      const err = normalizeError(e);
      if (err.status === 409) {
        setError('employeeCode', { type: 'server', message: F.duplicate });
        document.getElementById('user-employeeCode')?.focus();
      } else {
        const text = toUserMessage(err);
        if (text) setBanner(text);
      }
    }
  };

  return (
    <form
      noValidate
      aria-busy={isSubmitting}
      onSubmit={(e) => {
        void handleSubmit(onValid)(e);
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 sm:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <Field id="user-employeeCode" label={F.employeeCode} required={!editing} error={errors.employeeCode?.message}>
            <div className="flex gap-2">
              <Input
                id="user-employeeCode"
                disabled={editing}
                aria-invalid={Boolean(errors.employeeCode)}
                aria-describedby={errors.employeeCode ? 'user-employeeCode-error' : undefined}
                autoComplete="off"
                {...register('employeeCode')}
              />
              {editing ? null : (
                <Button type="button" variant="secondary" onClick={() => void lookup()} disabled={looking}>
                  {looking ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Search aria-hidden="true" />
                  )}
                  {looking ? F.hrmLooking : F.hrmLookup}
                </Button>
              )}
            </div>
          </Field>
          <Field id="user-fullName" label={F.fullName} error={errors.fullName?.message}>
            <Input id="user-fullName" disabled={editing} {...register('fullName')} />
          </Field>
        </div>

        {hrmNotice === 'failed' ? <AlertBanner tone="amber" title={F.hrmFailed} /> : null}
        {hrmNotice === 'filled' ? (
          <p role="status" className="text-xs text-(--text-secondary)">
            {F.hrmFilled}
          </p>
        ) : null}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <Field id="user-department" label={F.department} error={errors.department?.message}>
            <Input id="user-department" {...register('department')} />
          </Field>
          <Field id="user-division" label={F.division} error={errors.division?.message}>
            <Controller
              control={control}
              name="division"
              render={({ field }) => (
                <Select
                  value={field.value || NO_DIVISION}
                  onValueChange={(v) => field.onChange(v === NO_DIVISION ? '' : v)}
                >
                  <SelectTrigger id="user-division" aria-label={F.division} className="h-10 w-full">
                    <SelectValue placeholder={F.divisionPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DIVISION}>{F.divisionNone}</SelectItem>
                    {DIVISIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="user-email" label={F.email} error={errors.email?.message}>
            <Input id="user-email" type="email" disabled={editing} {...register('email')} />
          </Field>
          <Field id="user-phone" label={F.phone} error={errors.phone?.message}>
            <Input id="user-phone" type="tel" disabled={editing} {...register('phone')} />
          </Field>
          <Field id="user-role" label={F.role} required error={errors.role?.message}>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="user-role" aria-label={F.role} className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {lo.roles[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <fieldset className="space-y-3 rounded-xl border border-(--border-subtle) p-4">
          <legend className="px-1 text-xs font-medium text-(--text-secondary)">{F.permissions}</legend>
          {implied ? (
            <p role="status" className="text-xs text-(--text-muted)">
              {F.permissionsImplied}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {PERMISSION_KEYS.map((k) => (
              <Controller
                key={k}
                control={control}
                name={k}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`user-${k}`}
                      checked={implied || field.value}
                      disabled={implied}
                      onCheckedChange={(c) => field.onChange(c === true)}
                    />
                    <Label htmlFor={`user-${k}`} className="text-sm">
                      {lo.users.permissions[k]}
                    </Label>
                  </div>
                )}
              />
            ))}
          </div>
        </fieldset>

        {editing ? (
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="user-isActive"
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(c === true)}
                />
                <Label htmlFor="user-isActive" className="text-sm">
                  {F.isActive}
                </Label>
              </div>
            )}
          />
        ) : null}

        {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      </div>
      <DialogFooter className="mx-0 mb-0 flex shrink-0 items-center justify-between border-t border-(--border-subtle) bg-white/[0.02] px-6 py-4 sm:px-8">
        <span className="hidden text-xs text-(--text-muted) sm:inline">{F.requiredHint}</span>
        <div className="ml-auto flex items-center gap-2.5">
          <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onCancel}>
            {F.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-28 gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>{F.saving}</span>
              </>
            ) : (
              F.save
            )}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function UserFormDialog({ open, onOpenChange, user, onSaved }: UserFormDialogProps) {
  const returnFocus = useReturnFocus(open);
  const busy = useRef(false);
  const close = (next: boolean) => {
    if (!next && busy.current) return;
    onOpenChange(next);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        onCloseAutoFocus={returnFocus}
        className="flex max-h-[90vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[26px] border border-(--border-glass) bg-(image:--surface-modal) p-0 shadow-2xl sm:max-w-[720px]"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center gap-3.5 border-b border-(--border-subtle) px-6 py-4.5 sm:px-8">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-(--gold)/30 bg-(--gold)/15 text-(--gold)"
          >
            <UserPlus className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="font-serif text-xl font-semibold text-(--text-strong)">
              {user ? F.editTitle : F.createTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-(--text-muted)">
              {user ? F.editDescription : F.description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <FormBody
          key={user?.id ?? 'new'}
          user={user}
          onSaved={onSaved}
          onCancel={() => onOpenChange(false)}
          registerBusy={(b) => {
            busy.current = b;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

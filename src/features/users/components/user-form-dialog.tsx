'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  CheckCheck,
  Download,
  Eye,
  FilePlus2,
  FileText,
  Loader2,
  Pencil,
  RotateCcw,
  Scale,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Zap,
} from 'lucide-react';
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
import { rolesService, type Role } from '@/features/roles';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { PILLAR_MODULES, type CoreModuleKey, type ModulePermission, type PermissionActionKey } from '@/types/domain';
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

const PILLAR_ICONS: Record<CoreModuleKey, typeof FileText> = {
  CONTRACTS: FileText,
  POWER_CONTRACTS: Zap,
  LEGAL_AND_DISPUTE: Scale,
};

const ACTION_ICONS: Record<PermissionActionKey, typeof Eye> = {
  canView: Eye,
  canUpload: FilePlus2,
  canEdit: Pencil,
  canDelete: Trash2,
  canDownload: Download,
};

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
  const [roles, setRoles] = useState<Role[]>([]);
  const alive = useRef(true);

  // Watch full modulePermissions state so UI reacts instantly to all changes
  const modulePermissions = useWatch({ control, name: 'modulePermissions' });
  const currentRole = useWatch({ control, name: 'role' });

  useEffect(() => {
    alive.current = true;
    void (async () => {
      try {
        const fetchedRoles = await rolesService.list();
        if (alive.current && fetchedRoles.length > 0) {
          setRoles(fetchedRoles);
        }
      } catch {
        // Use fallback roles
      }
    })();
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => registerBusy(isSubmitting), [isSubmitting, registerBusy]);

  const isAdminRole = currentRole === 'ADMIN';
  const isDeptHead = currentRole === 'DEPARTMENT_HEAD';

  // Calculate total checked permissions count
  const activeCount = PILLAR_MODULES.reduce((total, p) => {
    const row = modulePermissions?.[p.key];
    if (!row) return total;
    return total + PERMISSION_KEYS.filter((k) => row[k]).length;
  }, 0);

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
      if (alive.current) setHrmNotice('failed');
    } finally {
      if (alive.current) setLooking(false);
    }
  };

  const handleRoleChange = (roleValue: string) => {
    setValue('role', roleValue, { shouldValidate: true, shouldDirty: true });

    const matchedRole = roles.find((r) => r.name === roleValue || r.id === roleValue);
    if (matchedRole) {
      setValue('roleId', matchedRole.id, { shouldDirty: true });
      if (matchedRole.name === 'ADMIN') {
        setAllPillars(true);
        return;
      }
      if (matchedRole.name === 'DEPARTMENT_HEAD') {
        setDeptHeadPillars();
        return;
      }

      // Populate matrix from custom role permissions
      const newPerms: Record<CoreModuleKey, ModulePermission> = {
        CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        POWER_CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        LEGAL_AND_DISPUTE: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
      };

      for (const pillar of PILLAR_MODULES) {
        const pKey = pillar.key;
        const rolePerm = matchedRole.permissions.find(
          (p) => p.module === pKey || (pKey === 'LEGAL_AND_DISPUTE' && (p.module === 'LEGAL_DOCUMENTS' || p.module === 'LEGAL_CASES')),
        );
        if (rolePerm) {
          newPerms[pKey] = {
            canView: rolePerm.canView,
            canUpload: rolePerm.canUpload,
            canEdit: rolePerm.canEdit,
            canDelete: rolePerm.canDelete,
            canDownload: rolePerm.canDownload,
          };
        }
      }
      setValue('modulePermissions', newPerms, { shouldDirty: true, shouldValidate: true });
    } else {
      setValue('roleId', undefined, { shouldDirty: true });
      if (roleValue === 'ADMIN') {
        setAllPillars(true);
      } else if (roleValue === 'DEPARTMENT_HEAD') {
        setDeptHeadPillars();
      }
    }
  };

  const setAllPillars = (checked: boolean) => {
    const perm: ModulePermission = {
      canView: checked,
      canUpload: checked,
      canEdit: checked,
      canDelete: checked,
      canDownload: checked,
    };
    setValue(
      'modulePermissions',
      {
        CONTRACTS: { ...perm },
        POWER_CONTRACTS: { ...perm },
        LEGAL_AND_DISPUTE: { ...perm },
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const setDeptHeadPillars = () => {
    const deptPerm: ModulePermission = {
      canView: true,
      canDownload: true,
      canUpload: false,
      canEdit: false,
      canDelete: false,
    };
    setValue(
      'modulePermissions',
      {
        CONTRACTS: { ...deptPerm },
        POWER_CONTRACTS: { ...deptPerm },
        LEGAL_AND_DISPUTE: { ...deptPerm },
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const toggleRow = (pKey: CoreModuleKey) => {
    const row = modulePermissions?.[pKey];
    const allChecked = PERMISSION_KEYS.every((k) => row?.[k]);
    const next = !allChecked;
    setValue(
      `modulePermissions.${pKey}`,
      {
        canView: next,
        canUpload: next,
        canEdit: next,
        canDelete: next,
        canDownload: next,
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const handleActionToggle = (pKey: CoreModuleKey, action: PermissionActionKey, nextChecked: boolean) => {
    const current = modulePermissions?.[pKey] ?? {
      canView: false,
      canUpload: false,
      canEdit: false,
      canDelete: false,
      canDownload: false,
    };

    const updated = { ...current, [action]: nextChecked };

    // Smart UX Rules:
    // 1) Enabling upload, edit, delete or download automatically enables canView
    if (nextChecked && action !== 'canView') {
      updated.canView = true;
    }
    // 2) Disabling canView automatically disables the other 4 actions
    if (!nextChecked && action === 'canView') {
      updated.canUpload = false;
      updated.canEdit = false;
      updated.canDelete = false;
      updated.canDownload = false;
    }

    setValue(`modulePermissions.${pKey}`, updated, { shouldDirty: true, shouldValidate: true });
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
                <Select value={field.value} onValueChange={handleRoleChange}>
                  <SelectTrigger id="user-role" aria-label={F.role} className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length > 0 ? (
                      roles.map((r) => (
                        <SelectItem key={r.id} value={r.name}>
                          <div className="flex items-center gap-2">
                            <span>{r.title || r.name}</span>
                            <span className="text-[11px] text-(--text-muted)">({r.name})</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      USER_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {lo.roles[r] ?? r}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        {/* 3 Core Modules Permission Matrix */}
        <fieldset className="space-y-4 rounded-2xl border border-(--border-subtle) bg-(--surface-subtle)/30 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-subtle) pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-(--gold)" />
                <legend className="text-sm font-semibold text-(--text-strong)">
                  {lo.users.matrixTitle}
                </legend>
                {!isAdminRole && (
                  <span className="rounded-full bg-(--gold)/15 px-2 py-0.5 text-[11px] font-semibold text-(--gold)">
                    {activeCount} / 15 ສິດທິ
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-(--text-muted)">{lo.users.matrixDesc}</p>
            </div>

            {!isAdminRole && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-xs font-medium text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                  onClick={() => setAllPillars(true)}
                >
                  <CheckCheck className="size-3.5" />
                  {lo.users.selectAll}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-xs font-medium text-(--text-muted) hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400"
                  onClick={() => setAllPillars(false)}
                >
                  <RotateCcw className="size-3" />
                  {lo.users.clearAll}
                </Button>
              </div>
            )}
          </div>

          {isAdminRole ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              {lo.users.adminFullAccess}
            </div>
          ) : isDeptHead ? (
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200">
              {lo.users.deptHeadAudit}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-(--border-subtle) text-(--text-secondary)">
                  <th className="py-2.5 pr-4 font-medium">ໂມດູນຫຼັກ (Pillar)</th>
                  {PERMISSION_KEYS.map((k) => {
                    const ActionIcon = ACTION_ICONS[k];
                    return (
                      <th key={k} className="px-2 py-2.5 text-center font-medium">
                        <div className="flex flex-col items-center gap-1">
                          <ActionIcon className="size-3.5 opacity-70" />
                          <span>{lo.users.permissions[k]}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-2.5 pl-2 text-right font-medium">ແຖວ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-subtle)/40">
                {PILLAR_MODULES.map((pillar) => {
                  const pKey = pillar.key;
                  const row = modulePermissions?.[pKey] ?? {
                    canView: false,
                    canUpload: false,
                    canEdit: false,
                    canDelete: false,
                    canDownload: false,
                  };
                  const allRow = PERMISSION_KEYS.every((k) => row[k]);
                  const PillarIcon = PILLAR_ICONS[pKey] ?? FileText;

                  return (
                    <tr key={pKey} className="transition-colors hover:bg-white/[0.03]">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-(--gold)">
                            <PillarIcon className="size-4" />
                          </div>
                          <div>
                            <span className="block font-medium text-(--text-strong)">
                              {lo.users.pillars[pKey] ?? pillar.label}
                            </span>
                            <span className="block text-[11px] text-(--text-muted)">
                              {lo.users.pillarDivisions[pKey] ?? pillar.divisionLabel}
                            </span>
                          </div>
                        </div>
                      </td>

                      {PERMISSION_KEYS.map((k) => {
                        const isChecked = isAdminRole || row[k];
                        const isDisabled =
                          isAdminRole ||
                          (isDeptHead && (k === 'canUpload' || k === 'canEdit' || k === 'canDelete'));

                        return (
                          <td
                            key={k}
                            className={cn(
                              'px-2 py-3.5 text-center transition-colors',
                              !isDisabled && 'cursor-pointer hover:bg-white/[0.04]',
                            )}
                            onClick={() => {
                              if (!isDisabled) {
                                handleActionToggle(pKey, k, !row[k]);
                              }
                            }}
                          >
                            <div className="flex items-center justify-center">
                              <Checkbox
                                id={`user-perm-${pKey}-${k}`}
                                checked={isChecked}
                                disabled={isDisabled}
                                onCheckedChange={(checked) => {
                                  handleActionToggle(pKey, k, checked === true);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`${pillar.label} ${lo.users.permissions[k]}`}
                              />
                            </div>
                          </td>
                        );
                      })}

                      <td className="py-3.5 pl-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isAdminRole || isDeptHead}
                          onClick={() => toggleRow(pKey)}
                          title={allRow ? 'ຍົກເລີກທຸກສິດໃນແຖວນີ້' : 'ເລືອກທຸກສິດໃນແຖວນີ້'}
                          className={cn(
                            'h-7 px-2 text-[11px] transition-colors',
                            allRow && 'bg-emerald-500/15 text-emerald-300 hover:bg-rose-500/15 hover:text-rose-300',
                          )}
                        >
                          {allRow ? <Check className="size-3.5" /> : 'ເລືອກ'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        className="flex max-h-[92vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[26px] border border-(--border-glass) bg-(image:--surface-modal) p-0 shadow-2xl sm:max-w-[780px]"
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

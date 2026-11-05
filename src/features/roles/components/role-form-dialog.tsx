'use client';

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
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { PILLAR_MODULES, type CoreModuleKey, type PermissionActionKey } from '@/types/domain';
import { rolesService } from '../api/roles.service';
import { toRoleCreatePayload, toRoleUpdatePayload } from '../lib/role-mapper';
import type { Role, RoleCreatePayload, RolePermission, RoleUpdatePayload } from '../types';

const L = lo.rolesManagement;
const PERMISSION_KEYS: readonly PermissionActionKey[] = [
  'canView',
  'canUpload',
  'canEdit',
  'canDelete',
  'canDownload',
];

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

export interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
  onSaved: () => void;
}

export function RoleFormDialog({ open, onOpenChange, role, onSaved }: RoleFormDialogProps) {
  const editing = Boolean(role);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Record<CoreModuleKey, Record<PermissionActionKey, boolean>>>({
    CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
    POWER_CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
    LEGAL_AND_DISPUTE: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setTitle(role.title || role.name);
      setDescription(role.description ?? '');

      const initialPerms = {
        CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        POWER_CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        LEGAL_AND_DISPUTE: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
      };

      for (const p of role.permissions) {
        const modKey = p.module as CoreModuleKey;
        if (modKey in initialPerms) {
          initialPerms[modKey] = {
            canView: p.canView,
            canUpload: p.canUpload,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
            canDownload: p.canDownload,
          };
        } else if (p.module === 'LEGAL_DOCUMENTS' || p.module === 'LEGAL_CASES') {
          initialPerms.LEGAL_AND_DISPUTE.canView ||= p.canView;
          initialPerms.LEGAL_AND_DISPUTE.canUpload ||= p.canUpload;
          initialPerms.LEGAL_AND_DISPUTE.canEdit ||= p.canEdit;
          initialPerms.LEGAL_AND_DISPUTE.canDelete ||= p.canDelete;
          initialPerms.LEGAL_AND_DISPUTE.canDownload ||= p.canDownload;
        }
      }
      setPermissions(initialPerms);
    } else {
      setName('');
      setTitle('');
      setDescription('');
      setPermissions({
        CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        POWER_CONTRACTS: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
        LEGAL_AND_DISPUTE: { canView: false, canUpload: false, canEdit: false, canDelete: false, canDownload: false },
      });
    }
    setErrorBanner(null);
  }, [role, open]);

  const setAll = (checked: boolean) => {
    setPermissions({
      CONTRACTS: { canView: checked, canUpload: checked, canEdit: checked, canDelete: checked, canDownload: checked },
      POWER_CONTRACTS: { canView: checked, canUpload: checked, canEdit: checked, canDelete: checked, canDownload: checked },
      LEGAL_AND_DISPUTE: { canView: checked, canUpload: checked, canEdit: checked, canDelete: checked, canDownload: checked },
    });
  };

  const toggleRow = (pKey: CoreModuleKey) => {
    const all = PERMISSION_KEYS.every((k) => permissions[pKey][k]);
    const next = !all;
    setPermissions((prev) => ({
      ...prev,
      [pKey]: {
        canView: next,
        canUpload: next,
        canEdit: next,
        canDelete: next,
        canDownload: next,
      },
    }));
  };

  const toggleAction = (pKey: CoreModuleKey, action: PermissionActionKey) => {
    setPermissions((prev) => {
      const row = { ...prev[pKey] };
      const nextVal = !row[action];
      row[action] = nextVal;
      // Smart dependencies:
      if (action !== 'canView' && nextVal) {
        row.canView = true;
      }
      if (action === 'canView' && !nextVal) {
        row.canUpload = false;
        row.canEdit = false;
        row.canDelete = false;
        row.canDownload = false;
      }
      return {
        ...prev,
        [pKey]: row,
      };
    });
  };

  const activeCount = PILLAR_MODULES.reduce((acc, p) => {
    return acc + PERMISSION_KEYS.filter((k) => permissions[p.key]?.[k]).length;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorBanner(lo.users.validation.required);
      return;
    }
    setErrorBanner(null);
    setSubmitting(true);

    try {
      if (editing && role) {
        const updatePayload = toRoleUpdatePayload(name, title, description, permissions);
        await rolesService.update(role.id, updatePayload);
        toast.success(L.updated);
      } else {
        const createPayload = toRoleCreatePayload(name, title, description, permissions);
        await rolesService.create(createPayload);
        toast.success(L.created);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const parsed = normalizeError(err);
      setErrorBanner(toUserMessage(parsed) || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[26px] border border-(--border-glass) bg-(image:--surface-modal) p-0 shadow-2xl sm:max-w-[760px]">
        <DialogHeader className="flex shrink-0 flex-row items-center gap-3.5 border-b border-(--border-subtle) px-6 py-4.5 sm:px-8">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-(--gold)/30 bg-(--gold)/15 text-(--gold)"
          >
            <ShieldCheck className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="font-serif text-xl font-semibold text-(--text-strong)">
              {editing ? L.form.editTitle : L.form.createTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-(--text-muted)">
              {L.form.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 sm:px-8">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-name" className="text-xs text-(--text-secondary)">
                  {L.name} <span className="text-(--gold)">*</span>
                </Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder={L.form.namePlaceholder}
                  disabled={editing && role?.isSystem}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-title" className="text-xs text-(--text-secondary)">
                  {L.roleTitle}
                </Label>
                <Input
                  id="role-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={L.form.titlePlaceholder}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-desc" className="text-xs text-(--text-secondary)">
                {L.description}
              </Label>
              <Textarea
                id="role-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={L.form.descPlaceholder}
              />
            </div>

            {/* Permission Matrix */}
            <fieldset className="space-y-3.5 rounded-2xl border border-(--border-subtle) bg-(--surface-subtle)/30 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-subtle) pb-3">
                <div className="flex items-center gap-2.5">
                  <div>
                    <legend className="text-sm font-semibold text-(--text-strong)">
                      {lo.users.matrixTitle}
                    </legend>
                    <p className="mt-0.5 text-xs text-(--text-muted)">{lo.users.matrixDesc}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-(--gold)/20 bg-(--gold)/10 px-2.5 py-0.5 text-[11px] font-medium text-(--gold)">
                    {activeCount} / 15 ສິດທິ
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAll(true)}
                  >
                    <CheckCheck className="size-3.5" />
                    {lo.users.selectAll}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-(--text-muted) hover:text-(--text-error)"
                    onClick={() => setAll(false)}
                  >
                    <X className="size-3.5" />
                    {lo.users.clearAll}
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-(--border-subtle) text-(--text-secondary)">
                      <th className="py-2.5 pr-4 font-medium">ໂມດູນຫຼັກ (Pillar)</th>
                      {PERMISSION_KEYS.map((k) => {
                        const Icon = ACTION_ICONS[k];
                        return (
                          <th key={k} className="px-2 py-2.5 text-center font-medium">
                            <span className="inline-flex items-center justify-center gap-1">
                              <Icon className="size-3 text-(--text-muted)" />
                              {lo.users.permissions[k]}
                            </span>
                          </th>
                        );
                      })}
                      <th className="py-2.5 pl-2 text-right font-medium">ແຖວ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border-subtle)/50">
                    {PILLAR_MODULES.map((pillar) => {
                      const pKey = pillar.key;
                      const PillarIcon = PILLAR_ICONS[pKey];
                      const rowPerms = permissions[pKey];
                      const allRow = PERMISSION_KEYS.every((k) => rowPerms[k]);
                      return (
                        <tr key={pKey} className="transition-colors hover:bg-white/[0.02]">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-(--border-subtle) bg-white/[0.03] text-(--text-muted)">
                                <PillarIcon className="size-3.5" />
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
                            const isChecked = Boolean(rowPerms[k]);
                            return (
                              <td
                                key={k}
                                className={cn(
                                  'cursor-pointer px-2 py-3 text-center transition-colors',
                                  isChecked && 'bg-(--gold)/[0.03]',
                                )}
                                onClick={() => toggleAction(pKey, k)}
                              >
                                <div className="inline-flex items-center justify-center">
                                  <Checkbox
                                    id={`role-perm-${pKey}-${k}`}
                                    checked={isChecked}
                                    onCheckedChange={() => toggleAction(pKey, k)}
                                    aria-label={`${pillar.label} ${lo.users.permissions[k]}`}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </td>
                            );
                          })}
                          <td className="py-3 pl-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(pKey)}
                              className="h-6 px-2 text-[11px]"
                              title={allRow ? lo.users.clearAll : lo.users.selectAll}
                            >
                              {allRow ? <X className="size-3 text-(--text-muted)" /> : <Check className="size-3 text-(--gold)" />}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </fieldset>

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
                lo.users.form.save
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


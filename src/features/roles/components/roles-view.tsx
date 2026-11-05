'use client';

import { Pencil, Plus, Shield, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { rolesService } from '../api/roles.service';
import type { Role } from '../types';
import { RoleFormDialog } from './role-form-dialog';

const L = lo.rolesManagement;

export function RolesView() {
  const [items, setItems] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rolesService.list();
      setItems(data);
    } catch (e) {
      setError(toUserMessage(normalizeError(e)) || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRoles();
  }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await rolesService.remove(toDelete.id);
      toast.success(L.deleted);
      setToDelete(null);
      await fetchRoles();
    } catch (e) {
      const parsed = normalizeError(e);
      toast.error(toUserMessage(parsed) || 'Cannot delete role');
    }
  };

  const columns = useMemo<DataTableColumn<Role>[]>(
    () => [
      {
        id: 'role',
        header: L.roleTitle,
        className: 'min-w-48 whitespace-normal',
        cell: (r) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-(--text-strong)">{r.title || r.name}</span>
              <StatusBadge
                tone={r.isSystem ? 'amber' : 'blue'}
                label={r.isSystem ? L.systemRole : L.customRole}
              />
            </div>
            <span className="text-[11px] text-(--text-muted)">{r.name}</span>
          </div>
        ),
      },
      {
        id: 'description',
        header: L.description,
        className: 'hidden min-w-56 whitespace-normal md:table-cell',
        cell: (r) => (
          <span className="text-xs text-(--text-secondary)">{r.description || '—'}</span>
        ),
      },
      {
        id: 'userCount',
        header: L.userCount,
        className: 'min-w-28 text-center',
        cell: (r) => (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-(--text-secondary)">
            <Users className="size-3 text-(--gold)" />
            {r.userCount}
          </span>
        ),
      },
      {
        id: 'actions',
        header: lo.table.actions,
        cell: (r) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${L.edit} ${r.name}`}
              onClick={() => {
                setEditingRole(r);
                setFormOpen(true);
              }}
            >
              <Pencil aria-hidden="true" />
            </Button>
            {!r.isSystem && (
              <Button
                variant="ghost"
                size="icon"
                disabled={r.userCount > 0}
                title={r.userCount > 0 ? L.cannotDeleteWithUsers : undefined}
                aria-label={`${L.delete} ${r.name}`}
                onClick={() => setToDelete(r)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={L.title}
        actions={
          <Button
            onClick={() => {
              setEditingRole(null);
              setFormOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            {L.add}
          </Button>
        }
      />

      {error ? (
        <AlertBanner
          tone="rose"
          title={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => void fetchRoles()}>
              {lo.common.retry}
            </Button>
          }
        />
      ) : null}

      <DataTable
        caption={L.caption}
        columns={columns}
        data={items}
        getRowId={(r) => r.id}
        total={items.length}
        page={1}
        pageSize={items.length || 10}
        onPageChange={() => {}}
        isLoading={loading}
        emptyTitle={L.emptyTitle}
        emptyDescription={L.emptyDescription}
      />

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editingRole}
        onSaved={() => void fetchRoles()}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title={L.deleteTitle}
        description={toDelete ? L.deleteDescription(toDelete.title || toDelete.name) : undefined}
        confirmLabel={L.delete}
        onConfirm={handleDelete}
      />
    </div>
  );
}

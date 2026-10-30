'use client';

import { Plus, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { useLookupsStore } from '@/features/lookups';
import { toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { adminService } from '../admin.service';
import { ActiveBadge, ListSection, RowActions } from '../shared/admin-list-parts';
import { AdminListToolbar, type ActiveFilter } from '../shared/admin-list-toolbar';
import type { DepartmentRecord } from '../types';
import { adminErrorMessage } from '../use-remote';
import { DepartmentFormDialog } from './department-form-dialog';
import {
  DEPARTMENTS_PAGE_SIZES,
  useDepartmentsListStore,
  useDepartmentsListUrlSync,
} from './departments-list.store';

const L = lo.departments;

export function DepartmentsView() {
  useDepartmentsListUrlSync();

  const query = useDepartmentsListStore((s) => s.query);
  const items = useDepartmentsListStore((s) => s.items);
  const total = useDepartmentsListStore((s) => s.total);
  const status = useDepartmentsListStore((s) => s.status);
  const error = useDepartmentsListStore((s) => s.error);
  const setQuery = useDepartmentsListStore((s) => s.setQuery);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | undefined>();
  const [deleting, setDeleting] = useState<DepartmentRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const reload = () => void useDepartmentsListStore.getState().fetch();

  const columns: DataTableColumn<DepartmentRecord>[] = useMemo(
    () => [
      { id: 'name', header: L.columns.name, cell: (r) => r.name },
      { id: 'code', header: L.columns.code, cell: (r) => r.code ?? '—' },
      {
        id: 'status',
        header: L.columns.status,
        cell: (r) => <ActiveBadge active={r.isActive} activeLabel={L.active} inactiveLabel={L.inactive} />,
      },
      {
        id: 'actions',
        header: L.columns.actions,
        align: 'end',
        cell: (r) => (
          <RowActions
            editLabel={L.editAria(r.name)}
            deleteLabel={L.deleteAria(r.name)}
            onEdit={() => {
              setEditing(r);
              setFormOpen(true);
            }}
            onDelete={() => {
              setDeleteError(null);
              setDeleting(r);
            }}
          />
        ),
      },
    ],
    [],
  );

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await adminService.departments.remove(deleting.id);
    } catch (e) {
      const msg = adminErrorMessage(e);
      setDeleteError(msg);
      toast.error(msg);
      throw e;
    }
    toast.success(L.deleted);
    void useLookupsStore.getState().load('departments', true);
    await useDepartmentsListStore.getState().afterDelete();
  };

  const sync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const r = await adminService.departments.sync();
      toast.success(
        r.created !== null && r.updated !== null ? L.syncDoneCounts(r.created, r.updated) : L.syncDone,
      );
      void useLookupsStore.getState().load('departments', true);
      reload();
    } catch (e) {
      toast.error(adminErrorMessage(e));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={lo.admin.departments}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" disabled={syncing} aria-busy={syncing} onClick={() => void sync()} className="gap-2">
              <RefreshCw className={syncing ? 'animate-spin' : undefined} aria-hidden="true" />
              {syncing ? L.syncing : L.sync}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
              className="gap-2"
            >
              <Plus aria-hidden="true" />
              {L.add}
            </Button>
          </div>
        }
      />
      <AdminListToolbar
        labels={L}
        search={query.q}
        onSearch={(q) => setQuery({ q: q || undefined, page: 1 })}
        activeFilter={query.filter ?? 'all'}
        onActiveFilter={(f: ActiveFilter) => setQuery({ filter: f, page: 1 })}
      />
      <ListSection
        isLoading={status === 'idle' || status === 'loading'}
        error={error ? toUserMessage(error) : null}
        errorTitle={L.loadError}
        onRetry={reload}
      >
        <DataTable
          columns={columns}
          data={items}
          getRowId={(r) => r.id}
          total={total}
          page={query.page ?? 1}
          pageSize={query.pageSize ?? 20}
          onPageChange={(page) => setQuery({ page })}
          pageSizeOptions={DEPARTMENTS_PAGE_SIZES}
          onPageSizeChange={(pageSize) => setQuery({ pageSize })}
          isLoading={status === 'idle' || status === 'loading'}
          emptyTitle={L.emptyTitle}
          emptyDescription={L.emptyDesc}
          caption={L.caption}
        />
      </ListSection>

      <DepartmentFormDialog open={formOpen} onOpenChange={setFormOpen} item={editing} onSaved={reload} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        title={L.deleteTitle}
        description={deleteError ?? (deleting ? L.deleteDesc(deleting.name) : undefined)}
        confirmLabel={L.delete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

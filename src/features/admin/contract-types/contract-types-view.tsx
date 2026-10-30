'use client';

import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { useLookupsStore } from '@/features/lookups';
import { lo } from '@/lib/i18n/lo';
import { adminService } from '../admin.service';
import { ActiveBadge, ListSection, RowActions } from '../shared/admin-list-parts';
import { activeFilterToBool, AdminListToolbar, type ActiveFilter } from '../shared/admin-list-toolbar';
import type { ContractType } from '../types';
import { adminErrorMessage, useRemote } from '../use-remote';
import { ContractTypeFormDialog } from './contract-type-form-dialog';

const L = lo.contractTypes;
const PAGE_SIZE = 20;

export function ContractTypesView() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ActiveFilter>('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContractType | undefined>();
  const [deleting, setDeleting] = useState<ContractType | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(
    () => adminService.contractTypes.list({ search, isActive: activeFilterToBool(filter) }),
    [search, filter],
  );
  const { data, error, isLoading, reload } = useRemote(load);
  const rows = useMemo(() => data ?? [], [data]);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const columns: DataTableColumn<ContractType>[] = [
    { id: 'nameLo', header: L.columns.nameLo, cell: (r) => r.nameLo },
    { id: 'nameEn', header: L.columns.nameEn, cell: (r) => r.nameEn ?? '—' },
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
          editLabel={L.editAria(r.nameLo)}
          deleteLabel={L.deleteAria(r.nameLo)}
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
  ];

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await adminService.contractTypes.remove(deleting.id);
    } catch (e) {
      const msg = adminErrorMessage(e);
      setDeleteError(msg);
      toast.error(msg);
      throw e;
    }
    toast.success(L.deleted);
    void useLookupsStore.getState().load('contractTypes', true);
    reload();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={lo.admin.contractTypes}
        actions={
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
        }
      />
      <AdminListToolbar
        labels={L}
        onSearch={onSearch}
        activeFilter={filter}
        onActiveFilter={(f) => {
          setFilter(f);
          setPage(1);
        }}
      />
      <ListSection isLoading={isLoading} error={error} errorTitle={L.loadError} onRetry={reload}>
        <DataTable
          columns={columns}
          data={pageRows}
          getRowId={(r) => r.id}
          total={rows.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={isLoading}
          emptyTitle={L.emptyTitle}
          emptyDescription={L.emptyDesc}
          caption={L.caption}
        />
      </ListSection>

      <ContractTypeFormDialog open={formOpen} onOpenChange={setFormOpen} item={editing} onSaved={reload} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        title={L.deleteTitle}
        description={deleteError ?? (deleting ? L.deleteDesc(deleting.nameLo) : undefined)}
        confirmLabel={L.delete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

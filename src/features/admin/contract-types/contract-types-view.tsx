'use client';

import { Plus } from 'lucide-react';
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
import type { ContractType } from '../types';
import { adminErrorMessage } from '../use-remote';
import { ContractTypeFormDialog } from './contract-type-form-dialog';
import {
  CONTRACT_TYPES_PAGE_SIZES,
  useContractTypesListStore,
  useContractTypesListUrlSync,
} from './contract-types-list.store';

const L = lo.contractTypes;

export function ContractTypesView() {
  useContractTypesListUrlSync();

  const query = useContractTypesListStore((s) => s.query);
  const items = useContractTypesListStore((s) => s.items);
  const total = useContractTypesListStore((s) => s.total);
  const status = useContractTypesListStore((s) => s.status);
  const error = useContractTypesListStore((s) => s.error);
  const setQuery = useContractTypesListStore((s) => s.setQuery);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContractType | undefined>();
  const [deleting, setDeleting] = useState<ContractType | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reload = () => void useContractTypesListStore.getState().fetch();

  const columns: DataTableColumn<ContractType>[] = useMemo(
    () => [
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
    ],
    [],
  );

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
    await useContractTypesListStore.getState().afterDelete();
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
          pageSizeOptions={CONTRACT_TYPES_PAGE_SIZES}
          onPageSizeChange={(pageSize) => setQuery({ pageSize })}
          isLoading={status === 'idle' || status === 'loading'}
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

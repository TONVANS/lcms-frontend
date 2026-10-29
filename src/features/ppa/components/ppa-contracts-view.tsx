'use client';

import { Eye, FilePlus2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { FilterChips } from '@/components/shared/filter-chips';
import { SearchInput } from '@/components/shared/search-input';
import { LegacyContractStatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/number';
import { ppaService } from '../api/ppa.service';
import type { PpaFormValues } from '../schemas/ppa.schema';
import { usePpaListStore } from '../store/ppa-list.store';
import type { PpaContract } from '../types';
import { PpaContractFormDialog } from './ppa-contract-form-dialog';

export function PpaContractsView() {
  const router = useRouter();
  const { filters, items, total, status, setFilter, fetch } = usePpaListStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<PpaContract | null>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleCreateSubmit = async (values: PpaFormValues) => {
    try {
      await ppaService.create(values);
      toast.success(lo.ppa.createdSuccess);
      fetch();
    } catch {
      toast.error(lo.errors.unknown);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;
    try {
      await ppaService.remove(contractToDelete.id);
      toast.success(lo.ppa.deletedSuccess);
      fetch();
    } catch {
      toast.error(lo.errors.unknown);
    } finally {
      setContractToDelete(null);
    }
  };

  const statusOptions = [
    { value: 'all', label: lo.table.all },
    { value: 'active', label: lo.status.active },
    { value: 'negotiating', label: lo.status.negotiating },
    { value: 'pending_cod', label: lo.status.pending_cod },
    { value: 'expiring', label: lo.status.expiring },
    { value: 'draft', label: lo.status.draft },
  ];

  const energyOptions = [
    { value: 'all', label: lo.table.all },
    { value: 'hydro', label: lo.energy.hydro },
    { value: 'solar', label: lo.energy.solar },
    { value: 'wind', label: lo.energy.wind },
    { value: 'coal', label: lo.energy.coal },
    { value: 'biomass', label: lo.energy.biomass },
  ];

  const columns: DataTableColumn<PpaContract>[] = [
    {
      id: 'contractNo',
      header: lo.ppa.fields.contractNo,
      cell: (row) => (
        <Link
          href={`/ppa/contracts/${row.id}`}
          className="font-medium text-[var(--ppa)] hover:underline tabular-nums"
        >
          {row.contractNo}
        </Link>
      ),
    },
    {
      id: 'projectName',
      header: lo.ppa.fields.projectName,
      cell: (row) => (
        <span className="font-semibold text-[var(--text-strong)]">
          {row.projectName}
        </span>
      ),
    },
    {
      id: 'developer',
      header: lo.ppa.fields.developer,
      cell: (row) => (
        <span className="text-xs text-[var(--text-secondary)]">
          {row.developer.name}
        </span>
      ),
    },
    {
      id: 'energyType',
      header: lo.ppa.fields.energyType,
      cell: (row) => (
        <span className="inline-flex rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          {lo.energy[row.energyType as keyof typeof lo.energy] ?? row.energyType}
        </span>
      ),
    },
    {
      id: 'capacityMw',
      header: lo.ppa.fields.capacityMw,
      cell: (row) => (
        <span className="font-medium tabular-nums text-[var(--text)]">
          {formatNumber(row.capacityMw)} MW
        </span>
      ),
    },
    {
      id: 'tariffUsCentPerKwh',
      header: lo.ppa.fields.tariff,
      cell: (row) => (
        <span className="font-medium tabular-nums text-[var(--text)]">
          {row.tariffUsCentPerKwh} ¢
        </span>
      ),
    },
    {
      id: 'status',
      header: lo.ppa.fields.status,
      cell: (row) => <LegacyContractStatusBadge status={row.status} />,
    },
    {
      id: 'endDate',
      header: lo.ppa.fields.endDate,
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <span className="tabular-nums text-xs text-[var(--text-secondary)]">
            {formatDate(row.endDate)}
          </span>
          {row.status === 'expiring' && (
            <CountdownBadge days={30} />
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: lo.table.actions,
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={lo.ppa.actions.view}
            onClick={() => router.push(`/ppa/contracts/${row.id}`)}
            className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={lo.ppa.actions.delete}
            onClick={() => setContractToDelete(row)}
            className="h-8 w-8 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="PPA"
        title={lo.ppa.title}
        meta={lo.ppa.subtitle}
        accent="ppa"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/ppa/new">
              <Button variant="secondary" className="gap-2">
                <FilePlus2 className="h-4 w-4" />
                <span>{lo.ppa.actions.createWizard}</span>
              </Button>
            </Link>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>{lo.ppa.actions.createModal}</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-glass)] p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <SearchInput
              value={filters.q}
              onChange={(val) => setFilter('q', val)}
              placeholder={lo.common.search}
              aria-label={lo.topbar.searchLabel}
            />
          </div>
          <FilterChips
            options={statusOptions}
            value={filters.status}
            onChange={(val) => setFilter('status', val)}
            accent="ppa"
            ariaLabel={lo.table.filterByStatus}
          />
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-xs font-medium text-[var(--text-muted)] shrink-0">
            {lo.table.filterByEnergy}:
          </span>
          <FilterChips
            options={energyOptions}
            value={filters.energyType}
            onChange={(val) => setFilter('energyType', val)}
            accent="ppa"
            ariaLabel={lo.table.filterByEnergy}
          />
        </div>
      </div>

      {/* Contracts Table */}
      <DataTable
        caption={lo.modules.ppa}
        getRowId={(r) => r.id}
        columns={columns}
        data={items}
        total={total}
        page={filters.page}
        pageSize={filters.pageSize}
        onPageChange={(p) => setFilter('page', p)}
        isLoading={status === 'loading'}
        emptyTitle={lo.table.noData}
        emptyAction={
          <Button onClick={() => setIsModalOpen(true)} size="default" className="mt-2">
            {lo.ppa.actions.createModal}
          </Button>
        }
      />

      {/* Modal Dialog */}
      <PpaContractFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(contractToDelete)}
        onOpenChange={(open) => !open && setContractToDelete(null)}
        title={lo.confirm.deleteTitle}
        description={contractToDelete ? `${lo.confirm.deleteDesc} (${contractToDelete.projectName})` : ''}
        confirmLabel={lo.ppa.actions.delete}
        onConfirm={handleDeleteConfirm}
        tone="danger"
      />
    </div>
  );
}

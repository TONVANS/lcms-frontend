'use client';

import { Eye, FilePlus2, Filter, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCan } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { FilterChips } from '@/components/shared/filter-chips';
import { SearchInput } from '@/components/shared/search-input';
import { ContractStatusBadge } from '@/components/shared/status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectTypes } from '@/features/lookups';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { daysLeft, formatDate } from '@/lib/utils/date';
import { ppaService } from '../api/ppa.service';
import { usePpaListUrlSync } from '../hooks/use-ppa-list-url-sync';
import { formatCapacity, formatTariff } from '../lib/format';
import { usePpaListStore } from '../store/ppa-list.store';
import {
  POWER_CONTRACT_TYPES,
  POWER_PAGE_SIZES,
  POWER_STATUSES,
  type PowerContract,
  type PowerContractType,
} from '../types';
import { PpaContractFormDialog } from './ppa-contract-form-dialog';

const ALL = 'all';
const DEBOUNCE_MS = 300;
const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

/**
 * Text that owns its input state. It commits to the store after a debounce and follows the store's value
 * when that changes from outside (back/forward, URL on mount) unless the user is mid-typing.
 */
function useDebouncedText(value: string | undefined, onCommit: (v: string | undefined) => void) {
  const [text, setText] = useState(value ?? '');
  const [prev, setPrev] = useState(value);
  const [editing, setEditing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (value !== prev) {
    setPrev(value);
    if (!editing && text.trim() !== (value ?? '')) setText(value ?? '');
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onChange = (next: string) => {
    setText(next);
    setEditing(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      setEditing(false);
      const trimmed = next.trim();
      if (trimmed !== (value ?? '')) onCommit(trimmed || undefined);
    }, DEBOUNCE_MS);
  };

  return { text, onChange };
}

function SearchFilter() {
  const q = usePpaListStore((s) => s.query.q);
  const setQuery = usePpaListStore((s) => s.setQuery);
  const { text, onChange } = useDebouncedText(q, (v) => setQuery({ q: v }));
  return (
    <SearchInput
      value={text}
      onChange={onChange}
      placeholder={lo.ppa.list.searchPlaceholder}
      aria-label={lo.ppa.list.searchLabel}
      className="w-full sm:w-72"
    />
  );
}

function ProjectFilter({ suggestions }: { suggestions: readonly string[] }) {
  const project = usePpaListStore((s) => s.query.projectTypeOrCustomer);
  const setQuery = usePpaListStore((s) => s.setQuery);
  const { text, onChange } = useDebouncedText(project, (v) => setQuery({ projectTypeOrCustomer: v }));
  return (
    <div className="w-full sm:w-64">
      <Label htmlFor="ppa-project-filter" className="sr-only">
        {lo.ppa.list.projectFilter}
      </Label>
      <Input
        id="ppa-project-filter"
        list="ppa-project-filter-options"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={lo.ppa.list.projectFilterPlaceholder}
        className="h-10"
      />
      <datalist id="ppa-project-filter-options">
        {suggestions.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  );
}

function RowActions({
  contract,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  contract: PowerContract;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (c: PowerContract) => void;
  onDelete: (c: PowerContract) => void;
}) {
  const label = contract.contractNumber || contract.projectName;
  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/ppa/contracts/${encodeURIComponent(contract.id)}`}
        aria-label={`${lo.ppa.list.view} ${label}`}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-(--text-secondary) hover:text-(--text)', FOCUS_RING)}
      >
        <Eye aria-hidden="true" />
      </Link>
      {canEdit ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${lo.ppa.list.edit} ${label}`}
          onClick={() => onEdit(contract)}
          className="text-(--text-secondary) hover:text-(--text)"
        >
          <Pencil aria-hidden="true" />
        </Button>
      ) : null}
      {canDelete ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${lo.ppa.list.delete} ${label}`}
          onClick={() => onDelete(contract)}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}

export function PpaContractsView() {
  usePpaListUrlSync();
  const query = usePpaListStore((s) => s.query);
  const items = usePpaListStore((s) => s.items);
  const total = usePpaListStore((s) => s.total);
  const status = usePpaListStore((s) => s.status);
  const error = usePpaListStore((s) => s.error);
  const setQuery = usePpaListStore((s) => s.setQuery);
  const projectTypes = useProjectTypes();

  const canCreate = useCan('ppa', 'create');
  const canEdit = useCan('ppa', 'edit');
  const canDelete = useCan('ppa', 'delete');

  // `contract` is kept after close so the dialog title does not flip to "create" mid exit-animation.
  const [dialog, setDialog] = useState<{ open: boolean; contract: PowerContract | null }>({
    open: false,
    contract: null,
  });
  const openCreate = () => setDialog({ open: true, contract: null });
  const [toDelete, setToDelete] = useState<PowerContract | null>(null);

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;

  // Deep-page clamp: a page beyond the data (e.g. ?page=99) moves to the last real page.
  useEffect(() => {
    if (status !== 'ready' || items.length > 0 || total === 0 || page <= 1) return;
    const last = Math.ceil(total / pageSize);
    if (last < page) usePpaListStore.getState().setQuery({ page: last });
  }, [status, items.length, total, page, pageSize]);

  const columns = useMemo<DataTableColumn<PowerContract>[]>(() => {
    const cols: DataTableColumn<PowerContract>[] = [
      {
        id: 'contractNumber',
        header: `${lo.ppa.fields.contractNumber} / ${lo.ppa.fields.projectName}`,
        className: 'min-w-56 whitespace-normal',
        cell: (c) => (
          <>
            <Link
              href={`/ppa/contracts/${encodeURIComponent(c.id)}`}
              className={cn(
                'rounded-sm font-medium text-(--text-strong) tabular-nums underline underline-offset-4 hover:text-(--ppa)',
                FOCUS_RING,
              )}
            >
              {c.contractNumber || c.id}
            </Link>
            <span className="mt-0.5 block font-semibold text-(--text-strong)">{c.projectName}</span>
          </>
        ),
      },
      {
        id: 'contractType',
        header: lo.ppa.fields.contractType,
        cell: (c) => (
          <span className="inline-flex rounded-full border border-(--border-subtle) px-2 py-0.5 text-xs font-medium text-(--text-secondary)">
            {lo.ppa.types[c.contractType]}
          </span>
        ),
      },
      {
        id: 'projectTypeOrCustomer',
        header: lo.ppa.fields.projectTypeOrCustomer,
        className: 'min-w-40 whitespace-normal',
        cell: (c) => <span className="text-xs text-(--text-secondary)">{c.projectTypeOrCustomer || '—'}</span>,
      },
      {
        id: 'capacity',
        header: lo.ppa.fields.installedCapacity,
        align: 'end',
        cell: (c) => <span className="tabular-nums">{formatCapacity(c.capacityValue, c.capacityUnit)}</span>,
      },
      {
        id: 'tariff',
        header: lo.ppa.fields.tariff,
        align: 'end',
        cell: (c) => <span className="tabular-nums">{formatTariff(c.tariffValue, c.tariffCurrency)}</span>,
      },
      {
        id: 'expirationDate',
        header: lo.ppa.fields.expirationDate,
        cell: (c) => (
          <>
            <span className="tabular-nums">{formatDate(c.expirationDate)}</span>
            {c.expirationDate && c.status !== 'EXPIRED' && c.status !== 'TERMINATED' ? (
              <span className="mt-1 block">
                <CountdownBadge days={daysLeft(c.expirationDate)} />
              </span>
            ) : null}
          </>
        ),
      },
      {
        id: 'status',
        header: lo.ppa.fields.status,
        cell: (c) => <ContractStatusBadge status={c.status} />,
      },
      {
        id: 'actions',
        header: lo.table.actions,
        cell: (c) => (
          <RowActions
            contract={c}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={(row) => setDialog({ open: true, contract: row })}
            onDelete={setToDelete}
          />
        ),
      },
    ];
    return cols;
  }, [canEdit, canDelete]);

  const typeOptions = useMemo(
    () => [
      { value: ALL, label: lo.table.all },
      ...POWER_CONTRACT_TYPES.map((t) => ({ value: t, label: lo.ppa.types[t] })),
    ],
    [],
  );
  const statusOptions = useMemo(
    () => [{ value: ALL, label: lo.table.all }, ...POWER_STATUSES.map((s) => ({ value: s, label: lo.status[s] }))],
    [],
  );

  const onConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await ppaService.remove(toDelete.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e; // keeps the ConfirmDialog open
    }
    toast.success(lo.ppa.list.deleted);
    await usePpaListStore.getState().afterDelete();
  };

  const hasFilters = Boolean(query.q || query.contractType || query.status || query.projectTypeOrCustomer);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow={MODULES.ppa.code}
        title={lo.ppa.title}
        meta={lo.ppa.subtitle}
        accent="ppa"
        actions={
          canCreate ? (
            <>
              <Link href="/ppa/new" className={buttonVariants({ variant: 'secondary' })}>
                <FilePlus2 aria-hidden="true" />
                {lo.ppa.list.openWizard}
              </Link>
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" />
                {lo.ppa.list.create}
              </Button>
            </>
          ) : null
        }
      />

      <div className="flex flex-col gap-3.5 rounded-2xl border border-(--border-glass) bg-(--surface-glass) p-4 shadow-(--shadow-card) backdrop-blur-md sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <SearchFilter />
            <ProjectFilter suggestions={projectTypes.items} />
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setQuery({
                    q: undefined,
                    contractType: undefined,
                    status: undefined,
                    projectTypeOrCustomer: undefined,
                  })
                }
                className="h-10 gap-1.5 text-xs text-(--text-muted) hover:bg-white/10 hover:text-(--text)"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                <span>{lo.ppa.list.resetFilters}</span>
              </Button>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-4 text-xs text-(--text-muted)">
            <span className="font-medium tabular-nums">
              {total} {lo.ppa.list.totalItems}
            </span>
            <div className="flex items-center gap-2 border-l border-(--border-subtle) pl-4">
              <Label htmlFor="ppa-page-size" className="hidden text-xs text-(--text-muted) sm:inline">
                {lo.ppa.list.pageSize}
              </Label>
              <Select value={String(pageSize)} onValueChange={(v) => setQuery({ pageSize: Number(v) })}>
                <SelectTrigger id="ppa-page-size" className="h-10 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POWER_PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-(--border-subtle) pt-3">
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-(--text-muted)">
            <Filter className="size-3.5 text-(--ppa)" aria-hidden="true" />
            {lo.ppa.list.typeFilter}:
          </span>
          <FilterChips
            accent="ppa"
            ariaLabel={lo.ppa.list.typeFilter}
            options={typeOptions}
            value={query.contractType ?? ALL}
            onChange={(v) => setQuery({ contractType: v === ALL ? undefined : (v as PowerContractType) })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-(--text-muted)">
            <Filter className="size-3.5 text-(--ppa)" aria-hidden="true" />
            {lo.table.filterByStatus}:
          </span>
          <FilterChips
            accent="ppa"
            ariaLabel={lo.table.filterByStatus}
            options={statusOptions}
            value={query.status ?? ALL}
            onChange={(v) =>
              setQuery({ status: v === ALL ? undefined : (v as (typeof POWER_STATUSES)[number]) })
            }
          />
        </div>
      </div>

      {status === 'error' && error ? (
        <AlertBanner
          tone="rose"
          title={toUserMessage(error)}
          action={
            <Button variant="secondary" onClick={() => void usePpaListStore.getState().fetch()}>
              {lo.common.retry}
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          getRowId={(c) => c.id}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={(p) => setQuery({ page: p })}
          isLoading={status === 'idle' || status === 'loading'}
          emptyTitle={lo.table.noData}
          emptyDescription={hasFilters ? lo.ppa.list.emptyHint : undefined}
          emptyAction={
            !hasFilters && canCreate ? (
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" />
                {lo.ppa.list.create}
              </Button>
            ) : undefined
          }
          caption={lo.ppa.list.caption}
        />
      )}

      <PpaContractFormDialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) setDialog((d) => ({ ...d, open: false }));
        }}
        contract={dialog.contract ?? undefined}
        onSaved={() => {
          void usePpaListStore.getState().fetch();
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        tone="danger"
        title={lo.ppa.list.deleteTitle}
        description={toDelete ? lo.ppa.list.deleteDesc(toDelete.contractNumber || toDelete.projectName) : undefined}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

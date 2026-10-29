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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContractTypes } from '@/features/lookups';
import { STATUS_META } from '@/lib/constants/status';
import { MODULES } from '@/lib/constants/modules';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { daysLeft, formatDate } from '@/lib/utils/date';
import { gcService } from '../api/gc.service';
import { formatValue } from '../lib/format';
import { useGcListUrlSync } from '../hooks/use-gc-list-url-sync';
import { useGcListStore } from '../store/gc-list.store';
import { GC_PAGE_SIZES, GC_STATUSES, type Contract } from '../types';
import { GcContractFormDialog } from './gc-contract-form-dialog';

const ALL = 'all';
const SEARCH_DEBOUNCE_MS = 300;
const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

/**
 * Search box that owns its text. It commits to the store after a debounce and follows the store's q
 * when that changes from outside (back/forward, URL on mount) unless the user is mid-typing.
 */
function GcSearch() {
  const q = useGcListStore((s) => s.query.q);
  const setQuery = useGcListStore((s) => s.setQuery);
  const [text, setText] = useState(q ?? '');
  const [prevQ, setPrevQ] = useState(q);
  const [editing, setEditing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (q !== prevQ) {
    setPrevQ(q);
    if (!editing && text.trim() !== (q ?? '')) setText(q ?? '');
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onChange = (value: string) => {
    setText(value);
    setEditing(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      setEditing(false);
      const next = value.trim();
      if (next !== (useGcListStore.getState().query.q ?? '')) setQuery({ q: next || undefined });
    }, SEARCH_DEBOUNCE_MS);
  };

  return (
    <SearchInput
      value={text}
      onChange={onChange}
      placeholder={lo.gc.list.searchPlaceholder}
      aria-label={lo.gc.list.searchLabel}
      className="w-full sm:w-72"
    />
  );
}

function RowActions({
  contract,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  contract: Contract;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (c: Contract) => void;
  onDelete: (c: Contract) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/contracts/${contract.id}`}
        aria-label={`${lo.gc.list.view} ${contract.contractNumber}`}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-(--text-secondary) hover:text-(--text)', FOCUS_RING)}
      >
        <Eye aria-hidden="true" />
      </Link>
      {canEdit ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${lo.gc.list.edit} ${contract.contractNumber}`}
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
          aria-label={`${lo.gc.list.delete} ${contract.contractNumber}`}
          onClick={() => onDelete(contract)}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}

export function GcContractsView() {
  useGcListUrlSync();
  const query = useGcListStore((s) => s.query);
  const items = useGcListStore((s) => s.items);
  const total = useGcListStore((s) => s.total);
  const status = useGcListStore((s) => s.status);
  const error = useGcListStore((s) => s.error);
  const setQuery = useGcListStore((s) => s.setQuery);

  const canCreate = useCan('gc', 'create');
  const canEdit = useCan('gc', 'edit');
  const canDelete = useCan('gc', 'delete');

  // `contract` is kept after close so the dialog title and body do not flip to "create" mid exit-animation.
  // Opening replaces it (null for create); the body is keyed by contract id inside the dialog.
  const [dialog, setDialog] = useState<{ open: boolean; contract: Contract | null }>({
    open: false,
    contract: null,
  });
  const openCreate = () => setDialog({ open: true, contract: null });
  const [toDelete, setToDelete] = useState<Contract | null>(null);

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;

  // Deep-page clamp: a page beyond the data (e.g. ?page=99) moves to the last real page.
  // It only fires when the target is strictly lower than the current page, so it cannot loop.
  useEffect(() => {
    if (status !== 'ready' || items.length > 0 || total === 0 || page <= 1) return;
    const last = Math.ceil(total / pageSize);
    if (last < page) useGcListStore.getState().setQuery({ page: last });
  }, [status, items.length, total, page, pageSize]);

  const columns = useMemo<DataTableColumn<Contract>[]>(() => {
    const cols: DataTableColumn<Contract>[] = [
      {
        id: 'contractNumber',
        header: lo.gc.list.numberAndTitle,
        className: 'min-w-56 whitespace-normal',
        cell: (c) => (
          <>
            <Link
              href={`/contracts/${c.id}`}
              className={cn(
                'rounded-sm font-medium text-(--text-strong) tabular-nums underline underline-offset-4 hover:text-(--gc)',
                FOCUS_RING,
              )}
            >
              {c.contractNumber}
            </Link>
            <span className="mt-0.5 block font-semibold text-(--text-strong)">{c.title}</span>
            <span className="mt-0.5 block text-xs text-(--text-secondary) 2xl:hidden">
              {c.contractType?.nameLo ?? '—'}
            </span>
          </>
        ),
      },
      {
        id: 'contractType',
        header: lo.gc.fields.contractTypeId,
        className: 'hidden 2xl:table-cell min-w-48 whitespace-normal',
        cell: (c) => <span className="text-xs text-(--text-secondary)">{c.contractType?.nameLo ?? '—'}</span>,
      },
      {
        id: 'signedDate',
        header: lo.gc.fields.signedDate,
        className: 'hidden xl:table-cell',
        cell: (c) => <span className="tabular-nums">{formatDate(c.signedDate)}</span>,
      },
      {
        id: 'expirationDate',
        header: lo.gc.fields.expirationDate,
        cell: (c) => {
          const left = daysLeft(c.expirationDate);
          const show = left !== null && left >= 0 && left <= (c.notifyDaysBefore ?? 60);
          return (
            <>
              <span className="tabular-nums">{formatDate(c.expirationDate)}</span>
              {show ? (
                <span className="mt-1 block">
                  <CountdownBadge days={left} />
                </span>
              ) : null}
            </>
          );
        },
      },
      {
        id: 'contractValue',
        header: lo.gc.fields.contractValue,
        align: 'end',
        cell: (c) => <span className="tabular-nums">{formatValue(c.contractValue, c.currency)}</span>,
      },
      {
        id: 'status',
        header: lo.gc.fields.status,
        cell: (c) => <ContractStatusBadge status={c.status} />,
      },
    ];
    cols.push({
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
    });
    return cols;
  }, [canEdit, canDelete]);

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: lo.table.all },
      ...GC_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })),
    ],
    [],
  );

  const onConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await gcService.remove(toDelete.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e; // keeps the ConfirmDialog open
    }
    toast.success(lo.gc.list.deleted);
    await useGcListStore.getState().afterDelete();
  };

  const hasFilters = Boolean(query.q || query.contractTypeId !== undefined || query.status);
  const contractTypes = useContractTypes();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow={MODULES.gc.code}
        title={lo.gc.list.title}
        accent="gc"
        actions={
          canCreate ? (
            <>
              <Link href="/contracts/new" className={buttonVariants({ variant: 'secondary' })}>
                <FilePlus2 aria-hidden="true" />
                {lo.gc.list.openWizard}
              </Link>
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" />
                {lo.gc.list.create}
              </Button>
            </>
          ) : null
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3.5 rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-glass)] p-4 sm:p-5 shadow-[var(--shadow-card)] backdrop-blur-md">
        {/* Top row: Search, Type Select, Reset Button, and Page size/Items count */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-0">
            <GcSearch />
            <div className="w-full sm:w-60">
              <Label htmlFor="gc-type-filter" className="sr-only">
                {lo.gc.list.typeFilter}
              </Label>
              <Select
                value={query.contractTypeId === undefined ? ALL : String(query.contractTypeId)}
                onValueChange={(v) => setQuery({ contractTypeId: v === ALL ? undefined : Number(v) })}
              >
                <SelectTrigger id="gc-type-filter" aria-label={lo.gc.list.typeFilter} className="w-full h-10">
                  <SelectValue placeholder={lo.gc.list.allTypes} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{lo.gc.list.allTypes}</SelectItem>
                  {contractTypes.items.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nameLo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery({ q: undefined, contractTypeId: undefined, status: undefined })}
                className="h-10 gap-1.5 text-xs text-(--text-muted) hover:text-(--text) hover:bg-white/10"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                <span>{lo.gc.list.resetFilters ?? lo.table.reset}</span>
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-4 shrink-0 text-xs text-(--text-muted)">
            <span className="font-medium tabular-nums">
              {total} {lo.gc.list.totalItems}
            </span>
            <div className="flex items-center gap-2 border-l border-(--border-subtle) pl-4">
              <Label htmlFor="gc-page-size" className="text-xs text-(--text-muted) hidden sm:inline">
                {lo.gc.list.pageSize}
              </Label>
              <Select value={String(pageSize)} onValueChange={(v) => setQuery({ pageSize: Number(v) })}>
                <SelectTrigger id="gc-page-size" className="w-20 h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GC_PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bottom row: Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-(--border-subtle)">
          <span className="text-xs font-medium text-(--text-muted) shrink-0 flex items-center gap-1.5">
            <Filter className="size-3.5 text-(--gc)" aria-hidden="true" />
            {lo.table.filterByStatus}:
          </span>
          <FilterChips
            accent="gc"
            ariaLabel={lo.table.filterByStatus}
            options={statusOptions}
            value={query.status ?? ALL}
            onChange={(v) =>
              setQuery({ status: v === ALL ? undefined : (v as (typeof GC_STATUSES)[number]) })
            }
          />
        </div>
      </div>

      {status === 'error' && error ? (
        <AlertBanner
          tone="rose"
          title={toUserMessage(error)}
          action={
            <Button variant="secondary" onClick={() => void useGcListStore.getState().fetch()}>
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
          emptyDescription={hasFilters ? lo.gc.list.emptyHint : undefined}
          emptyAction={
            !hasFilters && canCreate ? (
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" />
                {lo.gc.list.create}
              </Button>
            ) : undefined
          }
          caption={lo.gc.list.caption}
        />
      )}

      <GcContractFormDialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) setDialog((d) => ({ ...d, open: false }));
        }}
        contract={dialog.contract ?? undefined}
        onSaved={() => {
          void useGcListStore.getState().fetch();
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        tone="danger"
        title={lo.gc.list.deleteTitle}
        description={toDelete ? lo.gc.list.deleteDesc(toDelete.contractNumber) : undefined}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

'use client';

import { FilePlus2, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCan } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/components/shared/data-table';
import { FilterChips } from '@/components/shared/filter-chips';
import { SearchInput } from '@/components/shared/search-input';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MODULES } from '@/lib/constants/modules';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { daysLeft, formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/money';
import { gcService } from '../api/gc.service';
import { deriveGcStatus, GC_STATUS_TONE } from '../lib/derive-status';
import { useGcListUrlSync } from '../hooks/use-gc-list-url-sync';
import { useGcListStore } from '../store/gc-list.store';
import {
  GC_CONTRACT_TYPES,
  GC_PAGE_SIZES,
  GC_SORT_KEYS,
  GC_STATUSES,
  type GcContractType,
  type GcSortKey,
  type GeneralContract,
} from '../types';
import { GcContractFormDialog } from './gc-contract-form-dialog';

const ALL = 'all';
const SEARCH_DEBOUNCE_MS = 300;
const SORTABLE: ReadonlySet<string> = new Set(GC_SORT_KEYS);
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
  contract: GeneralContract;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (c: GeneralContract) => void;
  onDelete: (c: GeneralContract) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {canEdit ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${lo.gc.list.edit} ${contract.contractNo}`}
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
          aria-label={`${lo.gc.list.delete} ${contract.contractNo}`}
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

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<GeneralContract | null>(null);
  const [toDelete, setToDelete] = useState<GeneralContract | null>(null);

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;

  // Deep-page clamp: a page beyond the data (e.g. ?page=99) moves to the last real page.
  // It only fires when the target is strictly lower than the current page, so it cannot loop.
  useEffect(() => {
    if (status !== 'ready' || items.length > 0 || total === 0 || page <= 1) return;
    const last = Math.ceil(total / pageSize);
    if (last < page) useGcListStore.getState().setQuery({ page: last });
  }, [status, items.length, total, page, pageSize]);

  const columns = useMemo<DataTableColumn<GeneralContract>[]>(() => {
    const cols: DataTableColumn<GeneralContract>[] = [
      {
        id: 'contractNo',
        header: lo.gc.fields.contractNo,
        cell: (c) => (
          <Link
            href={`/contracts/${c.id}`}
            className={cn(
              'rounded-sm font-medium text-(--text-strong) underline underline-offset-4 tabular-nums hover:text-(--gc)',
              FOCUS_RING,
            )}
          >
            {c.contractNo}
          </Link>
        ),
      },
      {
        id: 'title',
        header: lo.gc.fields.title,
        sortable: true,
        className: 'min-w-48 whitespace-normal',
        cell: (c) => (
          <>
            <span className="font-semibold text-(--text-strong)">{c.title}</span>
            <span className="mt-0.5 block text-xs text-(--text-secondary) 2xl:hidden">
              {lo.gc.types[c.type]}
            </span>
          </>
        ),
      },
      {
        id: 'type',
        header: lo.gc.fields.type,
        className: 'hidden 2xl:table-cell min-w-48 whitespace-normal',
        cell: (c) => <span className="text-xs text-(--text-secondary)">{lo.gc.types[c.type]}</span>,
      },
      {
        id: 'counterparty',
        header: lo.gc.fields.counterparty,
        className: 'hidden 2xl:table-cell min-w-40 whitespace-normal',
        cell: (c) => c.counterparty ?? '—',
      },
      {
        id: 'signedDate',
        header: lo.gc.fields.signedDate,
        sortable: true,
        className: 'hidden 2xl:table-cell',
        cell: (c) => <span className="tabular-nums">{formatDate(c.signedDate)}</span>,
      },
      {
        id: 'endDate',
        header: lo.gc.fields.endDate,
        sortable: true,
        cell: (c) =>
          c.endDate ? (
            <>
              <span className="tabular-nums">{formatDate(c.endDate)}</span>
              <span className="mt-1 block 2xl:hidden">
                <CountdownBadge days={daysLeft(c.endDate)} />
              </span>
            </>
          ) : (
            lo.gc.openEnded
          ),
      },
      {
        id: 'value',
        header: lo.gc.fields.value,
        align: 'end',
        cell: (c) => (
          <span className="tabular-nums">{c.value ? formatMoney(c.value) : '—'}</span>
        ),
      },
      {
        id: 'status',
        header: lo.gc.fields.status,
        cell: (c) => {
          const s = deriveGcStatus(c);
          return <StatusBadge tone={GC_STATUS_TONE[s]} label={lo.gc.status[s]} />;
        },
      },
      {
        id: 'countdown',
        header: lo.gc.list.countdown,
        className: 'hidden 2xl:table-cell',
        cell: (c) => (c.endDate ? <CountdownBadge days={daysLeft(c.endDate)} /> : null),
      },
    ];
    if (canEdit || canDelete) {
      cols.push({
        id: 'actions',
        header: lo.table.actions,
        cell: (c) => (
          <RowActions
            contract={c}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={setEditing}
            onDelete={setToDelete}
          />
        ),
      });
    }
    return cols;
  }, [canEdit, canDelete]);

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: lo.table.all },
      ...GC_STATUSES.map((s) => ({ value: s, label: lo.gc.status[s] })),
    ],
    [],
  );

  const onSortChange = (s: DataTableSort) => {
    if (!SORTABLE.has(s.id)) return;
    setQuery({ sort: s.id as GcSortKey, order: s.order });
  };

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

  const hasFilters = Boolean(query.q || query.type || query.status);
  const dialogOpen = createOpen || editing !== null;

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
              <Button onClick={() => setCreateOpen(true)}>
                <Plus aria-hidden="true" />
                {lo.gc.list.create}
              </Button>
            </>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <GcSearch />
        <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor="gc-type-filter" className="text-xs text-(--text-muted)">
          {lo.gc.list.typeFilter}
        </Label>
        <Select
          value={query.type ?? ALL}
          onValueChange={(v) =>
            setQuery({ type: v === ALL ? undefined : (v as GcContractType) })
          }
        >
          <SelectTrigger id="gc-type-filter" className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{lo.gc.list.allTypes}</SelectItem>
            {GC_CONTRACT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {lo.gc.types[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
        <FilterChips
          accent="gc"
          ariaLabel={lo.table.filterByStatus}
          options={statusOptions}
          value={query.status ?? ALL}
          onChange={(v) =>
            setQuery({ status: v === ALL ? undefined : (v as (typeof GC_STATUSES)[number]) })
          }
        />
        <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor="gc-page-size" className="text-xs text-(--text-muted)">
          {lo.gc.list.pageSize}
        </Label>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => setQuery({ pageSize: Number(v) })}
        >
          <SelectTrigger id="gc-page-size" className="w-24">
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
          sort={{ id: query.sort ?? 'endDate', order: query.order ?? 'asc' }}
          onSortChange={onSortChange}
          isLoading={status === 'idle' || status === 'loading'}
          emptyTitle={lo.table.noData}
          emptyDescription={hasFilters ? lo.gc.list.emptyHint : undefined}
          emptyAction={
            !hasFilters && canCreate ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus aria-hidden="true" />
                {lo.gc.list.create}
              </Button>
            ) : undefined
          }
          caption={lo.gc.list.caption}
        />
      )}

      <GcContractFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditing(null);
          }
        }}
        contract={editing ?? undefined}
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
        description={toDelete ? lo.gc.list.deleteDesc(toDelete.contractNo) : undefined}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

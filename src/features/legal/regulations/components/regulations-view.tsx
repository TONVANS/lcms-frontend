'use client';

import { Download, Filter, Link2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Can, useCan } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/components/shared/data-table';
import { FilterChips } from '@/components/shared/filter-chips';
import { SearchInput } from '@/components/shared/search-input';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import { csvStamp, downloadCsv } from '@/lib/utils/export-csv';
import { LEGAL_PAGE_SIZES, LEGAL_UNITS, type LegalUnit } from '../../constants';
import { regulationsService } from '../api/regulations.service';
import { buildRegulationsCsv } from '../lib/regulations-csv';
import { RegulationFormDialog } from './regulation-form-dialog';
import { useRegulationsListStore, useRegulationsListUrlSync } from '../store/regulations-list.store';
import {
  REGULATION_SORT_KEYS,
  REGULATION_STATUS_TONE,
  REGULATION_STATUSES,
  REGULATION_TYPES,
  type Regulation,
  type RegulationSortKey,
  type RegulationStatus,
  type RegulationType,
} from '../types';

const ALL = 'all';
const SEARCH_DEBOUNCE_MS = 300;
const SORTABLE: ReadonlySet<string> = new Set(REGULATION_SORT_KEYS);
const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';
const L = lo.legal.regulations.list;

/**
 * Search box that owns its text. It commits to the store after a debounce and follows the store's q
 * when that changes from outside (back/forward, URL on mount) unless the user is mid-typing.
 */
function RegulationsSearch() {
  const q = useRegulationsListStore((s) => s.query.q);
  const setQuery = useRegulationsListStore((s) => s.setQuery);
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
      if (next !== (useRegulationsListStore.getState().query.q ?? '')) {
        setQuery({ q: next || undefined });
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  return (
    <SearchInput
      value={text}
      onChange={onChange}
      placeholder={L.searchPlaceholder}
      aria-label={L.searchLabel}
      className="w-full sm:w-72"
    />
  );
}

function LinkCountChip({ count }: { count: number }) {
  if (count === 0) return <span className="text-(--text-muted)">—</span>;
  return (
    <span
      aria-label={L.linkCount(count)}
      className="inline-flex items-center gap-1 rounded-full bg-(--surface-subtle) px-2 py-0.5 text-xs font-medium tabular-nums text-(--text-secondary)"
    >
      <Link2 className="size-3" aria-hidden="true" />
      {count}
    </span>
  );
}

function typeLabel(r: Regulation): string {
  return r.type === 'other' && r.typeOther ? r.typeOther : lo.legal.regulationTypes[r.type];
}

export function RegulationsView() {
  useRegulationsListUrlSync();
  const query = useRegulationsListStore((s) => s.query);
  const items = useRegulationsListStore((s) => s.items);
  const total = useRegulationsListStore((s) => s.total);
  const status = useRegulationsListStore((s) => s.status);
  const error = useRegulationsListStore((s) => s.error);
  const setQuery = useRegulationsListStore((s) => s.setQuery);

  const canDelete = useCan('legal', 'delete');
  const canEdit = useCan('legal', 'edit');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Regulation | null>(null);
  const [toDelete, setToDelete] = useState<Regulation | null>(null);
  const [exporting, setExporting] = useState(false);

  const page = query.page ?? 1;
  const pageSize = typeof query.pageSize === 'number' ? query.pageSize : 10;

  // Deep-page clamp: a page beyond the data (e.g. ?page=99) moves to the last real page.
  useEffect(() => {
    if (status !== 'ready' || items.length > 0 || total === 0 || page <= 1) return;
    const last = Math.ceil(total / pageSize);
    if (last < page) useRegulationsListStore.getState().setQuery({ page: last });
  }, [status, items.length, total, page, pageSize]);

  const columns = useMemo<DataTableColumn<Regulation>[]>(() => {
    const cols: DataTableColumn<Regulation>[] = [
      {
        id: 'number',
        header: lo.legal.fields.number,
        sortable: true,
        cell: (r) => (
          <>
            <Link
              href={`/legal/regulations/${r.id}`}
              className={cn(
                'rounded-sm font-medium text-(--text-strong) tabular-nums underline underline-offset-4 hover:text-(--legal)',
                FOCUS_RING,
              )}
            >
              {r.number}
            </Link>
            <span className="mt-1 block 2xl:hidden">
              <LinkCountChip count={r.externalLinks.length} />
            </span>
          </>
        ),
      },
      {
        id: 'issuedDate',
        header: lo.legal.fields.issuedDate,
        sortable: true,
        cell: (r) => <span className="tabular-nums">{formatDate(r.issuedDate)}</span>,
      },
      {
        id: 'title',
        header: lo.legal.fields.title,
        sortable: true,
        className: 'min-w-56 whitespace-normal',
        cell: (r) => (
          <>
            <span className="font-semibold text-(--text-strong)">{r.title}</span>
            {r.purpose ? (
              <span className="mt-0.5 block truncate text-xs text-(--text-secondary)">
                {r.purpose}
              </span>
            ) : null}
            <span className="mt-0.5 block text-xs text-(--text-secondary) 2xl:hidden">
              {[
                lo.legal.units[r.unit],
                r.year !== null ? L.yearSubline(r.year) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </>
        ),
      },
      {
        id: 'type',
        header: lo.legal.fields.type,
        className: 'min-w-32 whitespace-normal',
        cell: (r) => <span className="text-xs text-(--text-secondary)">{typeLabel(r)}</span>,
      },
      {
        id: 'year',
        header: lo.legal.fields.year,
        className: 'hidden 2xl:table-cell',
        cell: (r) => <span className="tabular-nums">{r.year ?? '—'}</span>,
      },
      {
        id: 'unit',
        header: lo.legal.fields.unit,
        className: 'hidden 2xl:table-cell min-w-44 whitespace-normal',
        cell: (r) => (
          <>
            <span>{lo.legal.units[r.unit]}</span>
            {r.responsible ? (
              <span className="mt-0.5 block text-xs text-(--text-secondary)">{r.responsible}</span>
            ) : null}
          </>
        ),
      },
      {
        id: 'status',
        header: lo.legal.fields.status,
        cell: (r) => (
          <StatusBadge
            tone={REGULATION_STATUS_TONE[r.status]}
            label={lo.legal.regulationStatus[r.status]}
          />
        ),
      },
      {
        id: 'documents',
        header: L.documents,
        className: 'hidden 2xl:table-cell',
        cell: (r) => <LinkCountChip count={r.externalLinks.length} />,
      },
    ];
    if (canDelete || canEdit) {
      cols.push({
        id: 'actions',
        header: lo.table.actions,
        cell: (r) => (
          <span className="inline-flex items-center gap-1">
            {canEdit ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${L.edit} ${r.number}`}
                onClick={() => {
                  setEditing(r);
                  setFormOpen(true);
                }}
              >
                <Pencil aria-hidden="true" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${L.delete} ${r.number}`}
                onClick={() => setToDelete(r)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            ) : null}
          </span>
        ),
      });
    }
    return cols;
  }, [canDelete, canEdit]);

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: lo.table.all },
      ...REGULATION_STATUSES.map((s) => ({ value: s, label: lo.legal.regulationStatus[s] })),
    ],
    [],
  );

  const onSortChange = (s: DataTableSort) => {
    if (!SORTABLE.has(s.id)) return;
    setQuery({ sort: s.id as RegulationSortKey, order: s.order });
  };

  const onConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await regulationsService.remove(toDelete.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e; // keeps the ConfirmDialog open
    }
    toast.success(L.deleted);
    await useRegulationsListStore.getState().afterDelete();
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const current = useRegulationsListStore.getState().query;
      const res = await regulationsService.list({ ...current, page: 1, pageSize: 'all' });
      downloadCsv(
        `${lo.legal.regulations.csv.filePrefix}${csvStamp()}.csv`,
        buildRegulationsCsv(res.items),
      );
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Boolean(query.q || query.type || query.unit || query.status);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow={MODULES.legal.code}
        title={L.title}
        accent="legal"
        actions={
          <>
            <Can module="legal" permission="download">
              <Button variant="secondary" onClick={() => void onExport()} disabled={exporting}>
                <Download aria-hidden="true" />
                {L.exportCsv}
              </Button>
            </Can>
            <Can module="legal" permission="create">
              <Button
                variant="gold"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus aria-hidden="true" />
                {L.add}
              </Button>
            </Can>
          </>
        }
      />

      <div className="flex flex-col gap-3.5 rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-glass)] p-4 sm:p-5 shadow-[var(--shadow-card)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <RegulationsSearch />
            <div className="w-full sm:w-52">
              <Label htmlFor="reg-type-filter" className="sr-only">
                {L.typeFilter}
              </Label>
              <Select
                value={query.type ?? ALL}
                onValueChange={(v) =>
                  setQuery({ type: v === ALL ? undefined : (v as RegulationType) })
                }
              >
                <SelectTrigger id="reg-type-filter" aria-label={L.typeFilter} className="h-10 w-full">
                  <SelectValue placeholder={L.allTypes} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{L.allTypes}</SelectItem>
                  {REGULATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {lo.legal.regulationTypes[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-64">
              <Label htmlFor="reg-unit-filter" className="sr-only">
                {L.unitFilter}
              </Label>
              <Select
                value={query.unit ?? ALL}
                onValueChange={(v) => setQuery({ unit: v === ALL ? undefined : (v as LegalUnit) })}
              >
                <SelectTrigger id="reg-unit-filter" aria-label={L.unitFilter} className="h-10 w-full">
                  <SelectValue placeholder={L.allUnits} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{L.allUnits}</SelectItem>
                  {LEGAL_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {lo.legal.units[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setQuery({ q: undefined, type: undefined, unit: undefined, status: undefined })
                }
                className="h-10 gap-1.5 text-xs text-(--text-muted) hover:bg-white/10 hover:text-(--text)"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                <span>{L.resetFilters}</span>
              </Button>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-4 text-xs text-(--text-muted)">
            <span className="font-medium tabular-nums">
              {total} {L.totalItems}
            </span>
            <div className="flex items-center gap-2 border-l border-(--border-subtle) pl-4">
              <Label htmlFor="reg-page-size" className="hidden text-xs text-(--text-muted) sm:inline">
                {L.pageSize}
              </Label>
              <Select value={String(pageSize)} onValueChange={(v) => setQuery({ pageSize: Number(v) })}>
                <SelectTrigger id="reg-page-size" className="h-10 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_PAGE_SIZES.map((n) => (
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
            <Filter className="size-3.5 text-(--legal)" aria-hidden="true" />
            {lo.table.filterByStatus}:
          </span>
          <FilterChips
            accent="legal"
            ariaLabel={lo.table.filterByStatus}
            options={statusOptions}
            value={query.status ?? ALL}
            onChange={(v) => setQuery({ status: v === ALL ? undefined : (v as RegulationStatus) })}
          />
        </div>
      </div>

      {status === 'error' && error ? (
        <AlertBanner
          tone="rose"
          title={toUserMessage(error)}
          action={
            <Button
              variant="secondary"
              onClick={() => void useRegulationsListStore.getState().fetch()}
            >
              {lo.common.retry}
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          getRowId={(r) => r.id}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={(p) => setQuery({ page: p })}
          sort={{ id: query.sort ?? 'issuedDate', order: query.order ?? 'desc' }}
          onSortChange={onSortChange}
          isLoading={status === 'idle' || status === 'loading'}
          emptyTitle={lo.table.noData}
          emptyDescription={hasFilters ? L.emptyHint : undefined}
          caption={L.caption}
        />
      )}

      <RegulationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        regulation={editing ?? undefined}
        onSaved={() => void useRegulationsListStore.getState().fetch()}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        tone="danger"
        title={L.deleteTitle}
        description={toDelete ? L.deleteDesc(toDelete.number) : undefined}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

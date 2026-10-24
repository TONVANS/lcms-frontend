'use client';

import { Download, Filter, Pencil, Plus, Printer, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
import { FilterChips, type FilterChipOption } from '@/components/shared/filter-chips';
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
import { formatMoney } from '@/lib/utils/money';
import { LEGAL_PAGE_SIZES } from '../../constants';
import { LegalSearch } from '../../lib/legal-search';
import { casesService } from '../api/cases.service';
import { buildCasesCsv } from '../lib/cases-csv';
import { caseTotal, CASE_STAGE_TONE } from '../lib/case-money';
import { CaseFormDialog } from './case-form-dialog';
import { useCasesListStore, useCasesListUrlSync } from '../store/cases-list.store';
import {
  CASE_SORT_KEYS,
  CASE_STAGES,
  CASE_TYPES,
  type CaseProgressFilter,
  type CaseSortKey,
  type CaseStage,
  type CaseType,
  type DualAmount,
  type LegalCase,
} from '../types';

const ALL = 'all';
const SORTABLE: ReadonlySet<string> = new Set(CASE_SORT_KEYS);
const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';
const L = lo.legal.cases.list;

function DualAmountStack({ amount }: { amount: DualAmount }) {
  const hasLak = amount.lak !== null;
  const hasUsd = amount.usd !== null;
  if (!hasLak && !hasUsd) return <span className="text-(--text-muted)">—</span>;
  return (
    <div className="flex flex-col text-xs tabular-nums">
      {hasLak ? (
        <span className="font-medium text-(--text-strong)">
          {formatMoney({ amount: amount.lak!, currency: 'LAK' })}
        </span>
      ) : null}
      {hasUsd ? (
        <span className="text-(--text-secondary)">
          {formatMoney({ amount: amount.usd!, currency: 'USD' })}
        </span>
      ) : null}
    </div>
  );
}

export function CasesView() {
  useCasesListUrlSync();
  const query = useCasesListStore((s) => s.query);
  const items = useCasesListStore((s) => s.items);
  const total = useCasesListStore((s) => s.total);
  const status = useCasesListStore((s) => s.status);
  const error = useCasesListStore((s) => s.error);
  const setQuery = useCasesListStore((s) => s.setQuery);

  const canDelete = useCan('legal', 'delete');
  const canEdit = useCan('legal', 'edit');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LegalCase | null>(null);
  const [toDelete, setToDelete] = useState<LegalCase | null>(null);
  const [exporting, setExporting] = useState(false);

  const page = query.page ?? 1;
  const pageSize = typeof query.pageSize === 'number' ? query.pageSize : 10;

  // Deep-page clamp: a page beyond the data moves to the last real page.
  useEffect(() => {
    if (status !== 'ready' || items.length > 0 || total === 0 || page <= 1) return;
    const last = Math.ceil(total / pageSize);
    if (last < page) useCasesListStore.getState().setQuery({ page: last });
  }, [status, items.length, total, page, pageSize]);

  const columns = useMemo<DataTableColumn<LegalCase>[]>(() => {
    const cols: DataTableColumn<LegalCase>[] = [
      {
        id: 'caseNo',
        header: lo.legal.fields.caseNo,
        sortable: true,
        cell: (c) => (
          <Link
            href={`/legal/cases/${c.id}`}
            className={cn(
              'rounded-sm font-medium text-(--text-strong) tabular-nums underline underline-offset-4 hover:text-(--litigation)',
              FOCUS_RING,
            )}
          >
            {c.caseNo}
          </Link>
        ),
      },
      {
        id: 'defendant',
        header: lo.legal.fields.defendant,
        sortable: true,
        className: 'min-w-48 whitespace-normal',
        cell: (c) => (
          <>
            <span className="font-semibold text-(--text-strong)">{c.defendant}</span>
            {c.allegation ? (
              <span className="mt-0.5 block truncate text-xs text-(--text-secondary)">
                {c.allegation}
              </span>
            ) : null}
            <span className="mt-0.5 block text-xs text-(--text-secondary) 2xl:hidden">
              {[
                c.handlingUnit,
                lo.legal.caseTypes[c.caseType],
                c.disputeDate ? formatDate(c.disputeDate) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </>
        ),
      },
      {
        id: 'handlingUnit',
        header: lo.legal.fields.handlingUnit,
        className: 'hidden 2xl:table-cell min-w-36 whitespace-normal',
        cell: (c) => <span>{c.handlingUnit}</span>,
      },
      {
        id: 'caseType',
        header: lo.legal.fields.caseType,
        className: 'hidden 2xl:table-cell min-w-28 whitespace-normal',
        cell: (c) => (
          <span className="text-xs text-(--text-secondary)">{lo.legal.caseTypes[c.caseType]}</span>
        ),
      },
      {
        id: 'stage',
        header: lo.legal.fields.stage,
        cell: (c) => (
          <StatusBadge
            tone={CASE_STAGE_TONE[c.stage]}
            label={lo.legal.caseStages[c.stage]}
          />
        ),
      },
      {
        id: 'total',
        header: lo.legal.fields.total,
        cell: (c) => <DualAmountStack amount={caseTotal(c)} />,
      },
      {
        id: 'recovered',
        header: lo.legal.fields.recovered,
        cell: (c) => <DualAmountStack amount={c.recovered} />,
      },
      {
        id: 'disputeDate',
        header: lo.legal.fields.disputeDate,
        sortable: true,
        className: 'hidden 2xl:table-cell',
        cell: (c) => (
          <span className="tabular-nums">
            {c.disputeDate ? formatDate(c.disputeDate) : '—'}
          </span>
        ),
      },
    ];

    if (canDelete || canEdit) {
      cols.push({
        id: 'actions',
        header: lo.table.actions,
        className: 'print:hidden',
        cell: (c) => (
          <span className="inline-flex items-center gap-1">
            {canEdit ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${L.edit} ${c.caseNo}`}
                onClick={() => {
                  setEditing(c);
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
                aria-label={`${L.delete} ${c.caseNo}`}
                onClick={() => setToDelete(c)}
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

  const filterChipsOptions = useMemo<FilterChipOption[]>(
    () => [
      { value: ALL, label: lo.table.all },
      { value: 'in_progress', label: lo.legal.progress.inProgress },
      { value: 'finished', label: lo.legal.progress.finished },
      ...CASE_STAGES.map((s) => ({ value: s, label: lo.legal.caseStages[s] })),
    ],
    [],
  );

  const selectedChipValue = query.stage ?? query.progress ?? ALL;

  const onFilterChipChange = (v: string) => {
    if (v === ALL) {
      setQuery({ stage: undefined, progress: undefined, page: 1 });
    } else if (v === 'in_progress' || v === 'finished') {
      setQuery({ progress: v as CaseProgressFilter, stage: undefined, page: 1 });
    } else if ((CASE_STAGES as readonly string[]).includes(v)) {
      setQuery({ stage: v as CaseStage, progress: undefined, page: 1 });
    }
  };

  const onSortChange = (s: DataTableSort) => {
    if (!SORTABLE.has(s.id)) return;
    setQuery({ sort: s.id as CaseSortKey, order: s.order });
  };

  const onConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await casesService.remove(toDelete.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e; // keeps the ConfirmDialog open
    }
    toast.success(L.deleted);
    await useCasesListStore.getState().afterDelete();
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const current = useCasesListStore.getState().query;
      const res = await casesService.list({ ...current, page: 1, pageSize: 'all' });
      downloadCsv(
        `${lo.legal.cases.csv.filePrefix}${csvStamp()}.csv`,
        buildCasesCsv(res.items),
      );
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Boolean(query.q || query.caseType || query.stage || query.progress);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow={MODULES.legal.code}
        title={L.title}
        accent="legal"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => window.print()}
              className="print:hidden"
            >
              <Printer aria-hidden="true" />
              {L.print}
            </Button>
            <Can module="legal" permission="download">
              <Button
                variant="secondary"
                onClick={() => void onExport()}
                disabled={exporting}
                className="print:hidden"
              >
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
                className="print:hidden"
              >
                <Plus aria-hidden="true" />
                {L.add}
              </Button>
            </Can>
          </>
        }
      />

      <div
        data-testid="cases-filters-card"
        className="flex flex-col gap-3.5 rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-glass)] p-4 sm:p-5 shadow-[var(--shadow-card)] backdrop-blur-md print:hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <LegalSearch
              value={query.q}
              onChange={(q) => setQuery({ q })}
              placeholder={L.searchPlaceholder}
              ariaLabel={L.searchLabel}
            />
            <div className="w-full sm:w-52">
              <Label htmlFor="case-type-filter" className="sr-only">
                {L.typeFilter}
              </Label>
              <Select
                value={query.caseType ?? ALL}
                onValueChange={(v) =>
                  setQuery({ caseType: v === ALL ? undefined : (v as CaseType) })
                }
              >
                <SelectTrigger id="case-type-filter" aria-label={L.typeFilter} className="h-10 w-full">
                  <SelectValue placeholder={L.allTypes} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{L.allTypes}</SelectItem>
                  {CASE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {lo.legal.caseTypes[t]}
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
                  setQuery({ q: undefined, caseType: undefined, stage: undefined, progress: undefined })
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
              <Label htmlFor="case-page-size" className="hidden text-xs text-(--text-muted) sm:inline">
                {L.pageSize}
              </Label>
              <Select value={String(pageSize)} onValueChange={(v) => setQuery({ pageSize: Number(v) })}>
                <SelectTrigger id="case-page-size" className="h-10 w-20 text-xs">
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
            <Filter className="size-3.5 text-(--litigation)" aria-hidden="true" />
            {lo.table.filterByStatus}:
          </span>
          <FilterChips
            accent="litigation"
            ariaLabel={lo.table.filterByStatus}
            options={filterChipsOptions}
            value={selectedChipValue}
            onChange={onFilterChipChange}
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
              onClick={() => void useCasesListStore.getState().fetch()}
            >
              {lo.common.retry}
            </Button>
          }
        />
      ) : (
        <div className="print:bg-white print:text-black">
          <DataTable
            columns={columns}
            data={items}
            getRowId={(c) => c.id}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => setQuery({ page: p })}
            sort={{ id: query.sort ?? 'disputeDate', order: query.order ?? 'desc' }}
            onSortChange={onSortChange}
            isLoading={status === 'idle' || status === 'loading'}
            emptyTitle={lo.table.noData}
            emptyDescription={hasFilters ? L.emptyHint : undefined}
            caption={L.caption}
          />
        </div>
      )}

      <CaseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        legalCase={editing ?? undefined}
        onSaved={() => void useCasesListStore.getState().fetch()}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        tone="danger"
        title={L.deleteTitle}
        description={toDelete ? L.deleteDesc(toDelete.caseNo) : undefined}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

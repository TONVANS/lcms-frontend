'use client';

import { Download, Filter, Pencil, Plus, Printer, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Can, useCan } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { DatePicker } from '@/components/shared/date-picker';
import { FilterChips } from '@/components/shared/filter-chips';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { csvStamp, downloadCsv } from '@/lib/utils/export-csv';
import { formatNumber } from '@/lib/utils/number';
import { ALL_FILTER, DEFAULT_PAGE_SIZE, LEGAL_PAGE_SIZES } from '../../constants';
import { DepartmentFilter } from '../../lib/department-select';
import { FOCUS_RING } from '../../lib/detail-bits';
import { LegalSearch } from '../../lib/legal-search';
import { legalCasesService } from '../api/legal-cases.service';
import { caseTotalDue } from '../lib/legal-case-mapper';
import { buildLegalCasesCsv } from '../lib/legal-cases-csv';
import { useLegalCasesListStore, useLegalCasesListUrlSync } from '../store/legal-cases-list.store';
import {
  CASE_TYPES,
  DISPUTE_STATUSES,
  DISPUTE_STATUS_TONE,
  type CaseType,
  type DisputeStatus,
  type LegalCase,
} from '../types';
import { LegalCaseFormDialog } from './legal-case-form-dialog';

const L = lo.legal.cases.list;
const F = lo.legal.fields;

function Money({ lak, usd }: { lak: number | null; usd: number | null }) {
  if (lak === null && usd === null) return <span className="text-(--text-muted)">—</span>;
  return (
    <span className="flex flex-col gap-0.5 text-xs tabular-nums">
      <span>{lak === null ? '—' : formatNumber(lak) + ' LAK'}</span>
      <span>{usd === null ? '—' : formatNumber(usd) + ' USD'}</span>
    </span>
  );
}

export function LegalCasesView() {
  useLegalCasesListUrlSync();
  const query = useLegalCasesListStore((s) => s.query);
  const items = useLegalCasesListStore((s) => s.items);
  const total = useLegalCasesListStore((s) => s.total);
  const status = useLegalCasesListStore((s) => s.status);
  const error = useLegalCasesListStore((s) => s.error);
  const setQuery = useLegalCasesListStore((s) => s.setQuery);

  const canDelete = useCan('legal', 'delete');
  const canEdit = useCan('legal', 'edit');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LegalCase | null>(null);
  const [toDelete, setToDelete] = useState<LegalCase | null>(null);
  const [exporting, setExporting] = useState(false);

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  useEffect(() => {
    if (status !== 'ready' || items.length > 0 || total === 0 || page <= 1) return;
    const last = Math.ceil(total / pageSize);
    if (last < page) useLegalCasesListStore.getState().setQuery({ page: last });
  }, [status, items.length, total, page, pageSize]);

  const columns = useMemo<DataTableColumn<LegalCase>[]>(() => {
    const cols: DataTableColumn<LegalCase>[] = [
      {
        id: 'caseCode',
        header: F.caseCode,
        className: 'min-w-52 whitespace-normal',
        cell: (c) => (
          <>
            <Link
              href={`/legal/cases/${encodeURIComponent(c.id)}`}
              className={cn(
                'rounded-sm font-medium text-(--text-strong) tabular-nums underline underline-offset-4 hover:text-(--litigation)',
                FOCUS_RING,
              )}
            >
              {c.caseCode}
            </Link>
            <span className="mt-0.5 block text-xs text-(--text-secondary)">{c.defendant}</span>
          </>
        ),
      },
      {
        id: 'allegation',
        header: F.allegation,
        className: 'hidden xl:table-cell max-w-64',
        cell: (c) => (
          <span className="block truncate text-xs text-(--text-secondary)" title={c.allegation ?? undefined}>
            {c.allegation ?? '—'}
          </span>
        ),
      },
      {
        id: 'caseType',
        header: F.caseType,
        className: 'min-w-28 whitespace-normal',
        cell: (c) => <span className="text-xs text-(--text-secondary)">{lo.legal.caseTypes[c.caseType]}</span>,
      },
      {
        id: 'disputeStatus',
        header: F.disputeStatus,
        cell: (c) => (
          <StatusBadge tone={DISPUTE_STATUS_TONE[c.disputeStatus]} label={lo.legal.disputeStatus[c.disputeStatus]} />
        ),
      },
      {
        id: 'totalDue',
        header: L.totalDue,
        align: 'end',
        cell: (c) => <Money lak={caseTotalDue(c, 'lak')} usd={caseTotalDue(c, 'usd')} />,
      },
      {
        id: 'recovered',
        header: L.recovered,
        align: 'end',
        className: 'hidden lg:table-cell',
        cell: (c) => <Money lak={c.recoveredLak} usd={c.recoveredUsd} />,
      },
    ];
    if (canDelete || canEdit) {
      cols.push({
        id: 'actions',
        header: lo.table.actions,
        cell: (c) => (
          <span className="inline-flex items-center gap-1">
            {canEdit ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${L.edit} ${c.caseCode}`}
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
                aria-label={`${L.delete} ${c.caseCode}`}
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

  const statusOptions = useMemo(
    () => [
      { value: ALL_FILTER, label: lo.table.all },
      ...DISPUTE_STATUSES.map((s) => ({ value: s, label: lo.legal.disputeStatus[s] })),
    ],
    [],
  );

  const onConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await legalCasesService.remove(toDelete.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e;
    }
    toast.success(L.deleted);
    await useLegalCasesListStore.getState().afterDelete();
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const rows = await legalCasesService.listAll(useLegalCasesListStore.getState().query);
      downloadCsv(`${lo.legal.cases.csv.filePrefix}${csvStamp()}.csv`, buildLegalCasesCsv(rows));
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Boolean(
    query.q || query.caseType || query.disputeStatus || query.departmentId || query.startDate || query.endDate,
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow={MODULES.legal.code}
        title={L.title}
        accent="legal"
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer aria-hidden="true" />
              {L.print}
            </Button>
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

      <div className="flex flex-col gap-3.5 rounded-2xl border border-[var(--border-glass)] bg-[var(--surface-glass)] p-4 sm:p-5 shadow-[var(--shadow-card)] backdrop-blur-md print:hidden">
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
                value={query.caseType ?? ALL_FILTER}
                onValueChange={(v) => setQuery({ caseType: v === ALL_FILTER ? undefined : (v as CaseType) })}
              >
                <SelectTrigger id="case-type-filter" aria-label={L.typeFilter} className="h-10 w-full">
                  <SelectValue placeholder={L.allTypes} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>{L.allTypes}</SelectItem>
                  {CASE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {lo.legal.caseTypes[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-64">
              <Label htmlFor="case-department-filter" className="sr-only">
                {L.departmentFilter}
              </Label>
              <DepartmentFilter
                id="case-department-filter"
                value={query.departmentId}
                onChange={(departmentId) => setQuery({ departmentId })}
                label={L.departmentFilter}
                allLabel={L.allDepartments}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="case-start-date" className="text-xs text-(--text-muted)">
                  {L.startDate}
                </Label>
                <div className="w-40">
                  <DatePicker
                    id="case-start-date"
                    clearable
                    value={query.startDate ?? null}
                    max={query.endDate}
                    onChange={(d) => setQuery({ startDate: d ?? undefined })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="case-end-date" className="text-xs text-(--text-muted)">
                  {L.endDate}
                </Label>
                <div className="w-40">
                  <DatePicker
                    id="case-end-date"
                    clearable
                    value={query.endDate ?? null}
                    min={query.startDate}
                    onChange={(d) => setQuery({ endDate: d ?? undefined })}
                  />
                </div>
              </div>
            </div>
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setQuery({
                    q: undefined,
                    caseType: undefined,
                    disputeStatus: undefined,
                    departmentId: undefined,
                    startDate: undefined,
                    endDate: undefined,
                  })
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
            {F.disputeStatus}:
          </span>
          <FilterChips
            accent="litigation"
            ariaLabel={F.disputeStatus}
            options={statusOptions}
            value={query.disputeStatus ?? ALL_FILTER}
            onChange={(v) => setQuery({ disputeStatus: v === ALL_FILTER ? undefined : (v as DisputeStatus) })}
          />
        </div>
      </div>

      {status === 'error' && error ? (
        <AlertBanner
          tone="rose"
          title={toUserMessage(error)}
          action={
            <Button variant="secondary" onClick={() => void useLegalCasesListStore.getState().fetch()}>
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
          emptyDescription={hasFilters ? L.emptyHint : undefined}
          caption={L.caption}
        />
      )}

      <LegalCaseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        legalCase={editing ?? undefined}
        onSaved={() => void useLegalCasesListStore.getState().fetch()}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        tone="danger"
        title={L.deleteTitle}
        description={toDelete ? L.deleteDesc(toDelete.caseCode) : undefined}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

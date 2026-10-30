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
import { ALL_FILTER, DEFAULT_PAGE_SIZE, LEGAL_PAGE_SIZES } from '../../constants';
import { DepartmentFilter } from '../../lib/department-select';
import { FOCUS_RING } from '../../lib/detail-bits';
import { LegalSearch } from '../../lib/legal-search';
import { legalDocumentsService } from '../api/legal-documents.service';
import { buildLegalDocumentsCsv } from '../lib/legal-documents-csv';
import {
  useLegalDocumentsListStore,
  useLegalDocumentsListUrlSync,
} from '../store/legal-documents-list.store';
import { DOC_STATUS_TONE, DOC_STATUSES, DOC_TYPES, type DocStatus, type DocType, type LegalDocument } from '../types';
import { LegalDocumentFormDialog } from './legal-document-form-dialog';

const L = lo.legal.regulations.list;
const F = lo.legal.fields;

function yearOptions(): number[] {
  const top = new Date().getFullYear() + 1;
  return Array.from({ length: top - 1989 }, (_, i) => top - i);
}

export function LegalDocumentsView() {
  useLegalDocumentsListUrlSync();
  const query = useLegalDocumentsListStore((s) => s.query);
  const items = useLegalDocumentsListStore((s) => s.items);
  const total = useLegalDocumentsListStore((s) => s.total);
  const status = useLegalDocumentsListStore((s) => s.status);
  const error = useLegalDocumentsListStore((s) => s.error);
  const setQuery = useLegalDocumentsListStore((s) => s.setQuery);

  const canDelete = useCan('legal', 'delete');
  const canEdit = useCan('legal', 'edit');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LegalDocument | null>(null);
  const [toDelete, setToDelete] = useState<LegalDocument | null>(null);
  const [exporting, setExporting] = useState(false);

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  // Deep-page clamp: a page beyond the data (e.g. ?page=99) moves to the last real page.
  useEffect(() => {
    if (status !== 'ready' || items.length > 0 || total === 0 || page <= 1) return;
    const last = Math.ceil(total / pageSize);
    if (last < page) useLegalDocumentsListStore.getState().setQuery({ page: last });
  }, [status, items.length, total, page, pageSize]);

  const columns = useMemo<DataTableColumn<LegalDocument>[]>(() => {
    const cols: DataTableColumn<LegalDocument>[] = [
      {
        id: 'docTitle',
        header: F.docTitle,
        className: 'min-w-64 whitespace-normal',
        cell: (d) => (
          <>
            <Link
              href={`/legal/regulations/${encodeURIComponent(d.id)}`}
              className={cn(
                'rounded-sm font-semibold text-(--text-strong) underline underline-offset-4 hover:text-(--legal)',
                FOCUS_RING,
              )}
            >
              {d.docTitle}
            </Link>
            <span className="mt-0.5 block text-xs text-(--text-secondary)">{d.docNumberDate}</span>
          </>
        ),
      },
      {
        id: 'docType',
        header: F.docType,
        className: 'min-w-32 whitespace-normal',
        cell: (d) => <span className="text-xs text-(--text-secondary)">{lo.legal.docTypes[d.docType]}</span>,
      },
      {
        id: 'issueYear',
        header: F.issueYear,
        cell: (d) => <span className="tabular-nums">{d.issueYear ?? '—'}</span>,
      },
      {
        id: 'department',
        header: F.department,
        className: 'min-w-44 whitespace-normal',
        cell: (d) => <span>{d.department?.name ?? '—'}</span>,
      },
      {
        id: 'responsiblePerson',
        header: F.responsiblePerson,
        className: 'hidden xl:table-cell whitespace-normal',
        cell: (d) => <span>{d.responsiblePerson ?? '—'}</span>,
      },
      {
        id: 'status',
        header: F.status,
        cell: (d) => <StatusBadge tone={DOC_STATUS_TONE[d.status]} label={lo.legal.docStatus[d.status]} />,
      },
    ];
    if (canDelete || canEdit) {
      cols.push({
        id: 'actions',
        header: lo.table.actions,
        cell: (d) => (
          <span className="inline-flex items-center gap-1">
            {canEdit ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${L.edit} ${d.docTitle}`}
                onClick={() => {
                  setEditing(d);
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
                aria-label={`${L.delete} ${d.docTitle}`}
                onClick={() => setToDelete(d)}
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
      ...DOC_STATUSES.map((s) => ({ value: s, label: lo.legal.docStatus[s] })),
    ],
    [],
  );

  const onConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await legalDocumentsService.remove(toDelete.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e; // keeps the ConfirmDialog open
    }
    toast.success(L.deleted);
    await useLegalDocumentsListStore.getState().afterDelete();
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const rows = await legalDocumentsService.listAll(useLegalDocumentsListStore.getState().query);
      downloadCsv(`${lo.legal.regulations.csv.filePrefix}${csvStamp()}.csv`, buildLegalDocumentsCsv(rows));
      toast.success(lo.common.exportSuccess);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Boolean(
    query.q || query.docType || query.status || query.issueYear !== undefined || query.departmentId,
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
              <Label htmlFor="doc-type-filter" className="sr-only">
                {L.typeFilter}
              </Label>
              <Select
                value={query.docType ?? ALL_FILTER}
                onValueChange={(v) => setQuery({ docType: v === ALL_FILTER ? undefined : (v as DocType) })}
              >
                <SelectTrigger id="doc-type-filter" aria-label={L.typeFilter} className="h-10 w-full">
                  <SelectValue placeholder={L.allTypes} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>{L.allTypes}</SelectItem>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {lo.legal.docTypes[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Label htmlFor="doc-year-filter" className="sr-only">
                {L.yearFilter}
              </Label>
              <Select
                value={query.issueYear === undefined ? ALL_FILTER : String(query.issueYear)}
                onValueChange={(v) => setQuery({ issueYear: v === ALL_FILTER ? undefined : Number(v) })}
              >
                <SelectTrigger id="doc-year-filter" aria-label={L.yearFilter} className="h-10 w-full">
                  <SelectValue placeholder={L.allYears} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>{L.allYears}</SelectItem>
                  {yearOptions().map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-64">
              <Label htmlFor="doc-department-filter" className="sr-only">
                {L.departmentFilter}
              </Label>
              <DepartmentFilter
                id="doc-department-filter"
                value={query.departmentId}
                onChange={(departmentId) => setQuery({ departmentId })}
                label={L.departmentFilter}
                allLabel={L.allDepartments}
              />
            </div>
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setQuery({
                    q: undefined,
                    docType: undefined,
                    status: undefined,
                    issueYear: undefined,
                    departmentId: undefined,
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
              <Label htmlFor="doc-page-size" className="hidden text-xs text-(--text-muted) sm:inline">
                {L.pageSize}
              </Label>
              <Select value={String(pageSize)} onValueChange={(v) => setQuery({ pageSize: Number(v) })}>
                <SelectTrigger id="doc-page-size" className="h-10 w-20 text-xs">
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
            value={query.status ?? ALL_FILTER}
            onChange={(v) => setQuery({ status: v === ALL_FILTER ? undefined : (v as DocStatus) })}
          />
        </div>
      </div>

      {status === 'error' && error ? (
        <AlertBanner
          tone="rose"
          title={toUserMessage(error)}
          action={
            <Button variant="secondary" onClick={() => void useLegalDocumentsListStore.getState().fetch()}>
              {lo.common.retry}
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          getRowId={(d) => d.id}
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

      <LegalDocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        document={editing ?? undefined}
        onSaved={() => void useLegalDocumentsListStore.getState().fetch()}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        tone="danger"
        title={L.deleteTitle}
        description={toDelete ? L.deleteDesc(toDelete.docTitle) : undefined}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

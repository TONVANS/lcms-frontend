'use client';

import {
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { EmptyState } from './empty-state';
import { FadeIn } from './fade-in';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'start' | 'end';
  className?: string;
}

export interface DataTableSort {
  id: string;
  order: 'asc' | 'desc';
}

export interface DataTableProps<T extends object> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  caption: string; // sr-only <caption>
}

// TanStack v9 core API: features are registered once at module scope. Sorting and
// pagination are manual (server-side), so no row-model factories are registered.
const features = tableFeatures({ rowSortingFeature, rowPaginationFeature });

const STAGGER_ROWS = 10;
const ROW_CLASS = 'border-b border-[var(--border-subtle)] transition-colors hover:bg-(--surface-inset)';
const cellPadding = 'px-4 py-3.5';

export function DataTable<T extends object>({
  columns,
  data,
  getRowId,
  total,
  page,
  pageSize,
  onPageChange,
  sort,
  onSortChange,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  emptyAction,
  caption,
}: DataTableProps<T>) {
  const tableColumns = useMemo<ColumnDef<typeof features, T>[]>(
    () =>
      columns.map((col) => ({
        id: col.id,
        accessorFn: () => null,
        header: col.header,
        cell: ({ row }) => col.cell(row.original),
        enableSorting: Boolean(col.sortable),
      })),
    [columns],
  );

  const table = useTable({
    features,
    columns: tableColumns,
    data,
    getRowId,
    rowCount: total,
    manualPagination: true,
    manualSorting: true,
    state: {
      pagination: { pageIndex: page - 1, pageSize },
      sorting: sort ? [{ id: sort.id, desc: sort.order === 'desc' }] : [],
    },
  });

  // Stagger only the first rows on initial load, not on every page change.
  const [staggered, setStaggered] = useState(true);
  const hasRows = data.length > 0 && !isLoading;
  useEffect(() => {
    if (!hasRows) return;
    const t = setTimeout(() => setStaggered(false), 800);
    return () => clearTimeout(t);
  }, [hasRows]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-[var(--border-glass)] bg-[var(--surface-glass)] backdrop-blur-md">
        <Table className="w-full text-left text-sm">
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader className="bg-[var(--surface-inset)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-[var(--border-subtle)] hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const def = columns.find((c) => c.id === header.column.id);
                  const sorted = header.column.getIsSorted();
                  const title = <table.FlexRender header={header} />;
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        def?.sortable
                          ? sorted === 'asc'
                            ? 'ascending'
                            : sorted === 'desc'
                              ? 'descending'
                              : 'none'
                          : undefined
                      }
                      className={cn(
                        'text-xs font-semibold text-[var(--text-muted)] tracking-wider',
                        cellPadding,
                        def?.align === 'end' && 'text-end',
                        def?.className,
                      )}
                    >
                      {header.isPlaceholder ? null : def?.sortable && onSortChange ? (
                        <button
                          type="button"
                          onClick={() =>
                            onSortChange({ id: header.column.id, order: sorted === 'asc' ? 'desc' : 'asc' })
                          }
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-md outline-none hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-(--focus-ring)"
                        >
                          {title}
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        title
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-b border-[var(--border-subtle)]">
                  {columns.map((col) => (
                    <TableCell key={col.id} className={cellPadding}>
                      <Skeleton className="h-5 w-full max-w-[140px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((row, i) => {
                const cells = row.getAllCells().map((cell) => {
                  const def = columns.find((c) => c.id === cell.column.id);
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'text-[var(--text)]',
                        cellPadding,
                        def?.align === 'end' && 'text-end',
                        def?.className,
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  );
                });
                return staggered && i < STAGGER_ROWS ? (
                  <FadeIn key={row.id} as={TableRow} variant="up-sm" index={i} className={ROW_CLASS}>
                    {cells}
                  </FadeIn>
                ) : (
                  <TableRow key={row.id} className={ROW_CLASS}>
                    {cells}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-1 py-1 text-xs text-[var(--text-muted)]">
          <div>{lo.common.showing(startItem === endItem ? startItem : `${startItem}–${endItem}`, total)}</div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label={lo.table.prev}
                disabled={page <= 1 || isLoading}
                onClick={() => onPageChange(page - 1)}
                className="size-11 text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 font-medium tabular-nums text-[var(--text)]">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={lo.table.next}
                disabled={page >= totalPages || isLoading}
                onClick={() => onPageChange(page + 1)}
                className="size-11 text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  useLegacyTable as useReactTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { EmptyState } from './empty-state';

export type ColumnDef<TData extends object = Record<string, unknown>, TValue = unknown> =
  LegacyColumnDef<TData, TValue>;

export interface DataTableProps<TData extends object> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  density?: 'comfortable' | 'compact';
  className?: string;
}

export function DataTable<TData extends object>({
  columns,
  data,
  total,
  page = 1,
  pageSize = 10,
  onPageChange,
  isLoading = false,
  emptyTitle = lo.table.noData,
  emptyDescription,
  emptyAction,
  density = 'comfortable',
  className,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const totalItems = total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const cellPadding = density === 'compact' ? 'px-3 py-2' : 'px-4 py-3.5';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="overflow-x-auto rounded-xl border border-[var(--border-glass)] bg-[var(--surface-glass)] backdrop-blur-md">
        <Table className="w-full text-left text-sm">
          <TableHeader className="bg-[var(--surface-inset)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-[var(--border-subtle)] hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn('text-xs font-semibold text-[var(--text-muted)] tracking-wider', cellPadding)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-b border-[var(--border-subtle)]">
                  {columns.map((_, colIdx) => (
                    <TableCell key={colIdx} className={cellPadding}>
                      <Skeleton className="h-5 w-full max-w-[140px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-b border-[var(--border-subtle)] transition-colors hover:bg-white/[0.045] dark:hover:bg-white/[0.045]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn('text-[var(--text)]', cellPadding)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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

      {/* Footer: showing X of Y + pagination */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-1 py-1 text-xs text-[var(--text-muted)]">
          <div>
            {lo.table.showing(startItem === endItem ? startItem : `${startItem}-${endItem}`, totalItems)}
          </div>
          {totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label={lo.table.prev}
                disabled={page <= 1 || isLoading}
                onClick={() => onPageChange(page - 1)}
                className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-40"
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
                className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-40"
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

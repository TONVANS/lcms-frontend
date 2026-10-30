'use client';

import { Eye } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { adminService } from '../admin.service';
import { ListSection } from '../shared/admin-list-parts';
import type { AuditLog } from '../types';
import { useRemote } from '../use-remote';

const L = lo.auditLogs;
const ALL = 'all';
const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;
const ACTION_LABELS = lo.history.actions;

const pad = (n: number) => String(n).padStart(2, '0');

/** `dd/mm/yyyy HH:mm` (local time); '—' when unparsable. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '—';
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DetailsDialog({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  const returnFocus = useReturnFocus(log !== null);
  return (
    <Dialog open={log !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        onCloseAutoFocus={returnFocus}
        className="max-w-[calc(100%-2rem)] rounded-[26px] border border-[var(--border-glass)] bg-(image:--surface-modal) p-6 shadow-2xl backdrop-blur-[28px] sm:max-w-[640px]"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[var(--text-strong)]">{L.detailsTitle}</DialogTitle>
          <DialogDescription>
            {log ? `${ACTION_LABELS[log.action] ?? log.action} · ${formatDateTime(log.createdAt)}` : ''}
          </DialogDescription>
        </DialogHeader>
        {log && log.changes.length === 0 ? (
          <p className="text-sm text-(--text-muted)">{L.noChanges}</p>
        ) : null}
        {log && log.changes.length > 0 ? (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-(--text-muted)">
                  <th scope="col" className="py-2 pr-3 font-medium">{L.field}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{L.oldValue}</th>
                  <th scope="col" className="py-2 font-medium">{L.newValue}</th>
                </tr>
              </thead>
              <tbody>
                {log.changes.map((c, i) => (
                  <tr key={`${c.field}-${i}`} className="border-t border-(--border-subtle) align-top">
                    <td className="py-2 pr-3 font-medium break-words">{c.label}</td>
                    <td className="py-2 pr-3 break-words text-(--text-muted)">{c.oldValue ?? lo.history.noValue}</td>
                    <td className="py-2 break-words">{c.newValue ?? lo.history.noValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function AuditLogsView() {
  const userInputId = useId();
  const [action, setAction] = useState(ALL);
  const [userText, setUserText] = useState('');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [details, setDetails] = useState<AuditLog | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setUserId((prev) => {
        const next = userText.trim();
        if (next !== prev) setPage(1);
        return next;
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [userText]);

  const load = useCallback(
    () =>
      adminService.auditLogs.list({
        page,
        pageSize: PAGE_SIZE,
        action: action === ALL ? undefined : action,
        userId: userId || undefined,
      }),
    [page, action, userId],
  );
  const { data, error, isLoading, reload } = useRemote(load);

  const columns: DataTableColumn<AuditLog>[] = [
    { id: 'time', header: L.columns.time, cell: (r) => <span className="tabular-nums">{formatDateTime(r.createdAt)}</span> },
    { id: 'user', header: L.columns.user, cell: (r) => r.userName ?? r.userId ?? '—' },
    { id: 'action', header: L.columns.action, cell: (r) => ACTION_LABELS[r.action] ?? r.action },
    {
      id: 'target',
      header: L.columns.target,
      cell: (r) => [r.targetType, r.targetLabel ?? r.targetId].filter(Boolean).join(' · ') || '—',
    },
    { id: 'ip', header: L.columns.ip, cell: (r) => r.ipAddress ?? '—' },
    {
      id: 'details',
      header: L.columns.details,
      align: 'end',
      cell: (r) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${L.viewDetails}: ${ACTION_LABELS[r.action] ?? r.action} (${L.changesCount(r.changes.length)})`}
          onClick={() => setDetails(r)}
        >
          <Eye aria-hidden="true" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={lo.admin.auditLogs} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${userInputId}-action`}>{L.filterAction}</Label>
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v);
              setPage(1);
            }}
          >
            <SelectTrigger id={`${userInputId}-action`} aria-label={L.filterAction} className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{L.allActions}</SelectItem>
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={userInputId}>{L.filterUser}</Label>
          <Input
            id={userInputId}
            type="text"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder={L.userPlaceholder}
            className="w-64"
          />
        </div>
      </div>
      <ListSection isLoading={isLoading} error={error} errorTitle={L.loadError} onRetry={reload}>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          getRowId={(r) => r.id}
          total={data?.total ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={isLoading}
          emptyTitle={L.emptyTitle}
          emptyDescription={L.emptyDesc}
          caption={L.caption}
        />
      </ListSection>
      <DetailsDialog log={details} onClose={() => setDetails(null)} />
    </div>
  );
}

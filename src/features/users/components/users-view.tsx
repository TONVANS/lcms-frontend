'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { FilterChips } from '@/components/shared/filter-chips';
import { SearchInput } from '@/components/shared/search-input';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/features/auth';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { USERS_PAGE_SIZE, usersService } from '../api/users.service';
import { permissionSummary } from '../lib/user-mapper';
import { USERS_PAGE_SIZES, useUsersListStore, useUsersListUrlSync } from '../store/users-list.store';
import { USER_ROLES, type AdminUser } from '../types';
import { UserFormDialog } from './user-form-dialog';

const L = lo.users;
const ALL = 'all';
const SEARCH_DEBOUNCE_MS = 300;

function statusOf(query: { isActive?: boolean }): string {
  return query.isActive === undefined ? ALL : query.isActive ? 'active' : 'inactive';
}

function DebouncedSearch({
  value,
  onCommit,
}: {
  value?: string;
  onCommit: (q: string | undefined) => void;
}) {
  const [text, setText] = useState(value ?? '');
  const [prevValue, setPrevValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setText(value ?? '');
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <SearchInput
      className="w-full sm:w-72"
      value={text}
      placeholder={L.searchPlaceholder}
      aria-label={L.searchLabel}
      onChange={(v) => {
        setText(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onCommit(v.trim() || undefined), SEARCH_DEBOUNCE_MS);
      }}
    />
  );
}

export function UsersView() {
  useUsersListUrlSync();

  const me = useAuthStore((s) => s.user);
  const query = useUsersListStore((s) => s.query);
  const items = useUsersListStore((s) => s.items);
  const total = useUsersListStore((s) => s.total);
  const status = useUsersListStore((s) => s.status);
  const error = useUsersListStore((s) => s.error);
  const setQuery = useUsersListStore((s) => s.setQuery);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);

  const refresh = () => void useUsersListStore.getState().fetch();

  const columns = useMemo<DataTableColumn<AdminUser>[]>(
    () => [
      {
        id: 'user',
        header: L.columns.user,
        className: 'min-w-52 whitespace-normal',
        cell: (u) => (
          <>
            <span className="font-medium text-(--text-strong) tabular-nums">{u.employeeCode ?? '—'}</span>
            <span className="mt-0.5 block text-xs text-(--text-secondary)">{u.fullName}</span>
          </>
        ),
      },
      {
        id: 'division',
        header: L.columns.division,
        className: 'hidden min-w-40 whitespace-normal lg:table-cell',
        cell: (u) => <span className="text-xs text-(--text-secondary)">{u.division ?? '—'}</span>,
      },
      {
        id: 'role',
        header: L.columns.role,
        cell: (u) => <span className="text-xs text-(--text-secondary)">{lo.roles[u.role]}</span>,
      },
      {
        id: 'permissions',
        header: L.columns.permissions,
        className: 'hidden min-w-44 whitespace-normal md:table-cell',
        cell: (u) => <span className="text-xs text-(--text-secondary)">{permissionSummary(u)}</span>,
      },
      {
        id: 'status',
        header: L.columns.status,
        cell: (u) => <StatusBadge tone={u.isActive ? 'emerald' : 'slate'} label={u.isActive ? L.active : L.inactive} />,
      },
      {
        id: 'actions',
        header: lo.table.actions,
        cell: (u) => (
          <span className="inline-flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${L.edit} ${u.fullName}`}
              onClick={() => {
                setEditing(u);
                setFormOpen(true);
              }}
            >
              <Pencil aria-hidden="true" />
            </Button>
            {me && u.id === me.id ? null : (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${L.delete} ${u.fullName}`}
                onClick={() => setToDelete(u)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            )}
          </span>
        ),
      },
    ],
    [me],
  );

  const onConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await usersService.remove(toDelete.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e;
    }
    toast.success(L.deleted);
    await useUsersListStore.getState().afterDelete();
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={L.title}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            {L.add}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-(--border-glass) bg-(--surface-glass) p-4 shadow-(--shadow-card) backdrop-blur-md sm:p-5">
        <DebouncedSearch value={query.q} onCommit={(q) => setQuery({ q })} />
        <div className="w-full sm:w-52">
          <Label htmlFor="user-role-filter" className="sr-only">
            {L.roleFilter}
          </Label>
          <Select
            value={query.role ?? ALL}
            onValueChange={(v) => setQuery({ role: v === ALL ? undefined : (v as AdminUser['role']) })}
          >
            <SelectTrigger id="user-role-filter" aria-label={L.roleFilter} className="h-10 w-full">
              <SelectValue placeholder={L.allRoles} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{L.allRoles}</SelectItem>
              {USER_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {lo.roles[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FilterChips
          ariaLabel={L.statusFilter}
          value={statusOf(query)}
          onChange={(v) => setQuery({ isActive: v === ALL ? undefined : v === 'active' })}
          options={[
            { value: ALL, label: L.statusAll },
            { value: 'active', label: L.active },
            { value: 'inactive', label: L.inactive },
          ]}
        />
      </div>

      {status === 'error' ? (
        <AlertBanner
          tone="rose"
          title={L.loadError}
          description={error ? toUserMessage(error) : undefined}
          action={
            <Button variant="secondary" size="sm" onClick={refresh}>
              {lo.common.retry}
            </Button>
          }
        />
      ) : null}

      <DataTable
        caption={L.caption}
        columns={columns}
        data={items}
        getRowId={(u) => u.id}
        total={total}
        page={query.page ?? 1}
        pageSize={query.pageSize ?? USERS_PAGE_SIZE}
        onPageChange={(page) => setQuery({ page })}
        pageSizeOptions={USERS_PAGE_SIZES}
        onPageSizeChange={(pageSize) => setQuery({ pageSize })}
        isLoading={status === 'idle' || status === 'loading'}
        emptyTitle={L.emptyTitle}
        emptyDescription={L.emptyDescription}
      />

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing ?? undefined}
        onSaved={() => refresh()}
      />
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => {
          if (!o) setToDelete(null);
        }}
        title={L.deleteTitle}
        description={toDelete ? L.deleteDescription(toDelete.fullName) : undefined}
        confirmLabel={L.delete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

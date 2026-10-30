'use client';

import { Eye, Mail, Pencil, Phone, Plus, Trash2, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { FilterChips } from '@/components/shared/filter-chips';
import { GlassCard } from '@/components/shared/glass-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supportMailHref, supportTelHref } from '@/config/support';
import { useAuthStore } from '@/features/auth';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { isAdmin } from '@/lib/auth/permissions';
import type { StatusTone } from '@/lib/constants/status';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { supportService } from '../api/support.service';
import { useSupportContacts } from '../hooks/use-support-contacts';
import { contactKind } from '../lib/support-mapper';
import {
  SUPPORT_PAGE_SIZES,
  useSupportTicketsListStore,
  useSupportTicketsListUrlSync,
} from '../store/support-tickets-list.store';
import {
  TICKET_STATUSES,
  type ContactChannel,
  type SupportTicket,
  type TicketPriority,
  type TicketStatus,
} from '../types';
import { AttachmentDialog } from './attachment-dialog';
import { ContactFormDialog } from './contact-form-dialog';
import { TicketFormDialog } from './ticket-form-dialog';
import { TicketUpdateDialog } from './ticket-update-dialog';

const LINK =
  'break-all rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

const PRIORITY_TONE: Record<TicketPriority, StatusTone> = {
  LOW: 'slate',
  MEDIUM: 'blue',
  HIGH: 'amber',
  URGENT: 'rose',
};
const STATUS_TONE: Record<TicketStatus, StatusTone> = {
  OPEN: 'blue',
  IN_PROGRESS: 'amber',
  RESOLVED: 'emerald',
  CLOSED: 'slate',
};

function ContactValue({ info }: { info: string }) {
  const kind = contactKind(info);
  if (kind === 'email') {
    return (
      <a href={supportMailHref(info)} className={LINK}>
        {info}
      </a>
    );
  }
  if (kind === 'phone') {
    return (
      <a href={supportTelHref(info)} className={LINK}>
        {info}
      </a>
    );
  }
  return <span className="break-all font-semibold">{info}</span>;
}

function ContactsSection({ admin }: { admin: boolean }) {
  const { contacts, status, error, reload } = useSupportContacts();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ContactChannel | null>(null);

  return (
    <section aria-labelledby="support-contacts-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="support-contacts-heading" className="font-serif text-lg font-semibold text-(--text-strong)">
          {lo.support.contactsHeading}
        </h2>
        {admin ? (
          <Button variant="secondary" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden="true" />
            {lo.support.addContact}
          </Button>
        ) : null}
      </div>
      {status === 'error' ? (
        <AlertBanner
          tone="rose"
          title={error ?? lo.support.contactsLoadError}
          action={
            <Button variant="secondary" onClick={() => void reload()}>
              {lo.common.retry}
            </Button>
          }
        />
      ) : status === 'loading' && contacts.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <GlassCard>
          <EmptyState title={lo.support.contactsEmpty} />
        </GlassCard>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => {
            const kind = contactKind(c.contactInfo);
            const Icon = kind === 'email' ? Mail : kind === 'phone' ? Phone : MessageSquare;
            return (
              <li key={c.id}>
                <GlassCard className="flex h-full items-start justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-(--text-muted)" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-(--text-strong)">{c.channelName}</p>
                      <p className="mt-1 text-sm text-(--text-default)">
                        <ContactValue info={c.contactInfo} />
                      </p>
                      {c.description ? (
                        <p className="mt-1 text-xs text-(--text-muted)">{c.description}</p>
                      ) : null}
                    </div>
                  </div>
                  {admin ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={lo.support.deleteContactFor(c.channelName)}
                      onClick={() => setDeleting(c)}
                      className="min-h-11 min-w-11 shrink-0"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}
      {admin ? (
        <>
          <ContactFormDialog open={adding} onOpenChange={setAdding} onCreated={() => void reload()} />
          <ConfirmDialog
            open={deleting !== null}
            onOpenChange={(o) => {
              if (!o) setDeleting(null);
            }}
            title={lo.support.deleteContactTitle}
            description={deleting ? lo.support.deleteContactConfirm(deleting.channelName) : undefined}
            confirmLabel={lo.confirm.confirm}
            onConfirm={async () => {
              if (!deleting) return;
              try {
                await supportService.deleteContact(deleting.id);
              } catch (e) {
                toast.error(toUserMessage(normalizeError(e)) || lo.errors.unknown);
                throw e;
              }
              toast.success(lo.support.contactDeleted);
              void reload();
            }}
          />
        </>
      ) : null}
    </section>
  );
}

export function SupportView() {
  useSupportTicketsListUrlSync();

  const user = useAuthStore((s) => s.user);
  const admin = user ? isAdmin(user) : false;

  const query = useSupportTicketsListStore((s) => s.query);
  const items = useSupportTicketsListStore((s) => s.items);
  const total = useSupportTicketsListStore((s) => s.total);
  const status = useSupportTicketsListStore((s) => s.status);
  const error = useSupportTicketsListStore((s) => s.error);
  const setQuery = useSupportTicketsListStore((s) => s.setQuery);

  const [reportOpen, setReportOpen] = useState(false);
  const [editing, setEditing] = useState<SupportTicket | null>(null);
  const [viewing, setViewing] = useState<SupportTicket | null>(null);

  const reloadTickets = () => void useSupportTicketsListStore.getState().fetch();

  const columns: DataTableColumn<SupportTicket>[] = [
    {
      id: 'subject',
      header: lo.support.colSubject,
      cell: (t) => (
        <div className="min-w-0 max-w-[28rem]">
          <p className="font-medium text-(--text-strong)">{t.subject}</p>
          {admin && t.createdBy ? <p className="text-xs text-(--text-muted)">{t.createdBy}</p> : null}
          {t.adminNote ? (
            <p className="mt-1 text-xs text-(--text-muted)">
              {lo.support.adminNote}: {t.adminNote}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'priority',
      header: lo.support.colPriority,
      cell: (t) => <StatusBadge tone={PRIORITY_TONE[t.priority]} label={lo.support.priorities[t.priority]} />,
    },
    {
      id: 'status',
      header: lo.support.colStatus,
      cell: (t) => <StatusBadge tone={STATUS_TONE[t.status]} label={lo.support.statuses[t.status]} />,
    },
    {
      id: 'createdAt',
      header: lo.support.colCreated,
      cell: (t) => <span className="tabular-nums">{t.createdAt ? formatDate(t.createdAt) : '—'}</span>,
    },
    {
      id: 'attachment',
      header: lo.support.colAttachment,
      cell: (t) =>
        t.hasAttachment ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={lo.support.viewAttachmentFor(t.subject)}
            onClick={() => setViewing(t)}
            className="min-h-11 min-w-11"
          >
            <Eye className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <span aria-label={lo.support.noAttachment}>{lo.support.noAttachment}</span>
        ),
    },
  ];
  if (admin) {
    columns.push({
      id: 'actions',
      header: lo.support.colActions,
      cell: (t) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={lo.support.updateTicketFor(t.subject)}
          onClick={() => setEditing(t)}
          className="min-h-11 min-w-11"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
      ),
    });
  }

  const chipOptions = [
    { value: 'ALL', label: lo.support.all },
    ...TICKET_STATUSES.map((s) => ({ value: s, label: lo.support.statuses[s] })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={lo.support.title}
        actions={
          <Button onClick={() => setReportOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            {lo.support.report}
          </Button>
        }
      />

      <ContactsSection admin={admin} />

      <section aria-labelledby="support-tickets-heading" className="flex flex-col gap-3">
        <h2 id="support-tickets-heading" className="font-serif text-lg font-semibold text-(--text-strong)">
          {lo.support.ticketsHeading}
        </h2>
        <FilterChips
          ariaLabel={lo.support.statusFilter}
          options={chipOptions}
          value={query.status ?? 'ALL'}
          onChange={(v) => {
            setQuery({ status: v === 'ALL' ? undefined : (v as TicketStatus), page: 1 });
          }}
        />
        {error ? (
          <AlertBanner
            tone="rose"
            title={toUserMessage(error) || lo.support.ticketsLoadError}
            action={
              <Button variant="secondary" onClick={reloadTickets}>
                {lo.common.retry}
              </Button>
            }
          />
        ) : null}
        <DataTable
          columns={columns}
          data={items}
          getRowId={(t) => t.id}
          total={total}
          page={query.page ?? 1}
          pageSize={query.pageSize ?? 10}
          onPageChange={(page) => setQuery({ page })}
          pageSizeOptions={SUPPORT_PAGE_SIZES}
          onPageSizeChange={(pageSize) => setQuery({ pageSize })}
          isLoading={status === 'idle' || status === 'loading'}
          emptyTitle={lo.support.ticketsEmpty}
          caption={lo.support.ticketsCaption}
        />
      </section>

      <TicketFormDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        onCreated={() => {
          setQuery({ page: 1 });
          reloadTickets();
        }}
      />
      {admin ? (
        <TicketUpdateDialog
          ticket={editing}
          onOpenChange={(o) => {
            if (!o) setEditing(null);
          }}
          onUpdated={reloadTickets}
        />
      ) : null}
      <AttachmentDialog
        ticket={viewing}
        onOpenChange={(o) => {
          if (!o) setViewing(null);
        }}
      />
    </div>
  );
}

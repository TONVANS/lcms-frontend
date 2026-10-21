'use client';

import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useCan } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { GlassCard } from '@/components/shared/glass-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Timeline } from '@/components/shared/timeline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentManager } from '@/features/documents';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { daysLeft, formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/money';
import type { ApiError } from '@/types/api';
import { gcService } from '../api/gc.service';
import { deriveGcStatus, GC_STATUS_TONE } from '../lib/derive-status';
import { EMPTY, formatEquity } from '../lib/format';
import { buildGcKeyDates } from '../lib/key-dates';
import type { GeneralContract } from '../types';
import { GcContractFormDialog } from './gc-contract-form-dialog';

const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; contract: GeneralContract }
  | { kind: 'notFound' }
  | { kind: 'error'; error: ApiError };

function BackLink() {
  return (
    <Link
      href="/contracts/list"
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-(--text-secondary) hover:text-(--text)',
        FOCUS_RING,
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {lo.gc.detail.backToList}
    </Link>
  );
}

function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-(--text-muted)">{label}</dt>
      <dd className="mt-1 text-sm wrap-break-word text-(--text-strong)">{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div data-testid="gc-detail-skeleton" className="flex flex-col gap-6">
      <h1 className="sr-only">{lo.gc.list.title}</h1>
      <Skeleton className="h-14 w-2/3 rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

function LoadedDetail({
  contract,
  onChange,
}: {
  contract: GeneralContract;
  onChange: (c: GeneralContract) => void;
}) {
  const router = useRouter();
  const canEdit = useCan('gc', 'edit');
  const canDelete = useCan('gc', 'delete');
  const canCreate = useCan('gc', 'create');
  const canDownload = useCan('gc', 'download');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const today = new Date();
  const status = deriveGcStatus(contract, today);
  const keyDates = buildGcKeyDates(contract, today);

  const onConfirmDelete = async () => {
    try {
      await gcService.remove(contract.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e; // keeps the ConfirmDialog open
    }
    toast.success(lo.gc.list.deleted);
    router.replace('/contracts/list');
  };

  const info: { label: string; value: ReactNode }[] = [
    { label: lo.gc.fields.title, value: contract.title },
    { label: lo.gc.fields.type, value: lo.gc.types[contract.type] },
    { label: lo.gc.fields.contractNo, value: <span className="tabular-nums">{contract.contractNo}</span> },
    { label: lo.gc.fields.counterparty, value: contract.counterparty ?? EMPTY },
    { label: lo.gc.fields.termText, value: contract.termText ?? EMPTY },
    { label: lo.gc.fields.signedDate, value: <span className="tabular-nums">{formatDate(contract.signedDate)}</span> },
    {
      label: lo.gc.fields.effectiveDate,
      value: <span className="tabular-nums">{formatDate(contract.effectiveDate)}</span>,
    },
    {
      label: lo.gc.fields.endDate,
      value: contract.endDate ? (
        <span className="tabular-nums">{formatDate(contract.endDate)}</span>
      ) : (
        lo.gc.openEnded
      ),
    },
    {
      label: lo.gc.fields.value,
      value: contract.value ? <span className="tabular-nums">{formatMoney(contract.value)}</span> : EMPTY,
    },
    { label: lo.gc.fields.equity, value: <span className="tabular-nums">{formatEquity(contract.equity)}</span> },
    { label: lo.gc.fields.implementer, value: contract.implementer ?? EMPTY },
    { label: lo.gc.fields.notes, value: contract.notes ?? EMPTY },
    { label: lo.gc.fields.createdAt, value: <span className="tabular-nums">{formatDate(contract.createdAt)}</span> },
    { label: lo.gc.fields.updatedAt, value: <span className="tabular-nums">{formatDate(contract.updatedAt)}</span> },
    { label: lo.gc.fields.createdBy, value: contract.createdBy },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackLink />
      <PageHeader
        eyebrow={`${MODULES.gc.code} · ${contract.contractNo}`}
        title={contract.title}
        accent="gc"
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={GC_STATUS_TONE[status]} label={lo.gc.status[status]} />
            {contract.endDate ? <CountdownBadge days={daysLeft(contract.endDate, today)} /> : null}
          </span>
        }
        actions={
          canEdit || canDelete ? (
            <>
              {canEdit ? (
                <Button variant="secondary" onClick={() => setEditOpen(true)}>
                  <Pencil aria-hidden="true" />
                  {lo.gc.list.edit}
                </Button>
              ) : null}
              {canDelete ? (
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 aria-hidden="true" />
                  {lo.gc.list.delete}
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard
          as="section"
          accent="gc"
          aria-labelledby="gc-info-heading"
          className="min-w-0 lg:col-span-2"
        >
          <h2 id="gc-info-heading" className="mb-4 font-serif text-lg font-semibold text-(--text-strong)">
            {lo.gc.detail.info}
          </h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {info.map((i) => (
              <InfoItem key={i.label} label={i.label}>
                {i.value}
              </InfoItem>
            ))}
          </dl>
        </GlassCard>

        <GlassCard as="section" aria-labelledby="gc-dates-heading" className="min-w-0">
          <h2 id="gc-dates-heading" className="mb-4 font-serif text-lg font-semibold text-(--text-strong)">
            {lo.gc.detail.keyDates}
          </h2>
          <Timeline
            items={keyDates.map((k) => ({
              id: k.key,
              date: k.date,
              title: k.label,
              status: k.status,
            }))}
          />
        </GlassCard>
      </div>

      <GlassCard as="section" aria-labelledby="gc-docs-heading" className="min-w-0">
        <h2 id="gc-docs-heading" className="mb-4 font-serif text-lg font-semibold text-(--text-strong)">
          {lo.gc.fields.documents}
        </h2>
        <DocumentManager
          entityType="gc"
          entityId={contract.id}
          canUpload={canCreate}
          canDownload={canDownload}
          canDelete={canDelete}
        />
      </GlassCard>

      <GcContractFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contract={contract}
        onSaved={onChange}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="danger"
        title={lo.gc.list.deleteTitle}
        description={lo.gc.list.deleteDesc(contract.contractNo)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

function GcContractDetail({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    gcService
      .get(id)
      .then((contract) => {
        if (active) setState({ kind: 'ready', contract });
      })
      .catch((e: unknown) => {
        if (!active) return;
        const error = normalizeError(e);
        setState(error.status === 404 ? { kind: 'notFound' } : { kind: 'error', error });
      });
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  const retry = useCallback(() => {
    setState({ kind: 'loading' });
    setReloadKey((k) => k + 1);
  }, []);

  if (state.kind === 'loading') return <DetailSkeleton />;

  if (state.kind === 'notFound') {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow={MODULES.gc.code} title={lo.gc.list.title} accent="gc" />
        <EmptyState
          title={lo.gc.detail.notFound}
          action={
            <Link
              href="/contracts/list"
              className={cn('rounded-sm text-sm text-(--text-strong) underline underline-offset-4', FOCUS_RING)}
            >
              {lo.gc.detail.backToList}
            </Link>
          }
        />
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <PageHeader eyebrow={MODULES.gc.code} title={lo.gc.list.title} accent="gc" />
        <AlertBanner
          tone="rose"
          title={toUserMessage(state.error)}
          action={
            <Button variant="secondary" onClick={retry}>
              {lo.common.retry}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <LoadedDetail
      contract={state.contract}
      onChange={(contract) => setState({ kind: 'ready', contract })}
    />
  );
}

export function GcContractDetailView({ id }: { id: string }) {
  // Keyed by id so navigating between contracts resets state without an effect.
  return <GcContractDetail key={id} id={id} />;
}

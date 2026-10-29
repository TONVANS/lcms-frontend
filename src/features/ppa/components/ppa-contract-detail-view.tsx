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
import { ContractStatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentManager } from '@/features/documents';
import { HistoryTimeline } from '@/features/history';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { daysLeft, formatDate } from '@/lib/utils/date';
import type { ApiError } from '@/types/api';
import { ppaService } from '../api/ppa.service';
import { EMPTY, displayText, formatCapacity, formatTariff } from '../lib/format';
import type { PowerContract } from '../types';
import { PpaContractFormDialog } from './ppa-contract-form-dialog';

const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; contract: PowerContract }
  | { kind: 'notFound' }
  | { kind: 'error'; error: ApiError };

function BackLink() {
  return (
    <Link
      href="/ppa/contracts"
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-(--text-secondary) hover:text-(--text)',
        FOCUS_RING,
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {lo.ppa.detail.backToList}
    </Link>
  );
}

function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-(--text-muted)">{label}</dt>
      <dd className="mt-1 text-sm wrap-break-word whitespace-pre-wrap text-(--text-strong)">{children}</dd>
    </div>
  );
}

function LoadedDetail({ contract, onChange }: { contract: PowerContract; onChange: (c: PowerContract) => void }) {
  const router = useRouter();
  const canEdit = useCan('ppa', 'edit');
  const canDelete = useCan('ppa', 'delete');
  const canUpload = useCan('ppa', 'create');
  const canDownload = useCan('ppa', 'download');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const f = lo.ppa.fields;
  const date = (d: string | null) => <span className="tabular-nums">{formatDate(d)}</span>;
  const left = contract.status === 'EXPIRED' || contract.status === 'TERMINATED' ? null : daysLeft(contract.expirationDate);

  const onConfirmDelete = async () => {
    try {
      await ppaService.remove(contract.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e; // keeps the ConfirmDialog open
    }
    toast.success(lo.ppa.list.deleted);
    router.replace('/ppa/contracts');
  };

  const info: { label: string; value: ReactNode }[] = [
    { label: f.contractType, value: lo.ppa.types[contract.contractType] },
    { label: f.contractNumber, value: <span className="tabular-nums">{displayText(contract.contractNumber)}</span> },
    { label: f.projectName, value: contract.projectName },
    {
      label: contract.contractType === 'SALE' ? f.customer : f.projectType,
      value: displayText(contract.projectTypeOrCustomer),
    },
    { label: f.projectLocation, value: displayText(contract.projectLocation) },
    { label: f.durationText, value: displayText(contract.durationText) },
    { label: f.durationMonths, value: contract.durationMonths ?? EMPTY },
    { label: f.signedDate, value: date(contract.signedDate) },
    { label: f.effectiveDate, value: date(contract.effectiveDate) },
    { label: f.expirationDate, value: date(contract.expirationDate) },
    {
      label: f.installedCapacity,
      value: (
        <span className="tabular-nums">
          {contract.capacityValue !== null
            ? formatCapacity(contract.capacityValue, contract.capacityUnit)
            : displayText(contract.installedCapacity)}
        </span>
      ),
    },
    {
      label: f.tariff,
      value: (
        <span className="tabular-nums">
          {contract.tariffValue !== null
            ? formatTariff(contract.tariffValue, contract.tariffCurrency)
            : displayText(contract.tariff)}
        </span>
      ),
    },
    { label: f.notifyDaysBefore, value: contract.notifyDaysBefore ?? EMPTY },
    { label: f.additionalDetails, value: displayText(contract.additionalDetails) },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackLink />
      <PageHeader
        eyebrow={MODULES.ppa.code}
        title={contract.projectName}
        meta={contract.contractNumber}
        accent="ppa"
        actions={
          <>
            <ContractStatusBadge status={contract.status} />
            <CountdownBadge days={left} />
            {canEdit ? (
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil aria-hidden="true" />
                {lo.ppa.list.edit}
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="ghost" className="text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 aria-hidden="true" />
                {lo.ppa.list.delete}
              </Button>
            ) : null}
          </>
        }
      />

      <GlassCard accent="ppa" className="flex flex-col gap-4">
        <h2 className="font-serif text-lg font-semibold text-(--text-strong)">{lo.ppa.detail.info}</h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {info.map((i) => (
            <InfoItem key={i.label} label={i.label}>
              {i.value}
            </InfoItem>
          ))}
          <InfoItem label={f.status}>
            <ContractStatusBadge status={contract.status} />
          </InfoItem>
        </dl>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard accent="ppa" className="flex min-w-0 flex-col gap-4">
          <h2 className="font-serif text-lg font-semibold text-(--text-strong)">{lo.ppa.detail.documents}</h2>
          <DocumentManager
            module="power-contracts"
            entityId={contract.id}
            canUpload={canUpload}
            canDownload={canDownload}
            canDelete={canDelete}
          />
        </GlassCard>
        <GlassCard accent="ppa" className="flex min-w-0 flex-col gap-4">
          <h2 className="font-serif text-lg font-semibold text-(--text-strong)">{lo.history.title}</h2>
          <HistoryTimeline key={contract.updatedAt ?? contract.id} kind="power-contracts" id={contract.id} />
        </GlassCard>
      </div>

      <PpaContractFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contract={contract}
        onSaved={onChange}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="danger"
        title={lo.ppa.list.deleteTitle}
        description={lo.ppa.list.deleteDesc(contract.contractNumber || contract.projectName)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

export function PpaContractDetailView({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    ppaService
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
  }, [id, attempt]);

  const retry = useCallback(() => {
    setState({ kind: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  if (state.kind === 'loading') {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <h1 className="sr-only">{lo.ppa.title}</h1>
        <Skeleton className="h-14 w-2/3 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }
  if (state.kind === 'notFound') {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <GlassCard accent="ppa">
          <EmptyState title={lo.ppa.detail.notFound} />
        </GlassCard>
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <AlertBanner
          tone="rose"
          title={toUserMessage(state.error) || lo.ppa.detail.loadError}
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

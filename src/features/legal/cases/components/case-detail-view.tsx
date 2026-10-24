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
import { EmptyState } from '@/components/shared/empty-state';
import { GlassCard } from '@/components/shared/glass-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Stepper, type StepItem } from '@/components/shared/stepper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/money';
import type { ApiError } from '@/types/api';
import { casesService } from '../api/cases.service';
import { caseTotal, CASE_STAGE_TONE } from '../lib/case-money';
import type { CaseStage, DualAmount, LegalCase } from '../types';
import { CaseFormDialog } from './case-form-dialog';

const EMPTY = '—';
const F = lo.legal.fields;
const D = lo.legal.cases.detail;
const L = lo.legal.cases.list;
const LIST_HREF = '/legal/cases';
const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; legalCase: LegalCase }
  | { kind: 'notFound' }
  | { kind: 'error'; error: ApiError };

function getCaseStepNumber(stage: CaseStage): number {
  switch (stage) {
    case 'first_instance':
      return 1;
    case 'appeal':
      return 2;
    case 'cassation':
      return 3;
    case 'completed':
    case 'closed':
      return 4;
  }
}

function getLastStepLabel(stage: CaseStage): string {
  if (stage === 'completed') return lo.legal.caseStages.completed;
  if (stage === 'closed') return lo.legal.caseStages.closed;
  return lo.legal.progress.finished;
}

function BackLink() {
  return (
    <Link
      href={LIST_HREF}
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-(--text-secondary) hover:text-(--text)',
        FOCUS_RING,
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {D.backToList}
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

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-4 font-serif text-lg font-semibold text-(--text-strong)">
      {children}
    </h2>
  );
}

function DetailSkeleton() {
  return (
    <div data-testid="case-detail-skeleton" className="flex flex-col gap-6">
      <h1 className="sr-only">{lo.legal.cases.list.title}</h1>
      <Skeleton className="h-14 w-2/3 rounded-xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

function LoadedDetail({
  legalCase,
  onChange,
}: {
  legalCase: LegalCase;
  onChange: (c: LegalCase) => void;
}) {
  const router = useRouter();
  const canEdit = useCan('legal', 'edit');
  const canDelete = useCan('legal', 'delete');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onConfirmDelete = async () => {
    try {
      await casesService.remove(legalCase.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e;
    }
    toast.success(L.deleted);
    router.push(LIST_HREF);
  };

  const totals = caseTotal(legalCase);

  const steps: StepItem[] = [
    { id: 1, label: lo.legal.caseStages.first_instance },
    { id: 2, label: lo.legal.caseStages.appeal },
    { id: 3, label: lo.legal.caseStages.cassation },
    { id: 4, label: getLastStepLabel(legalCase.stage) },
  ];

  const info: { label: string; value: ReactNode }[] = [
    { label: F.caseNo, value: <span className="tabular-nums">{legalCase.caseNo}</span> },
    { label: F.defendant, value: legalCase.defendant },
    {
      label: F.allegation,
      value: legalCase.allegation ? (
        <span className="whitespace-pre-wrap">{legalCase.allegation}</span>
      ) : (
        EMPTY
      ),
    },
    { label: F.handlingUnit, value: legalCase.handlingUnit },
    { label: F.caseType, value: lo.legal.caseTypes[legalCase.caseType] },
    {
      label: F.stage,
      value: (
        <StatusBadge
          tone={CASE_STAGE_TONE[legalCase.stage]}
          label={lo.legal.caseStages[legalCase.stage]}
        />
      ),
    },
    {
      label: F.disputeDate,
      value: (
        <span className="tabular-nums">
          {legalCase.disputeDate ? formatDate(legalCase.disputeDate) : EMPTY}
        </span>
      ),
    },
    {
      label: F.createdAt,
      value: <span className="tabular-nums">{formatDate(legalCase.createdAt)}</span>,
    },
    {
      label: F.updatedAt,
      value: <span className="tabular-nums">{formatDate(legalCase.updatedAt)}</span>,
    },
    { label: F.createdBy, value: legalCase.createdBy },
  ];

  const moneyRows: { label: string; amounts: DualAmount; isBold?: boolean }[] = [
    { label: F.damage, amounts: legalCase.damage },
    { label: F.fine, amounts: legalCase.fine },
    { label: F.total, amounts: totals, isBold: true },
    { label: F.recovered, amounts: legalCase.recovered },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackLink />
      <PageHeader
        eyebrow={`${MODULES.legal.code} · ${legalCase.caseNo}`}
        title={legalCase.defendant}
        accent="legal"
        meta={
          <StatusBadge
            tone={CASE_STAGE_TONE[legalCase.stage]}
            label={lo.legal.caseStages[legalCase.stage]}
          />
        }
        actions={
          canEdit || canDelete ? (
            <>
              {canEdit ? (
                <Button variant="secondary" onClick={() => setEditOpen(true)}>
                  <Pencil aria-hidden="true" />
                  {L.edit}
                </Button>
              ) : null}
              {canDelete ? (
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 aria-hidden="true" />
                  {L.delete}
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle id="stage-stepper-title">{D.stageStepper}</SectionTitle>
        <div className="py-2">
          <Stepper steps={steps} currentStep={getCaseStepNumber(legalCase.stage)} />
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle id="case-info-title">{D.info}</SectionTitle>
        <dl
          aria-labelledby="case-info-title"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {info.map((item) => (
            <InfoItem key={item.label} label={item.label}>
              {item.value}
            </InfoItem>
          ))}
        </dl>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle id="case-amounts-title">{D.amounts}</SectionTitle>
        <div className="rounded-xl border border-[var(--border-subtle)]">
          <Table
            containerProps={{ tabIndex: 0, role: 'region', 'aria-label': D.amounts }}
            className="w-full text-left text-sm"
          >
            <TableHeader className="bg-[var(--surface-inset)]">
              <TableRow className="border-b border-[var(--border-subtle)]">
                <TableHead className="font-semibold text-[var(--text-muted)]">
                  {D.category}
                </TableHead>
                <TableHead className="text-right font-semibold text-[var(--text-muted)]">
                  {F.lak}
                </TableHead>
                <TableHead className="text-right font-semibold text-[var(--text-muted)]">
                  {F.usd}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moneyRows.map((row) => (
                <TableRow
                  key={row.label}
                  className={cn(
                    'border-b border-[var(--border-subtle)] last:border-none',
                    row.isBold && 'bg-[var(--surface-subtle)] font-semibold',
                  )}
                >
                  <TableCell className="text-[var(--text-strong)]">{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums text-[var(--text-strong)]">
                    {row.amounts.lak !== null
                      ? formatMoney({ amount: row.amounts.lak, currency: 'LAK' })
                      : EMPTY}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-[var(--text-strong)]">
                    {row.amounts.usd !== null
                      ? formatMoney({ amount: row.amounts.usd, currency: 'USD' })
                      : EMPTY}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle id="case-progress-title">{D.progress}</SectionTitle>
        <div className="text-sm text-[var(--text-strong)]">
          {legalCase.progress ? (
            <p className="whitespace-pre-wrap">{legalCase.progress}</p>
          ) : (
            <span className="text-[var(--text-muted)]">{EMPTY}</span>
          )}
        </div>
      </GlassCard>

      <CaseFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        legalCase={legalCase}
        onSaved={(updated) => {
          onChange(updated);
          toast.success(lo.legal.cases.form.saved);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="danger"
        title={L.deleteTitle}
        description={L.deleteDesc(legalCase.caseNo)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

export function CaseDetailView({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    casesService
      .get(id)
      .then((legalCase) => {
        if (active) setState({ kind: 'ready', legalCase });
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

  if (state.kind === 'loading') {
    return <DetailSkeleton />;
  }

  if (state.kind === 'notFound') {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow={MODULES.legal.code} title={L.title} accent="legal" />
        <EmptyState
          title={D.notFound}
          action={
            <Link
              href={LIST_HREF}
              className={cn(
                'rounded-sm text-sm text-(--text-strong) underline underline-offset-4',
                FOCUS_RING,
              )}
            >
              {D.backToList}
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
      legalCase={state.legalCase}
      onChange={(updated) => setState({ kind: 'ready', legalCase: updated })}
    />
  );
}

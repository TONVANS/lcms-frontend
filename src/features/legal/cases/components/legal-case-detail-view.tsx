'use client';

import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DocumentManager } from '@/features/documents';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/money';
import { BackLink, ExternalLink, FOCUS_RING, InfoItem, SectionTitle } from '../../lib/detail-bits';
import { useRecord } from '../../lib/use-record';
import { legalCasesService } from '../api/legal-cases.service';
import { caseTotalDue, isCaseFinished } from '../lib/legal-case-mapper';
import { DISPUTE_STATUS_TONE, type DisputeStatus, type LegalCase } from '../types';
import { LegalCaseFormDialog } from './legal-case-form-dialog';

const EMPTY = '—';
const F = lo.legal.fields;
const D = lo.legal.cases.detail;
const L = lo.legal.cases.list;
const LIST_HREF = '/legal/cases';

/** FIRST_INSTANCE -> APPEAL -> SUPREME -> CLOSED / RESOLVED. */
export function disputeStepNumber(s: DisputeStatus): number {
  switch (s) {
    case 'FIRST_INSTANCE':
      return 1;
    case 'APPEAL':
      return 2;
    case 'SUPREME':
      return 3;
    default:
      return 4;
  }
}

function lastStepLabel(s: DisputeStatus): string {
  if (isCaseFinished(s)) return lo.legal.disputeStatus[s];
  return lo.legal.disputeStatus.CLOSED + ' / ' + lo.legal.disputeStatus.RESOLVED;
}

function DetailSkeleton() {
  return (
    <div data-testid="legal-case-detail-skeleton" className="flex flex-col gap-6">
      <h1 className="sr-only">{L.title}</h1>
      <Skeleton className="h-14 w-2/3 rounded-xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

function money(n: number | null, currency: 'LAK' | 'USD'): string {
  return n === null ? EMPTY : formatMoney({ amount: n, currency });
}

function LoadedDetail({ legalCase: c, onChange }: { legalCase: LegalCase; onChange: (c: LegalCase) => void }) {
  const router = useRouter();
  const canEdit = useCan('legal', 'edit');
  const canDelete = useCan('legal', 'delete');
  const canCreate = useCan('legal', 'create');
  const canDownload = useCan('legal', 'download');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onConfirmDelete = async () => {
    try {
      await legalCasesService.remove(c.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e;
    }
    toast.success(L.deleted);
    router.push(LIST_HREF);
  };

  const steps: StepItem[] = [
    { id: 1, label: lo.legal.disputeStatus.FIRST_INSTANCE },
    { id: 2, label: lo.legal.disputeStatus.APPEAL },
    { id: 3, label: lo.legal.disputeStatus.SUPREME },
    { id: 4, label: lastStepLabel(c.disputeStatus) },
  ];
  const badge = <StatusBadge tone={DISPUTE_STATUS_TONE[c.disputeStatus]} label={lo.legal.disputeStatus[c.disputeStatus]} />;

  const info: { label: string; value: ReactNode }[] = [
    { label: F.caseCode, value: <span className="tabular-nums">{c.caseCode}</span> },
    { label: F.defendant, value: c.defendant },
    { label: F.allegation, value: c.allegation ? <span className="whitespace-pre-wrap">{c.allegation}</span> : EMPTY },
    { label: F.department, value: c.department?.name ?? EMPTY },
    { label: F.departmentAction, value: c.departmentAction ? <span className="whitespace-pre-wrap">{c.departmentAction}</span> : EMPTY },
    { label: F.caseType, value: lo.legal.caseTypes[c.caseType] },
    { label: F.disputeStatus, value: badge },
    { label: F.date, value: <span className="tabular-nums">{c.date ? formatDate(c.date) : EMPTY}</span> },
    { label: D.link, value: c.externalUrl ? <ExternalLink url={c.externalUrl} /> : EMPTY },
    { label: F.createdAt, value: <span className="tabular-nums">{c.createdAt ? formatDate(c.createdAt) : EMPTY}</span> },
    { label: F.updatedAt, value: <span className="tabular-nums">{c.updatedAt ? formatDate(c.updatedAt) : EMPTY}</span> },
  ];

  const rows: { label: string; lak: number | null; usd: number | null; bold?: boolean }[] = [
    { label: F.damage, lak: c.damageLak, usd: c.damageUsd },
    { label: F.fine, lak: c.fineLak, usd: c.fineUsd },
    { label: F.totalDue, lak: caseTotalDue(c, 'lak'), usd: caseTotalDue(c, 'usd'), bold: true },
    { label: F.recovered, lak: c.recoveredLak, usd: c.recoveredUsd },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackLink href={LIST_HREF} label={D.backToList} />
      <PageHeader
        eyebrow={`${MODULES.legal.code} · ${c.caseCode}`}
        title={c.defendant}
        accent="legal"
        meta={badge}
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
          <Stepper steps={steps} currentStep={disputeStepNumber(c.disputeStatus)} />
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle id="case-info-title">{D.info}</SectionTitle>
        <dl aria-labelledby="case-info-title" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <TableHead className="font-semibold text-[var(--text-muted)]">{D.category}</TableHead>
                <TableHead className="text-right font-semibold text-[var(--text-muted)]">{F.lak}</TableHead>
                <TableHead className="text-right font-semibold text-[var(--text-muted)]">{F.usd}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.label}
                  className={cn(
                    'border-b border-[var(--border-subtle)] last:border-none',
                    row.bold && 'bg-[var(--surface-subtle)] font-semibold',
                  )}
                >
                  <TableCell className="text-[var(--text-strong)]">{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums text-[var(--text-strong)]">{money(row.lak, 'LAK')}</TableCell>
                  <TableCell className="text-right tabular-nums text-[var(--text-strong)]">{money(row.usd, 'USD')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle id="case-progress-title">{F.disputeProgress}</SectionTitle>
        <div className="text-sm text-[var(--text-strong)]">
          {c.disputeProgress ? (
            <p className="whitespace-pre-wrap">{c.disputeProgress}</p>
          ) : (
            <span className="text-[var(--text-muted)]">{EMPTY}</span>
          )}
        </div>
      </GlassCard>

      <GlassCard as="section" aria-labelledby="case-docs-heading" className="p-5 sm:p-6">
        <SectionTitle id="case-docs-heading">{F.documents}</SectionTitle>
        <DocumentManager
          module="legal-cases"
          entityId={c.id}
          canUpload={canCreate}
          canDownload={canDownload}
          canDelete={canDelete}
        />
      </GlassCard>

      <LegalCaseFormDialog open={editOpen} onOpenChange={setEditOpen} legalCase={c} onSaved={onChange} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="danger"
        title={L.deleteTitle}
        description={L.deleteDesc(c.caseCode)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

function Detail({ id }: { id: string }) {
  const { state, retry, setRecord } = useRecord(id, legalCasesService.get);

  if (state.kind === 'loading') return <DetailSkeleton />;

  if (state.kind === 'notFound') {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow={MODULES.legal.code} title={L.title} accent="legal" />
        <EmptyState
          title={D.notFound}
          action={
            <Link
              href={LIST_HREF}
              className={cn('rounded-sm text-sm text-(--text-strong) underline underline-offset-4', FOCUS_RING)}
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
        <BackLink href={LIST_HREF} label={D.backToList} />
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

  return <LoadedDetail legalCase={state.record} onChange={setRecord} />;
}

export function LegalCaseDetailView({ id }: { id: string }) {
  return <Detail key={id} id={id} />;
}

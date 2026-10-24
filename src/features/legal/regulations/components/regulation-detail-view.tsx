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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentManager } from '@/features/documents';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import type { ApiError } from '@/types/api';
import { regulationsService } from '../api/regulations.service';
import { REGULATION_STATUS_TONE, type Regulation } from '../types';
import { RegulationFormDialog } from './regulation-form-dialog';

const EMPTY = '—';
const F = lo.legal.fields;
const D = lo.legal.regulations.detail;
const L = lo.legal.regulations.list;
const LIST_HREF = '/legal/regulations';
const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; regulation: Regulation }
  | { kind: 'notFound' }
  | { kind: 'error'; error: ApiError };

/** Only https: URLs become anchors, so a stored link can never run script when clicked. */
function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
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
    <div data-testid="regulation-detail-skeleton" className="flex flex-col gap-6">
      <h1 className="sr-only">{lo.legal.regulations.list.title}</h1>
      <Skeleton className="h-14 w-2/3 rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

function LoadedDetail({
  regulation,
  onChange,
}: {
  regulation: Regulation;
  onChange: (r: Regulation) => void;
}) {
  const router = useRouter();
  const canEdit = useCan('legal', 'edit');
  const canDelete = useCan('legal', 'delete');
  const canCreate = useCan('legal', 'create');
  const canDownload = useCan('legal', 'download');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onConfirmDelete = async () => {
    try {
      await regulationsService.remove(regulation.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e; // keeps the ConfirmDialog open
    }
    toast.success(L.deleted);
    router.push(LIST_HREF);
  };

  const typeText =
    regulation.type === 'other' && regulation.typeOther
      ? regulation.typeOther
      : lo.legal.regulationTypes[regulation.type];

  const info: { label: string; value: ReactNode }[] = [
    { label: F.title, value: regulation.title },
    { label: F.type, value: typeText },
    { label: F.number, value: <span className="tabular-nums">{regulation.number}</span> },
    {
      label: F.issuedDate,
      value: <span className="tabular-nums">{formatDate(regulation.issuedDate)}</span>,
    },
    {
      label: F.year,
      value:
        regulation.year === null ? EMPTY : <span className="tabular-nums">{regulation.year}</span>,
    },
    {
      label: F.purpose,
      value: regulation.purpose ? (
        <span className="whitespace-pre-wrap">{regulation.purpose}</span>
      ) : (
        EMPTY
      ),
    },
    { label: F.responsible, value: regulation.responsible ?? EMPTY },
    { label: F.unit, value: lo.legal.units[regulation.unit] },
    {
      label: F.status,
      value: (
        <StatusBadge
          tone={REGULATION_STATUS_TONE[regulation.status]}
          label={lo.legal.regulationStatus[regulation.status]}
        />
      ),
    },
    {
      label: F.createdAt,
      value: <span className="tabular-nums">{formatDate(regulation.createdAt)}</span>,
    },
    {
      label: F.updatedAt,
      value: <span className="tabular-nums">{formatDate(regulation.updatedAt)}</span>,
    },
    { label: F.createdBy, value: regulation.createdBy },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackLink />
      <PageHeader
        eyebrow={`${MODULES.legal.code} · ${regulation.number}`}
        title={regulation.title}
        accent="legal"
        meta={
          <StatusBadge
            tone={REGULATION_STATUS_TONE[regulation.status]}
            label={lo.legal.regulationStatus[regulation.status]}
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

      <GlassCard
        as="section"
        accent="legal"
        aria-labelledby="regulation-info-heading"
        className="min-w-0"
      >
        <SectionTitle id="regulation-info-heading">{D.info}</SectionTitle>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {info.map((i) => (
            <InfoItem key={i.label} label={i.label}>
              {i.value}
            </InfoItem>
          ))}
        </dl>
      </GlassCard>

      <GlassCard as="section" aria-labelledby="regulation-links-heading" className="min-w-0">
        <SectionTitle id="regulation-links-heading">{D.links}</SectionTitle>
        {regulation.externalLinks.length === 0 ? (
          <p className="text-sm text-(--text-muted)">{D.noLinks}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {regulation.externalLinks.map((url, i) => (
              <li key={`${i}-${url}`} className="min-w-0">
                {isHttpsUrl(url) ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'rounded-sm text-sm break-all text-(--text-strong) underline underline-offset-4',
                      FOCUS_RING,
                    )}
                  >
                    {url}
                  </a>
                ) : (
                  <span className="text-sm break-all text-(--text-strong)">{url}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard as="section" aria-labelledby="regulation-docs-heading" className="min-w-0">
        <SectionTitle id="regulation-docs-heading">{F.documents}</SectionTitle>
        <DocumentManager
          entityType="legal-regulation"
          entityId={regulation.id}
          canUpload={canCreate}
          canDownload={canDownload}
          canDelete={canDelete}
        />
      </GlassCard>

      <RegulationFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        regulation={regulation}
        onSaved={onChange}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="danger"
        title={L.deleteTitle}
        description={L.deleteDesc(regulation.number)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

function RegulationDetail({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    regulationsService
      .get(id)
      .then((regulation) => {
        if (active) setState({ kind: 'ready', regulation });
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
        <PageHeader eyebrow={MODULES.legal.code} title={L.title} accent="legal" />
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
      regulation={state.regulation}
      onChange={(regulation) => setState({ kind: 'ready', regulation })}
    />
  );
}

export function RegulationDetailView({ id }: { id: string }) {
  // Keyed by id so navigating between regulations resets state without an effect.
  return <RegulationDetail key={id} id={id} />;
}

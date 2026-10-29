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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentManager } from '@/features/documents';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import { BackLink, ExternalLink, FOCUS_RING, InfoItem, SectionTitle } from '../../lib/detail-bits';
import { useRecord } from '../../lib/use-record';
import { legalDocumentsService } from '../api/legal-documents.service';
import { DOC_STATUS_TONE, type LegalDocument } from '../types';
import { LegalDocumentFormDialog } from './legal-document-form-dialog';

const EMPTY = '—';
const F = lo.legal.fields;
const D = lo.legal.regulations.detail;
const L = lo.legal.regulations.list;
const LIST_HREF = '/legal/regulations';

function DetailSkeleton() {
  return (
    <div data-testid="legal-document-detail-skeleton" className="flex flex-col gap-6">
      <h1 className="sr-only">{L.title}</h1>
      <Skeleton className="h-14 w-2/3 rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

function LoadedDetail({ doc, onChange }: { doc: LegalDocument; onChange: (d: LegalDocument) => void }) {
  const router = useRouter();
  const canEdit = useCan('legal', 'edit');
  const canDelete = useCan('legal', 'delete');
  const canCreate = useCan('legal', 'create');
  const canDownload = useCan('legal', 'download');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onConfirmDelete = async () => {
    try {
      await legalDocumentsService.remove(doc.id);
    } catch (e) {
      const text = toUserMessage(normalizeError(e));
      if (text) toast.error(text);
      throw e; // keeps the ConfirmDialog open
    }
    toast.success(L.deleted);
    router.push(LIST_HREF);
  };

  const statusBadge = (
    <StatusBadge tone={DOC_STATUS_TONE[doc.status]} label={lo.legal.docStatus[doc.status]} />
  );
  const info: { label: string; value: ReactNode }[] = [
    { label: F.docTitle, value: doc.docTitle },
    { label: F.docType, value: lo.legal.docTypes[doc.docType] },
    { label: F.docNumberDate, value: doc.docNumberDate || EMPTY },
    { label: F.issueYear, value: doc.issueYear === null ? EMPTY : <span className="tabular-nums">{doc.issueYear}</span> },
    { label: F.department, value: doc.department?.name ?? EMPTY },
    { label: F.responsiblePerson, value: doc.responsiblePerson ?? EMPTY },
    { label: F.status, value: statusBadge },
    {
      label: F.purpose,
      value: doc.purpose ? <span className="whitespace-pre-wrap">{doc.purpose}</span> : EMPTY,
    },
    {
      label: D.link,
      value: doc.externalUrl ? <ExternalLink url={doc.externalUrl} /> : <span className="text-(--text-muted)">{D.noLink}</span>,
    },
    { label: F.createdAt, value: <span className="tabular-nums">{doc.createdAt ? formatDate(doc.createdAt) : EMPTY}</span> },
    { label: F.updatedAt, value: <span className="tabular-nums">{doc.updatedAt ? formatDate(doc.updatedAt) : EMPTY}</span> },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackLink href={LIST_HREF} label={D.backToList} />
      <PageHeader
        eyebrow={`${MODULES.legal.code} · ${doc.docNumberDate}`}
        title={doc.docTitle}
        accent="legal"
        meta={statusBadge}
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

      <GlassCard as="section" accent="legal" aria-labelledby="legal-document-info-heading" className="min-w-0">
        <SectionTitle id="legal-document-info-heading">{D.info}</SectionTitle>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {info.map((i) => (
            <InfoItem key={i.label} label={i.label}>
              {i.value}
            </InfoItem>
          ))}
        </dl>
      </GlassCard>

      <GlassCard as="section" aria-labelledby="legal-document-docs-heading" className="min-w-0">
        <SectionTitle id="legal-document-docs-heading">{F.documents}</SectionTitle>
        <DocumentManager
          module="legal-documents"
          entityId={doc.id}
          canUpload={canCreate}
          canDownload={canDownload}
          canDelete={canDelete}
        />
      </GlassCard>

      <LegalDocumentFormDialog open={editOpen} onOpenChange={setEditOpen} document={doc} onSaved={onChange} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="danger"
        title={L.deleteTitle}
        description={L.deleteDesc(doc.docTitle)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

function Detail({ id }: { id: string }) {
  const { state, retry, setRecord } = useRecord(id, legalDocumentsService.get);

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

  return <LoadedDetail doc={state.record} onChange={setRecord} />;
}

export function LegalDocumentDetailView({ id }: { id: string }) {
  // Keyed by id so navigating between records resets state without an effect.
  return <Detail key={id} id={id} />;
}

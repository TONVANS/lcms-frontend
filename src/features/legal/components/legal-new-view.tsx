'use client';

import { Scale, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/shared/glass-card';
import { useAuthStore } from '@/features/auth';
import { hasSystemModule } from '@/lib/auth/permissions';
import { lo } from '@/lib/i18n/lo';
import { LegalCaseWizard } from '../cases/components/legal-case-wizard';
import { LegalDocumentWizard } from '../documents/components/legal-document-wizard';

/** Chooser (and wizard host) offering only the record types the SystemModules allow. */
export function LegalNewView() {
  const searchParams = useSearchParams();
  const kind = searchParams?.get('kind');
  const user = useAuthStore((s) => s.user);
  const canDocuments = user !== null && hasSystemModule(user, 'legal-documents');
  const canCases = user !== null && hasSystemModule(user, 'legal-cases');

  if (kind === 'regulation' && canDocuments) return <LegalDocumentWizard />;
  if (kind === 'case' && canCases) return <LegalCaseWizard />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={lo.legal.wizard.title} meta={<p>{lo.legal.wizard.description}</p>} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {canDocuments ? (
          <Link
            href="/legal/new?kind=regulation"
            className="group block rounded-2xl outline-hidden focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
          >
            <GlassCard className="flex h-full flex-col gap-4 p-6 transition-all duration-200 group-hover:border-(--gold) group-hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--gold-subtle) text-(--gold)">
                <ScrollText className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-(--text-strong) group-hover:text-(--gold)">
                  {lo.legal.wizard.chooseRegulation}
                </h2>
                <p className="text-sm text-(--text-muted)">{lo.legal.wizard.chooseRegulationDesc}</p>
              </div>
            </GlassCard>
          </Link>
        ) : null}

        {canCases ? (
          <Link
            href="/legal/new?kind=case"
            className="group block rounded-2xl outline-hidden focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
          >
            <GlassCard className="flex h-full flex-col gap-4 p-6 transition-all duration-200 group-hover:border-(--litigation) group-hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--litigation-subtle) text-(--litigation)">
                <Scale className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-(--text-strong) group-hover:text-(--litigation)">
                  {lo.legal.wizard.chooseCase}
                </h2>
                <p className="text-sm text-(--text-muted)">{lo.legal.wizard.chooseCaseDesc}</p>
              </div>
            </GlassCard>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

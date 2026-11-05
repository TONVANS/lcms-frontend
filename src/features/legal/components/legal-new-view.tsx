'use client';

import { ArrowRight, FileText, Scale, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/shared/glass-card';
import { buttonVariants } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth';
import { hasSystemModule } from '@/lib/auth/permissions';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { LegalCaseWizard } from '../cases/components/legal-case-wizard';
import { LegalDocumentWizard } from '../documents/components/legal-document-wizard';

/** Chooser (and wizard host) conforming strictly to Design.md specs. */
export function LegalNewView() {
  const searchParams = useSearchParams();
  const kind = searchParams?.get('kind');
  const user = useAuthStore((s) => s.user);
  const canDocuments = user !== null && hasSystemModule(user, 'legal-documents');
  const canCases = user !== null && hasSystemModule(user, 'legal-cases');

  if (kind === 'regulation' && canDocuments) return <LegalDocumentWizard />;
  if (kind === 'case' && canCases) return <LegalCaseWizard />;

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageHeader
        title={lo.legal.wizard.title}
        meta={<p className="text-[13px] text-(--text-muted)">{lo.legal.wizard.description}</p>}
        accent="legal"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {canDocuments ? (
          <Link
            href="/legal/new?kind=regulation"
            className="group block rounded-[22px] outline-hidden focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
          >
            <GlassCard className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[22px] p-7 transition-all duration-200 ease-out-soft group-hover:-translate-y-1 group-hover:border-(--gold)/50 group-hover:shadow-card">
              {/* Design.md section 4: 2px top accent line */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-(--gold) to-transparent"
                aria-hidden="true"
              />

              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  {/* Design.md section 2.4: Tinted chip recipe */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-(--gold)/30 bg-(--gold)/12 text-(--gold) transition-transform duration-200 ease-out-soft group-hover:scale-105">
                    <ScrollText className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-(--gold)/30 bg-(--gold)/12 px-3 py-0.5 text-xs font-semibold text-(--gold)">
                    <FileText className="size-3.5" aria-hidden="true" />
                    <span>{lo.legal.wizard.chooseRegulation}</span>
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h2 className="font-serif text-xl font-semibold text-(--text-strong) transition-colors group-hover:text-(--gold)">
                    {lo.legal.wizard.chooseRegulation}
                  </h2>
                  <p className="text-sm leading-relaxed text-(--text-muted)">{lo.legal.wizard.chooseRegulationDesc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-(--border-subtle) pt-4">
                <span className="text-xs text-(--text-dim)">
                  {lo.stepper.step(1, 3)}
                </span>
                {/* Design.md section 6: Button - gold (text #0A1630 700) */}
                <span className={cn(buttonVariants({ variant: 'gold', size: 'sm' }), 'gap-1.5')}>
                  <span>{lo.legal.wizard.regulations.title}</span>
                  <ArrowRight className="size-3.5 transition-transform duration-150 ease-out-soft group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </div>
            </GlassCard>
          </Link>
        ) : null}

        {canCases ? (
          <Link
            href="/legal/new?kind=case"
            className="group block rounded-[22px] outline-hidden focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
          >
            <GlassCard className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[22px] p-7 transition-all duration-200 ease-out-soft group-hover:-translate-y-1 group-hover:border-(--litigation)/50 group-hover:shadow-card">
              {/* Design.md section 4: 2px top accent line */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-(--litigation) to-transparent"
                aria-hidden="true"
              />

              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  {/* Design.md section 2.4: Tinted chip recipe for Litigation */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-(--litigation)/30 bg-(--litigation)/12 text-(--litigation) transition-transform duration-200 ease-out-soft group-hover:scale-105">
                    <Scale className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-(--litigation)/30 bg-(--litigation)/12 px-3 py-0.5 text-xs font-semibold text-(--litigation)">
                    <Scale className="size-3.5" aria-hidden="true" />
                    <span>{lo.legal.wizard.chooseCase}</span>
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h2 className="font-serif text-xl font-semibold text-(--text-strong) transition-colors group-hover:text-(--litigation)">
                    {lo.legal.wizard.chooseCase}
                  </h2>
                  <p className="text-sm leading-relaxed text-(--text-muted)">{lo.legal.wizard.chooseCaseDesc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-(--border-subtle) pt-4">
                <span className="text-xs text-(--text-dim)">
                  {lo.stepper.step(1, 3)}
                </span>
                {/* Design.md section 6: Button - gold (Legal module primary) */}
                <span className={cn(buttonVariants({ variant: 'gold', size: 'sm' }), 'gap-1.5')}>
                  <span>{lo.legal.wizard.cases.title}</span>
                  <ArrowRight className="size-3.5 transition-transform duration-150 ease-out-soft group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </div>
            </GlassCard>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

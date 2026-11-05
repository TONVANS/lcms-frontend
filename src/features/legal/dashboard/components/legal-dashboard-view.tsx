'use client';

import { BookOpen, Layers, Plus, Scale, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Can } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/shared/glass-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/features/auth';
import { hasSystemModule } from '@/lib/auth/permissions';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { LegalCasesDashboardSection } from '../../cases/components/legal-cases-dashboard-section';
import { LegalDocumentsDashboardSection } from '../../documents/components/legal-documents-dashboard-section';
import { FOCUS_RING } from '../../lib/detail-bits';

const D = lo.legal.dashboard;

/** Composes the documents and cases sections; each renders only when the user holds its SystemModule. */
export function LegalDashboardView() {
  const user = useAuthStore((s) => s.user);
  const showDocuments = user !== null && hasSystemModule(user, 'legal-documents');
  const showCases = user !== null && hasSystemModule(user, 'legal-cases');
  const hasBoth = showDocuments && showCases;

  const [activeTab, setActiveTab] = useState<'overview' | 'regulations' | 'cases'>('overview');

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow={MODULES.legal.code}
        title={D.title}
        meta={
          <p className="text-[13px] text-[var(--text-muted)]">
            ລະບົບຕິດຕາມສະຖິຕິເອກະສານນິຕິກຳ, ລະບຽບການ ແລະ ຄວາມຄືບໜ້າການດຳເນີນຄະດີ
          </p>
        }
        accent="legal"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {showDocuments ? (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/legal/regulations" className={FOCUS_RING}>
                  <BookOpen className="size-4 text-[var(--legal)]" aria-hidden="true" />
                  <span>{lo.nav.regulations}</span>
                </Link>
              </Button>
            ) : null}

            {showCases ? (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/legal/cases" className={FOCUS_RING}>
                  <Scale className="size-4 text-[var(--litigation)]" aria-hidden="true" />
                  <span>{lo.nav.cases}</span>
                </Link>
              </Button>
            ) : null}

            <Can module="legal" permission="create">
              <Button asChild variant="gold" size="sm">
                <Link href="/legal/new" className={FOCUS_RING}>
                  <Plus className="size-4" aria-hidden="true" />
                  <span>{D.new}</span>
                </Link>
              </Button>
            </Can>
          </div>
        }
      />

      {/* When user has access to both modules, offer modern segmented tab switching */}
      {hasBoth ? (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'overview' | 'regulations' | 'cases')}
          className="w-full"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
            <TabsList className="bg-[var(--surface-inset)] p-1">
              <TabsTrigger
                value="overview"
                className="gap-2 px-3.5 py-1.5 text-xs font-medium cursor-pointer"
              >
                <Layers className="size-3.5" aria-hidden="true" />
                <span>ພາບລວມທັງໝົດ</span>
              </TabsTrigger>
              <TabsTrigger
                value="regulations"
                className="gap-2 px-3.5 py-1.5 text-xs font-medium cursor-pointer"
              >
                <BookOpen className="size-3.5 text-[var(--legal)]" aria-hidden="true" />
                <span>{D.regulationsSection}</span>
              </TabsTrigger>
              <TabsTrigger
                value="cases"
                className="gap-2 px-3.5 py-1.5 text-xs font-medium cursor-pointer"
              >
                <Scale className="size-3.5 text-[var(--litigation)]" aria-hidden="true" />
                <span>{D.casesSection}</span>
              </TabsTrigger>
            </TabsList>

            {/* Quick shortcuts on mobile / small screen */}
            <div className="flex sm:hidden items-center gap-2">
              <Link
                href="/legal/regulations"
                className="text-xs text-[var(--legal)] underline-offset-4 hover:underline"
              >
                {lo.nav.regulations}
              </Link>
              <span className="text-[var(--border-subtle)]">|</span>
              <Link
                href="/legal/cases"
                className="text-xs text-[var(--litigation)] underline-offset-4 hover:underline"
              >
                {lo.nav.cases}
              </Link>
            </div>
          </div>

          <TabsContent value="overview" className="mt-6 flex flex-col gap-8 outline-hidden">
            <LegalDocumentsDashboardSection />
            <div className="border-t border-[var(--border-subtle)] pt-6">
              <LegalCasesDashboardSection />
            </div>
          </TabsContent>

          <TabsContent value="regulations" className="mt-6 outline-hidden">
            <LegalDocumentsDashboardSection />
          </TabsContent>

          <TabsContent value="cases" className="mt-6 outline-hidden">
            <LegalCasesDashboardSection />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col gap-8">
          {showDocuments ? <LegalDocumentsDashboardSection /> : null}
          {showCases ? <LegalCasesDashboardSection /> : null}
        </div>
      )}
    </div>
  );
}

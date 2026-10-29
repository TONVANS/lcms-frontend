'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Can } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth';
import { hasSystemModule } from '@/lib/auth/permissions';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { LegalCasesDashboardSection } from '../../cases/components/legal-cases-dashboard-section';
import { LegalDocumentsDashboardSection } from '../../documents/components/legal-documents-dashboard-section';
import { FOCUS_RING } from '../../lib/detail-bits';

const D = lo.legal.dashboard;

/** Composes the documents and cases sections; each renders only when the user holds its SystemModule. */
export function LegalDashboardView() {
  const user = useAuthStore((s) => s.user);
  const showDocuments = user !== null && hasSystemModule(user, 'legal-documents');
  const showCases = user !== null && hasSystemModule(user, 'legal-cases');

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <PageHeader
        eyebrow={MODULES.legal.code}
        title={D.title}
        accent="legal"
        actions={
          <Can module="legal" permission="create">
            <Button asChild variant="gold">
              <Link href="/legal/new" className={FOCUS_RING}>
                <Plus aria-hidden="true" />
                {D.new}
              </Link>
            </Button>
          </Can>
        }
      />
      {showDocuments ? <LegalDocumentsDashboardSection /> : null}
      {showCases ? <LegalCasesDashboardSection /> : null}
    </div>
  );
}

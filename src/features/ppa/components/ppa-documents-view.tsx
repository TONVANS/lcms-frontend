'use client';

import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/shared/glass-card';
import { DocumentManager } from '@/features/documents';
import { lo } from '@/lib/i18n/lo';

export function PpaDocumentsView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="PPA"
        title={lo.ppa.documentsTitle}
        meta="ຄັງເກັບມ້ຽນເອກະສານສັນຍາຊື້-ຂາຍໄຟຟ້າ, ເອກະສານສຳປະທານ ແລະ ໃບອະນຸຍາດຕ່າງໆ"
        accent="ppa"
      />

      <GlassCard accent="ppa" className="p-6">
        <DocumentManager entityType="ppa" entityId="all" canUpload canDownload canDelete />
      </GlassCard>
    </div>
  );
}

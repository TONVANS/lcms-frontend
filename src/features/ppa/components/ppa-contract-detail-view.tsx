'use client';

import { ArrowLeft, Calendar, Edit, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { GlassCard } from '@/components/shared/glass-card';
import { KpiCard } from '@/components/shared/kpi-card';
import { ContractStatusBadge } from '@/components/shared/status-badge';
import { Timeline, type TimelineItem } from '@/components/shared/timeline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentManager } from '@/features/documents';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/number';
import { ppaService } from '../api/ppa.service';
import type { PpaFormValues } from '../schemas/ppa.schema';
import type { PpaContract } from '../types';
import { PpaContractFormDialog } from './ppa-contract-form-dialog';

export interface PpaContractDetailViewProps {
  id: string;
}

export function PpaContractDetailView({ id }: PpaContractDetailViewProps) {
  const router = useRouter();
  const [contract, setContract] = useState<PpaContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    ppaService
      .get(id)
      .then((data) => {
        if (active) {
          setContract(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          toast.error(lo.errors.notFound);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleUpdate = async (values: PpaFormValues) => {
    try {
      const updated = await ppaService.update(id, values);
      setContract(updated);
      toast.success(lo.ppa.updatedSuccess);
    } catch {
      toast.error(lo.errors.unknown);
    }
  };

  const handleDelete = async () => {
    try {
      await ppaService.remove(id);
      toast.success(lo.ppa.deletedSuccess);
      router.push('/ppa/contracts');
    } catch {
      toast.error(lo.errors.unknown);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-14 w-1/3 rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-base text-[var(--text-muted)]">{lo.errors.notFound}</p>
        <Link href="/ppa/contracts">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>{lo.nav.contracts}</span>
          </Button>
        </Link>
      </div>
    );
  }

  // Generate timeline items based on contract milestones
  const timelineItems: TimelineItem[] = [
    {
      id: 'signed',
      date: contract.signedDate,
      title: 'ວັນທີເຊັນສັນຍາ PPA',
      description: `ເຊັນສັນຍາກັບ ${contract.developer.name}`,
      status: 'done',
    },
    {
      id: 'cod',
      date: contract.codDate,
      title: 'ວັນທີເລີ່ມດຳເນີນງານທາງການຄ້າ (COD)',
      description: `ກຳລັງຜະລິດ ${formatNumber(contract.capacityMw)} MW`,
      status: contract.status === 'active' || contract.status === 'expiring' ? 'done' : 'current',
    },
    {
      id: 'end',
      date: contract.endDate,
      title: 'ກຳນົດສິ້ນສຸດສັນຍາ',
      description: `ສັນຍາອາຍຸ ${contract.termYears ?? 25} ປີ`,
      status: contract.status === 'expired' ? 'done' : 'future',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/ppa/contracts" className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{lo.nav.contracts}</span>
        </Link>
      </div>

      <PageHeader
        eyebrow={contract.contractNo}
        title={contract.projectName}
        meta={`${contract.developer.name} • ${lo.energy[contract.energyType as keyof typeof lo.energy] ?? contract.energyType}`}
        accent="ppa"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              <span>{lo.ppa.actions.edit}</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(true)}
              className="gap-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="h-4 w-4" />
              <span>{lo.ppa.actions.delete}</span>
            </Button>
          </div>
        }
      />

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={lo.ppa.fields.capacityMw}
          value={`${formatNumber(contract.capacityMw)} MW`}
          variant="default"
          index={0}
        />
        <KpiCard
          label={lo.ppa.fields.tariff}
          value={`${contract.tariffUsCentPerKwh} ¢`}
          variant="default"
          index={1}
        />
        <KpiCard
          label={lo.ppa.fields.codDate}
          value={formatDate(contract.codDate)}
          variant="default"
          index={2}
        />
        <KpiCard
          label={lo.ppa.fields.status}
          value={<ContractStatusBadge status={contract.status} />}
          variant={contract.status === 'expiring' ? 'warning' : 'default'}
          index={3}
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Contract Details */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <GlassCard accent="ppa" className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <h3 className="font-serif text-lg font-semibold text-[var(--text-strong)]">
                ຂໍ້ມູນສັນຍາໂດຍລະອຽດ
              </h3>
              <div className="flex items-center gap-2">
                {contract.status === 'expiring' && <CountdownBadge days={30} />}
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 text-xs">
              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.contractNo}</dt>
                <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
                  {contract.contractNo}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.projectName}</dt>
                <dd className="font-semibold text-[var(--text-strong)]">
                  {contract.projectName}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.developer}</dt>
                <dd className="font-semibold text-[var(--text-strong)]">
                  {contract.developer.name}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.energyType}</dt>
                <dd className="font-semibold text-[var(--text-strong)]">
                  {lo.energy[contract.energyType as keyof typeof lo.energy] ?? contract.energyType}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.capacityMw}</dt>
                <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
                  {formatNumber(contract.capacityMw)} MW
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.tariff}</dt>
                <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
                  {contract.tariffUsCentPerKwh} US¢/kWh
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.annualEnergyGwh}</dt>
                <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
                  {contract.annualEnergyGwh ? `${formatNumber(contract.annualEnergyGwh)} GWh/ປີ` : '—'}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.market}</dt>
                <dd className="font-semibold text-[var(--text-strong)]">
                  {lo.market[contract.market] ?? contract.market}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.signedDate}</dt>
                <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
                  {formatDate(contract.signedDate)}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.codDate}</dt>
                <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
                  {formatDate(contract.codDate)}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.endDate}</dt>
                <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
                  {formatDate(contract.endDate)}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="text-[var(--text-muted)]">{lo.ppa.fields.termYears}</dt>
                <dd className="font-semibold tabular-nums text-[var(--text-strong)]">
                  {contract.termYears} ປີ
                </dd>
              </div>
            </dl>

            {contract.notes && (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-4">
                <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {lo.ppa.fields.notes}
                </span>
                <p className="text-xs leading-relaxed text-[var(--text)]">
                  {contract.notes}
                </p>
              </div>
            )}
          </GlassCard>

          {/* Documents Section */}
          <GlassCard accent="ppa" className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
              <FileText className="h-5 w-5 text-[var(--ppa)]" />
              <h3 className="font-serif text-lg font-semibold text-[var(--text-strong)]">
                {lo.ppa.documentsTitle}
              </h3>
            </div>
            <DocumentManager entityType="ppa" entityId={contract.id} />
          </GlassCard>
        </div>

        {/* Right Column: Timeline */}
        <div className="flex flex-col gap-6">
          <GlassCard accent="ppa" className="flex flex-col gap-5 p-6">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
              <Calendar className="h-5 w-5 text-[#d4b37a]" />
              <h3 className="font-serif text-lg font-semibold text-[var(--text-strong)]">
                {lo.ppa.historyTitle}
              </h3>
            </div>
            <Timeline items={timelineItems} />
          </GlassCard>
        </div>
      </div>

      {/* Edit Modal */}
      <PpaContractFormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleUpdate}
        initialData={contract}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title={lo.confirm.deleteTitle}
        description={`${lo.confirm.deleteDesc} (${contract.projectName})`}
        confirmLabel={lo.ppa.actions.delete}
        onConfirm={handleDelete}
        tone="danger"
      />
    </div>
  );
}

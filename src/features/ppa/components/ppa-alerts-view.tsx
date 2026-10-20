'use client';

import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { CountdownBadge } from '@/components/shared/countdown-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { FilterChips } from '@/components/shared/filter-chips';
import { GlassCard } from '@/components/shared/glass-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { alertsService } from '@/features/alerts/api/alerts.service';
import { lo } from '@/lib/i18n/lo';
import { formatDate } from '@/lib/utils/date';
import type { Alert } from '@/types/domain';

export function PpaAlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [windowFilter, setWindowFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const win = windowFilter === 'all' ? undefined : (Number(windowFilter) as 7 | 30 | 90);
    alertsService
      .list({ module: 'ppa', window: win })
      .then((res) => {
        if (active) {
          setAlerts(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          toast.error(lo.errors.server);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [windowFilter]);

  const handleFilterChange = (val: string) => {
    setWindowFilter(val);
    setIsLoading(true);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await alertsService.markRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
      );
    } catch {
      toast.error(lo.errors.unknown);
    }
  };

  const filterOptions = [
    { value: 'all', label: lo.table.all },
    { value: '7', label: lo.home.buckets.within7 },
    { value: '30', label: lo.home.buckets.within30 },
    { value: '90', label: lo.home.buckets.within90 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="PPA"
        title={lo.ppa.alertsTitle}
        meta="ຕິດຕາມກຳນົດເວລາສັນຍາໃກ້ໝົດອາຍຸ ແລະ ການເຈລະຈາຄ່າໄຟຟ້າ"
        accent="ppa"
      />

      <div className="flex items-center justify-between">
        <FilterChips
          options={filterOptions}
          value={windowFilter}
          onChange={handleFilterChange}
          accent="ppa"
          ariaLabel={lo.ppa.alertsWindowFilter}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <GlassCard accent="ppa" className="p-12 text-center">
          <EmptyState title="ບໍ່ມີລາຍການແຈ້ງເຕືອນ" description="ບໍ່ມີສັນຍາໃກ້ໝົດອາຍຸໃນໄລຍະທີ່ເລືອກ" />
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <GlassCard
              key={alert.id}
              accent="ppa"
              className="flex items-center justify-between gap-4 p-4 transition-all duration-200 hover:border-[var(--border-glass)]"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <Link
                    href={`/ppa/contracts/${alert.entityId}`}
                    className="font-medium text-sm text-[var(--text-strong)] hover:text-[var(--ppa)] hover:underline"
                  >
                    {alert.title}
                  </Link>
                  <p className="text-xs text-[var(--text-muted)] tabular-nums">
                    ກຳນົດ: {formatDate(alert.dueDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CountdownBadge days={alert.daysLeft} />
                {!alert.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Mark as read"
                    onClick={() => handleMarkRead(alert.id)}
                    className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text)]"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

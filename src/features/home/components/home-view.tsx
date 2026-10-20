'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AlertBanner } from '@/components/shared/alert-banner';
import { GlassCard } from '@/components/shared/glass-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth';
import { getLandingRoute } from '@/lib/auth/permissions';
import { lo } from '@/lib/i18n/lo';
import { homeService } from '../api/home.service';
import { buildHomeView } from '../lib/build-home-view';
import type { HomeSummary } from '../types';
import { AlertSummary } from './alert-summary';
import { ModuleCard } from './module-card';
import { UpcomingList } from './upcoming-list';

const CARD_GRID = 'grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]';

export function HomeView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [failed, setFailed] = useState(false);

  const landing = user ? getLandingRoute(user) : null;
  const isHome = landing === '/';

  useEffect(() => {
    if (landing && landing !== '/') router.replace(landing);
  }, [landing, router]);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isHome) return;
    let live = true;
    homeService.summary().then(
      (s) => live && setSummary(s),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [isHome, attempt]);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  const view = useMemo(
    () => (summary && user ? buildHomeView(summary, user) : null),
    [summary, user],
  );

  if (!user || !isHome) return null;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="animate-fade-in-hero font-serif text-[34px] leading-[1.35] font-semibold text-text-strong">
        {lo.home.title}
      </h1>

      {failed ? (
        <AlertBanner
          tone="rose"
          title={lo.home.loadError}
          action={
            <Button variant="secondary" onClick={retry}>
              {lo.common.retry}
            </Button>
          }
        />
      ) : !view ? (
        <div className={CARD_GRID} aria-busy="true" aria-label={lo.common.loading}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[230px] rounded-[20px]" />
          ))}
        </div>
      ) : (
        <>
          <div className={CARD_GRID}>
            {view.modules.map((m, i) => (
              <div
                key={m.module}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <ModuleCard module={m.module} stats={m} />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-6">
            <section style={{ flex: '3 1 420px' }} className="min-w-0">
              <h2 className="mb-3 font-serif text-xl font-semibold text-text-strong">
                {lo.home.upcoming30}
              </h2>
              <GlassCard className="p-3">
                <UpcomingList alerts={view.upcoming} />
              </GlassCard>
            </section>
            <section style={{ flex: '2 1 300px' }} className="min-w-0">
              <h2 className="mb-3 font-serif text-xl font-semibold text-text-strong">
                {lo.home.alertSummary}
              </h2>
              <AlertSummary buckets={view.alertBuckets} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { AlertBanner } from '@/components/shared/alert-banner';
import { GlassCard } from '@/components/shared/glass-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth';
import { getLandingRoute } from '@/lib/auth/permissions';
import { lo } from '@/lib/i18n/lo';
import { formatNumber } from '@/lib/utils/number';
import { homeService } from '../api/home.service';
import { buildHomeView } from '../lib/build-home-view';
import type { HomeSummary } from '../types';
import { AlertSummary } from './alert-summary';
import { ModuleCard } from './module-card';
import { UpcomingList } from './upcoming-list';

const CARD_GRID = 'grid gap-5 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(310px,1fr))]';

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

  // Aggregated totals across accessible modules
  const portfolioTotals = useMemo(() => {
    if (!view) return null;
    return view.modules.reduce(
      (acc, m) => ({
        total: acc.total + m.total,
        active: acc.active + m.active,
        expiring: acc.expiring + m.expiring,
      }),
      { total: 0, active: 0, expiring: 0 },
    );
  }, [view]);

  if (!user || !isHome) return null;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* Executive Hero Banner */}
      <section className="relative overflow-hidden rounded-[24px] border border-white/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,255,255,0.68))] p-6 sm:p-8 backdrop-blur-xl shadow-[inset_0_1px_0_#fff,0_20px_40px_-24px_rgba(15,35,80,0.18)] dark:border-[rgba(212,179,122,0.25)] dark:bg-[linear-gradient(160deg,rgba(30,58,138,0.35),rgba(19,41,79,0.25))] dark:shadow-lg">
        {/* Top Gold Hairline */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4b37a]/80 to-transparent"
        />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-[rgba(212,179,122,0.3)] dark:bg-amber-500/10 dark:text-(--gold)">
              <Sparkles className="size-3.5" aria-hidden="true" />
              <span>{lo.common.appName} Executive Hub</span>
            </div>
            <h1 className="animate-fade-in-hero font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-strong leading-tight">
              {lo.home.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[65ch] leading-relaxed">
              ສະບາຍດີ, <span className="font-semibold text-foreground">{user.fullName || user.username}</span> • {lo.home.welcomeSubtitle}
            </p>
          </div>

          {/* Portfolio Pulse Quick Stats */}
          {portfolioTotals ? (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 lg:pt-0">
              <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.06] bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none px-3.5 py-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                  <FileText className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{lo.home.stats.total}</p>
                  <p className="text-base font-bold text-text-strong tabular-nums">
                    {formatNumber(portfolioTotals.total)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.06] bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none px-3.5 py-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{lo.home.stats.active}</p>
                  <p className="text-base font-bold text-text-strong tabular-nums">
                    {formatNumber(portfolioTotals.active)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.06] bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none px-3.5 py-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{lo.home.stats.expiring}</p>
                  <p className="text-base font-bold text-text-strong tabular-nums">
                    {formatNumber(portfolioTotals.expiring)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Main Content Areas */}
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
            <Skeleton key={i} className="h-[250px] rounded-[22px]" />
          ))}
        </div>
      ) : (
        <>
          {/* Module Launchpad Cards Grid */}
          <section className="space-y-3">
            <h2 className="sr-only">{lo.home.title}</h2>
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
          </section>

          {/* Operational Overview: Upcoming Deadlines & Urgency Buckets */}
          <div className="flex flex-wrap gap-6 sm:gap-8">
            {/* Upcoming Deadlines (3/5 ratio) */}
            <section style={{ flex: '3 1 440px' }} className="min-w-0 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <CalendarClock className="size-4.5" aria-hidden="true" />
                  </div>
                  <h2 className="font-heading text-lg sm:text-xl font-semibold text-text-strong">
                    {lo.home.upcoming30}
                  </h2>
                </div>
                {view.upcoming.length > 0 ? (
                  <span className="rounded-full border border-border/60 bg-secondary/80 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                    {view.upcoming.length} ລາຍການ
                  </span>
                ) : null}
              </div>
              <GlassCard className="p-4 sm:p-5">
                <UpcomingList alerts={view.upcoming} />
              </GlassCard>
            </section>

            {/* Alert Summary (2/5 ratio) */}
            <section style={{ flex: '2 1 320px' }} className="min-w-0 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                  <BellRing className="size-4.5" aria-hidden="true" />
                </div>
                <h2 className="font-heading text-lg sm:text-xl font-semibold text-text-strong">
                  {lo.home.alertSummary}
                </h2>
              </div>
              <GlassCard className="p-4 sm:p-5">
                <AlertSummary buckets={view.alertBuckets} />
              </GlassCard>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BellRing, CalendarClock, Sparkles } from 'lucide-react';
import { AlertBanner } from '@/components/shared/alert-banner';
import { EmptyState } from '@/components/shared/empty-state';
import { GlassCard } from '@/components/shared/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth';
import { getAccessibleModules, getLandingRoute } from '@/lib/auth/permissions';
import { lo } from '@/lib/i18n/lo';
import { homeService } from '../api/home.service';
import type { HomeData } from '../types';
import { ModuleCard } from './module-card';
import { NotificationsSummary } from './notifications-summary';
import { UpcomingList } from './upcoming-list';

const CARD_GRID = 'grid gap-5 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(310px,1fr))]';

export function HomeView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<HomeData | null>(null);
  const [attempt, setAttempt] = useState(0);

  const modules = user ? getAccessibleModules(user) : [];
  const landing = user ? getLandingRoute(user) : null;
  // A single-module user goes straight to their module; no-module users stay for the empty state.
  const redirect = landing && landing !== '/' && modules.length > 0 ? landing : null;
  const hasModules = modules.length > 0;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  useEffect(() => {
    if (!user || redirect || !hasModules) return;
    let live = true;
    homeService.load(user).then((d) => live && setData(d));
    return () => {
      live = false;
    };
    // `user` identity is stable per session; attempt triggers manual retries.
  }, [user, redirect, hasModules, attempt]);

  const retry = useCallback(() => {
    setData(null);
    setAttempt((n) => n + 1);
  }, []);

  if (!user || redirect) return null;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section className="relative overflow-hidden rounded-[24px] border border-white/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,255,255,0.68))] p-6 sm:p-8 backdrop-blur-xl shadow-[inset_0_1px_0_#fff,0_20px_40px_-24px_rgba(15,35,80,0.18)] dark:border-[rgba(212,179,122,0.25)] dark:bg-[linear-gradient(160deg,rgba(30,58,138,0.35),rgba(19,41,79,0.25))] dark:shadow-lg">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4b37a]/80 to-transparent"
        />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-[rgba(212,179,122,0.3)] dark:bg-amber-500/10 dark:text-(--gold)">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>{lo.common.appName}</span>
          </div>
          <h1 className="animate-fade-in-hero font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-strong leading-tight">
            {lo.home.title}
          </h1>
          <p className="max-w-[65ch] text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">{user.fullName || user.username}</span>
            {' • '}
            {lo.home.welcomeSubtitle}
          </p>
        </div>
      </section>

      {!hasModules ? (
        <GlassCard className="p-4 sm:p-5">
          <EmptyState
            title={lo.home.noModulesTitle}
            description={lo.home.noModulesDesc}
            action={
              <Link
                href="/support"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
              >
                {lo.home.contactSupport}
              </Link>
            }
          />
        </GlassCard>
      ) : (
        <>
          <section aria-labelledby="home-modules" className="space-y-3">
            <h2 id="home-modules" className="sr-only">
              {lo.home.title}
            </h2>
            {!data ? (
              <div className={CARD_GRID} aria-busy="true" aria-label={lo.common.loading}>
                {modules.map((m) => (
                  <Skeleton key={m} className="h-[250px] rounded-[22px]" />
                ))}
              </div>
            ) : (
              <div className={CARD_GRID}>
                {modules.map((m, i) => {
                  const r = data.modules[m];
                  return (
                    <div
                      key={m}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <ModuleCard
                        module={m}
                        card={r?.ok ? r.card : undefined}
                        onRetry={r && !r.ok ? retry : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="flex flex-wrap gap-6 sm:gap-8">
            <section
              aria-labelledby="home-upcoming"
              style={{ flex: '3 1 440px' }}
              className="flex min-w-0 flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <CalendarClock className="size-4.5" aria-hidden="true" />
                  </div>
                  <h2
                    id="home-upcoming"
                    className="font-heading text-lg sm:text-xl font-semibold text-text-strong"
                  >
                    {lo.home.upcomingTitle}
                  </h2>
                </div>
                {data && data.upcoming.length > 0 ? (
                  <span className="rounded-full border border-border/60 bg-secondary/80 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                    {lo.home.itemsCount(data.upcoming.length)}
                  </span>
                ) : null}
              </div>
              {data?.upcomingFailed ? (
                <AlertBanner tone="amber" title={lo.home.upcomingLoadError} />
              ) : null}
              <GlassCard className="p-4 sm:p-5">
                {!data ? (
                  <div aria-busy="true" aria-label={lo.common.loading} className="space-y-2.5">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-14 rounded-[14px]" />
                    ))}
                  </div>
                ) : (
                  <UpcomingList items={data.upcoming} />
                )}
              </GlassCard>
            </section>

            <section
              aria-labelledby="home-notifications"
              style={{ flex: '2 1 320px' }}
              className="flex min-w-0 flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                  <BellRing className="size-4.5" aria-hidden="true" />
                </div>
                <h2
                  id="home-notifications"
                  className="font-heading text-lg sm:text-xl font-semibold text-text-strong"
                >
                  {lo.home.notificationsTitle}
                </h2>
              </div>
              <GlassCard className="p-4 sm:p-5">
                <NotificationsSummary />
              </GlassCard>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

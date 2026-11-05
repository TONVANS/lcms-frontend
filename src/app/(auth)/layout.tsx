import type { ReactNode } from 'react';
import Image from 'next/image';
import { BackgroundGlows } from '@/components/layout/background-glows';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { FadeIn } from '@/components/shared/fade-in';
import { GlassCard } from '@/components/shared/glass-card';
import { lo } from '@/lib/i18n/lo';
import { ShieldCheck } from 'lucide-react';
import { BrandPanel } from './_brand-panel';


export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col justify-between overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <BackgroundGlows />

      {/* Subtle Architectural Grid Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />

      {/* Floating Top Navigation Bar */}
      <header className="relative z-10 w-full px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(212,179,122,0.35)] bg-gradient-to-br from-[#1e3a8a]/40 via-[#13294f]/60 to-[#0b1b3a] p-1 shadow-[0_0_15px_rgba(212,179,122,0.2)]">
              <Image
                src="/logo/logo.png"
                alt="LCMS Logo"
                width={36}
                height={36}
                className="size-8 object-contain drop-shadow"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-wider text-foreground leading-none">
                {lo.common.appName}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
                {lo.common.appSubtitle}
              </span>
            </div>
          </div>

          {/* Right Status Indicator & Theme Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-medium text-foreground">{lo.auth.systemStatus}</span>
            </div>

            <div className="rounded-xl border border-border/60 bg-secondary/80 p-0.5 backdrop-blur-md shadow-sm">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Responsive Split Hero & Form Card */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-stretch lg:gap-12">
          {/* Left Brand Panel */}
          <BrandPanel />

          {/* Right Authentication Card */}
          <FadeIn
            variant="scale"
            style={{ animationDelay: '150ms' }}
            className="w-full lg:flex-[1_1_480px] max-w-[520px] flex items-center"
          >
            <GlassCard className="relative w-full overflow-hidden p-6 sm:p-10 border border-white/20 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]">
              {/* Gold Top Hairline Accent */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4b37a]/70 to-transparent"
              />
              {children}
            </GlassCard>
          </FadeIn>
        </div>
      </main>

      {/* Institutional Legal Footer */}
      <footer className="relative z-10 w-full border-t border-border/40 py-4 sm:py-5 px-4 sm:px-8 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p>{lo.auth.footerCopyright}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" aria-hidden="true" />
              <span>{lo.auth.complianceTag}</span>
            </span>
            <span className="text-border">•</span>
            <span>{lo.auth.secureConnection}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

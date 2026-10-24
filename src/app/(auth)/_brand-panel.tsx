import { FadeIn } from '@/components/shared/fade-in';
import { GlassCard } from '@/components/shared/glass-card';
import { lo } from '@/lib/i18n/lo';
import { Activity, FileText, Scale, ShieldCheck, Sparkles, Zap } from 'lucide-react';

const MODULES = [
  {
    key: 'ppa' as const,
    code: 'PPA',
    name: lo.modules.ppa,
    desc: lo.auth.ppaFeatureDesc,
    color: '92,200,255',
    hex: '#5CC8FF',
    icon: Zap,
    badgeBg: 'rgba(92,200,255,0.15)',
    border: 'rgba(92,200,255,0.25)',
  },
  {
    key: 'gc' as const,
    code: 'GC',
    name: lo.modules.gc,
    desc: lo.auth.gcFeatureDesc,
    color: '139,156,255',
    hex: '#8B9CFF',
    icon: FileText,
    badgeBg: 'rgba(139,156,255,0.15)',
    border: 'rgba(139,156,255,0.25)',
  },
  {
    key: 'legal' as const,
    code: 'LEGAL',
    name: lo.modules.legal,
    desc: lo.auth.legalFeatureDesc,
    color: '212,179,122',
    hex: '#D4B37A',
    icon: Scale,
    badgeBg: 'rgba(212,179,122,0.15)',
    border: 'rgba(212,179,122,0.25)',
  },
] as const;

export function BrandPanel() {
  return (
    <FadeIn variant="hero" className="w-full lg:flex-[1_1_520px] max-w-[620px] flex items-center">
      <GlassCard
        highlight
        className="relative flex flex-col gap-6 sm:gap-7 p-6 sm:p-10 lg:p-12 border border-[rgba(212,179,122,0.25)] shadow-[0_24px_50px_-20px_rgba(3,8,20,0.6)]"
      >
        {/* Top gold hairline accent */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#b08a4a] via-[#d4b37a] to-transparent opacity-80"
        />

        {/* Brand Crest Header */}
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 sm:size-13 shrink-0 items-center justify-center rounded-2xl border border-[rgba(212,179,122,0.35)] bg-gradient-to-br from-[#1e3a8a] via-[#13294f] to-[#0b1b3a] text-[#d4b37a] shadow-[0_0_20px_rgba(212,179,122,0.25)]">
            <Scale className="size-6 sm:size-6.5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-2xl sm:text-[26px] font-bold tracking-wider text-(--gold-soft) drop-shadow-sm leading-tight">
              {lo.common.appName}
            </p>
            <p className="text-xs sm:text-[13px] font-medium text-[#c9d5ea]/85 tracking-wide line-clamp-1">
              {lo.common.appSubtitle}
            </p>
          </div>
        </div>

        {/* Hero Text */}
        <div className="space-y-3">
          <h2 className="font-heading text-2xl sm:text-[36px] lg:text-[42px] leading-[1.25] font-semibold text-[#f5f8fd] tracking-tight">
            {lo.auth.brandHeading}
          </h2>
          <p className="max-w-[48ch] text-sm sm:text-base leading-relaxed text-[#c9d5ea]">
            {lo.auth.brandIntro}
          </p>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid gap-3 sm:gap-3.5">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.key}
                className="group relative flex items-start gap-3.5 rounded-[16px] border p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, rgba(${m.color}, 0.08), rgba(${m.color}, 0.02))`,
                  borderColor: m.border,
                }}
              >
                <div
                  className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                  style={{
                    background: m.badgeBg,
                    color: m.hex,
                  }}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#f5f8fd] tracking-wide">
                      {m.name}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wider"
                      style={{
                        background: m.badgeBg,
                        color: m.hex,
                      }}
                    >
                      {m.code}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs sm:text-[13px] leading-relaxed text-[#c9d5ea]/80">
                    {m.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust & Guarantee Strip */}
        <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-3 text-xs text-[#c9d5ea]/80">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{lo.auth.trustBankSecurity}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-[#d4b37a] shrink-0" aria-hidden="true" />
            <span>{lo.auth.trustSmartAlerts}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="size-4 text-sky-400 shrink-0" aria-hidden="true" />
            <span>{lo.auth.trustAuditTrail}</span>
          </div>
        </div>
      </GlassCard>
    </FadeIn>
  );
}

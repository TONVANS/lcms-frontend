import { FadeIn } from '@/components/shared/fade-in';
import { GlassCard } from '@/components/shared/glass-card';
import { lo } from '@/lib/i18n/lo';

// Accent hexes are the dark-mode values: the panel is navy in both themes.
const CHIPS = [
  { key: 'ppa', color: '92,200,255', hex: '#5CC8FF' },
  { key: 'gc', color: '139,156,255', hex: '#8B9CFF' },
  { key: 'legal', color: '212,179,122', hex: '#D4B37A' },
] as const;

export function BrandPanel() {
  return (
    <FadeIn variant="hero" className="flex-[1_1_520px]">
      <GlassCard highlight className="flex flex-col gap-6 p-8 sm:p-12">
        <p className="font-heading text-2xl font-semibold tracking-wide text-(--gold-soft)">
          {lo.common.appName}
        </p>
        <h2 className="font-heading text-[32px] leading-[1.3] font-semibold text-[#f5f8fd] sm:text-[46px] lg:text-[52px]">
          {lo.auth.brandHeading}
        </h2>
        <p className="max-w-[46ch] text-base leading-relaxed text-[#c9d5ea]">
          {lo.auth.brandIntro}
        </p>
        <ul className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <li
              key={c.key}
              className="rounded-full border px-3 py-1.5 text-[13px] font-medium"
              style={{
                background: `rgba(${c.color},0.12)`,
                borderColor: `rgba(${c.color},0.30)`,
                color: c.hex,
              }}
            >
              {lo.modules[c.key]}
            </li>
          ))}
        </ul>
      </GlassCard>
    </FadeIn>
  );
}

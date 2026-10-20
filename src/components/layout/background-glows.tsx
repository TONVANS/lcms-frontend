import { cn } from '@/lib/utils/cn';

type GlowAccent = 'default' | 'ppa' | 'gc' | 'legal';

const MAIN_GLOW: Record<GlowAccent, string> = {
  default: 'rgba(59,130,246,0.34)',
  ppa: 'rgba(92,200,255,0.30)',
  gc: 'rgba(139,156,255,0.30)',
  legal: 'rgba(212,179,122,0.28)',
};

const glow = (color: string) => `radial-gradient(circle, ${color} 0%, transparent 70%)`;

export function BackgroundGlows({ accent = 'default' }: { accent?: GlowAccent }) {
  const base = 'pointer-events-none absolute rounded-full';

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className={cn(base, '-top-40 -right-40 size-[640px]')}
        style={{ background: glow(MAIN_GLOW[accent]) }}
      />
      <div
        className={cn(base, '-bottom-48 -left-40 size-[620px]')}
        style={{ background: glow('rgba(99,102,241,0.26)') }}
      />
      <div
        className={cn(base, 'top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2')}
        style={{ background: glow('rgba(212,179,122,0.10)') }}
      />
    </div>
  );
}

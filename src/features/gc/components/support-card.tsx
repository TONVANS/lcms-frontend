import { SupportContactList } from '@/components/layout/support-dialog';
import { FadeIn } from '@/components/shared/fade-in';
import { GlassCard } from '@/components/shared/glass-card';
import { lo } from '@/lib/i18n/lo';

export function SupportCard({ index }: { index?: number }) {
  return (
    <FadeIn variant="up" index={index}>
      <GlassCard highlight className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="font-serif text-base font-semibold">{lo.support.title}</h2>
          <p className="mt-1 text-xs opacity-80">{lo.support.intro}</p>
        </div>
        <SupportContactList onDark />
      </GlassCard>
    </FadeIn>
  );
}

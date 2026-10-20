import type { ReactNode } from 'react';
import { BackgroundGlows } from '@/components/layout/background-glows';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { FadeIn } from '@/components/shared/fade-in';
import { GlassCard } from '@/components/shared/glass-card';
import { BrandPanel } from './_brand-panel';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-1">
      <BackgroundGlows />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <main className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-8 px-4 py-20 sm:px-6 lg:py-6">
        <BrandPanel />
        <FadeIn variant="scale" style={{ animationDelay: '150ms' }} className="mx-auto w-full max-w-[520px] flex-[1_1_400px]">
          <GlassCard className="p-6 sm:p-10">{children}</GlassCard>
        </FadeIn>
      </main>
    </div>
  );
}

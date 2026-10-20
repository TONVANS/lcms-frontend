import type { ReactNode } from 'react';
import { OctagonAlertIcon, TriangleAlertIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { FadeIn } from './fade-in';

type AlertTone = 'amber' | 'rose';

const TONE_ICON = { amber: TriangleAlertIcon, rose: OctagonAlertIcon } as const;

const TONE_CLASS: Record<AlertTone, string> = {
  amber:
    'border-[rgba(251,191,36,0.35)] bg-[#FEF3C7] text-[#92400E] dark:bg-transparent dark:bg-[linear-gradient(160deg,rgba(251,191,36,0.16),rgba(251,191,36,0.05))] dark:text-[#FCD34D]',
  rose: 'border-[rgba(251,113,133,0.35)] bg-[#FFE4E6] text-[#BE123C] dark:bg-transparent dark:bg-[linear-gradient(160deg,rgba(251,113,133,0.16),rgba(251,113,133,0.05))] dark:text-[#FDA4AF]',
};

interface AlertBannerProps {
  tone: AlertTone;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function AlertBanner({ tone, title, description, action }: AlertBannerProps) {
  const Icon = TONE_ICON[tone];
  return (
    <FadeIn variant="down">
      <div
        role={tone === 'rose' ? 'alert' : 'status'}
        className={cn(
          'flex flex-wrap items-center gap-3 rounded-[16px] border px-4 py-3 backdrop-blur-[20px]',
          TONE_CLASS[tone],
        )}
      >
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          {description ? <p className="mt-0.5 text-[13px] opacity-90">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </FadeIn>
  );
}

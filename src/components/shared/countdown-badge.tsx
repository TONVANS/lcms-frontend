import { formatCountdown, getCountdownTone, type CountdownTone } from '@/lib/utils/countdown';
import { cn } from '@/lib/utils/cn';
import { BADGE_TONE_CLASS } from './status-badge';

// Design.md section 2.6: urgent = rose, warning = amber, planning = blue.
const TONE_CLASS: Record<CountdownTone, string> = {
  urgent: BADGE_TONE_CLASS.rose,
  warning: BADGE_TONE_CLASS.amber,
  planning: BADGE_TONE_CLASS.blue,
};

export function CountdownBadge({ days }: { days: number }) {
  const tone = getCountdownTone(days);
  if (!tone) return null;
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-[5px] text-xs font-semibold tabular-nums',
        TONE_CLASS[tone],
      )}
    >
      {formatCountdown(days)}
    </span>
  );
}

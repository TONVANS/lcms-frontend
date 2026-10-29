import { LEGACY_STATUS_META, STATUS_META, type StatusTone } from '@/lib/constants/status';
import type { ContractStatus, LegacyContractStatus } from '@/types/domain';
import { cn } from '@/lib/utils/cn';

// Design.md section 2.5 (badge bg/text, dot): light values first, dark via dark: variant.
export const BADGE_TONE_CLASS: Record<StatusTone, string> = {
  emerald: 'bg-[#D1FAE5] text-[#047857] dark:bg-[rgba(52,211,153,0.12)] dark:text-[#6EE7B7]',
  blue: 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-[rgba(96,165,250,0.12)] dark:text-[#93C5FD]',
  violet: 'bg-[#EDE9FE] text-[#5B21B6] dark:bg-[rgba(167,139,250,0.14)] dark:text-[#C4B5FD]',
  amber: 'bg-[#FEF3C7] text-[#92400E] dark:bg-[rgba(251,191,36,0.12)] dark:text-[#FCD34D]',
  rose: 'bg-[#FFE4E6] text-[#BE123C] dark:bg-[rgba(251,113,133,0.12)] dark:text-[#FDA4AF]',
  slate: 'bg-[#F1F5F9] text-[#334155] dark:bg-[rgba(148,163,184,0.14)] dark:text-[#CBD5E1]',
};

// Also used by charts (stacked status bar) so status colours stay in one place.
export const DOT_TONE_CLASS: Record<StatusTone, string> = {
  emerald: 'bg-[#059669] dark:bg-[#34D399]',
  blue: 'bg-[#2563EB] dark:bg-[#60A5FA]',
  violet: 'bg-[#7C3AED] dark:bg-[#A78BFA]',
  amber: 'bg-[#FBBF24]',
  rose: 'bg-[#E11D48] dark:bg-[#FB7185]',
  slate: 'bg-[#94A3B8]',
};

export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs font-semibold',
        BADGE_TONE_CLASS[tone],
      )}
    >
      <span
        data-slot="dot"
        aria-hidden="true"
        className={cn('size-1.5 shrink-0 rounded-full', DOT_TONE_CLASS[tone])}
      />
      {label}
    </span>
  );
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const meta = STATUS_META[status];
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

/** Pre-backend statuses (GC/PPA until they migrate). */
export function LegacyContractStatusBadge({ status }: { status: LegacyContractStatus }) {
  const meta = LEGACY_STATUS_META[status];
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

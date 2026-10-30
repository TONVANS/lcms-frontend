'use client';

import { Mail, MessageSquare, Phone } from 'lucide-react';
import { FadeIn } from '@/components/shared/fade-in';
import { GlassCard } from '@/components/shared/glass-card';
import { SUPPORT_CONTACTS, supportMailHref, supportTelHref } from '@/config/support';
import { useAuthStore } from '@/features/auth';
import { contactKind, useSupportContacts, type ContactKind } from '@/features/support';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';

const LINK_BASE =
  'min-w-0 break-all rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2';

interface ContactRow {
  key: string;
  label: string;
  value: string;
  kind: ContactKind;
}

const FALLBACK_ROWS: ContactRow[] = [
  { key: 'phone', label: lo.support.phone, value: SUPPORT_CONTACTS.phone, kind: 'phone' },
  { key: 'email', label: lo.support.email, value: SUPPORT_CONTACTS.email, kind: 'email' },
];

export function SupportContactList({ onDark = false }: { onDark?: boolean }) {
  const ring = onDark ? 'focus-visible:outline-[#d4b37a]' : 'focus-visible:outline-(--focus-ring)';
  const user = useAuthStore((s) => s.user);
  const { contacts, status } = useSupportContacts(user !== null);
  const rows: ContactRow[] =
    status === 'ready' && contacts.length > 0
      ? contacts.map((c) => ({
          key: c.id,
          label: c.channelName,
          value: c.contactInfo,
          kind: contactKind(c.contactInfo),
        }))
      : FALLBACK_ROWS;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => {
        const Icon = r.kind === 'email' ? Mail : r.kind === 'phone' ? Phone : MessageSquare;
        return (
          <li key={r.key} className="flex items-center gap-3">
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="shrink-0 text-[13px] opacity-80">{r.label}</span>
            {r.kind === 'text' ? (
              <span className="min-w-0 break-all font-semibold">{r.value}</span>
            ) : (
              <a
                href={r.kind === 'email' ? supportMailHref(r.value) : supportTelHref(r.value)}
                className={cn(LINK_BASE, ring)}
              >
                {r.value}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

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

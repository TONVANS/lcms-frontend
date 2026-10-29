'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

/** Only http(s) URLs become anchors, so a stored link can never run script when clicked. */
export function isHttpUrl(value: string): boolean {
  try {
    const p = new URL(value).protocol;
    return p === 'https:' || p === 'http:';
  } catch {
    return false;
  }
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-(--text-secondary) hover:text-(--text)',
        FOCUS_RING,
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
}

export function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-(--text-muted)">{label}</dt>
      <dd className="mt-1 text-sm wrap-break-word text-(--text-strong)">{children}</dd>
    </div>
  );
}

export function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-4 font-serif text-lg font-semibold text-(--text-strong)">
      {children}
    </h2>
  );
}

/** External link rendered as an anchor only when it is http(s); plain text otherwise. */
export function ExternalLink({ url }: { url: string }) {
  if (!isHttpUrl(url)) return <span className="break-all">{url}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('rounded-sm break-all underline underline-offset-4', FOCUS_RING)}
    >
      {url}
    </a>
  );
}

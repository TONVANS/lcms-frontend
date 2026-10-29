import Link from 'next/link';
import { ArrowLeft, KeyRound, Mail, Phone } from 'lucide-react';
import { FadeIn } from '@/components/shared/fade-in';
import { SUPPORT_CONTACTS, supportMailHref, supportTelHref } from '@/config/support';
import { lo } from '@/lib/i18n/lo';

/** Static notice: the backend has no password-reset endpoint, so users contact IT / HRM. */
export function ForgotPasswordForm() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <FadeIn variant="up-sm" index={0} className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-[rgba(212,179,122,0.35)] bg-gradient-to-br from-primary/20 via-amber-500/10 to-primary/10 text-[#d4b37a] shadow-sm">
            <KeyRound aria-hidden="true" className="size-4.5" />
          </div>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {lo.auth.forgotTitle}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">{lo.auth.forgotIntro}</p>
      </FadeIn>

      <FadeIn variant="up-sm" index={1}>
        <div className="flex flex-col gap-3 rounded-[16px] border border-border/80 bg-secondary/80 p-4 text-sm text-foreground backdrop-blur-md shadow-sm">
          <p className="leading-relaxed">{lo.auth.forgotContactIt}</p>
          <ul aria-label={lo.auth.forgotContactLabel} className="flex flex-col gap-1">
            <li>
              <a
                href={supportTelHref(SUPPORT_CONTACTS.phone)}
                className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
              >
                <Phone aria-hidden="true" className="size-4" />
                {SUPPORT_CONTACTS.phone}
              </a>
            </li>
            <li>
              <a
                href={supportMailHref(SUPPORT_CONTACTS.email)}
                className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
              >
                <Mail aria-hidden="true" className="size-4" />
                {SUPPORT_CONTACTS.email}
              </a>
            </li>
          </ul>
        </div>
      </FadeIn>

      <FadeIn variant="up-sm" index={2} className="pt-2 border-t border-border/50">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-primary underline-offset-4 hover:underline hover:text-primary/90 transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          <span>{lo.auth.backToLogin}</span>
        </Link>
      </FadeIn>
    </div>
  );
}

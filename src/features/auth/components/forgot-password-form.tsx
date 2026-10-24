'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, KeyRound, Loader2Icon, ShieldCheck, User } from 'lucide-react';
import { FadeIn } from '@/components/shared/fade-in';
import { AlertBanner } from '@/components/shared/alert-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { authService } from '../api/auth.service';
import { loginSchema } from '../schemas/login.schema';
import { z } from 'zod';

const forgotSchema = loginSchema.pick({ username: true });
type ForgotInput = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [transportError, setTransportError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { username: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setTransportError(null);
    try {
      await authService.forgotPassword({ username: values.username });
    } catch (e) {
      const err = normalizeError(e);
      // Transport failures say nothing about the account, so report them honestly.
      if (err.code === 'NETWORK' || err.code === 'TIMEOUT' || err.status >= 500) {
        setTransportError(toUserMessage(err));
        return;
      }
      // Any other outcome stays neutral: never reveal whether the account exists.
    }
    setSent(true);
  });

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <FadeIn variant="up-sm" index={0} className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-[rgba(212,179,122,0.35)] bg-gradient-to-br from-primary/20 via-amber-500/10 to-primary/10 text-[#d4b37a] shadow-sm">
            <KeyRound aria-hidden="true" className="size-4.5" />
          </div>
          <span className="rounded-full border border-border/60 bg-secondary/80 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {lo.common.appName} Account Recovery
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {lo.auth.forgotTitle}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {lo.auth.forgotIntro}
        </p>
      </FadeIn>

      {sent ? (
        <FadeIn variant="up-sm" index={1}>
          <div
            role="status"
            className="flex items-start gap-3 rounded-[16px] border border-border/80 bg-secondary/80 p-4 text-sm text-foreground backdrop-blur-md shadow-sm"
          >
            <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-emerald-500 mt-0.5" />
            <p className="leading-relaxed">{lo.auth.forgotSent}</p>
          </div>
        </FadeIn>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 sm:gap-6">
          {transportError ? <AlertBanner tone="rose" title={transportError} /> : null}

          <FadeIn variant="up-sm" index={1} className="flex flex-col gap-2">
            <Label htmlFor="username" className="text-sm font-medium text-foreground">
              {lo.auth.username}
            </Label>
            <div className="group relative">
              <User
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
              />
              <Input
                id="username"
                autoComplete="username"
                placeholder={lo.auth.username}
                className="h-[52px] rounded-[14px] pl-11 text-base transition-all bg-(--surface-input) border-border focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
                aria-invalid={errors.username ? true : undefined}
                aria-describedby={errors.username ? 'username-error' : undefined}
                {...register('username')}
              />
            </div>
            {errors.username ? (
              <p id="username-error" className="text-[13px] font-medium text-destructive">
                {errors.username.message}
              </p>
            ) : null}
          </FadeIn>

          <FadeIn variant="up-sm" index={2} className="space-y-4 pt-1">
            <Button
              type="submit"
              size="lg"
              className="group relative h-[52px] w-full rounded-[14px] text-base font-semibold border-[rgba(212,179,122,0.5)] shadow-[0_12px_30px_-14px_rgba(37,99,235,0.9)] hover:shadow-[0_16px_36px_-12px_rgba(37,99,235,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon aria-hidden="true" className="size-5 animate-spin" />
                  <span>{lo.common.loading}</span>
                </>
              ) : (
                <span className="inline-flex items-center justify-center gap-2">
                  <span>{lo.auth.forgotSubmit}</span>
                  <ArrowRight aria-hidden="true" className="size-4.5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </FadeIn>
        </form>
      )}

      <FadeIn variant="up-sm" index={3} className="pt-2 border-t border-border/50">
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

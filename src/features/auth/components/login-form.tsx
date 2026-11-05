'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, EyeIcon, EyeOffIcon, KeyRound, Loader2Icon, Lock, ShieldCheck, User } from 'lucide-react';
import { FadeIn } from '@/components/shared/fade-in';
import { AlertBanner } from '@/components/shared/alert-banner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getLandingRoute } from '@/lib/auth/permissions';
import { getSafeNext } from '@/lib/auth/route-decision';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import type { z } from 'zod';
import { loginSchema, type LoginInput } from '../schemas/login.schema';
import { useAuthStore } from '../store/auth.store';

interface LoginFormProps {
  next?: string | null;
  reason?: string | null;
}

export function LoginForm({ next, reason }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof loginSchema>, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', remember: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await useAuthStore.getState().login(values);
    } catch (e) {
      setSubmitError(toUserMessage(normalizeError(e)));
      return;
    }
    const user = useAuthStore.getState().user;
    if (!user) return;
    toast.success(lo.auth.loginSuccess);
    router.replace(getSafeNext(next) ?? getLandingRoute(user));
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 sm:gap-6">
      <FadeIn variant="up-sm" index={0} className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-[rgba(212,179,122,0.35)] bg-gradient-to-br from-[#1e3a8a]/30 via-amber-500/10 to-primary/10 p-1 shadow-sm">
            <Image src="/logo/logo.png" alt="LCMS" width={28} height={28} className="size-6 object-contain" priority />
          </div>
          <span className="rounded-full border border-border/60 bg-secondary/80 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {lo.common.appName} Authentication
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {lo.auth.loginTitle}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {lo.auth.welcomeSubtitle}
        </p>
      </FadeIn>

      {reason === 'expired' ? (
        <AlertBanner tone="amber" title={lo.auth.sessionExpired} />
      ) : null}
      {submitError ? <AlertBanner tone="rose" title={submitError} /> : null}

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

      <FadeIn variant="up-sm" index={2} className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          {lo.auth.password}
        </Label>
        <div className="group relative">
          <Lock
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
          />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={lo.auth.password}
            className="h-[52px] rounded-[14px] pl-11 pr-12 text-base transition-all bg-(--surface-input) border-border focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          <button
            type="button"
            aria-label={showPassword ? lo.auth.hidePassword : lo.auth.showPassword}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-1.5 my-auto flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--focus-ring)"
          >
            {showPassword ? (
              <EyeOffIcon aria-hidden="true" className="size-5" />
            ) : (
              <EyeIcon aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="password-error" className="text-[13px] font-medium text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </FadeIn>

      <FadeIn variant="up-sm" index={3} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-h-11 items-center gap-2.5">
          <Controller
            control={control}
            name="remember"
            render={({ field }) => (
              <Checkbox
                id="remember"
                checked={field.value === true}
                onCheckedChange={(v) => field.onChange(v === true)}
                className="cursor-pointer"
              />
            )}
          />
          <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-muted-foreground hover:text-foreground transition-colors">
            {lo.auth.remember}
          </Label>
        </div>
      </FadeIn>

      <FadeIn variant="up-sm" index={4} className="space-y-4 pt-1">
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
              <span>{lo.auth.submit}</span>
              <ArrowRight aria-hidden="true" className="size-4.5 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground/80">
          <ShieldCheck aria-hidden="true" className="size-4 text-emerald-500 shrink-0" />
          <span>{lo.auth.secureConnection}</span>
        </div>
      </FadeIn>
    </form>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
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
    router.replace(getSafeNext(next) ?? getLandingRoute(user));
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FadeIn variant="up-sm" index={0}>
        <h1 className="font-heading text-3xl font-semibold text-foreground">{lo.auth.loginTitle}</h1>
      </FadeIn>

      {reason === 'expired' ? (
        <AlertBanner tone="amber" title={lo.auth.sessionExpired} />
      ) : null}
      {submitError ? <AlertBanner tone="rose" title={submitError} /> : null}

      <FadeIn variant="up-sm" index={1} className="flex flex-col gap-2">
        <Label htmlFor="username">{lo.auth.username}</Label>
        <Input
          id="username"
          autoComplete="username"
          className="h-[50px] rounded-[14px]"
          aria-invalid={errors.username ? true : undefined}
          aria-describedby={errors.username ? 'username-error' : undefined}
          {...register('username')}
        />
        {errors.username ? (
          <p id="username-error" className="text-[13px] text-destructive">
            {errors.username.message}
          </p>
        ) : null}
      </FadeIn>

      <FadeIn variant="up-sm" index={2} className="flex flex-col gap-2">
        <Label htmlFor="password">{lo.auth.password}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="h-[50px] rounded-[14px] pr-14"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          <button
            type="button"
            aria-label={showPassword ? lo.auth.hidePassword : lo.auth.showPassword}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-[14px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--focus-ring)"
          >
            {showPassword ? (
              <EyeOffIcon aria-hidden="true" className="size-5" />
            ) : (
              <EyeIcon aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="password-error" className="text-[13px] text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </FadeIn>

      <FadeIn variant="up-sm" index={3} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-h-11 items-center gap-2">
          <Controller
            control={control}
            name="remember"
            render={({ field }) => (
              <Checkbox
                id="remember"
                checked={field.value === true}
                onCheckedChange={(v) => field.onChange(v === true)}
              />
            )}
          />
          <Label htmlFor="remember" className="font-normal">
            {lo.auth.remember}
          </Label>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {lo.auth.forgot}
        </Link>
      </FadeIn>

      <FadeIn variant="up-sm" index={4}>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon aria-hidden="true" className="size-5 animate-spin" /> : null}
          {lo.auth.submit}
        </Button>
      </FadeIn>
    </form>
  );
}

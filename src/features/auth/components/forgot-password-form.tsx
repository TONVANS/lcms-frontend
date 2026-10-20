'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
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
    <div className="flex flex-col gap-5">
      <FadeIn variant="up-sm" index={0}>
        <h1 className="font-heading text-3xl font-semibold text-foreground">{lo.auth.forgotTitle}</h1>
      </FadeIn>

      {sent ? (
        <p
          role="status"
          className="rounded-[14px] border border-border bg-secondary px-4 py-3 text-sm text-foreground"
        >
          {lo.auth.forgotSent}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {transportError ? <AlertBanner tone="rose" title={transportError} /> : null}
          <p className="text-sm text-muted-foreground">{lo.auth.forgotIntro}</p>
          <div className="flex flex-col gap-2">
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
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2Icon aria-hidden="true" className="size-5 animate-spin" />
            ) : null}
            {lo.auth.forgotSubmit}
          </Button>
        </form>
      )}

      <Link
        href="/login"
        className="inline-flex min-h-11 items-center self-start text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {lo.auth.backToLogin}
      </Link>
    </div>
  );
}

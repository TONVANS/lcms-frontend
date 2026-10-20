'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AlertBanner } from '@/components/shared/alert-banner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth';
import { toUserMessage } from '@/lib/api/errors';
import { clearMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';

export function AuthSkeleton() {
  return (
    <div aria-busy="true" aria-label={lo.common.loading} className="flex flex-wrap gap-6 p-6">
      <Skeleton className="h-[calc(100dvh-3rem)] w-[260px] rounded-[20px]" />
      <div className="flex min-w-0 flex-col gap-6" style={{ flex: '999 1 560px' }}>
        <Skeleton className="h-16 w-full rounded-[20px]" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full rounded-[20px]" />
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = useAuthStore((s) => s.status);
  const endReason = useAuthStore((s) => s.endReason);
  const error = useAuthStore((s) => s.error);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const search = searchParams.toString();

  useEffect(() => {
    if (status === 'idle') {
      void fetchMe();
    } else if (status === 'unauthenticated') {
      clearMockSession();
      if (endReason === 'logout') {
        router.replace('/login');
      } else {
        const next = pathname + (search ? `?${search}` : '');
        router.replace(`/login?reason=expired&next=${encodeURIComponent(next)}`);
      }
    }
  }, [status, endReason, pathname, search, router, fetchMe]);

  if (status === 'authenticated') return <>{children}</>;
  if (status === 'unauthenticated') return null;
  if (status === 'error') {
    return (
      <div className="mx-auto flex max-w-[720px] flex-col gap-6 p-6">
        <AlertBanner
          tone="rose"
          title={error ? toUserMessage(error) : lo.errors.unknown}
          action={
            <Button variant="outline" size="sm" onClick={() => void fetchMe()}>
              {lo.common.retry}
            </Button>
          }
        />
      </div>
    );
  }
  return <AuthSkeleton />;
}

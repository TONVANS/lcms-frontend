import { Suspense, type ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { AuthGate, AuthSkeleton } from '@/components/guards/auth-gate';


export default function AppLayout({ children }: { children: ReactNode }) {

  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthGate>
        <AppShell>{children}</AppShell>
      </AuthGate>
    </Suspense>
  );
}

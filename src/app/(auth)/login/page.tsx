import { Suspense } from 'react';
import { LoginForm } from '@/features/auth';

export const instant = false;

async function LoginContent({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  return <LoginForm next={first(params.next)} reason={first(params.reason)} />;
}

export default function LoginPage(props: PageProps<'/login'>) {
  return (
    <Suspense fallback={null}>
      <LoginContent searchParams={props.searchParams} />
    </Suspense>
  );
}

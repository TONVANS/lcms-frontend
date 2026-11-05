import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'ເຂົ້າສູ່ລະບົບ',
  description:
    'ເຂົ້າສູ່ລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ EDL LCMS - ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)',
  openGraph: {
    title: 'ເຂົ້າສູ່ລະບົບ | EDL LCMS',
    description:
      'ເຂົ້າສູ່ລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ EDL LCMS - ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)',
  },
};


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

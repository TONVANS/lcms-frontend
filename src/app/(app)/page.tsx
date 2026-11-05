import type { Metadata } from 'next';
import { HomeView } from '@/features/home';

export const metadata: Metadata = {
  title: 'ໜ້າຫຼັກ',
  description:
    'ສູນກາງລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ EDL LCMS - ລວມສັນຍາພະລັງງານໄຟຟ້າ (PPA), ສັນຍາທົ່ວໄປ (GC) ແລະ ວຽກງານນິຕິກຳ ໄວ້ໃນບ່ອນດຽວ',
};


export default function HomePage() {
  return <HomeView />;
}


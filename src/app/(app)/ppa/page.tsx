import type { Metadata } from 'next';
import { PpaDashboardView } from '@/features/ppa';

export const metadata: Metadata = {
  title: 'ສັນຍາຊື້-ຂາຍໄຟຟ້າ (PPA)',
  description:
    'ພາບລວມລະບົບຄຸ້ມຄອງສັນຍາຊື້-ຂາຍໄຟຟ້າ Power Purchase Agreements, ຕິດຕາມສະຖານະ COD, Tariff ແລະ ຜົນຜະລິດພະລັງງານໄຟຟ້າ',
};


export default function PpaDashboardPage() {
  return <PpaDashboardView />;
}

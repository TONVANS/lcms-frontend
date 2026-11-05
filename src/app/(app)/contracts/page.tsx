import type { Metadata } from 'next';
import { GcDashboardView } from '@/features/gc';

export const instant = false;

export const metadata: Metadata = {
  title: 'ສັນຍາທົ່ວໄປ (General Contracts) | LCMS',
  description: 'ພາບລວມລະບົບຄຸ້ມຄອງສັນຍາທົ່ວໄປ, ການຄ້າ ແລະ ຈັດຊື້-ຈັດຈ້າງ',
};

export default function ContractsDashboardPage() {
  return <GcDashboardView />;
}

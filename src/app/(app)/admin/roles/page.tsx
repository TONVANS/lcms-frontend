import type { Metadata } from 'next';
import { RolesView } from '@/features/roles/components/roles-view';

export const metadata: Metadata = {
  title: 'ຈັດການບົດບາດ ແລະ ສິດທິ (Roles & Permissions)',
  description: 'ກຳນົດບົດບາດ ແລະ ສິດທິການເຂົ້າເຖິງຂໍ້ມູນໃນລະບົບ LCMS',
};


export default function RolesPage() {
  return <RolesView />;
}


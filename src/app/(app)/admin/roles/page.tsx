import type { Metadata } from 'next';
import { RolesView } from '@/features/roles/components/roles-view';

export const metadata: Metadata = {
  title: 'ຈັດການບົດບາດ ແລະ ສິດທິ | LCMS',
};

export const instant = false;

export default function RolesPage() {
  return <RolesView />;
}


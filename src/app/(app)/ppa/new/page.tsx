import type { Metadata } from 'next';
import { PermissionGuard } from '@/components/guards/permission-guard';
import { PpaWizardView } from '@/features/ppa';

export const metadata: Metadata = {
  title: 'ສ້າງສັນຍາຊື້-ຂາຍໄຟຟ້າໃໝ່ (PPA)',
  description: 'ລົງທະບຽນ ແລະ ສ້າງຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟຟ້າໃໝ່ເຂົ້າສູ່ລະບົບ',
};

export const instant = false;

export default function PpaNewContractPage() {
  return (
    <PermissionGuard module="ppa" permission="create">
      <PpaWizardView />
    </PermissionGuard>
  );
}

import type { Metadata } from 'next';
import { PermissionGuard } from '@/components/guards/permission-guard';
import { GcWizardView } from '@/features/gc';

export const metadata: Metadata = {
  title: 'ສ້າງສັນຍາທົ່ວໄປໃໝ່ (GC)',
  description: 'ລົງທະບຽນ ແລະ ສ້າງສັນຍາທົ່ວໄປ/ຈັດຊື້-ຈັດຈ້າງໃໝ່',
};

export const instant = false;

export default function NewContractPage() {
  return (
    <PermissionGuard module="gc" permission="create">
      <GcWizardView />
    </PermissionGuard>
  );
}

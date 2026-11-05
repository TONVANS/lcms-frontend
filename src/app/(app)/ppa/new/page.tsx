import { PermissionGuard } from '@/components/guards/permission-guard';
import { PpaWizardView } from '@/features/ppa';

export const instant = false;

export default function PpaNewContractPage() {
  return (
    <PermissionGuard module="ppa" permission="create">
      <PpaWizardView />
    </PermissionGuard>
  );
}

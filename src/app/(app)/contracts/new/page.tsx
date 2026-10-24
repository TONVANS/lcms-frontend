import { PermissionGuard } from '@/components/guards/permission-guard';
import { GcWizardView } from '@/features/gc';

export const instant = false;

export default function NewContractPage() {
  return (
    <PermissionGuard module="gc" permission="create">
      <GcWizardView />
    </PermissionGuard>
  );
}

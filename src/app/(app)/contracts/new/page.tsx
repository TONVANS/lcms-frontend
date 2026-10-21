import { PermissionGuard } from '@/components/guards/permission-guard';
import { GcWizardView } from '@/features/gc';

export default function NewContractPage() {
  return (
    <PermissionGuard module="gc" permission="create">
      <GcWizardView />
    </PermissionGuard>
  );
}

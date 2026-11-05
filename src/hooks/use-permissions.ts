import { useAuthStore } from '@/features/auth';
import { canAccessModule, hasPermission } from '@/lib/auth/permissions';
import type {
  CoreModuleKey,
  ModuleKey,
  Permission,
  PermissionActionKey,
  SystemModuleKey,
} from '@/types/domain';

export function usePermissions(scopedModule?: CoreModuleKey | ModuleKey | SystemModuleKey) {
  const user = useAuthStore((s) => s.user);

  const can = (
    module: CoreModuleKey | ModuleKey | SystemModuleKey,
    action: Permission | PermissionActionKey = 'canView',
  ): boolean => {
    if (!user) return false;
    return hasPermission(user, module, action);
  };

  const hasModule = (module: CoreModuleKey | ModuleKey | SystemModuleKey): boolean => {
    if (!user) return false;
    return canAccessModule(user, module);
  };

  return {
    can,
    hasModule,
    // Scoped actions for currently active module
    canView: scopedModule ? can(scopedModule, 'canView') : false,
    canUpload: scopedModule ? can(scopedModule, 'canUpload') : false,
    canEdit: scopedModule ? can(scopedModule, 'canEdit') : false,
    canDelete: scopedModule ? can(scopedModule, 'canDelete') : false,
    canDownload: scopedModule ? can(scopedModule, 'canDownload') : false,
  };
}


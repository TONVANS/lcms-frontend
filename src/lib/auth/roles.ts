import type { ModuleRole, Permission } from '@/types/domain';

export const ROLE_PERMISSIONS: Record<ModuleRole, readonly Permission[]> = {
  viewer: ['view'],
  editor: ['view', 'create', 'edit', 'delete'],
  main: ['view', 'create', 'edit', 'delete', 'download'],
};

import type { ReactNode } from 'react';
import { ModuleGuard } from '@/components/guards/module-guard';

export default function ContractsLayout({ children }: { children: ReactNode }) {
  return <ModuleGuard module="gc">{children}</ModuleGuard>;
}

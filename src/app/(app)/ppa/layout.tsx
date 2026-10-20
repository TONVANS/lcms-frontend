import type { ReactNode } from 'react';
import { ModuleGuard } from '@/components/guards/module-guard';

export const instant = false;

export default function PpaLayout({ children }: { children: ReactNode }) {
  return <ModuleGuard module="ppa">{children}</ModuleGuard>;
}

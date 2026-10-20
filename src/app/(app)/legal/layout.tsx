import type { ReactNode } from 'react';
import { ModuleGuard } from '@/components/guards/module-guard';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return <ModuleGuard module="legal">{children}</ModuleGuard>;
}

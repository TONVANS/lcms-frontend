import { FileText, Scale, Zap, type LucideIcon } from 'lucide-react';
import { lo } from '@/lib/i18n/lo';
import type { ModuleKey } from '@/types/domain';

export interface ModuleMeta {
  key: ModuleKey;
  code: 'PPA' | 'GC' | 'LEGAL';
  name: string;
  href: string;
  icon: LucideIcon;
}

export const MODULES: Record<ModuleKey, ModuleMeta> = {
  ppa: { key: 'ppa', code: 'PPA', name: lo.modules.ppa, href: '/ppa', icon: Zap },
  gc: { key: 'gc', code: 'GC', name: lo.modules.gc, href: '/contracts', icon: FileText },
  legal: { key: 'legal', code: 'LEGAL', name: lo.modules.legal, href: '/legal', icon: Scale },
};

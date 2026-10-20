import {
  Bell,
  FilePlus2,
  FileText,
  Gavel,
  LayoutDashboard,
  Library,
  Scale,
  ScrollText,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import type { ModuleKey } from '@/types/domain';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  countKey?: string;
}

export const MODULE_NAV: Record<ModuleKey, NavItem[]> = {
  ppa: [
    { key: 'dashboard', label: lo.nav.dashboard, href: '/ppa', icon: LayoutDashboard },
    { key: 'contracts', label: lo.nav.contracts, href: '/ppa/contracts', icon: FileText },
    { key: 'create', label: lo.nav.create, href: '/ppa/new', icon: FilePlus2 },
    { key: 'alerts', label: lo.nav.alerts, href: '/ppa/alerts', icon: Bell, countKey: 'alerts' },
    { key: 'documents', label: lo.nav.documents, href: '/ppa/documents', icon: Library },
  ],
  gc: [
    { key: 'dashboard', label: lo.nav.dashboard, href: '/contracts', icon: LayoutDashboard },
    { key: 'contracts', label: lo.nav.contracts, href: '/contracts/list', icon: FileText },
    { key: 'create', label: lo.nav.create, href: '/contracts/new', icon: FilePlus2 },
    { key: 'alerts', label: lo.nav.alerts, href: '/contracts/alerts', icon: Bell, countKey: 'alerts' },
  ],
  legal: [
    { key: 'dashboard', label: lo.nav.dashboard, href: '/legal', icon: LayoutDashboard },
    { key: 'regulations', label: lo.nav.regulations, href: '/legal/regulations', icon: ScrollText },
    { key: 'procurement', label: lo.nav.procurement, href: '/legal/procurement', icon: ShoppingCart },
    { key: 'laws', label: lo.nav.laws, href: '/legal/laws', icon: Library },
    { key: 'cases', label: lo.nav.cases, href: '/legal/cases', icon: Gavel },
    { key: 'hearings', label: lo.nav.hearings, href: '/legal/hearings', icon: Scale },
  ],
};

const MODULE_KEYS = Object.keys(MODULES) as ModuleKey[];
const MODULE_ROOTS: string[] = MODULE_KEYS.map((k) => MODULES[k].href);

export function getModuleFromPath(pathname: string): ModuleKey | null {
  for (const key of MODULE_KEYS) {
    const root = MODULES[key].href;
    if (pathname === root || pathname.startsWith(`${root}/`)) return key;
  }
  return null;
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (MODULE_ROOTS.includes(href)) return pathname === href;
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (href === '/contracts/list') {
    const match = /^\/contracts\/([^/]+)$/.exec(pathname);
    if (match && !['list', 'new', 'alerts'].includes(match[1])) {
      return true;
    }
  }
  return false;
}

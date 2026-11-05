import {
  Bell,
  Building2,
  ClipboardList,
  FilePlus2,
  FileText,
  Gavel,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  ShieldCheck,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import type { ModuleKey, Permission, SystemModule } from '@/types/domain';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  countKey?: string;
  /** Item is rendered only when the user holds this permission in the module. */
  permission?: Permission;
  /** Item is rendered only when the user holds this backend system module. */
  systemModule?: SystemModule;
}

export const MODULE_NAV: Record<ModuleKey, NavItem[]> = {
  ppa: [
    { key: 'dashboard', label: lo.nav.dashboard, href: '/ppa', icon: LayoutDashboard },
    {
      key: 'contracts',
      label: lo.nav.contracts,
      href: '/ppa/contracts',
      icon: FileText,
      systemModule: 'power-contracts',
    },
    {
      key: 'create',
      label: lo.nav.create,
      href: '/ppa/new',
      icon: FilePlus2,
      permission: 'create',
    },
    { key: 'alerts', label: lo.nav.alerts, href: '/ppa/alerts', icon: Bell, countKey: 'expiringSoon' },
  ],
  gc: [
    { key: 'dashboard', label: lo.nav.dashboard, href: '/contracts', icon: LayoutDashboard },
    { key: 'contracts', label: lo.nav.contracts, href: '/contracts/list', icon: FileText },
    {
      key: 'create',
      label: lo.nav.create,
      href: '/contracts/new',
      icon: FilePlus2,
      permission: 'create',
    },
    { key: 'alerts', label: lo.nav.alerts, href: '/contracts/alerts', icon: Bell, countKey: 'expiringSoon' },
  ],
  legal: [
    { key: 'dashboard', label: lo.nav.dashboard, href: '/legal', icon: LayoutDashboard },
    {
      key: 'regulations',
      label: lo.nav.regulations,
      href: '/legal/regulations',
      icon: ScrollText,
      systemModule: 'legal-documents',
    },
    {
      key: 'cases',
      label: lo.nav.cases,
      href: '/legal/cases',
      icon: Gavel,
      systemModule: 'legal-cases',
    },
    {
      key: 'create',
      label: lo.nav.createLegal,
      href: '/legal/new',
      icon: FilePlus2,
      permission: 'create',
    },
  ],
};

export const COMMON_NAV: NavItem[] = [
  {
    key: 'notifications',
    label: lo.nav.notifications,
    href: '/notifications',
    icon: Bell,
    countKey: 'unread',
  },
  { key: 'support', label: lo.nav.support, href: '/support', icon: LifeBuoy },
];

export const ADMIN_NAV: NavItem[] = [
  { key: 'users', label: lo.admin.users, href: '/admin/users', icon: Users },
  { key: 'roles', label: lo.admin.roles, href: '/admin/roles', icon: ShieldCheck },
  { key: 'audit-logs', label: lo.admin.auditLogs, href: '/admin/audit-logs', icon: ClipboardList },
  {
    key: 'contract-types',
    label: lo.admin.contractTypes,
    href: '/admin/contract-types',
    icon: Tags,
  },
  { key: 'departments', label: lo.admin.departments, href: '/admin/departments', icon: Building2 },
];

const MODULE_KEYS = Object.keys(MODULES) as ModuleKey[];
const MODULE_ROOTS: string[] = MODULE_KEYS.map((k) => MODULES[k].href);

export function getModuleFromPath(pathname: string): ModuleKey | null {
  for (const key of MODULE_KEYS) {
    const root = MODULES[key].href;
    if (pathname === root || pathname.startsWith(`${root}/`)) return key;
  }
  return null;
}

// GC detail lives at /contracts/[id] while its list item is /contracts/list.
const GC_RESERVED = ['list', 'new', 'alerts'];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (MODULE_ROOTS.includes(href)) return pathname === href;
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (href === '/contracts/list') {
    const match = /^\/contracts\/([^/]+)$/.exec(pathname);
    return match !== null && !GC_RESERVED.includes(match[1]);
  }
  return false;
}

'use client';

import { Fragment } from 'react';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { MODULE_NAV, getModuleFromPath, isNavItemActive } from '@/config/navigation';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';

const SEGMENT_LABELS: Record<string, string> = {
  admin: lo.admin.section,
  users: lo.admin.users,
  roles: lo.admin.roles,
  'audit-logs': lo.admin.auditLogs,
  'contract-types': lo.admin.contractTypes,
  departments: lo.admin.departments,
  support: lo.nav.support,
  notifications: lo.nav.notifications,
};

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ tone = 'default' }: { tone?: 'default' | 'navy' }) {
  const pathname = usePathname();
  const moduleKey = getModuleFromPath(pathname);
  const crumbs: Crumb[] = [{ label: lo.common.home, href: '/' }];

  if (moduleKey) {
    const mod = MODULES[moduleKey];
    const item = MODULE_NAV[moduleKey]
      .filter((n) => isNavItemActive(pathname, n.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    const deeper = item !== undefined && item.href !== mod.href;
    crumbs.push({ label: mod.name, href: deeper ? mod.href : undefined });
    if (deeper) crumbs.push({ label: item.label });
  }

  if (!moduleKey) {
    const segments = pathname
      .split('/')
      .filter(Boolean)
      .filter((seg) => seg in SEGMENT_LABELS);
    segments.forEach((seg, i) => {
      const last = i === segments.length - 1;
      crumbs.push({
        label: SEGMENT_LABELS[seg],
        href: last || seg === 'admin' ? undefined : `/${seg}`,
      });
    });
  }

  const navy = tone === 'navy';
  const total = crumbs.length;

  return (
    <Breadcrumb aria-label={lo.topbar.breadcrumb}>
      <BreadcrumbList
        className={cn(
          'flex-nowrap overflow-hidden text-xs sm:text-sm',
          navy ? 'text-[#9fb0cc]' : 'text-muted-foreground',
        )}
      >
        {crumbs.map((c, i) => {
          const last = i === total - 1;
          const isOlderCrumb = total > 2 && i < total - 2;

          return (
            <Fragment key={`${i}-${c.label}`}>
              {i > 0 ? (
                <BreadcrumbSeparator
                  className={cn(
                    '[&>svg]:size-3 shrink-0',
                    isOlderCrumb && 'hidden sm:flex',
                  )}
                />
              ) : null}
              <BreadcrumbItem
                className={cn(
                  'shrink-0',
                  isOlderCrumb && 'hidden sm:inline-flex',
                  last && 'min-w-0 flex-1 sm:flex-initial',
                )}
              >
                {last || !c.href ? (
                  <BreadcrumbPage
                    className={cn(
                      'block max-w-[150px] truncate sm:max-w-[280px] md:max-w-[360px] font-semibold',
                      navy ? 'text-white' : 'text-foreground',
                    )}
                  >
                    {c.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className={navy ? 'hover:text-white' : undefined}>
                    <Link
                      href={c.href}
                      className="flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      {i === 0 ? <Home className="size-3.5 shrink-0 sm:hidden" /> : null}
                      <span className={cn(i === 0 && 'hidden sm:inline')}>
                        {c.label}
                      </span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

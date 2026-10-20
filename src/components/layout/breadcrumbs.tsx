'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
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

  const navy = tone === 'navy';

  return (
    <Breadcrumb aria-label={lo.topbar.breadcrumb}>
      <BreadcrumbList className={navy ? 'text-[#9fb0cc]' : undefined}>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${i}-${c.label}`}>
              {i > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {last || !c.href ? (
                  <BreadcrumbPage className={navy ? 'text-white' : undefined}>{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className={navy ? 'hover:text-white' : undefined}>
                    <Link href={c.href}>{c.label}</Link>
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

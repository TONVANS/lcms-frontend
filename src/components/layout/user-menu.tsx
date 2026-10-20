'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/features/auth';
import { lo } from '@/lib/i18n/lo';

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const initial = Array.from(user.fullName)[0] ?? '';

  async function handleLogout() {
    await useAuthStore.getState().logout();
    router.replace('/login?reason=logout');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={lo.topbar.userMenu}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary transition-colors duration-150 hover:bg-muted"
      >
        <Avatar>
          <AvatarFallback className="bg-[image:var(--primary-gradient)] text-xs font-semibold text-white">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{user.fullName}</span>
          <span className="text-xs font-normal text-muted-foreground">{user.departmentName}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut aria-hidden="true" />
          {lo.auth.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

import { KeyRound, LifeBuoy, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
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
import { ChangePasswordDialog } from './change-password-dialog';

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [passwordOpen, setPasswordOpen] = useState(false);
  if (!user) return null;

  const initial = Array.from(user.fullName)[0] ?? '';

  async function handleLogout() {
    await useAuthStore.getState().logout();
    toast.success(lo.auth.logoutSuccess);
    router.replace('/login?reason=logout');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={lo.topbar.userMenu}
        className="border-border bg-secondary hover:bg-muted inline-flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-150"
      >
        <Avatar>
          <AvatarFallback className="bg-[image:var(--primary-gradient)] text-xs font-semibold text-white">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-semibold">{user.fullName}</span>
          {user.employeeCode ? (
            <span className="text-muted-foreground text-xs font-normal">{user.employeeCode}</span>
          ) : null}
          <span className="text-muted-foreground text-xs font-normal">
            {user.roleTitle || lo.roles[user.role] || user.role}
          </span>
          {(user.division ?? user.department) ? (
            <span className="text-muted-foreground text-xs font-normal">
              {user.division ?? user.department}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
          <KeyRound aria-hidden="true" />
          {lo.users.changePassword}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/support">
            <LifeBuoy aria-hidden="true" />
            {lo.support.menu}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut aria-hidden="true" />
          {lo.auth.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </DropdownMenu>
  );
}

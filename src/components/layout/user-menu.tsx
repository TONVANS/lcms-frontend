'use client';

import { LifeBuoy, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
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
import { SupportDialog } from './support-dialog';

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [supportOpen, setSupportOpen] = useState(false);
  // Set on select; the dialog opens only once the menu has fully closed (see onCloseAutoFocus).
  const supportRequested = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (!user) return null;

  const initial = Array.from(user.fullName)[0] ?? '';

  async function handleLogout() {
    await useAuthStore.getState().logout();
    router.replace('/login?reason=logout');
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={triggerRef}
          aria-label={lo.topbar.userMenu}
          className="border-border bg-secondary hover:bg-muted inline-flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-150"
        >
          <Avatar>
            <AvatarFallback className="bg-[image:var(--primary-gradient)] text-xs font-semibold text-white">
              {initial}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64"
          onCloseAutoFocus={(e) => {
            // Opening a modal dialog while the menu is still closing leaves body pointer-events
            // locked and focus lost; wait for the menu cleanup, then open it.
            if (supportRequested.current) {
              supportRequested.current = false;
              e.preventDefault();
              setSupportOpen(true);
            }
          }}
        >
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-semibold">{user.fullName}</span>
            <span className="text-muted-foreground text-xs font-normal">{user.division ?? user.department}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              supportRequested.current = true;
            }}
          >
            <LifeBuoy aria-hidden="true" />
            {lo.support.menu}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleLogout}>
            <LogOut aria-hidden="true" />
            {lo.auth.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} returnFocusRef={triggerRef} />
    </>
  );
}

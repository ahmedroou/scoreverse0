
"use client";
import Link from 'next/link';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Sparkles, LogOut, ShieldCheck } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/hooks/use-language';

export function AppHeader() {
  const { isMobile } = useSidebar();
  const { currentUser, logout, isClient } = useAppContext();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-2">
        {isClient && isMobile && currentUser && <SidebarTrigger />}
        <Link href={currentUser ? "/dashboard" : "/auth"} className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          <Sparkles className="h-7 w-7" />
          <span>{t('header.title')}</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-sm text-muted-foreground block leading-tight">
                {t('header.welcome', {username: currentUser.username})}
              </span>
              {currentUser.isAdmin && (
                <Badge variant="destructive" className="mt-1 text-xs">
                  <ShieldCheck className="h-3 w-3 me-1"/> {t('header.adminMode')}
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://placehold.co/40x40.png?text=${currentUser.username.substring(0,1)}`} alt={currentUser.username} data-ai-hint="avatar user"/>
                    <AvatarFallback>{currentUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.isAdmin ? t('header.adminMode') : t('sidebar.playerStats')}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="me-2 h-4 w-4" />
                  {t('header.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}

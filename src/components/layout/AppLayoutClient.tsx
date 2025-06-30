
"use client";
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import { useAppContext } from '@/context/AppContext';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

// This component will render the correct layout based on the route and auth state.
export function AppLayoutClient({ children }: { children: ReactNode }) {
  const { currentUser, isLoadingAuth, isClient } = useAppContext();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  // Determine if the current path is a public one that doesn't require authentication.
  const isPublicPath = pathname.startsWith('/share') || pathname === '/auth' || pathname === '/';

  // This effect handles redirecting the user based on their auth state for all subsequent navigation.
  useEffect(() => {
    // We can't redirect until we are on the client and auth state is resolved.
    if (!isClient || isLoadingAuth) {
      return; 
    }

    // If the user is not logged in and is trying to access a protected page, redirect to /auth.
    if (!currentUser && !isPublicPath) {
      router.push('/auth');
    }

    // If the user *is* logged in and is on the auth page, redirect them to the dashboard.
    if (currentUser && pathname === '/auth') {
      router.push('/dashboard');
    }
  }, [currentUser, isLoadingAuth, isPublicPath, pathname, router, isClient]);


  // On the server, or on the initial client render before auth state is known,
  // we show a consistent loader to prevent hydration errors.
  if (!isClient || isLoadingAuth) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">{t('common.loading')}</p>
      </div>
    );
  }
  
  // After the client has mounted and auth is resolved, render the correct layout.
  
  // If the user is logged in and not on a public path, show the full dashboard layout.
  if (currentUser && !isPublicPath) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background text-foreground">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    );
  }

  // For public pages, or while waiting for a redirect, show a simple layout.
  return (
    <main className="flex-1 bg-background text-foreground min-h-screen">
        {children}
    </main>
  );
}

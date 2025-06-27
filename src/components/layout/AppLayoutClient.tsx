"use client";
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

// This component will render the correct layout based on the route and auth state.
function LayoutWrapper({ children }: { children: ReactNode }) {
  const { currentUser, isLoadingAuth } = useAppContext();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  // Determine if the current path is a public one that doesn't require authentication.
  const isPublicPath = pathname.startsWith('/share') || pathname === '/auth' || pathname === '/';

  // This effect handles redirecting the user based on their auth state for all subsequent navigation.
  useEffect(() => {
    if (isLoadingAuth) {
      return; // Do nothing while we are checking the auth state.
    }

    // If the user is not logged in and is trying to access a protected page, redirect to /auth.
    if (!currentUser && !isPublicPath) {
      router.push('/auth');
    }

    // If the user *is* logged in and is on the auth page, redirect them to the dashboard.
    if (currentUser && pathname === '/auth') {
      router.push('/dashboard');
    }
  }, [currentUser, isLoadingAuth, isPublicPath, pathname, router]);


  // While loading the auth state, or if we are about to redirect, show a global loader.
  if (isLoadingAuth || (!currentUser && !isPublicPath)) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">{t('common.loading')}</p>
      </div>
    );
  }

  // If the user is logged in, show the full dashboard layout with the sidebar.
  if (currentUser && !isPublicPath) {
    return (
      <SidebarProvider defaultOpen={true}>
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
      </SidebarProvider>
    );
  }

  // For logged-out users on public pages (like /auth, /share, or the root loader), show a simple layout.
  return (
    <main className="flex-1 bg-background text-foreground min-h-screen">
        {children}
    </main>
  );
}


export function AppLayoutClient({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <LayoutWrapper>{children}</LayoutWrapper>
    </AppProvider>
  );
}

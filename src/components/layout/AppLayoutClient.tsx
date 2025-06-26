
"use client";
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppProvider, useAppContext } from '@/context/AppContext'; // Import useAppContext
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Inner component to access context after AppProvider is set up
function ProtectedLayout({ children }: { children: ReactNode }) {
  const { currentUser, isLoadingAuth } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoadingAuth) {
      const isPublicPath = pathname.startsWith('/share');
      
      // Centralized redirection: always redirect from root to the main dashboard.
      // The subsequent auth checks will handle unauthenticated users correctly.
      if (pathname === '/') {
        router.push('/dashboard');
        return; // Exit early to avoid conflicting checks on the same render cycle.
      }

      if (!currentUser && pathname !== '/auth' && !isPublicPath) {
        router.push('/auth');
      } else if (currentUser && pathname === '/auth') {
        router.push('/dashboard'); // Redirect to dashboard if logged in and on auth page
      }
    }
  }, [currentUser, isLoadingAuth, pathname, router]);

  if (isLoadingAuth && !pathname.startsWith('/share')) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading ScoreVerse...</p>
      </div>
    );
  }
  
  const isAuthPage = pathname === '/auth';
  const isPublicPage = pathname.startsWith('/share');

  // If user is not logged in and we are trying to access a protected page
  // and not yet redirected, show loading or null to prevent flashing content.
  if (!currentUser && !isAuthPage && !isPublicPage) {
     return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Redirecting to login...</p>
      </div>
    );
  }

  // If user is logged in and on /auth page, show loading until redirected.
  if (currentUser && isAuthPage) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading dashboard...</p>
      </div>
    );
  }


  // Render pages without sidebar/header if on /auth or a public /share page
  if (isAuthPage || isPublicPage) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen">
         {children}
      </main>
    );
  }

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


export function AppLayoutClient({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </AppProvider>
  );
}


"use client";
import type { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppProvider } from '@/context/AppContext';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export function AppLayoutClient({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
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
    </AppProvider>
  );
}

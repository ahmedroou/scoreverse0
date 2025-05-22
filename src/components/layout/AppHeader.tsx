
"use client";
import Link from 'next/link';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react'; // Using Sparkles as a logo icon

export function AppHeader() {
  const { isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger />}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          <Sparkles className="h-7 w-7" />
          <span>ScoreVerse</span>
        </Link>
      </div>
      {/* Add any header actions here if needed, e.g., User Profile Dropdown */}
    </header>
  );
}


"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Home, Swords, PlusCircle, BarChart3, History, Settings, Sparkles, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/games', label: 'Game Library', icon: Swords },
  { href: '/add-result', label: 'Add Game Result', icon: PlusCircle },
  { href: '/leaderboards', label: 'Leaderboards', icon: BarChart3 },
  { href: '/match-history', label: 'Match History', icon: History },
  // { href: '/settings', label: 'Settings', icon: Settings }, // Future feature
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarHeader className="p-4 justify-center items-center hidden md:flex">
        {/* Logo or App Name for collapsed state could go here if desired */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  aria-label={item.label}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 hidden md:block">
        {/* Footer content if any, e.g., version, links */}
         <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            <Github className="h-4 w-4" /> 
            <span>View on GitHub</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

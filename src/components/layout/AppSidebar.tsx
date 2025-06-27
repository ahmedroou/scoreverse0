
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
import { Button } from '@/components/ui/button'; 
import { Home, Swords, PlusCircle, BarChart3, History, Settings, Sparkles, Github, Users as UsersIcon, LayoutDashboard, Layers, BarChartHorizontal, Trophy, Award, Shuffle, UserCog } from 'lucide-react'; 
import { useAppContext } from '@/context/AppContext';
import { useLanguage } from '@/hooks/use-language';

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser } = useAppContext();
  const { t, language } = useLanguage();

  const navItems = [
    { href: '/dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { href: '/add-result', label: t('sidebar.addResult'), icon: PlusCircle },
    { href: '/draw', label: t('sidebar.generateDraw'), icon: Shuffle },
    { href: '/leaderboards', label: t('sidebar.leaderboards'), icon: BarChart3 },
    { href: '/stats', label: t('sidebar.playerStats'), icon: BarChartHorizontal },
    { href: '/match-history', label: t('sidebar.matchHistory'), icon: History },
    { href: '/tournaments', label: t('sidebar.tournaments'), icon: Trophy },
    { href: '/trophies', label: t('sidebar.trophyRoom'), icon: Award },
    { href: '/players', label: t('sidebar.managePlayers'), icon: UsersIcon },
    { href: '/games', label: t('sidebar.gameLibrary'), icon: Swords },
    { href: '/spaces', label: t('sidebar.manageSpaces'), icon: Layers }, 
    { href: '/users', label: t('sidebar.manageUsers'), icon: UserCog, adminOnly: true },
  ];

  const visibleNavItems = navItems.filter(item => !item.adminOnly || currentUser?.isAdmin);


  return (
    <Sidebar collapsible="icon" side={language === 'ar' ? 'right' : 'left'} variant="sidebar">
      <SidebarHeader className="p-4 justify-center items-center hidden md:flex">
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
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
         <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            <Github className="h-4 w-4" /> 
            <span>View on GitHub</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

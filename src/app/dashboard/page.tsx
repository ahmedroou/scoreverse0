
"use client";

import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, BarChart3, History, Users, Swords, Layers, UserCircle, Shuffle, Award, Trophy, BarChartHorizontal, UserCog } from 'lucide-react';
import React from 'react';
import { useLanguage } from '@/hooks/use-language';

export default function DashboardPage() {
  const { currentUser, isClient, getActiveSpace, isLoadingAuth } = useAppContext();
  const { t } = useLanguage();
  const activeSpace = getActiveSpace();

  if (!isClient || isLoadingAuth) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))]">
        <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('dashboard.loadingUserData')}</p>
      </div>
    );
  }
  
  if (!currentUser && !isLoadingAuth) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))]">
        <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('dashboard.loginPrompt')}</p>
         <Link href="/auth" passHref legacyBehavior>
            <Button className="mt-4">{t('dashboard.goToLogin')}</Button>
         </Link>
      </div>
    );
  }
  
  if (!currentUser) return null; 

  const quickAccessItems = [
    { title: t('sidebar.addResult'), href: "/add-result", icon: PlusCircle, description: t('dashboard.quickAccess.recordMatchDesc') },
    { title: t('sidebar.leaderboards'), href: "/leaderboards", icon: BarChart3, description: t('dashboard.quickAccess.leaderboardsDesc') },
    { title: t('sidebar.matchHistory'), href: "/match-history", icon: History, description: t('dashboard.quickAccess.matchHistoryDesc') },
    { title: t('sidebar.managePlayers'), href: "/players", icon: Users, description: t('dashboard.quickAccess.managePlayersDesc') },
    { title: t('sidebar.gameLibrary'), href: "/games", icon: Swords, description: t('dashboard.quickAccess.gameLibraryDesc') },
    { title: t('sidebar.manageSpaces'), href: "/spaces", icon: Layers, description: t('dashboard.quickAccess.manageSpacesDesc') },
  ];

  return (
    <div className="container mx-auto py-8">
      <header className="mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">
                  {t('dashboard.title', {username: currentUser.username})}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {activeSpace ? t('dashboard.activeSpace', {spaceName: activeSpace.name}) : t('dashboard.noActiveSpace')}
                </p>
            </div>
             {activeSpace && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border border-border rounded-lg bg-card shadow-sm whitespace-nowrap">
                    <Layers className="h-5 w-5 text-accent"/>
                    <span>Active Space: <strong className="text-accent">{activeSpace.name}</strong></span>
                </div>
            )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickAccessItems.map((item) => (
          <Card key={item.title} className="hover:shadow-xl transition-shadow duration-200 ease-in-out bg-card border-border hover:border-primary/70 flex flex-col">
            <CardHeader className="flex flex-row items-center space-x-4 pb-3">
              <item.icon className="w-8 h-8 text-primary" />
              <CardTitle className="text-xl font-semibold text-card-foreground">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
            </CardContent>
            <CardContent className="pt-0">
               <Link href={item.href} passHref legacyBehavior>
                <Button 
                    variant="default" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {t('dashboard.goTo', {page: item.title})}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}

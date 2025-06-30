
"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trophy, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { AddTournamentForm } from './AddTournamentForm';
import { TournamentCard } from '@/components/TournamentCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/hooks/use-language';

export default function ManageTournamentsPage() {
  const { tournaments, getGameById, getGameLeaderboard, isClient, currentUser, getUserById, activeSpaceId } = useAppContext();
  const { t } = useLanguage();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  if (!isClient) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (!currentUser) {
    return (
       <div className="container mx-auto py-8">
           <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
               <CardHeader><CardTitle>{t('draw.accessDenied')}</CardTitle></CardHeader>
               <CardContent>
                   <p>{t('dashboard.loginPrompt')}</p>
                   <Link href="/auth" passHref legacyBehavior><Button className="mt-4 w-full">{t('dashboard.goToLogin')}</Button></Link>
               </CardContent>
           </Card>
       </div>
   );
  }

  const relevantTournaments = useMemo(() => {
    // spaceId can be undefined for global context, activeSpaceId can be null.
    // This logic handles both cases correctly.
    const currentSpace = activeSpaceId || undefined;
    return tournaments.filter(t => (t.spaceId || undefined) === currentSpace);
  }, [tournaments, activeSpaceId]);

  const activeTournaments = relevantTournaments.filter(t => t.status === 'active');
  const completedTournaments = relevantTournaments.filter(t => t.status === 'completed');

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-2"><Trophy /> {t('tournaments.pageTitle')}</h1>
          <p className="text-lg text-muted-foreground">{t('tournaments.pageDescription')}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="me-2 h-5 w-5" /> {t('tournaments.createButton')}
        </Button>
      </header>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">{t('tournaments.activeTab', {count: activeTournaments.length})}</TabsTrigger>
            <TabsTrigger value="completed">{t('tournaments.completedTab', {count: completedTournaments.length})}</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
            {activeTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTournaments.map(t => {
                        const owner = currentUser.isAdmin ? getUserById(t.ownerId) : undefined;
                        const game = getGameById(t.gameId);
                        const leaderboard = game ? getGameLeaderboard(t.gameId) : [];
                        const leader = leaderboard[0];
                        return (
                           <Link key={t.id} href={`/tournaments/${t.id}`} className="block hover:scale-[1.02] transition-transform duration-200 h-full">
                             <TournamentCard 
                                tournament={t}
                                game={game}
                                leader={leader}
                                ownerUsername={owner?.username}
                              />
                           </Link>
                        )
                    })}
                </div>
            ) : <p className="text-center text-muted-foreground py-8">{t('tournaments.noActive')}</p>}
        </TabsContent>
         <TabsContent value="completed" className="mt-6">
            {completedTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedTournaments.map(t => {
                        const owner = currentUser.isAdmin ? getUserById(t.ownerId) : undefined;
                        const game = getGameById(t.gameId);
                        const leaderboard = game ? getGameLeaderboard(t.gameId) : [];
                        const winner = leaderboard.find(p => p.playerId === t.winnerPlayerId)
                        return (
                           <Link key={t.id} href={`/tournaments/${t.id}`} className="block hover:scale-[1.02] transition-transform duration-200 h-full">
                             <TournamentCard 
                                tournament={t}
                                game={game}
                                leader={winner} // For completed, the leader is the winner
                                ownerUsername={owner?.username}
                              />
                           </Link>
                        )
                    })}
                </div>
            ) : <p className="text-center text-muted-foreground py-8">{t('tournaments.noCompleted')}</p>}
        </TabsContent>
      </Tabs>
      
      <AddTournamentForm isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}

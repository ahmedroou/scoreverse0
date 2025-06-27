
"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trophy, PlusCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { AddTournamentForm } from './AddTournamentForm';
import { EditTournamentForm } from './EditTournamentForm';
import { TournamentCard } from './TournamentCard';
import type { Tournament } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/hooks/use-language';

export default function ManageTournamentsPage() {
  const { tournaments, deleteTournament, getGameById, getPlayerById, isClient, currentUser, getUserById } = useAppContext();
  const { t } = useLanguage();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);

  const handleEditClick = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (tournament: Tournament) => {
    setTournamentToDelete(tournament);
  };

  const confirmDelete = () => {
    if (tournamentToDelete) {
      deleteTournament(tournamentToDelete.id);
      setTournamentToDelete(null);
    }
  };

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

  const activeTournaments = tournaments.filter(t => t.status === 'active');
  const completedTournaments = tournaments.filter(t => t.status === 'completed');

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeTournaments.map(t => {
                        const canEdit = currentUser.isAdmin || currentUser.id === t.ownerId;
                        const owner = currentUser.isAdmin ? getUserById(t.ownerId) : undefined;
                        return (
                           <TournamentCard 
                                key={t.id}
                                tournament={t}
                                game={getGameById(t.gameId)}
                                onEdit={() => handleEditClick(t)}
                                onDelete={() => handleDeleteClick(t)}
                                canEdit={canEdit}
                                ownerUsername={owner?.username}
                            />
                        )
                    })}
                </div>
            ) : <p className="text-center text-muted-foreground py-8">{t('tournaments.noActive')}</p>}
        </TabsContent>
         <TabsContent value="completed" className="mt-6">
            {completedTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completedTournaments.map(t => {
                        const canEdit = currentUser.isAdmin || currentUser.id === t.ownerId;
                        const owner = currentUser.isAdmin ? getUserById(t.ownerId) : undefined;
                        return (
                           <TournamentCard 
                                key={t.id}
                                tournament={t}
                                game={getGameById(t.gameId)}
                                winner={getPlayerById(t.winnerPlayerId || '')}
                                onEdit={() => handleEditClick(t)}
                                onDelete={() => handleDeleteClick(t)}
                                canEdit={canEdit}
                                ownerUsername={owner?.username}
                            />
                        )
                    })}
                </div>
            ) : <p className="text-center text-muted-foreground py-8">{t('tournaments.noCompleted')}</p>}
        </TabsContent>
      </Tabs>
      
      <AddTournamentForm isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      
      {editingTournament && (
        <EditTournamentForm 
            isOpen={isEditDialogOpen} 
            onOpenChange={setIsEditDialogOpen} 
            tournament={editingTournament} 
        />
      )}

      {tournamentToDelete && (
         <AlertDialog open={!!tournamentToDelete} onOpenChange={() => setTournamentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert/>{t('tournaments.deleteDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('tournaments.deleteDialog.description', {tournamentName: tournamentToDelete.name})}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                  {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

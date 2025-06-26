
"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export default function ManageTournamentsPage() {
  const { tournaments, deleteTournament, getGameById, getPlayerById, isClient, currentUser, getUserById } = useAppContext();
  
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
               <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
               <CardContent>
                   <p>Please log in to manage tournaments.</p>
                   <Link href="/auth" passHref legacyBehavior><Button className="mt-4 w-full">Go to Login</Button></Link>
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
          <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-2"><Trophy /> Tournaments</h1>
          <p className="text-lg text-muted-foreground">Create and manage tournaments to crown a champion.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Tournament
        </Button>
      </header>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active ({activeTournaments.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTournaments.length})</TabsTrigger>
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
            ) : <p className="text-center text-muted-foreground py-8">No active tournaments. Create one to get started!</p>}
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
            ) : <p className="text-center text-muted-foreground py-8">No tournaments have been completed yet.</p>}
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
              <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert/>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the tournament "{tournamentToDelete.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}


"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EditPlayerForm } from './EditPlayerForm';
import { AddPlayerForm } from './AddPlayerForm';
import type { Player } from '@/types';
import { Loader2, Users, Edit3, UserPlus, Trash2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ManagePlayersPage() {
  const { players, deletePlayer, isClient, currentUser } = useAppContext();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  // playerToDelete state is no longer needed for dialog visibility control here.
  // Each AlertDialog will manage its own open state.

  const handleEditClick = (player: Player) => {
    setEditingPlayer(player);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingPlayer(null);
  };

  const handleAddPlayerDialogOpen = () => {
    setIsAddPlayerDialogOpen(true);
  };

  const handleAddPlayerDialogClose = () => {
    setIsAddPlayerDialogOpen(false);
  };

  if (!isClient) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading players...</span></div>;
  }

  if (!currentUser) {
     return (
        <div className="container mx-auto py-8">
            <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please log in to manage players.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Users /> Manage Players
          </CardTitle>
          <CardDescription>
            View, edit, add, or delete players in ScoreVerse.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {players.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No players found. Start by adding some!</p>
          ) : (
            <ul className="space-y-3">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <Link href={`/profile/${player.id}`} passHref legacyBehavior>
                    <a className="flex items-center gap-3 cursor-pointer hover:underline flex-grow">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${player.name.substring(0,1)}`} alt={player.name} data-ai-hint="avatar user"/>
                        <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-lg text-card-foreground">{player.name}</span>
                    </a>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(player)} className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                      <Edit3 className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                          <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="text-destructive h-6 w-6"/>
                            Are you sure you want to delete this player?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. Deleting "{player.name}" will remove them from the player list and all associated match records.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePlayer(player.id)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Delete Player
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="border-t border-border pt-6">
          <Button onClick={handleAddPlayerDialogOpen} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <UserPlus className="h-5 w-5 mr-2" />
            Add New Player
          </Button>
        </CardFooter>
      </Card>

      {editingPlayer && (
        <EditPlayerForm
          player={editingPlayer}
          isOpen={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
        />
      )}
      
      <AddPlayerForm 
        isOpen={isAddPlayerDialogOpen}
        onOpenChange={handleAddPlayerDialogClose}
      />

      {/* The global AlertDialog previously here has been removed. 
          Each player item now has its own self-contained AlertDialog. */}
    </div>
  );
}


"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EditPlayerForm } from './EditPlayerForm';
import type { Player } from '@/types';
import { Loader2, Users, Edit3 } from 'lucide-react';

export default function ManagePlayersPage() {
  const { players, isClient } = useAppContext();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (player: Player) => {
    setEditingPlayer(player);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingPlayer(null);
  };
  
  if (!isClient) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading players...</span></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Users /> Manage Players
          </CardTitle>
          <CardDescription>
            View and update player information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {players.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No players found.</p>
          ) : (
            <ul className="space-y-3">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://placehold.co/40x40.png?text=${player.name.substring(0,1)}`} alt={player.name} data-ai-hint="avatar user" />
                      <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-lg text-card-foreground">{player.name}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(player)} className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Name
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {editingPlayer && (
        <EditPlayerForm
          player={editingPlayer}
          isOpen={isEditDialogOpen}
          onOpenChange={handleDialogClose}
        />
      )}
    </div>
  );
}

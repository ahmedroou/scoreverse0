
"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EditPlayerForm } from './EditPlayerForm';
import { AddPlayerForm } from './AddPlayerForm';
import type { Player } from '@/types';
import { Loader2, Users, Edit3, UserPlus, Trash2, ShieldAlert, BarChartHorizontal, UserCog } from 'lucide-react';
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
import { useLanguage } from '@/hooks/use-language';

// Helper function to generate a consistent "random" color from a string
const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};


export default function ManagePlayersPage() {
  const { players, deletePlayer, isClient, currentUser, getUserById } = useAppContext();
  const { t } = useLanguage();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);

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
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ms-2">{t('common.loading')}</span></div>;
  }

  if (!currentUser) {
     return (
        <div className="container mx-auto py-8">
            <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">{t('draw.accessDenied')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{t('dashboard.loginPrompt')}</p>
                     <Link href="/auth" passHref legacyBehavior>
                        <Button className="mt-4 w-full">{t('dashboard.goToLogin')}</Button>
                     </Link>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Users /> {t('players.pageTitle')}
          </CardTitle>
          <CardDescription>
            {currentUser.isAdmin ? t('players.pageDescriptionAdmin') : t('players.pageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {players.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('players.noPlayers')}</p>
          ) : (
            <ul className="space-y-3">
              {players.map((player) => {
                const owner = currentUser.isAdmin ? getUserById(player.ownerId) : null;
                const canEdit = currentUser.isAdmin || currentUser.id === player.ownerId;
                return (
                <li
                  key={player.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-grow min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.avatarUrl} alt={player.name} />
                      <AvatarFallback style={{ backgroundColor: stringToHslColor(player.name, 50, 60) }}>
                        {player.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                        <span className="font-medium text-lg text-card-foreground truncate">{player.name}</span>
                        {owner && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <UserCog className="h-3 w-3"/>
                                {t('players.owner', {username: owner.username})}
                            </div>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                     <Link href={`/stats/${player.id}`} passHref legacyBehavior>
                        <Button variant="outline" size="sm" className="border-primary/50 text-primary/90 hover:bg-primary/10 hover:text-primary">
                            <BarChartHorizontal className="h-4 w-4 me-1 sm:me-2" />
                            <span className="hidden sm:inline">{t('players.stats')}</span>
                        </Button>
                    </Link>
                    {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(player)} className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                      <Edit3 className="h-4 w-4 me-1 sm:me-2" />
                      <span className="hidden sm:inline">{t('common.edit')}</span>
                    </Button>
                    )}
                    
                    {canEdit && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                          <Trash2 className="h-4 w-4 me-1 sm:me-2" />
                          <span className="hidden sm:inline">{t('common.delete')}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="text-destructive h-6 w-6"/>
                            {t('players.deleteConfirmTitle')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('players.deleteConfirmDescriptionNew', {playerName: player.name})}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePlayer(player.id)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            {t('players.deleteButton')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    )}
                  </div>
                </li>
              )})}
            </ul>
          )}
        </CardContent>
        <CardFooter className="border-t border-border pt-6">
          <Button onClick={handleAddPlayerDialogOpen} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <UserPlus className="h-5 w-5 me-2" />
            {t('players.addNewPlayer')}
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
    </div>
  );
}

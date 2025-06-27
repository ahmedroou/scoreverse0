
"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Loader2, Trophy, Gamepad2, Flag, Star, Edit3, Trash2, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '@/hooks/use-language';
import type { Tournament } from '@/types';
import { EditTournamentForm } from '../EditTournamentForm';
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

const stringToHslColor = (str: string, s: number, l: number): string => {
  if (!str) return `hsl(0, ${s}%, ${l}%)`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};


export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { 
      tournaments, 
      getGameById, 
      getGameLeaderboard, 
      getPlayerById, 
      isClient,
      currentUser,
      deleteTournament,
  } = useAppContext();
  
  const tournamentId = Array.isArray(params.tournamentId) ? params.tournamentId[0] : params.tournamentId;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);

  const tournament = tournaments.find(t => t.id === tournamentId);
  const game = tournament ? getGameById(tournament.gameId) : undefined;
  const leaderboard = tournament ? getGameLeaderboard(tournament.gameId) : [];
  
  if (!isClient || !currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!tournament || !game) {
    return (
       <div className="container mx-auto py-8 text-center">
        <Trophy className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-destructive">{t('tournaments.details.notFound')}</h1>
        <p className="text-muted-foreground mt-2">{t('tournaments.details.notFoundDesc')}</p>
         <Link href="/tournaments" passHref legacyBehavior>
            <Button className="mt-6">
                <ArrowLeft className="me-2 h-4 w-4" />
                {t('tournaments.details.backButton')}
            </Button>
         </Link>
      </div>
    );
  }
  
  const leader = leaderboard?.[0];
  const progress = leader ? Math.min((leader.totalPoints / tournament.targetPoints) * 100, 100) : 0;
  const winner = tournament.status === 'completed' && tournament.winnerPlayerId 
    ? getPlayerById(tournament.winnerPlayerId) 
    : null;

  const canEdit = currentUser.isAdmin || currentUser.id === tournament.ownerId;
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "PPP");
    } catch {
      return "Invalid Date";
    }
  };
  
  const confirmDelete = () => {
    if (tournamentToDelete) {
      deleteTournament(tournamentToDelete.id);
      router.push('/tournaments');
      setTournamentToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
       <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <Link href="/tournaments" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
             <ArrowLeft className="h-4 w-4" /> {t('tournaments.details.backButton')}
           </Link>
          <div className="flex items-center gap-3">
            <Trophy className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">{tournament.name}</h1>
                <p className="text-lg text-muted-foreground flex items-center gap-2"><Gamepad2 className="h-5 w-5" /> {game.name}</p>
            </div>
          </div>
        </div>
        {canEdit && (
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)} disabled={tournament.status === 'completed'}>
                    <Edit3 className="h-4 w-4 me-1.5" /> {t('common.edit')}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setTournamentToDelete(tournament)}>
                    <Trash2 className="h-4 w-4 me-1.5" /> {t('common.delete')}
                </Button>
            </div>
        )}
      </header>
      
      {tournament.status === 'completed' && winner ? (
         <Card className="bg-yellow-500/10 border-yellow-500/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-yellow-600">
                    <Star className="h-6 w-6"/>
                    {t('tournaments.details.winnerTitle')}
                </CardTitle>
                <CardDescription>
                    {t('tournaments.details.completedOn', {date: formatDate(tournament.dateCompleted)})}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-yellow-500">
                    <AvatarImage src={winner.avatarUrl} alt={winner.name} />
                    <AvatarFallback style={{ backgroundColor: stringToHslColor(winner.name, 50, 60) }} className="text-2xl">
                        {winner.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <p className="text-3xl font-bold text-yellow-700">{winner.name}</p>
            </CardContent>
         </Card>
      ) : (
        <Card>
            <CardHeader>
                <CardTitle>{t('tournaments.details.progressTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span>
                        {leader ? `${t('tournaments.details.leader')}: ${leader.playerName}` : t('tournaments.details.noProgress')}
                    </span>
                    <div className="flex items-center gap-1">
                       <Flag className="h-4 w-4"/>
                       <span>{leader ? `${leader.totalPoints} / ${tournament.targetPoints}`: t('tournaments.card.points', {count: tournament.targetPoints})}</span>
                    </div>
                </div>
                <Progress value={progress} className="h-3" />
            </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">{t('tournaments.details.standings')}</h2>
        <LeaderboardTable scores={leaderboard} />
      </div>

      {isEditDialogOpen && (
        <EditTournamentForm 
            isOpen={isEditDialogOpen} 
            onOpenChange={setIsEditDialogOpen} 
            tournament={tournament} 
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
  )
}


"use client";

import type { Tournament, Player, Game } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Trophy, Gamepad2, Flag, Edit3, Trash2, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '@/hooks/use-language';

interface TournamentCardProps {
  tournament: Tournament;
  game?: Game;
  winner?: Player;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  ownerUsername?: string;
}

export function TournamentCard({ tournament, game, winner, onEdit, onDelete, canEdit, ownerUsername }: TournamentCardProps) {
  const { t } = useLanguage();
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PPP"); // E.g., Jun 21, 2023
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <Card className={`border hover:shadow-md transition-shadow duration-150 bg-card ${tournament.status === 'completed' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border'}`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
            <div className='flex-grow'>
                <CardTitle className="text-xl font-semibold flex items-center gap-2 text-primary">
                    <Trophy className="h-6 w-6" />
                    {tournament.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                    <Gamepad2 className="h-4 w-4" />
                    {t('tournaments.card.game', {gameName: game?.name || '...'})}
                </CardDescription>
            </div>
            <Badge variant={tournament.status === 'completed' ? 'default' : 'secondary'} className={`${tournament.status === 'completed' ? 'bg-yellow-500/80 text-white' : ''}`}>
                {t(tournament.status === 'completed' ? 'tournaments.card.statusCompleted' : 'tournaments.card.statusActive')}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-lg">
            <Flag className="h-5 w-5 text-accent"/>
            <span className="text-muted-foreground">{t('tournaments.card.targetScore')}</span>
            <strong className="text-accent">{t('tournaments.card.points', {count: tournament.targetPoints})}</strong>
        </div>
        {tournament.status === 'completed' && winner && (
            <div className="flex items-center gap-2 text-lg pt-2 border-t border-border">
                <Trophy className="h-5 w-5 text-yellow-500"/>
                <span className="text-muted-foreground">{t('tournaments.card.winner')}</span>
                <strong className="text-yellow-500">{winner.name}</strong>
            </div>
        )}
        {tournament.dateCompleted && (
             <p className="text-xs text-muted-foreground">{t('tournaments.card.completedOn', {date: formatDate(tournament.dateCompleted)})}</p>
        )}
        {ownerUsername && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                <UserCog className="h-3 w-3"/>
                {t('players.owner', {username: ownerUsername})}
            </div>
        )}
      </CardContent>
      {canEdit && (
        <CardFooter className="flex justify-end gap-2 border-t border-border/50 pt-3 px-4 pb-4">
          <Button variant="outline" size="sm" onClick={onEdit} disabled={tournament.status === 'completed'}>
            <Edit3 className="h-4 w-4 me-1.5" /> {t('common.edit')}
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 me-1.5" /> {t('common.delete')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

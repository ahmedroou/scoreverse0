
"use client";

import type { Tournament, Player, Game, ScoreData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Trophy, Gamepad2, Flag, UserCog, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface TournamentCardProps {
  tournament: Tournament;
  game?: Game;
  leader?: ScoreData;
  ownerUsername?: string;
}

export function TournamentCard({ tournament, game, leader, ownerUsername }: TournamentCardProps) {
  const { t } = useLanguage();
  
  const progress = leader ? Math.min((leader.totalPoints / tournament.targetPoints) * 100, 100) : 0;
  const winner = tournament.status === 'completed' && leader && leader.totalPoints >= tournament.targetPoints ? leader : null;

  return (
    <Link href={`/tournaments/${tournament.id}`} className="block h-full">
      <Card className={`border hover:shadow-lg transition-all duration-200 ease-in-out bg-card flex flex-col h-full hover:scale-[1.02] hover:border-primary ${tournament.status === 'completed' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border'}`}>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-4">
              <div className='flex-grow min-w-0'>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2 text-primary truncate">
                      <Trophy className="h-6 w-6 flex-shrink-0" />
                      <span className="truncate" title={tournament.name}>{tournament.name}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1 text-sm">
                      <Gamepad2 className="h-4 w-4" />
                      {t('tournaments.card.game', {gameName: game?.name || '...'})}
                  </CardDescription>
              </div>
              <Badge variant={tournament.status === 'completed' ? 'default' : 'secondary'} className={`whitespace-nowrap ${tournament.status === 'completed' ? 'bg-yellow-500/80 text-white' : ''}`}>
                  {t(tournament.status === 'completed' ? 'tournaments.card.statusCompleted' : 'tournaments.card.statusActive')}
              </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          <div className="flex items-center gap-2 text-md">
              <Flag className="h-5 w-5 text-accent"/>
              <span className="text-muted-foreground">{t('tournaments.card.targetScore')}</span>
              <strong className="text-accent">{t('tournaments.card.points', {count: tournament.targetPoints})}</strong>
          </div>

          {tournament.status === 'completed' && winner ? (
              <div className="flex items-center gap-2 text-md pt-2 border-t border-border/50">
                  <Star className="h-5 w-5 text-yellow-500"/>
                  <span className="text-muted-foreground">{t('tournaments.card.winner')}</span>
                  <strong className="text-yellow-500">{winner.playerName}</strong>
              </div>
          ) : (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className='font-medium'>{leader ? `${t('tournaments.details.leader')}: ${leader.playerName}` : t('tournaments.details.noProgress')}</span>
                <span>{leader ? `${leader.totalPoints} / ${tournament.targetPoints}`: ''}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {ownerUsername && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                  <UserCog className="h-3 w-3"/>
                  {t('players.owner', {username: ownerUsername})}
              </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

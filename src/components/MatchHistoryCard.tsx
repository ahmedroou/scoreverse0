
"use client";
import type { Match, Game, Player } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'; // Removed CardFooter as it's not used
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, CalendarDays, Bot, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getGameIcon } from './icons';

interface MatchHistoryCardProps {
  match: Match;
  game: Game | undefined;
  getPlayerById: (id: string) => Player | undefined;
}

export function MatchHistoryCard({ match, game, getPlayerById }: MatchHistoryCardProps) {
  const gameName = game?.name || 'Unknown Game';
  const GameIconComponent = getGameIcon(game?.icon);

  const participantNames = match.playerIds.map(id => getPlayerById(id)?.name || 'Unknown Player');
  const winnerNames = match.winnerIds.map(id => getPlayerById(id)?.name || 'Unknown Player');

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PPPp"); // E.g., Jun 21, 2023, 4:30 PM
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  return (
    <Card className="bg-card border-border shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-grow">
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <GameIconComponent className="w-6 h-6 text-primary flex-shrink-0" />
              <span className="truncate" title={gameName}>{gameName}</span>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground flex items-center mt-1.5">
              <CalendarDays className="w-4 h-4 mr-1.5 flex-shrink-0" />
              {formatDate(match.date)}
            </CardDescription>
          </div>
          {match.winnerIds.length > 0 && (
            <Badge variant="default" className="text-sm bg-primary text-primary-foreground self-start whitespace-nowrap py-1 px-2.5">
              <Trophy className="w-4 h-4 mr-1.5" /> {match.winnerIds.length > 1 ? 'Winners' : 'Winner'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-sm">
        <div>
          <h4 className="font-medium text-card-foreground/90 mb-1.5 flex items-center"><Users className="w-4 h-4 mr-1.5 text-muted-foreground" /> Participants:</h4>
          <div className="flex flex-wrap gap-2">
            {participantNames.map((name, index) => (
              <Badge key={`${name}-${index}`} variant="secondary" className="bg-muted text-muted-foreground font-normal">{name}</Badge>
            ))}
          </div>
        </div>
        
        {winnerNames.length > 0 && (
          <div>
            <h4 className="font-medium text-card-foreground/90 mb-1.5 flex items-center"><Star className="w-4 h-4 mr-1.5 text-yellow-400" /> Victorious:</h4>
            <div className="flex flex-wrap gap-2">
              {winnerNames.map((name, index) => (
                <Badge key={`${name}-winner-${index}`} variant="default" className="bg-primary/90 text-primary-foreground shadow-sm font-medium">{name}</Badge>
              ))}
            </div>
          </div>
        )}

        {match.pointsAwarded && match.pointsAwarded.filter(p => p.points !== 0).length > 0 && (
           <div>
            <h4 className="font-medium text-card-foreground/90 mb-1.5">Points Awarded:</h4>
            <ul className="list-disc list-inside pl-1 space-y-0.5 text-muted-foreground">
              {match.pointsAwarded.filter(p => p.points !== 0).map(pa => {
                const playerName = getPlayerById(pa.playerId)?.name || 'Unknown Player';
                return (
                  <li key={pa.playerId}>
                    {playerName}: <span className={`font-semibold ${pa.points > 0 ? 'text-green-500' : 'text-red-500'}`}>{pa.points > 0 ? '+' : ''}{pa.points}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {match.handicapSuggestions && match.handicapSuggestions.some(s => s.handicap !== undefined) && (
          <div className="pt-3 border-t border-border/50 mt-3">
            <h4 className="font-medium text-card-foreground/90 mb-1.5 flex items-center"><Bot className="w-4 h-4 mr-1.5 text-accent" /> AI Handicaps Applied:</h4>
            <ul className="list-disc list-inside pl-1 space-y-0.5 text-xs text-muted-foreground">
              {match.handicapSuggestions.filter(s => s.handicap !== undefined).map((suggestion, idx) => (
                <li key={idx}>
                  <span className="font-medium text-card-foreground/80">{suggestion.playerName}:</span> {suggestion.handicap}
                  {suggestion.reason && <span className="italic ml-1">({suggestion.reason})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


"use client";
import type { Match, Game, Player } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, CalendarDays, Bot, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface MatchHistoryCardProps {
  match: Match;
  game: Game | undefined;
  players: Player[]; // All players, to resolve names
  getPlayerById: (id: string) => Player | undefined;
}

export function MatchHistoryCard({ match, game, getPlayerById }: MatchHistoryCardProps) {
  const gameName = game?.name || 'Unknown Game';
  const gameIcon = game?.icon ? <game.icon className="w-5 h-5 mr-2 text-primary" /> : null;

  const participantNames = match.playerIds.map(id => getPlayerById(id)?.name || 'Unknown Player');
  const winnerNames = match.winnerIds.map(id => getPlayerById(id)?.name || 'Unknown Player');

  return (
    <Card className="mb-4 bg-card border-border shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold text-primary flex items-center">
              {gameIcon}
              {gameName}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground flex items-center mt-1">
              <CalendarDays className="w-4 h-4 mr-1.5" />
              {format(parseISO(match.date), "PPPp")}
            </CardDescription>
          </div>
          {match.winnerIds.length > 0 && (
            <Badge variant="default" className="text-sm bg-primary text-primary-foreground">
              <Trophy className="w-4 h-4 mr-1.5" /> Winner{match.winnerIds.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <h4 className="font-medium text-primary-foreground/80 mb-1 flex items-center"><Users className="w-4 h-4 mr-1.5" /> Participants:</h4>
          <div className="flex flex-wrap gap-2">
            {participantNames.map(name => (
              <Badge key={name} variant="secondary" className="bg-accent/20 text-accent-foreground">{name}</Badge>
            ))}
          </div>
        </div>
        
        {winnerNames.length > 0 && (
          <div>
            <h4 className="font-medium text-primary-foreground/80 mb-1 flex items-center"><Star className="w-4 h-4 mr-1.5 text-yellow-400" /> Victorious:</h4>
            <div className="flex flex-wrap gap-2">
              {winnerNames.map(name => (
                <Badge key={name} variant="default" className="bg-primary text-primary-foreground shadow-sm">{name}</Badge>
              ))}
            </div>
          </div>
        )}

        {match.pointsAwarded.length > 0 && (
           <div>
            <h4 className="font-medium text-primary-foreground/80 mb-1">Points Awarded:</h4>
            <ul className="list-disc list-inside pl-1 space-y-0.5 text-muted-foreground">
              {match.pointsAwarded.filter(p => p.points !== 0).map(pa => ( // Only show if points are not zero
                <li key={pa.playerId}>
                  {getPlayerById(pa.playerId)?.name || 'Unknown'}: <span className={`font-semibold ${pa.points > 0 ? 'text-green-400' : 'text-red-400'}`}>{pa.points > 0 ? '+' : ''}{pa.points}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {match.handicapSuggestions && match.handicapSuggestions.some(s => s.handicap !== undefined) && (
          <div className="pt-2 border-t border-border mt-3">
            <h4 className="font-medium text-primary-foreground/80 mb-1 flex items-center"><Bot className="w-4 h-4 mr-1.5 text-accent" /> AI Handicaps Applied:</h4>
            <ul className="list-disc list-inside pl-1 space-y-0.5 text-xs text-muted-foreground">
              {match.handicapSuggestions.filter(s => s.handicap !== undefined).map((suggestion, idx) => (
                <li key={idx}>
                  {suggestion.playerName}: <span className="font-medium">{suggestion.handicap}</span>
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

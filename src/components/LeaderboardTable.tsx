
"use client";
import type { ScoreData } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardTableProps {
  scores: ScoreData[];
  title?: string;
}

const getRankIndicator = (rank: number) => {
  if (rank === 1) return <Medal className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-orange-400" />;
  return <span className="font-semibold text-muted-foreground">{rank}</span>;
};

const getWinRatePercentage = (wins: number, gamesPlayed: number) => {
  if (gamesPlayed === 0) return "0%";
  return `${((wins / gamesPlayed) * 100).toFixed(1)}%`;
};

export function LeaderboardTable({ scores, title }: LeaderboardTableProps) {
  if (!scores || scores.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No scores yet for this leaderboard.</p>;
  }

  return (
    <Table className="bg-card border-border shadow-md rounded-lg">
      {title && <TableCaption className="text-lg font-semibold py-2 text-primary">{title}</TableCaption>}
      <TableHeader>
        <TableRow className="hover:bg-card">
          <TableHead className="w-[80px] text-center text-primary-foreground/80">Rank</TableHead>
          <TableHead className="text-primary-foreground/80">Player</TableHead>
          <TableHead className="text-center text-primary-foreground/80">Total Points</TableHead>
          <TableHead className="text-center text-primary-foreground/80">Games Played</TableHead>
          <TableHead className="text-center text-primary-foreground/80">Wins</TableHead>
          <TableHead className="text-center text-primary-foreground/80">Win Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scores.map((score, index) => (
          <TableRow key={score.playerId} className="hover:bg-muted/20 transition-colors">
            <TableCell className="text-center font-medium">
                <div className="flex items-center justify-center">
                    {getRankIndicator(index + 1)}
                </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://placehold.co/40x40.png?text=${score.playerName.substring(0,1)}`} alt={score.playerName} data-ai-hint="avatar user" />
                  <AvatarFallback>{score.playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-primary-foreground">{score.playerName}</span>
              </div>
            </TableCell>
            <TableCell className="text-center font-bold text-accent">{score.totalPoints}</TableCell>
            <TableCell className="text-center text-muted-foreground">{score.gamesPlayed}</TableCell>
            <TableCell className="text-center text-green-400">{score.wins}</TableCell>
            <TableCell className="text-center text-muted-foreground">{getWinRatePercentage(score.wins, score.gamesPlayed)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

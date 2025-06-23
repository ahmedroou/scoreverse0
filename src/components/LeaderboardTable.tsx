
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
import { Medal, ShieldQuestion } from 'lucide-react';

interface LeaderboardTableProps {
  scores: ScoreData[];
  title?: string;
}

// Helper function to generate a consistent "random" color from a string
const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const getRankIndicator = (rank: number) => {
  if (rank === 1) return <Medal className="h-6 w-6 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-orange-500" />; // Brighter orange
  return <span className="font-semibold text-muted-foreground text-lg">{rank}</span>;
};

const getWinRatePercentage = (wins: number, gamesPlayed: number) => {
  if (gamesPlayed === 0) return "0%";
  return `${((wins / gamesPlayed) * 100).toFixed(1)}%`;
};

export function LeaderboardTable({ scores, title }: LeaderboardTableProps) {
  if (!scores || scores.length === 0) {
    return (
      <div className="text-center py-12 bg-card border-border shadow-md rounded-lg">
        <ShieldQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl font-semibold text-card-foreground">No Scores Yet</p>
        <p className="text-muted-foreground mt-1">
          {title ? `No match data available for the ${title}.` : "No one has played any matches yet."}
        </p>
        <p className="text-muted-foreground mt-1">
          Record some game results to see the leaderboard populate!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="bg-card border-border shadow-md rounded-lg min-w-[600px]">
        {title && <TableCaption className="text-xl font-bold py-3 text-primary bg-card-foreground/5 rounded-t-lg">{title}</TableCaption>}
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-muted/40 border-b-2 border-border">
            <TableHead className="w-[80px] text-center text-primary-foreground/90 font-semibold text-base">Rank</TableHead>
            <TableHead className="text-primary-foreground/90 font-semibold text-base">Player</TableHead>
            <TableHead className="text-center text-primary-foreground/90 font-semibold text-base">Total Points</TableHead>
            <TableHead className="text-center text-primary-foreground/90 font-semibold text-base">Games Played</TableHead>
            <TableHead className="text-center text-primary-foreground/90 font-semibold text-base">Wins</TableHead>
            <TableHead className="text-center text-primary-foreground/90 font-semibold text-base">Win Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scores.map((score, index) => (
            <TableRow key={score.playerId} className="hover:bg-muted/20 transition-colors border-b border-border last:border-b-0">
              <TableCell className="text-center font-medium">
                  <div className="flex items-center justify-center h-full">
                      {getRankIndicator(index + 1)}
                  </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3 py-2">
                  <Avatar className="h-10 w-10 border-2 border-primary/30">
                    <AvatarImage src={score.avatarUrl} alt={score.playerName} />
                    <AvatarFallback style={{ backgroundColor: stringToHslColor(score.playerName, 50, 60) }}>
                      {score.playerName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-lg text-card-foreground">{score.playerName}</span>
                </div>
              </TableCell>
              <TableCell className="text-center font-bold text-xl text-accent">{score.totalPoints}</TableCell>
              <TableCell className="text-center text-lg text-muted-foreground">{score.gamesPlayed}</TableCell>
              <TableCell className="text-center text-lg text-green-500 font-medium">{score.wins}</TableCell>
              <TableCell className="text-center text-lg text-muted-foreground">{getWinRatePercentage(score.wins, score.gamesPlayed)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

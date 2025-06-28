
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
import { Medal, ShieldQuestion, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useLanguage } from '@/hooks/use-language';

interface LeaderboardTableProps {
  scores: ScoreData[];
  title?: string;
  isPublicView?: boolean;
}

// Helper function to generate a consistent "random" color from a string
const stringToHslColor = (str: string, s: number, l: number): string => {
  if (!str) return `hsl(0, ${s}%, ${l}%)`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const getRankIndicator = (rank: number) => {
  if (rank === 1) return <Medal className="h-7 w-7 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-7 w-7 text-gray-400" />;
  if (rank === 3) return <Medal className="h-7 w-7 text-orange-500" />;
  return <span className="font-semibold text-muted-foreground text-xl">{rank}</span>;
};

const getWinRatePercentage = (wins: number, gamesPlayed: number) => {
  if (gamesPlayed === 0) return "0%";
  return `${((wins / gamesPlayed) * 100).toFixed(1)}%`;
};

export function LeaderboardTable({ scores, title, isPublicView = false }: LeaderboardTableProps) {
  const { t } = useLanguage();
  if (!scores || scores.length === 0) {
    return (
      <div className="text-center py-12 bg-card border-border shadow-md rounded-lg">
        <ShieldQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl font-semibold text-card-foreground">{t('leaderboards.table.noScores')}</p>
        <p className="text-muted-foreground mt-1">
          {t('leaderboards.table.noScoresDescription', {title: title || ''})}
        </p>
        {!isPublicView && (
            <p className="text-muted-foreground mt-1">
                {t('leaderboards.table.noScoresPrompt')}
            </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="bg-card border-border shadow-md rounded-lg min-w-[700px]">
        {title && <TableCaption className="text-xl font-bold py-4 text-primary bg-card-foreground/5 rounded-t-lg">{title}</TableCaption>}
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-muted/40 border-b-2 border-border">
            <TableHead className="w-[80px] text-center font-semibold text-base">{t('leaderboards.table.rank')}</TableHead>
            <TableHead className="font-semibold text-base">{t('leaderboards.table.player')}</TableHead>
            <TableHead className="text-center font-semibold text-base">{t('leaderboards.table.totalPoints')}</TableHead>
            <TableHead className="text-center font-semibold text-base">{t('leaderboards.table.gamesPlayed')}</TableHead>
            <TableHead className="text-center font-semibold text-base">{t('leaderboards.table.winsLosses')}</TableHead>
            <TableHead className="text-center font-semibold text-base">{t('leaderboards.table.winRate')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scores.map((score, index) => {
            const rank = index + 1;
            const playerCellContent = (
              <div className="group flex items-center gap-3 py-2 rounded-md -m-2 p-2">
                 <Avatar className="h-12 w-12 border-2 border-primary/30 group-hover:border-primary">
                    <AvatarImage src={score.avatarUrl} alt={score.playerName} />
                    <AvatarFallback style={{ backgroundColor: stringToHslColor(score.playerName, 50, 60) }}>
                      {score.playerName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-lg text-card-foreground group-hover:text-primary">{score.playerName}</span>
              </div>
            );

            return (
              <TableRow 
                key={score.playerId} 
                className={cn("transition-colors border-b border-border last:border-b-0", 
                  rank === 1 && "bg-yellow-500/10 hover:bg-yellow-500/20",
                  rank === 2 && "bg-slate-400/10 hover:bg-slate-400/20",
                  rank === 3 && "bg-orange-500/10 hover:bg-orange-500/20"
                )}
              >
                <TableCell className="text-center font-medium">
                    <div className="flex items-center justify-center h-full">
                        {getRankIndicator(rank)}
                    </div>
                </TableCell>
                <TableCell>
                  {isPublicView ? (
                    playerCellContent
                  ) : (
                    <Link href={`/stats/${score.playerId}`} className="transition-colors hover:bg-primary/10 block -m-2 p-2 rounded-md">
                      {playerCellContent}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-center font-bold text-2xl text-accent">{score.totalPoints}</TableCell>
                <TableCell className="text-center text-lg text-muted-foreground">{score.gamesPlayed}</TableCell>
                <TableCell className="text-center text-lg">
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="default" className="bg-green-600/80 hover:bg-green-600 text-white gap-1">
                      <ArrowUp className="h-3 w-3"/>{score.wins}
                    </Badge>
                     <Badge variant="destructive" className="bg-red-600/70 hover:bg-red-600 text-white gap-1">
                       <ArrowDown className="h-3 w-3"/>{score.gamesPlayed - score.wins}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center text-xl font-semibold text-muted-foreground">{getWinRatePercentage(score.wins, score.gamesPlayed)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

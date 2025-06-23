
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowUp, ArrowDown, Repeat, Trophy, Gamepad2, Sigma, BarChartHorizontal, UserCircle, Star } from 'lucide-react';
import React from 'react';
import { PlayerStatsChart } from './PlayerStatsChart';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const StatCard = ({ title, value, icon: Icon, colorClass = "text-accent" }: { title: string, value: string | number, icon: React.ElementType, colorClass?: string }) => (
  <Card className="bg-card/50">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${colorClass}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-card-foreground">{value}</div>
    </CardContent>
  </Card>
);

export default function PlayerStatsPage() {
  const params = useParams();
  const router = useRouter();
  const { getPlayerStats, isClient } = useAppContext();
  
  const playerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
  
  if (!playerId) {
      router.push('/stats'); // Should not happen with Next.js routing, but a good safeguard
      return null;
  }

  const stats = getPlayerStats(playerId);

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading Player Stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8 text-center">
        <UserCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-destructive">Player Not Found</h1>
        <p className="text-muted-foreground mt-2">The player you are looking for does not exist.</p>
         <Link href="/stats" passHref legacyBehavior>
            <Button className="mt-6">Back to Stats Overview</Button>
         </Link>
      </div>
    );
  }

  const { player, totalGames, totalWins, totalLosses, winRate, currentStreak, longestWinStreak, longestLossStreak, totalPoints, averagePointsPerMatch } = stats;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="flex flex-col sm:flex-row items-center gap-4">
        <Avatar className="h-20 w-20 border-4 border-primary shadow-lg">
          <AvatarImage src={player.avatarUrl} alt={player.name} />
          <AvatarFallback style={{ backgroundColor: stringToHslColor(player.name, 50, 60) }} className="text-3xl">
            {player.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">{player.name}</h1>
          <p className="text-lg text-muted-foreground">Player Statistics Overview</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Points" value={totalPoints} icon={Star} colorClass="text-yellow-400"/>
        <StatCard title="Total Games Played" value={totalGames} icon={Gamepad2} />
        <StatCard title="Win Rate" value={`${(winRate * 100).toFixed(1)}%`} icon={Trophy} colorClass="text-green-500" />
        <StatCard title="Avg. Points / Match" value={averagePointsPerMatch.toFixed(2)} icon={Sigma} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Wins" value={totalWins} icon={ArrowUp} colorClass="text-green-500" />
          <StatCard title="Total Losses" value={totalLosses} icon={ArrowDown} colorClass="text-red-500" />
          <StatCard title="Longest Win Streak" value={longestWinStreak} icon={Trophy} colorClass="text-green-500" />
          <StatCard title="Longest Loss Streak" value={longestLossStreak} icon={Repeat} colorClass="text-red-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center p-6 bg-card/50">
            <h3 className="text-lg font-medium text-muted-foreground">Current Streak</h3>
            {currentStreak.count > 0 ? (
                <div className={`text-6xl font-bold flex items-center gap-2 ${currentStreak.type === 'W' ? 'text-green-400' : 'text-red-400'}`}>
                    {currentStreak.type === 'W' ? <ArrowUp /> : <ArrowDown />}
                    {currentStreak.count}
                </div>
            ) : (
                 <div className="text-2xl font-semibold text-muted-foreground">No Games Played</div>
            )}
        </Card>
        
        <PlayerStatsChart stats={stats} />
      </div>

    </div>
  );
}

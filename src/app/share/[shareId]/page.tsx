"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import pako from 'pako';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import type { Game, Player, Match, Space, ScoreData } from '@/types';
import { Loader2, ShieldQuestion, Layers, BarChart3, Swords } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';


interface SharedData {
  space: Space;
  players: Player[];
  matches: Match[];
  games: Game[];
}

function SharedPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SharedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const encodedData = searchParams.get('data');

  useEffect(() => {
    if (encodedData) {
      try {
        const decoded = atob(decodeURIComponent(encodedData));
        const decompressed = pako.inflate(decoded, { to: 'string' });
        const sharedData = JSON.parse(decompressed);
        setData(sharedData);
      } catch (e) {
        console.error("Failed to parse shared data from URL", e);
        setError("The shared link is invalid or corrupted.");
      } finally {
        setIsLoading(false);
      }
    } else {
        setError("No sharing data found in the link.");
        setIsLoading(false);
    }
  }, [encodedData]);

  const calculateScores = (filteredMatchesForCalc: Match[], playersForCalc: Player[]): ScoreData[] => {
    const playerScores: Record<string, ScoreData> = {};

    playersForCalc.forEach(player => {
      playerScores[player.id] = {
        playerId: player.id,
        playerName: player.name,
        avatarUrl: player.avatarUrl,
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0
      };
    });

    filteredMatchesForCalc.forEach(match => {
      match.playerIds.forEach(playerId => {
        const player = playersForCalc.find(p => p.id === playerId);
        if (player) {
          if (!playerScores[playerId]) {
            playerScores[playerId] = { playerId: player.id, playerName: player.name, avatarUrl: player.avatarUrl, totalPoints: 0, gamesPlayed: 0, wins: 0 };
          }
          playerScores[playerId].gamesPlayed += 1;
        }
      });
      match.pointsAwarded.forEach(pa => {
        if (playerScores[pa.playerId]) {
          playerScores[pa.playerId].totalPoints += pa.points;
        }
      });
      match.winnerIds.forEach(winnerId => {
        if (playerScores[winnerId]) {
          playerScores[winnerId].wins += 1;
        }
      });
    });

    return Object.values(playerScores)
      .filter(s => s.gamesPlayed > 0 || s.totalPoints !== 0)
      .sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins || a.gamesPlayed - b.gamesPlayed || a.playerName.localeCompare(b.playerName));
  };
  
  const overallScores = useMemo(() => {
    if (!data) return [];
    return calculateScores(data.matches, data.players);
  }, [data]);

  const getGameLeaderboard = (gameId: string) => {
    if (!data) return [];
    const gameMatches = data.matches.filter(match => match.gameId === gameId);
    return calculateScores(gameMatches, data.players);
  };
  
  const relevantGames = useMemo(() => {
    if (!data) return [];
    const gameIdsInMatches = new Set(data.matches.map(m => m.gameId));
    return data.games.filter(g => gameIdsInMatches.has(g.id));
  }, [data]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-semibold text-primary">Loading Shared Leaderboard...</h1>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldQuestion className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-destructive">Could not load leaderboard</h1>
        <p className="text-muted-foreground mt-2">{error || "The requested data could not be found."}</p>
      </div>
    );
  }

  return (
     <div className="container mx-auto py-8">
      <header className="mb-8 p-4 bg-card rounded-lg border border-border shadow-lg">
        <p className="text-sm text-muted-foreground">You are viewing a shared leaderboard for</p>
        <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3">
          <Layers className="h-8 w-8" /> 
          {data.space.name}
        </h1>
      </header>

      {overallScores.length === 0 ? (
         <Card className="text-center py-12 bg-card border-border shadow">
          <CardHeader>
            <Swords className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-2xl text-card-foreground">No Matches Played Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Once matches are recorded in the "{data.space.name}" space, the leaderboards will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-auto gap-2 mb-6 bg-card p-2 rounded-lg shadow">
            <TabsTrigger value="overall" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Overall Ranking</TabsTrigger>
            {relevantGames.map(game => (
              <TabsTrigger key={game.id} value={game.id} className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">{game.name}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overall">
            <LeaderboardTable scores={overallScores} title={`Overall Leaderboard (${data.space.name})`} isPublicView />
          </TabsContent>

          {relevantGames.map(game => (
            <TabsContent key={game.id} value={game.id}>
              <LeaderboardTable scores={getGameLeaderboard(game.id)} title={`${game.name} Leaderboard (${data.space.name})`} isPublicView />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}


export default function SharedLeaderboardPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h1 className="text-2xl font-semibold text-primary">Loading...</h1>
            </div>
        }>
            <SharedPageContent />
        </Suspense>
    )
}

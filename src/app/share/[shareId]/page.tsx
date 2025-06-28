
"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { MatchHistoryCard } from '@/components/MatchHistoryCard';
import { TournamentCard } from '@/app/tournaments/TournamentCard';
import type { Game, Player, Match, Space, ScoreData, Tournament } from '@/types';
import { Loader2, ShieldQuestion, Layers, BarChart3, History, Users, Award, Trophy, Medal, Gamepad2, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/hooks/use-language';
import { format, parseISO } from 'date-fns';

interface SharedData {
  space: Space;
  players: Player[];
  matches: Match[];
  games: Game[];
  tournaments: Tournament[];
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


function SharedPageContent() {
  const params = useParams();
  const { t } = useLanguage();
  const [data, setData] = useState<SharedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const shareId = Array.isArray(params.shareId) ? params.shareId[0] : params.shareId;

  useEffect(() => {
    if (shareId) {
      const [ownerId, spaceId] = shareId.split('--');
      if (!ownerId || !spaceId) {
        setError(t('share.errorDescription'));
        setIsLoading(false);
        return;
      }

      fetch(`/api/share?ownerId=${ownerId}&spaceId=${spaceId}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Error: ${res.status}`);
          }
          return res.json();
        })
        .then((fetchedData: SharedData) => {
          setData(fetchedData);
        })
        .catch((e) => {
          console.error("Failed to parse shared data from API", e);
          setError(t('share.errorDescription'));
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
        setError(t('share.noDataError'));
        setIsLoading(false);
    }
  }, [shareId, t]);

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
      .sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins || a.playerName.localeCompare(b.playerName));
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
  
  const getPlayerById = (playerId: string) => data?.players.find(p => p.id === playerId);
  const getGameById = (gameId: string) => data?.games.find(g => g.id === gameId);
  
  const completedTournaments = useMemo(() => {
    if (!data) return [];
    return data.tournaments.filter(t => t.status === 'completed' && t.winnerPlayerId);
  }, [data]);

  const trophiesByPlayer = useMemo(() => {
    if (!data) return {};
    return completedTournaments.reduce((acc, tourney) => {
        const winnerId = tourney.winnerPlayerId!;
        if (!acc[winnerId]) acc[winnerId] = [];
        acc[winnerId].push(tourney);
        return acc;
    }, {} as Record<string, Tournament[]>);
  }, [completedTournaments]);

  const sortedPlayersWithTrophies = useMemo(() => {
    if (!data) return [];
    return Object.entries(trophiesByPlayer)
        .map(([playerId, trophies]) => ({
            player: getPlayerById(playerId),
            trophies,
        }))
        .filter(item => !!item.player)
        .sort((a, b) => b.trophies.length - a.trophies.length);
  }, [data, trophiesByPlayer]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "PPP");
    } catch {
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-semibold text-primary">{t('share.loadingTitle')}</h1>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldQuestion className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-destructive">{t('share.errorTitle')}</h1>
        <p className="text-muted-foreground mt-2">{error || "The requested data could not be found."}</p>
      </div>
    );
  }

  return (
     <div className="container mx-auto py-8">
      <header className="mb-8 p-4 bg-card rounded-lg border border-border shadow-lg">
        <p className="text-sm text-muted-foreground">{t('share.header')}</p>
        <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3">
          <Layers className="h-8 w-8" /> 
          {data.space.name}
        </h1>
      </header>

      <Tabs defaultValue="leaderboards" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6 bg-card p-2 rounded-lg shadow">
          <TabsTrigger value="leaderboards" className="py-2 text-sm md:text-base"><BarChart3 className="me-2"/>{t('sidebar.leaderboards')}</TabsTrigger>
          <TabsTrigger value="tournaments" className="py-2 text-sm md:text-base"><Trophy className="me-2"/>{t('sidebar.tournaments')}</TabsTrigger>
          <TabsTrigger value="trophy-room" className="py-2 text-sm md:text-base"><Award className="me-2"/>{t('sidebar.trophyRoom')}</TabsTrigger>
          <TabsTrigger value="match-history" className="py-2 text-sm md:text-base"><History className="me-2"/>{t('sidebar.matchHistory')}</TabsTrigger>
          <TabsTrigger value="players" className="py-2 text-sm md:text-base"><Users className="me-2"/>{t('sidebar.managePlayers')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaderboards">
            <LeaderboardTable scores={overallScores} title={`${t('leaderboards.overallLeaderboard')} (${data.space.name})`} isPublicView />
        </TabsContent>
        
        <TabsContent value="tournaments">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.tournaments.map(t => (
                    <TournamentCard 
                        key={t.id}
                        tournament={t}
                        game={getGameById(t.gameId)}
                        leader={getGameLeaderboard(t.gameId)[0]}
                    />
                ))}
                {data.tournaments.length === 0 && <p className="text-center col-span-full text-muted-foreground py-8">{t('tournaments.noActive')}</p>}
            </div>
        </TabsContent>

        <TabsContent value="trophy-room">
             {sortedPlayersWithTrophies.length === 0 ? (
                 <div className="text-center py-10 bg-card border border-border rounded-lg shadow">
                    <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl text-muted-foreground">{t('trophyRoom.noChampions')}</p>
                 </div>
            ) : (
                <div className="space-y-6">
                    {sortedPlayersWithTrophies.map(({ player, trophies }, index) => (
                        <Card key={player!.id} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-4 bg-muted/30">
                                <span className={`text-4xl font-bold ${index === 0 ? 'text-yellow-400' : (index === 1 ? 'text-gray-400' : (index === 2 ? 'text-orange-500' : 'text-muted-foreground'))}`}>#{index + 1}</span>
                                <Avatar className="h-16 w-16 border-2 border-primary"><AvatarImage src={player!.avatarUrl} alt={player!.name} /><AvatarFallback style={{backgroundColor: stringToHslColor(player!.name, 50, 60)}} className="text-2xl">{player!.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                <div>
                                    <CardTitle className="text-2xl">{player!.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-base"><Trophy className="h-5 w-5 text-yellow-500"/> {t('trophyRoom.trophiesWon', {count: trophies.length})}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {trophies.map(trophy => (<div key={trophy.id} className="p-3 rounded-md border bg-card-foreground/[.03] flex flex-col"><p className="font-bold text-primary flex items-center gap-2"><Medal className="h-5 w-5"/>{trophy.name}</p><div className="text-sm text-muted-foreground mt-2 space-y-1 flex-grow"><p className="flex items-center gap-2"><Gamepad2 className="h-4 w-4"/>{t('trophyRoom.game', {gameName: getGameById(trophy.gameId)?.name || '...'})}</p><p className="flex items-center gap-2"><Calendar className="h-4 w-4"/>{t('trophyRoom.date', {date: formatDate(trophy.dateCompleted)})}</p></div></div>))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </TabsContent>

        <TabsContent value="match-history">
            <div className="space-y-6">
                {data.matches.map(match => (
                    <MatchHistoryCard 
                        key={match.id} 
                        match={match} 
                        game={getGameById(match.gameId)}
                        getPlayerById={getPlayerById}
                    />
                ))}
                 {data.matches.length === 0 && <p className="text-center col-span-full text-muted-foreground py-8">{t('matchHistory.noMatchesFound')}</p>}
            </div>
        </TabsContent>

        <TabsContent value="players">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.players.map(player => (
                <Card key={player.id} className="bg-card border-border flex flex-col items-center text-center p-6">
                    <Avatar className="h-24 w-24 mb-4 border-4 border-primary/50"><AvatarImage src={player.avatarUrl} alt={player.name} /><AvatarFallback style={{ backgroundColor: stringToHslColor(player.name, 50, 60) }} className="text-3xl">{player.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <h2 className="text-xl font-bold text-card-foreground">{player.name}</h2>
                </Card>
              ))}
              {data.players.length === 0 && <p className="text-center col-span-full text-muted-foreground py-8">{t('players.noPlayers')}</p>}
            </div>
        </TabsContent>

      </Tabs>
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

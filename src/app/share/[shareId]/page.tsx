
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ShieldX, Trophy, Gamepad2, History, Users, BarChart3, Award, Medal, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import type { Player, Game, Match, Tournament, ScoreData } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { MatchHistoryCard } from '@/components/MatchHistoryCard';
import { TournamentCard } from '@/components/TournamentCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';

interface SharedData {
    players: Player[];
    games: Game[];
    matches: Match[];
    tournaments: Tournament[];
    spaceName: string | null;
    ownerUsername: string;
}

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
  const shareId = Array.isArray(params.shareId) ? params.shareId[0] : params.shareId;

  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!shareId) {
      setError(t('share.noLink'));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/share/${shareId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.status}`);
        }
        const sharedData: SharedData = await response.json();
        setData(sharedData);
      } catch (err: any) {
        setError(err.message || t('share.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shareId, t]);

  const getPlayerById = useCallback((id: string) => data?.players.find(p => p.id === id), [data]);
  const getGameById = useCallback((id: string) => data?.games.find(g => g.id === id), [data]);

  const leaderboards = useMemo(() => {
    if (!data) return { overall: [], byGame: new Map<string, ScoreData[]>() };
    
    const calculateScores = (filteredMatches: Match[]): ScoreData[] => {
      const playerScores: Record<string, ScoreData> = {};
      const relevantPlayerIds = new Set(filteredMatches.flatMap(m => m.playerIds));
      const relevantPlayers = data.players.filter(p => relevantPlayerIds.has(p.id));

      relevantPlayers.forEach(player => {
        playerScores[player.id] = { 
          playerId: player.id, playerName: player.name, avatarUrl: player.avatarUrl,
          totalPoints: 0, gamesPlayed: 0, wins: 0 
        };
      });

      filteredMatches.forEach(match => {
        match.playerIds.forEach(playerId => {
          if (playerScores[playerId]) playerScores[playerId].gamesPlayed += 1;
        });
        match.pointsAwarded.forEach(pa => {
          if (playerScores[pa.playerId]) playerScores[pa.playerId].totalPoints += pa.points;
        });
        match.winnerIds.forEach(winnerId => {
          if (playerScores[winnerId]) playerScores[winnerId].wins += 1;
        });
      });
      
      return Object.values(playerScores)
        .filter(s => s.gamesPlayed > 0 || s.totalPoints !== 0)
        .sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins);
    };

    const overall = calculateScores(data.matches);
    const byGame = new Map<string, ScoreData[]>();
    data.games.forEach(game => {
        const gameMatches = data.matches.filter(m => m.gameId === game.id);
        byGame.set(game.id, calculateScores(gameMatches));
    });

    return { overall, byGame };

  }, [data]);

  const sortedMatches = useMemo(() => {
    if (!data) return [];
    return [...data.matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);
  
  const completedTournaments = useMemo(() => {
    if (!data) return [];
    return data.tournaments.filter(t => t.status === 'completed' && t.winnerPlayerId);
  }, [data]);

  const trophiesByPlayer = useMemo(() => {
      return completedTournaments.reduce((acc, tourney) => {
        const winnerId = tourney.winnerPlayerId!;
        if (!acc[winnerId]) acc[winnerId] = [];
        acc[winnerId].push(tourney);
        return acc;
    }, {} as Record<string, typeof completedTournaments>);
  }, [completedTournaments]);

  const sortedPlayersWithTrophies = useMemo(() => {
    if (!data) return [];
    return Object.entries(trophiesByPlayer)
        .map(([playerId, trophies]) => ({
            player: data.players.find(p => p.id === playerId),
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

  const PageError = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 justify-center text-2xl font-bold text-destructive">
            <ShieldX className="h-8 w-8" />
            {t('share.errorTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-semibold">{t('share.loadingTitle')}</h1>
        </div>
    );
  }

  if (error || !data) {
    return <PageError message={error || t('share.fetchError')} />;
  }

  const headerTitle = data.spaceName 
    ? t('share.headerSpace', { spaceName: data.spaceName, owner: data.ownerUsername })
    : t('share.headerGlobal', { owner: data.ownerUsername });

  const activeTournaments = data.tournaments.filter(t => t.status === 'active');
  const finishedTournaments = data.tournaments.filter(t => t.status === 'completed');


  return (
    <div className="container mx-auto py-8">
        <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">{headerTitle}</h1>
            <p className="text-lg text-muted-foreground">{t('share.headerDescription')}</p>
        </header>

        <Tabs defaultValue="leaderboards" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                <TabsTrigger value="leaderboards"><BarChart3 className="me-2 h-4 w-4"/>{t('sidebar.leaderboards')}</TabsTrigger>
                <TabsTrigger value="tournaments"><Trophy className="me-2 h-4 w-4"/>{t('sidebar.tournaments')}</TabsTrigger>
                <TabsTrigger value="trophy-room"><Award className="me-2 h-4 w-4"/>{t('sidebar.trophyRoom')}</TabsTrigger>
                <TabsTrigger value="match-history"><History className="me-2 h-4 w-4"/>{t('sidebar.matchHistory')}</TabsTrigger>
                <TabsTrigger value="players"><Users className="me-2 h-4 w-4"/>{t('share.players')}</TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboards" className="mt-6">
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="md:w-64 flex-shrink-0">
                        <h2 className="text-lg font-semibold mb-4 px-2">{t('leaderboards.gameList')}</h2>
                        <LeaderboardTable scores={leaderboards.overall} title={t('leaderboards.overallRanking')} isPublicView />
                        {data.games.map(game => (
                            <div key={game.id} className="mt-4">
                                <LeaderboardTable scores={leaderboards.byGame.get(game.id) || []} title={game.name} isPublicView />
                            </div>
                        ))}
                    </aside>
                </div>
            </TabsContent>

            <TabsContent value="tournaments" className="mt-6">
                <h3 className="text-2xl font-bold mb-4">{t('tournaments.activeTab', {count: activeTournaments.length})}</h3>
                {activeTournaments.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeTournaments.map(t => (
                            <TournamentCard 
                                key={t.id}
                                tournament={t}
                                game={getGameById(t.gameId)}
                                leader={leaderboards.byGame.get(t.gameId)?.[0]}
                                isPublicView
                            />
                        ))}
                     </div>
                ) : <p className="text-center text-muted-foreground py-8">{t('tournaments.noActive')}</p>}
                
                <h3 className="text-2xl font-bold my-4 pt-4 border-t">{t('tournaments.completedTab', {count: finishedTournaments.length})}</h3>
                {finishedTournaments.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {finishedTournaments.map(t => (
                            <TournamentCard 
                                key={t.id}
                                tournament={t}
                                game={getGameById(t.gameId)}
                                leader={leaderboards.byGame.get(t.gameId)?.find(p => p.playerId === t.winnerPlayerId)}
                                isPublicView
                            />
                        ))}
                     </div>
                ) : <p className="text-center text-muted-foreground py-8">{t('tournaments.noCompleted')}</p>}
            </TabsContent>

            <TabsContent value="trophy-room" className="mt-6">
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
                                    <h4 className="font-semibold mb-3">{t('trophyRoom.victories')}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {trophies.map(trophy => (<div key={trophy.id} className="p-3 rounded-md border bg-card-foreground/[.03] flex flex-col"><p className="font-bold text-primary flex items-center gap-2"><Medal className="h-5 w-5"/>{trophy.name}</p><div className="text-sm text-muted-foreground mt-2 space-y-1 flex-grow"><p className="flex items-center gap-2"><Gamepad2 className="h-4 w-4"/>{t('trophyRoom.game', {gameName: getGameById(trophy.gameId)?.name || '...'})}</p><p className="flex items-center gap-2"><Calendar className="h-4 w-4"/>{t('trophyRoom.date', {date: formatDate(trophy.dateCompleted)})}</p></div></div>))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                 )}
            </TabsContent>

            <TabsContent value="match-history" className="mt-6">
                 {sortedMatches.length > 0 ? (
                    <div className="space-y-6">
                    {sortedMatches.map(match => (
                        <MatchHistoryCard 
                        key={match.id} 
                        match={match} 
                        game={getGameById(match.gameId)}
                        getPlayerById={getPlayerById}
                        />
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-card border border-border rounded-lg shadow">
                        <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-2xl font-semibold text-card-foreground">{t('matchHistory.noMatchesFound')}</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="players" className="mt-6">
                {data.players.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.players.map(player => (
                            <Card key={player.id} className="bg-card border-border flex flex-col items-center text-center p-4">
                                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/50"><AvatarImage src={player.avatarUrl} alt={player.name} /><AvatarFallback style={{ backgroundColor: stringToHslColor(player.name, 50, 60) }} className="text-3xl">{player.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                <h2 className="text-xl font-bold text-card-foreground">{player.name}</h2>
                            </Card>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-10 bg-card border border-border rounded-lg shadow">
                        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-xl text-muted-foreground">{t('stats.noPlayers')}</p>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    </div>
  )
}


export default function SharedPage() {
    const { t } = useLanguage();
    return (
        <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h1 className="text-2xl font-semibold">{t('share.loadingTitle')}</h1>
            </div>
        }>
            <SharedPageContent />
        </React.Suspense>
    )
}


"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldX, Trophy, BarChart3, History, Users, Award, Medal, Gamepad2, Calendar, Layers, Zap, ArrowUp, ArrowDown, Repeat, Sigma, BarChartHorizontal, Star } from 'lucide-react';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { TournamentCard } from '@/app/tournaments/TournamentCard';
import { MatchHistoryCard } from '@/components/MatchHistoryCard';
import { useLanguage } from '@/hooks/use-language';
import type { PublicShareData, Player, Game, Match, Space, Tournament, ScoreData, PlayerStats, PlayerGameStats } from '@/types';
import { format, parseISO } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const stringToHslColor = (str: string, s: number, l: number, a: number = 1): string => {
  if (!str) return `hsla(0, ${s}%, ${l}%, ${a})`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
        return format(parseISO(dateString), "PPP");
    } catch {
        return "Invalid Date";
    }
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

const PlayerStatsChart = ({ stats, t }: { stats: PlayerStats, t: (key: string, replacements?: Record<string, string | number>) => string }) => {
  const chartData = stats.gameStats.map(gs => ({
    name: gs.game.name,
    [t('stats.playerPage.wins')]: gs.wins,
    [t('stats.playerPage.losses')]: gs.losses,
  }));

  return (
    <div className="w-full h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
          />
          <Legend wrapperStyle={{fontSize: "14px"}} />
          <Bar dataKey={t('stats.playerPage.wins')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey={t('stats.playerPage.losses')} fill="hsl(var(--destructive) / 0.6)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlayerStatsDialog({ isOpen, onOpenChange, stats, t }: { isOpen: boolean, onOpenChange: (open: boolean) => void, stats: PlayerStats | null, t: (key: string, replacements?: Record<string, string | number>) => string }) {
    if (!stats) return null;
  
    const { player, totalGames, totalWins, totalLosses, winRate, currentStreak, longestWinStreak, longestLossStreak, totalPoints, averagePointsPerMatch } = stats;
  
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={player.avatarUrl} alt={player.name} />
                    <AvatarFallback style={{ backgroundColor: stringToHslColor(player.name, 50, 60) }}>
                        {player.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                {player.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title={t('stats.playerPage.totalPoints')} value={totalPoints} icon={Star} colorClass="text-yellow-400"/>
                <StatCard title={t('stats.playerPage.totalGames')} value={totalGames} icon={Gamepad2} />
                <StatCard title={t('stats.playerPage.winRate')} value={`${(winRate * 100).toFixed(1)}%`} icon={Trophy} colorClass="text-green-500" />
                <StatCard title={t('stats.playerPage.avgPoints')} value={averagePointsPerMatch.toFixed(2)} icon={Sigma} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title={t('stats.playerPage.longestWinStreak')} value={longestWinStreak} icon={ArrowUp} colorClass="text-green-500" />
                <StatCard title={t('stats.playerPage.longestLossStreak')} value={longestLossStreak} icon={ArrowDown} colorClass="text-red-500" />
                <Card className="flex flex-col items-center justify-center p-4 bg-card/50 col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">{t('stats.playerPage.currentStreak')}</h3>
                    {currentStreak.count > 0 ? (
                        <div className={`text-3xl font-bold flex items-center gap-2 ${currentStreak.type === 'W' ? 'text-green-400' : 'text-red-400'}`}>
                            {currentStreak.type === 'W' ? <ArrowUp /> : <ArrowDown />}
                            {currentStreak.count}
                        </div>
                    ) : (
                        <div className="text-lg font-semibold text-muted-foreground">{t('stats.playerPage.noGamesPlayed')}</div>
                    )}
                </Card>
            </div>
            {stats.gameStats.length > 0 && <PlayerStatsChart stats={stats} t={t} />}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

function SharePageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const shareId = Array.isArray(params.shareId) ? params.shareId[0] : params.shareId;
    const defaultSpaceId = searchParams.get('space');
    const { t } = useLanguage();

    const [data, setData] = useState<PublicShareData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
    
    const [statsDialogPlayer, setStatsDialogPlayer] = useState<Player | null>(null);

    useEffect(() => {
        if (!shareId) {
            setError(t('share.noLink'));
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/share/${shareId}`, { cache: 'no-store' });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || t('share.fetchError'));
                }
                const fetchedData: PublicShareData = await response.json();
                setData(fetchedData);
                // Set default active space from URL, or the first available space, or null (global)
                setActiveSpaceId(defaultSpaceId || fetchedData.spaces?.[0]?.id || null);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [shareId, t, defaultSpaceId]);

    const getPlayerById = useCallback((id: string) => data?.players.find(p => p.id === id), [data]);
    const getGameById = useCallback((id: string) => data?.games.find(g => g.id === id), [data]);

    const {
        filteredMatches,
        overallLeaderboard,
        gameLeaderboards,
        completedTournaments,
        activeTournaments,
        trophiesByPlayer
    } = useMemo(() => {
        if (!data) return { filteredMatches: [], overallLeaderboard: [], gameLeaderboards: {}, completedTournaments: [], activeTournaments: [], trophiesByPlayer: {} };

        const currentSpaceId = activeSpaceId || null;

        const fMatches = data.matches.filter(m => (m.spaceId || null) === currentSpaceId);
        const fTournaments = data.tournaments.filter(t => (t.spaceId || null) === currentSpaceId);

        const sortedMatches = [...fMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const calculateScores = (matchesForCalc: Match[]): ScoreData[] => {
            const playerScores: Record<string, ScoreData> = {};
            const relevantPlayerIds = new Set(matchesForCalc.flatMap(m => m.playerIds));
            data.players.forEach(player => {
                if (relevantPlayerIds.has(player.id)) {
                    playerScores[player.id] = { 
                        playerId: player.id, playerName: player.name, avatarUrl: player.avatarUrl,
                        totalPoints: 0, gamesPlayed: 0, wins: 0 
                    };
                }
            });

            matchesForCalc.forEach(match => {
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

        const overall = calculateScores(fMatches);

        const gamesLB: Record<string, ScoreData[]> = {};
        data.games.forEach(game => {
            const gameMatches = fMatches.filter(m => m.gameId === game.id);
            gamesLB[game.id] = calculateScores(gameMatches);
        });

        const activeT = fTournaments.filter(t => t.status === 'active');
        const completedT = fTournaments.filter(t => t.status === 'completed' && t.winnerPlayerId);

        const trophies = completedT.reduce((acc, tourney) => {
            const winnerId = tourney.winnerPlayerId!;
            if (!acc[winnerId]) acc[winnerId] = [];
            acc[winnerId].push(tourney);
            return acc;
        }, {} as Record<string, Tournament[]>);

        return { 
            filteredMatches: sortedMatches, 
            overallLeaderboard: overall,
            gameLeaderboards: gamesLB,
            activeTournaments: activeT,
            completedTournaments: completedT,
            trophiesByPlayer: trophies
        };

    }, [data, activeSpaceId]);
    
    const sortedTrophyPlayers = useMemo(() => Object.entries(trophiesByPlayer)
        .map(([playerId, trophies]) => ({ player: getPlayerById(playerId), trophies }))
        .filter(item => !!item.player)
        .sort((a, b) => b.trophies.length - a.trophies.length), [trophiesByPlayer, getPlayerById]);

    const calculatePlayerStats = useCallback((playerId: string): PlayerStats | null => {
        if (!data) return null;
        const player = getPlayerById(playerId);
        if (!player) return null;
    
        const playerMatches = filteredMatches
            .filter(m => m.playerIds.includes(playerId))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
        if (playerMatches.length === 0) {
            return {
                player, totalGames: 0, totalWins: 0, totalLosses: 0, winRate: 0,
                currentStreak: { type: 'W', count: 0 }, longestWinStreak: 0, longestLossStreak: 0,
                totalPoints: 0, averagePointsPerMatch: 0, gameStats: []
            };
        }
    
        let totalWins = 0, totalPoints = 0, currentWinStreak = 0, currentLossStreak = 0, longestWinStreak = 0, longestLossStreak = 0;
    
        playerMatches.forEach(match => {
            if (match.winnerIds.includes(playerId)) {
                totalWins++;
                currentWinStreak++;
                currentLossStreak = 0;
                if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
            } else {
                currentLossStreak++;
                currentWinStreak = 0;
                if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak;
            }
            const points = match.pointsAwarded.find(p => p.playerId === playerId)?.points || 0;
            totalPoints += points;
        });
    
        const lastResult = playerMatches.length > 0 ? (playerMatches[playerMatches.length - 1].winnerIds.includes(playerId) ? 'W' : 'L') : null;
        const currentStreak = !lastResult ? { type: 'W', count: 0 } : (lastResult === 'W' ? { type: 'W', count: currentWinStreak } : { type: 'L', count: currentLossStreak });
    
        const gameStatsMap = new Map<string, any>();
        playerMatches.forEach(match => {
            const game = getGameById(match.gameId);
            if (!game) return;
            if (!gameStatsMap.has(game.id)) gameStatsMap.set(game.id, { game, wins: 0, losses: 0, gamesPlayed: 0 });
            const stats = gameStatsMap.get(game.id)!;
            stats.gamesPlayed++;
            if (match.winnerIds.includes(playerId)) stats.wins++; else stats.losses++;
        });
    
        const gameStatsArray: PlayerGameStats[] = Array.from(gameStatsMap.values()).map(gs => ({
            ...gs,
            winRate: gs.gamesPlayed > 0 ? gs.wins / gs.gamesPlayed : 0
        }));
    
        return {
            player,
            totalGames: playerMatches.length,
            totalWins,
            totalLosses: playerMatches.length - totalWins,
            winRate: playerMatches.length > 0 ? totalWins / playerMatches.length : 0,
            currentStreak,
            longestWinStreak,
            longestLossStreak,
            totalPoints,
            averagePointsPerMatch: playerMatches.length > 0 ? totalPoints / playerMatches.length : 0,
            gameStats: gameStatsArray,
        };
    }, [data, filteredMatches, getGameById, getPlayerById]);

    const playerStatsForDialog = useMemo(() => {
        if (!statsDialogPlayer) return null;
        return calculatePlayerStats(statsDialogPlayer.id);
    }, [statsDialogPlayer, calculatePlayerStats]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h1 className="text-2xl font-semibold mt-4">{t('share.loadingTitle')}</h1>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
                <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-3 justify-center text-2xl font-bold text-destructive">
                        <ShieldX className="h-8 w-8" />
                        {t('share.errorTitle')}
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">{error || t('share.errorDescription')}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const activeSpace = activeSpaceId ? data.spaces.find(s => s.id === activeSpaceId) : null;

    return (
        <>
            <div className="bg-background min-h-screen bg-gradient-to-b from-card/20 to-background">
                <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
                    <div className="container mx-auto">
                        <h1 className="text-2xl font-bold text-primary truncate">{t('share.headerSpace', { spaceName: activeSpace?.name || 'Global', owner: data.owner.username })}</h1>
                        <Alert variant="default" className="mt-2 text-xs p-2 border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-300">
                            <AlertTitle className="flex items-center gap-2 font-normal"><Zap className="h-4 w-4"/>{t('share.headerDescription')}</AlertTitle>
                        </Alert>
                    </div>
                </header>
                <main className="container mx-auto py-8">
                    <div className="mb-6 max-w-sm">
                        <Label className="flex items-center gap-2 mb-2"><Layers />{t('spaces.pageTitle')}</Label>
                        <Select value={activeSpaceId || 'global'} onValueChange={(value) => setActiveSpaceId(value === 'global' ? null : value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a space" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="global">{t('dashboard.globalContext')}</SelectItem>
                                {data.spaces.map(space => (
                                    <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Tabs defaultValue="leaderboards" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
                            <TabsTrigger value="leaderboards" className="py-2.5 text-sm md:text-base"><BarChart3 className="me-2"/>{t('sidebar.leaderboards')}</TabsTrigger>
                            <TabsTrigger value="tournaments" className="py-2.5 text-sm md:text-base"><Trophy className="me-2"/>{t('sidebar.tournaments')}</TabsTrigger>
                            <TabsTrigger value="trophy-room" className="py-2.5 text-sm md:text-base"><Award className="me-2"/>{t('sidebar.trophyRoom')}</TabsTrigger>
                            <TabsTrigger value="history" className="py-2.5 text-sm md:text-base"><History className="me-2"/>{t('sidebar.matchHistory')}</TabsTrigger>
                            <TabsTrigger value="players" className="py-2.5 text-sm md:text-base"><Users className="me-2"/>{t('share.players')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="leaderboards" className="mt-6">
                            <div className="space-y-8">
                                {overallLeaderboard.length > 0 ? (
                                    <LeaderboardTable scores={overallLeaderboard} title={t('leaderboards.overallLeaderboard')} isPublicView />
                                ) : null}
                                {data.games.map(game => {
                                    const gameScores = gameLeaderboards[game.id] || [];
                                    if (gameScores.length === 0) return null;
                                    return <LeaderboardTable key={game.id} scores={gameScores} title={t('leaderboards.gameLeaderboard', { gameName: game.name })} isPublicView />
                                })}
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="tournaments" className="mt-6">
                            <h2 className="text-2xl font-bold mb-4">{t('tournaments.activeTab', { count: activeTournaments.length })}</h2>
                            {activeTournaments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeTournaments.map(t => <TournamentCard key={t.id} tournament={t} game={getGameById(t.gameId)} leader={(gameLeaderboards[t.gameId] || [])[0]} isPublicView />)}
                                </div>
                            ) : <p className="text-center text-muted-foreground py-8">{t('tournaments.noActive')}</p>}

                            <h2 className="text-2xl font-bold mt-8 mb-4">{t('tournaments.completedTab', { count: completedTournaments.length })}</h2>
                            {completedTournaments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {completedTournaments.map(t => <TournamentCard key={t.id} tournament={t} game={getGameById(t.gameId)} leader={(gameLeaderboards[t.gameId] || []).find(p => p.playerId === t.winnerPlayerId)} isPublicView />)}
                                </div>
                            ) : <p className="text-center text-muted-foreground py-8">{t('tournaments.noCompleted')}</p>}
                        </TabsContent>

                        <TabsContent value="trophy-room" className="mt-6">
                            {sortedTrophyPlayers.length === 0 ? (
                                <div className="text-center py-10 bg-card border border-border rounded-lg shadow">
                                    <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-xl text-muted-foreground">{t('trophyRoom.noChampions')}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {sortedTrophyPlayers.map(({ player, trophies }, index) => (
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
                                                    {trophies.map(trophy => <div key={trophy.id} className="p-3 rounded-md border bg-card-foreground/[.03] flex flex-col"><p className="font-bold text-primary flex items-center gap-2"><Medal className="h-5 w-5"/>{trophy.name}</p><div className="text-sm text-muted-foreground mt-2 space-y-1 flex-grow"><p className="flex items-center gap-2"><Gamepad2 className="h-4 w-4"/>{t('trophyRoom.game', {gameName: getGameById(trophy.gameId)?.name || '...'})}</p><p className="flex items-center gap-2"><Calendar className="h-4 w-4"/>{t('trophyRoom.date', {date: formatDate(trophy.dateCompleted)})}</p></div></div>)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="mt-6">
                            <div className="space-y-6">
                                {filteredMatches.length > 0 ? filteredMatches.map(match => <MatchHistoryCard key={match.id} match={match} game={getGameById(match.gameId)} getPlayerById={getPlayerById} />) : <p className="text-center text-muted-foreground py-8">{t('matchHistory.noMatchesFound')}</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="players" className="mt-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                                {data.players.map(player => (
                                    <Card key={player.id} className="text-center flex flex-col p-4 pt-6 transition-all duration-200 hover:shadow-xl border-2 border-transparent hover:border-primary/50">
                                        <div className="flex-grow">
                                            <Avatar className="h-24 w-24 mx-auto border-4" style={{ borderColor: stringToHslColor(player.name, 50, 60) }}>
                                                <AvatarImage src={player.avatarUrl} alt={player.name} />
                                                <AvatarFallback className="text-3xl font-bold" style={{ backgroundColor: stringToHslColor(player.name, 50, 85), color: stringToHslColor(player.name, 60, 30) }}>
                                                    {player.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <h3 className="mt-4 font-bold text-lg text-card-foreground truncate" title={player.name}>{player.name}</h3>
                                        </div>
                                        <div className="mt-4">
                                            <Button variant="outline" size="sm" onClick={() => setStatsDialogPlayer(player)}>
                                                <BarChartHorizontal className="h-4 w-4 me-2"/> {t('stats.viewFullStats')}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
            <PlayerStatsDialog 
                isOpen={!!statsDialogPlayer} 
                onOpenChange={(open) => !open && setStatsDialogPlayer(null)} 
                stats={playerStatsForDialog}
                t={t}
            />
        </>
    );
}


export default function SharedPage() {
    const { t } = useLanguage();
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h1 className="text-2xl font-semibold mt-4">{t('share.loadingTitle')}</h1>
            </div>
        }>
            <SharePageContent />
        </Suspense>
    );
}


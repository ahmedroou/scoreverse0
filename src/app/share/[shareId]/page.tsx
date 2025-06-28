
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldX, Trophy, BarChart3, History, Users, Award, Medal, Gamepad2, Calendar, Layers, Clock, Zap } from 'lucide-react';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { TournamentCard } from '@/app/tournaments/TournamentCard';
import { MatchHistoryCard } from '@/components/MatchHistoryCard';
import { useLanguage } from '@/hooks/use-language';
import type { PublicShareData, Player, Game, Match, Space, Tournament, ScoreData } from '@/types';
import { format, parseISO } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

export default function SharedPage() {
    const params = useParams();
    const shareId = Array.isArray(params.shareId) ? params.shareId[0] : params.shareId;
    const { t } = useLanguage();

    const [data, setData] = useState<PublicShareData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);

    useEffect(() => {
        if (!shareId) {
            setError(t('share.noLink'));
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/share/${shareId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || t('share.fetchError'));
                }
                const fetchedData: PublicShareData = await response.json();
                setData(fetchedData);
                // Set default active space to null (global)
                setActiveSpaceId(null);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [shareId, t]);

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
        <div className="bg-background min-h-screen bg-gradient-to-b from-card/20 to-background">
            <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold text-primary truncate">{t('share.headerSpace', { spaceName: activeSpace?.name || 'Global', owner: data.owner.username })}</h1>
                    <p className="text-sm text-muted-foreground">{t('share.headerDescription')}</p>
                     {data.type === 'snapshot' && data.createdAt && (
                         <Alert variant="default" className="mt-2 text-xs p-2 border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300">
                             <AlertTitle className="flex items-center gap-2 font-normal"><Clock className="h-4 w-4"/>This is a snapshot created on {format(parseISO(data.createdAt), "PPPp")}. It does not receive live updates.</AlertTitle>
                         </Alert>
                     )}
                     {data.type === 'live' && (
                          <Alert variant="default" className="mt-2 text-xs p-2 border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-300">
                             <AlertTitle className="flex items-center gap-2 font-normal"><Zap className="h-4 w-4"/>Showing live data which updates automatically.</AlertTitle>
                         </Alert>
                     )}
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
                            <LeaderboardTable scores={overallLeaderboard} title={t('leaderboards.overallLeaderboard')} isPublicView />
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
                                <Card key={player.id} className="text-center p-4 pt-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-primary/50">
                                    <Avatar className="h-24 w-24 mx-auto border-4" style={{ borderColor: stringToHslColor(player.name, 50, 60) }}>
                                        <AvatarImage src={player.avatarUrl} alt={player.name} />
                                        <AvatarFallback className="text-3xl font-bold" style={{ backgroundColor: stringToHslColor(player.name, 50, 85), color: stringToHslColor(player.name, 60, 30) }}>
                                            {player.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="mt-4 font-bold text-lg text-card-foreground truncate" title={player.name}>{player.name}</h3>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

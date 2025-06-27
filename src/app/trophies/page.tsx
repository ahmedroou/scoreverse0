
"use client";

import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Award, Medal, Gamepad2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';

const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

export default function TrophyRoomPage() {
    const { players, tournaments, getGameById, isClient, currentUser } = useAppContext();
    const { t } = useLanguage();

    if (!isClient) {
        return <div className="text-center p-8">{t('common.loading')}</div>
    }

    if (!currentUser) {
       return (
        <div className="container mx-auto py-8">
            <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
                <CardHeader><CardTitle>{t('draw.accessDenied')}</CardTitle></CardHeader>
                <CardContent>
                    <p>{t('dashboard.loginPrompt')}</p>
                     <Link href="/auth" passHref legacyBehavior><Button className="mt-4 w-full">{t('dashboard.goToLogin')}</Button></Link>
                </CardContent>
            </Card>
        </div>
       );
    }
    
    const completedTournaments = tournaments.filter(t => t.status === 'completed' && t.winnerPlayerId);

    const trophiesByPlayer = completedTournaments.reduce((acc, tourney) => {
        const winnerId = tourney.winnerPlayerId!;
        if (!acc[winnerId]) {
            acc[winnerId] = [];
        }
        acc[winnerId].push(tourney);
        return acc;
    }, {} as Record<string, typeof completedTournaments>);

    const sortedPlayersWithTrophies = Object.entries(trophiesByPlayer)
        .map(([playerId, trophies]) => ({
            player: players.find(p => p.id === playerId),
            trophies,
        }))
        .filter(item => !!item.player)
        .sort((a, b) => b.trophies.length - a.trophies.length);
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        try {
            return format(parseISO(dateString), "PPP");
        } catch {
            return "Invalid Date";
        }
    };


    return (
        <div className="container mx-auto py-8">
             <header className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-2"><Award /> {t('trophyRoom.pageTitle')}</h1>
                <p className="text-lg text-muted-foreground">{t('trophyRoom.pageDescription')}</p>
             </header>

            {sortedPlayersWithTrophies.length === 0 ? (
                 <div className="text-center py-10 bg-card border border-border rounded-lg shadow">
                    <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl text-muted-foreground">
                        {t('trophyRoom.noChampions')}
                    </p>
                    <p className="text-muted-foreground mt-2">
                        {t('trophyRoom.noChampionsDescription')}
                    </p>
                 </div>
            ) : (
                <div className="space-y-6">
                    {sortedPlayersWithTrophies.map(({ player, trophies }, index) => (
                        <Card key={player!.id} className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-4 bg-muted/30">
                                <span className={`text-4xl font-bold ${index === 0 ? 'text-yellow-400' : (index === 1 ? 'text-gray-400' : (index === 2 ? 'text-orange-500' : 'text-muted-foreground'))}`}>
                                    #{index + 1}
                                </span>
                                <Avatar className="h-16 w-16 border-2 border-primary">
                                    <AvatarImage src={player!.avatarUrl} alt={player!.name} />
                                    <AvatarFallback style={{backgroundColor: stringToHslColor(player!.name, 50, 60)}} className="text-2xl">
                                        {player!.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-2xl">{player!.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-base">
                                        <Trophy className="h-5 w-5 text-yellow-500"/> {t('trophyRoom.trophiesWon', {count: trophies.length})}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6">
                                <h4 className="font-semibold mb-3">{t('trophyRoom.victories')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {trophies.map(trophy => {
                                        const game = getGameById(trophy.gameId);
                                        return (
                                            <div key={trophy.id} className="p-3 rounded-md border bg-card-foreground/[.03] flex flex-col">
                                                <p className="font-bold text-primary flex items-center gap-2"><Medal className="h-5 w-5"/>{trophy.name}</p>
                                                <div className="text-sm text-muted-foreground mt-2 space-y-1 flex-grow">
                                                   <p className="flex items-center gap-2"><Gamepad2 className="h-4 w-4"/>{t('trophyRoom.game', {gameName: game?.name || '...'})}</p>
                                                   <p className="flex items-center gap-2"><Calendar className="h-4 w-4"/>{t('trophyRoom.date', {date: formatDate(trophy.dateCompleted)})}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}


"use client";

import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Users, BarChartHorizontal, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

export default function StatsOverviewPage() {
  const { players, isClient, currentUser } = useAppContext();

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading Player Stats...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please log in to view player stats.</p>
            <Link href="/auth" passHref legacyBehavior>
              <Button className="mt-4 w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2 flex items-center gap-3">
          <BarChartHorizontal /> Player Statistics
        </h1>
        <p className="text-lg text-muted-foreground">Select a player to view their detailed performance metrics.</p>
      </header>

      {players.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map(player => (
            <Card key={player.id} className="hover:shadow-xl transition-shadow duration-200 ease-in-out bg-card border-border hover:border-primary/70 flex flex-col">
                <CardContent className="pt-6 flex flex-col items-center text-center flex-grow">
                     <Avatar className="h-24 w-24 mb-4 border-4 border-primary/50">
                        <AvatarImage src={player.avatarUrl} alt={player.name} />
                        <AvatarFallback style={{ backgroundColor: stringToHslColor(player.name, 50, 60) }} className="text-3xl">
                            {player.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold text-card-foreground">{player.name}</h2>
                </CardContent>
                <CardContent className="pt-0">
                    <Link href={`/stats/${player.id}`} passHref legacyBehavior>
                        <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                            View Full Stats
                        </Button>
                    </Link>
                </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-card border border-border rounded-lg shadow">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No players have been added yet.</p>
           <Link href="/players" passHref legacyBehavior>
            <Button className="mt-4">
              Manage Players
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

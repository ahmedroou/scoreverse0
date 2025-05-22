
"use client";
import type { Game } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Info } from 'lucide-react';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const IconComponent = game.icon || Info;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 ease-in-out bg-card border-border hover:border-primary">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <IconComponent className="w-10 h-10 text-primary" />
        <div>
          <CardTitle className="text-2xl font-bold text-primary-foreground">{game.name}</CardTitle>
          {game.description && <CardDescription className="text-muted-foreground">{game.description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="flex items-center gap-2">
            <Users className="w-4 h-4" /> 
            <span>
              {game.minPlayers}
              {game.maxPlayers ? ` - ${game.maxPlayers}` : '+'} Players
            </span>
          </p>
          <p>Points per win: <span className="font-semibold text-accent">{game.pointsPerWin}</span></p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Link href={`/add-result?gameId=${game.id}`} passHref legacyBehavior>
          <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Record Match
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

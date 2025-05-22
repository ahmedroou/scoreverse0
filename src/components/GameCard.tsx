
"use client";
import type { Game } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Info, PlayCircle } from 'lucide-react'; // Added PlayCircle

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const IconComponent = game.icon || Info;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 ease-in-out bg-card border-border hover:border-primary/70">
      <CardHeader className="flex flex-row items-start gap-4 pb-3">
        <IconComponent className="w-10 h-10 text-primary mt-1" />
        <div className="flex-1">
          <CardTitle className="text-2xl font-bold text-card-foreground">{game.name}</CardTitle>
          {game.description && <CardDescription className="text-sm text-muted-foreground mt-1">{game.description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-0">
        <div className="text-sm text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" /> 
            <span>
              {game.minPlayers}
              {game.maxPlayers ? ` - ${game.maxPlayers}` : '+'} Players
            </span>
          </div>
          <p>Points per win: <span className="font-semibold text-accent">{game.pointsPerWin}</span></p>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border pt-4">
        <Link href={`/add-result?gameId=${game.id}`} passHref legacyBehavior>
          <Button variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlayCircle className="w-5 h-5 mr-2" />
            Record Match
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

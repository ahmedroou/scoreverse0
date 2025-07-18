
"use client";
import type { Game } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, PlayCircle, Edit3, Trash2, UserCog } from 'lucide-react';
import { getGameIcon } from './icons';
import { useLanguage } from '@/hooks/use-language';

interface GameCardProps {
  game: Game;
  showAdminControls?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  ownerUsername?: string;
}

export function GameCard({ game, showAdminControls = false, onEdit, onDelete, ownerUsername }: GameCardProps) {
  const IconComponent = getGameIcon(game.icon);
  const { t } = useLanguage();

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 ease-in-out bg-card border-border hover:border-primary/70">
      <CardHeader className="flex flex-row items-start gap-4 pb-3">
        <IconComponent className="w-10 h-10 text-primary mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <CardTitle className="text-2xl font-bold text-card-foreground truncate" title={game.name}>{game.name}</CardTitle>
          {game.description && <CardDescription className="text-sm text-muted-foreground mt-1 line-clamp-2">{game.description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-0">
        <div className="text-sm text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" /> 
            <span>
              {t('games.players', { minPlayers: game.minPlayers, maxRange: game.maxPlayers ? ` - ${game.maxPlayers}` : '+'})}
            </span>
          </div>
          <p>{t('games.pointsPerWin', {count: game.pointsPerWin})}</p>
           {ownerUsername && (
            <div className="flex items-center gap-2 text-xs pt-1">
                <UserCog className="w-3.5 h-3.5" />
                <span>{t('games.owner', {username: ownerUsername})}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t border-border pt-4 flex flex-col gap-2">
        <Link href={`/add-result?gameId=${game.id}`} passHref legacyBehavior className="w-full">
          <Button variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlayCircle className="w-5 h-5 me-2" />
            {t('games.recordMatch')}
          </Button>
        </Link>
        {showAdminControls && onEdit && onDelete && (
          <div className="flex gap-2 w-full mt-2">
            <Button variant="outline" onClick={onEdit} className="flex-1 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <Edit3 className="w-4 h-4 me-2" /> {t('common.edit')}
            </Button>
            <Button variant="destructive" onClick={onDelete} className="flex-1 bg-destructive/80 hover:bg-destructive text-destructive-foreground">
              <Trash2 className="w-4 h-4 me-2" /> {t('common.delete')}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

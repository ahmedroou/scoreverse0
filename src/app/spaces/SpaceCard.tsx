"use client";

import type { Space } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Layers, Edit3, Trash2, CheckCircle, Radio, UserCog, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface SpaceCardProps {
  space: Space;
  isActive: boolean;
  onSetActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClearHistory?: () => void;
  ownerUsername?: string;
  canEdit?: boolean;
}

export function SpaceCard({ space, isActive, onSetActive, onEdit, onDelete, onClearHistory, ownerUsername, canEdit = true }: SpaceCardProps) {
  const { t } = useLanguage();
  return (
    <Card className={`border hover:shadow-md transition-shadow duration-150 ${isActive ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border bg-card'}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className={`text-xl font-semibold flex items-center gap-2 ${isActive ? 'text-primary' : 'text-card-foreground'}`}>
              <Layers className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-accent'}`} />
              {space.name}
            </CardTitle>
            {ownerUsername && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                    <UserCog className="h-3 w-3"/>
                    {t('players.owner', {username: ownerUsername})}
                </div>
            )}
          </div>
          {isActive && (
            <div className="flex items-center gap-1 text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10 whitespace-nowrap">
              <CheckCircle className="h-3.5 w-3.5" />
              {t('spaces.active')}
            </div>
          )}
        </div>
      </CardHeader>
      <CardFooter className="flex flex-wrap justify-end gap-2 border-t border-border/50 pt-3 px-4 pb-4">
        <div className="flex-grow flex gap-2">
            {canEdit && onClearHistory && (
                 <Button variant="outline" size="sm" onClick={onClearHistory} className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <RotateCcw className="h-4 w-4 me-1.5" /> {t('common.reset')}
                </Button>
            )}
        </div>
        
        <Button 
          variant={isActive ? "default" : "outline"} 
          size="sm" 
          onClick={onSetActive} 
          disabled={isActive}
          className={`${isActive ? 'bg-primary text-primary-foreground cursor-default' : 'border-accent text-accent hover:bg-accent hover:text-accent-foreground'}`}
        >
          {isActive ? <CheckCircle className="h-4 w-4 me-1.5" /> : <Radio className="h-4 w-4 me-1.5" />}
          {isActive ? t('spaces.active') : t('spaces.setActive')}
        </Button>
        {canEdit && (
            <>
                <Button variant="outline" size="sm" onClick={onEdit} className="border-muted-foreground/50 text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent/10">
                <Edit3 className="h-4 w-4 me-1.5" /> {t('common.edit')}
                </Button>
                <Button variant="destructive" size="sm" onClick={onDelete} className="bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                <Trash2 className="h-4 w-4 me-1.5" /> {t('common.delete')}
                </Button>
            </>
        )}
      </CardFooter>
    </Card>
  );
}


"use client";

import type { Space } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Layers, Edit3, Trash2, CheckCircle, Radio, UserCog, RotateCcw, UserPlus, LogOut } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useAppContext } from '@/context/AppContext';

interface SpaceCardProps {
  space: Space;
  isActive: boolean;
  isOwned: boolean;
  onSetActive: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onManageMembers?: () => void;
  onLeave?: () => void;
  onClearHistory?: () => void;
}

export function SpaceCard({ space, isActive, isOwned, onSetActive, onEdit, onDelete, onClearHistory, onManageMembers, onLeave }: SpaceCardProps) {
  const { t } = useLanguage();
  const { getUserById } = useAppContext();

  const owner = isOwned ? null : getUserById(space.ownerId);

  return (
    <Card className={`border hover:shadow-md transition-shadow duration-150 ${isActive ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border bg-card'}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
                <CardTitle className={`text-xl font-semibold flex items-center gap-2 ${isActive ? 'text-primary' : 'text-card-foreground'}`}>
                    <Layers className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-accent'}`} />
                    {space.name}
                </CardTitle>
             </div>
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                <UserCog className="h-3 w-3"/>
                {isOwned ? t('spaces.ownedByYou') : t('spaces.ownedBy', {ownerName: owner?.username || '...' })}
            </CardDescription>
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
             {isOwned && onClearHistory && (
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
        {isOwned ? (
            <>
                <Button variant="outline" size="sm" onClick={onManageMembers} className="border-muted-foreground/50 text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent/10">
                    <UserPlus className="h-4 w-4 me-1.5" /> {t('spaces.members')}
                </Button>
                <Button variant="outline" size="sm" onClick={onEdit} className="border-muted-foreground/50 text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent/10">
                    <Edit3 className="h-4 w-4 me-1.5" /> {t('common.edit')}
                </Button>
                <Button variant="destructive" size="sm" onClick={onDelete} className="bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                    <Trash2 className="h-4 w-4 me-1.5" /> {t('common.delete')}
                </Button>
            </>
        ) : (
            <Button variant="destructive" size="sm" onClick={onLeave} className="bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                <LogOut className="h-4 w-4 me-1.5" /> {t('spaces.leaveSpace')}
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}

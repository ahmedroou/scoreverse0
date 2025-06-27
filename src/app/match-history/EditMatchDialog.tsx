
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { Match, Player } from '@/types';
import { useLanguage } from '@/hooks/use-language';
import { PlayerTag } from '@/components/PlayerTag';

const createFormSchema = (t: (key: string) => string, playerIds: string[]) => z.object({
  winnerIds: z.array(z.string()).min(1, t('addResult.validation.winnerRequired')),
}).superRefine((data, ctx) => {
  data.winnerIds.forEach(winnerId => {
    if (!playerIds.includes(winnerId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('addResult.validation.winnerMustBePlayer'),
        path: ['winnerIds'],
      });
    }
  });
});

interface EditMatchDialogProps {
  match: Match | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMatchDialog({ match, isOpen, onOpenChange }: EditMatchDialogProps) {
  const { updateMatch, getGameById, getPlayerById } = useAppContext();
  const { t } = useLanguage();
  
  const game = match ? getGameById(match.gameId) : null;
  const playersInMatch = match ? (match.playerIds.map(id => getPlayerById(id)).filter(Boolean) as Player[]) : [];

  const formSchema = createFormSchema(t, match?.playerIds || []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      winnerIds: [],
    },
  });

  React.useEffect(() => {
    if (isOpen && match) {
      form.reset({ winnerIds: match.winnerIds });
    }
  }, [isOpen, match, form]);
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!game || !match) return;
    const pointsAwarded = values.winnerIds.map(winnerId => ({
      playerId: winnerId,
      points: game.pointsPerWin,
    }));
    updateMatch(match.id, { winnerIds: values.winnerIds, pointsAwarded });
    onOpenChange(false);
  };
  
  const watchedWinnerIds = form.watch('winnerIds') || [];

  if (!match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary">{t('matchHistory.editDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('matchHistory.editDialog.description', { gameName: game?.name || '...' })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label>{t('addResult.winnerLabel')}</Label>
            <Controller
              control={form.control}
              name="winnerIds"
              render={({ field }) => (
                <div className="space-y-2">
                  <Select
                    onValueChange={(winnerId) => {
                      if (!winnerId) return;
                      const currentWinners = field.value || [];
                      const newWinners = currentWinners.includes(winnerId)
                        ? currentWinners.filter(id => id !== winnerId)
                        : [...currentWinners, winnerId];
                      field.onChange(newWinners);
                    }}
                    value=""
                  >
                    <SelectTrigger><SelectValue placeholder={t('addResult.winnerPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      {playersInMatch.map(player => (
                        <SelectItem key={player.id} value={player.id} className={(field.value || []).includes(player.id) ? 'font-bold text-primary' : ''}>
                          {player.name} {(field.value || []).includes(player.id) ? ` (${t('addResult.selectedWinner')})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">
                    {watchedWinnerIds.map(playerId => {
                      const player = getPlayerById(playerId);
                      return player ? (
                        <PlayerTag 
                          key={playerId} 
                          name={player.name} 
                          isWinner
                          onRemove={() => field.onChange(watchedWinnerIds.filter(id => id !== playerId))}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            />
            {form.formState.errors.winnerIds && <p className="text-sm text-destructive mt-1">{form.formState.errors.winnerIds.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">{t('common.cancel')}</Button></DialogClose>
            <Button type="submit">{t('common.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

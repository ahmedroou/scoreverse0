
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ThumbsUp, UserCheck, Users, Calendar as CalendarIcon } from 'lucide-react';
import type { Game, Player } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlayerTag } from '@/components/PlayerTag';
import { useSearchParams } from 'next/navigation';
import { playSound } from '@/lib/audio';
import { useLanguage } from '@/hooks/use-language';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const createFormSchema = (t: (key: string, replacements?: Record<string, string | number>) => string, gamesForValidation: Game[]) => z.object({
  gameId: z.string().min(1, t('addResult.validation.gameRequired')),
  selectedPlayerIds: z.array(z.string()).min(1, t('addResult.validation.playerRequired')),
  winnerIds: z.array(z.string()).min(1, t('addResult.validation.winnerRequired')),
}).superRefine((data, ctx) => {
  if (data.selectedPlayerIds.length > 0) {
    const game = gamesForValidation.find(g => g.id === data.gameId);
    if (game) {
      if (data.selectedPlayerIds.length < game.minPlayers) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('addResult.validation.minPlayers', {count: game.minPlayers}),
          path: ['selectedPlayerIds'],
        });
      }
      if (game.maxPlayers && data.selectedPlayerIds.length > game.maxPlayers) {
         ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('addResult.validation.maxPlayers', {count: game.maxPlayers}),
          path: ['selectedPlayerIds'],
        });
      }
      data.winnerIds.forEach(winnerId => {
        if (!data.selectedPlayerIds.includes(winnerId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('addResult.validation.winnerMustBePlayer'),
            path: ['winnerIds'],
          });
        }
      });
    } else if (data.gameId) { // Game ID is selected but game not found in context
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('addResult.validation.gameNotFound'),
            path: ['gameId'],
        });
    }
  }
  if (data.winnerIds.length > data.selectedPlayerIds.length) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: t('addResult.validation.moreWinnersThanPlayers'),
      path: ['winnerIds'],
    });
  }
});


export function AddResultForm() {
  const { games, players, addMatch, getGameById, getPlayerById, isClient, currentUser } = useAppContext();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const defaultGameId = searchParams.get('gameId');

  const formSchema = useMemo(() => createFormSchema(t, games), [t, games]);

  const [selectedGame, setSelectedGame] = useState<Game | null>(defaultGameId ? getGameById(defaultGameId) || null : null);
  const [potentialWinners, setPotentialWinners] = useState<Player[]>([]);
  const [customDate, setCustomDate] = useState<Date>();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameId: defaultGameId || "",
      selectedPlayerIds: [],
      winnerIds: [],
    },
  });

  useEffect(() => {
    if (defaultGameId) {
      form.setValue('gameId', defaultGameId);
      const game = getGameById(defaultGameId);
      setSelectedGame(game || null);
      if (!game) {
        toast({title: t('common.error'), description: t('addResult.toasts.gameNotFound'), variant: "default"})
      }
    }
  }, [defaultGameId, form, getGameById, toast, t]);

  const watchedGameId = form.watch('gameId');
  const watchedSelectedPlayerIds = form.watch('selectedPlayerIds');

  useEffect(() => {
    const gameFromContext = getGameById(watchedGameId);
    setSelectedGame(gameFromContext || null);
    form.setValue('selectedPlayerIds', []);
    form.setValue('winnerIds', []);
  }, [watchedGameId, getGameById, form]);

  useEffect(() => {
    const currentlySelectedPlayers = players.filter(p => watchedSelectedPlayerIds.includes(p.id));
    setPotentialWinners(currentlySelectedPlayers);
    // Ensure winners are a subset of selected players
    form.setValue('winnerIds', form.getValues('winnerIds').filter(id => watchedSelectedPlayerIds.includes(id)));
  }, [watchedSelectedPlayerIds, players, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({ title: t('auth.authError'), description: t('addResult.toasts.authError'), variant: "destructive"});
      return;
    }
    const game = getGameById(values.gameId);
    if (!game) {
      toast({ title: t('common.error'), description: t('addResult.toasts.gameNotFoundOnSubmit'), variant: "destructive" });
      return;
    }

    const pointsAwarded = values.winnerIds.map(winnerId => ({
      playerId: winnerId,
      points: game.pointsPerWin,
    }));

    addMatch({
      gameId: values.gameId,
      playerIds: values.selectedPlayerIds,
      winnerIds: values.winnerIds,
      pointsAwarded,
      date: customDate?.toISOString(),
    });

    form.reset({ gameId: watchedGameId, selectedPlayerIds: [], winnerIds: [] }); 
    setPotentialWinners([]);
    setCustomDate(undefined);
    toast({
      title: t('addResult.toasts.matchRecorded'),
      description: t('addResult.toasts.matchRecordedDesc', {gameName: game.name}),
      action: <ThumbsUp className="h-5 w-5 text-green-400" />,
    });
    playSound('success');
  };
  
  const availablePlayersForSelection = useMemo(() => {
    if (!selectedGame) return players;
    if (selectedGame.maxPlayers && watchedSelectedPlayerIds.length >= selectedGame.maxPlayers) {
      return players.filter(p => watchedSelectedPlayerIds.includes(p.id));
    }
    return players;
  }, [players, selectedGame, watchedSelectedPlayerIds]);


  if (!isClient) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ms-2">{t('common.loading')}</span></div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2"><UserCheck /> {t('addResult.pageTitle')}</CardTitle>
        <CardDescription>{t('addResult.pageDescription')}</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gameId" className="text-lg font-semibold">{t('addResult.gameLabel')}</Label>
            <Controller
              control={form.control}
              name="gameId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={defaultGameId || undefined}>
                  <SelectTrigger id="gameId" aria-label={t('addResult.gamePlaceholder')}>
                    <SelectValue placeholder={t('addResult.gamePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map(game => (
                      <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.gameId && <p className="text-sm text-destructive">{form.formState.errors.gameId.message}</p>}
          </div>

          {selectedGame && (
            <div className="space-y-2">
              <Label className="text-lg font-semibold flex items-center gap-2"><Users />{t('addResult.playersLabel')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('addResult.playersSelectionPrompt', {
                  minPlayers: selectedGame.minPlayers,
                  maxPlayersRange: selectedGame.maxPlayers ? t('addResult.maxPlayersRange', {maxPlayers: selectedGame.maxPlayers}) : t('addResult.orMore')
                })}
              </p>
              <Controller
                control={form.control}
                name="selectedPlayerIds"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Select
                      onValueChange={(playerId) => {
                        if (!playerId || field.value?.includes(playerId)) return;
                        if (selectedGame.maxPlayers && field.value && field.value.length >= selectedGame.maxPlayers) {
                            toast({ title: t('addResult.toasts.maxPlayersReached'), description: t('addResult.toasts.maxPlayersReachedDesc', {count: selectedGame.maxPlayers}), variant: "default"});
                            return;
                        }
                        field.onChange([...(field.value || []), playerId]);
                      }}
                       value=""
                    >
                      <SelectTrigger aria-label={t('addResult.addPlayerPlaceholder')}>
                        <SelectValue placeholder={t('addResult.addPlayerPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlayersForSelection
                          .filter(p => !(field.value || []).includes(p.id)) 
                          .map(player => (
                            <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                          ))}
                         {availablePlayersForSelection.filter(p => !(field.value || []).includes(p.id)).length === 0 && <p className="p-2 text-sm text-muted-foreground">{t('addResult.allPlayersSelected')}</p>}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">
                      {(field.value || []).map(playerId => {
                        const player = getPlayerById(playerId);
                        return player ? (
                          <PlayerTag 
                            key={playerId} 
                            name={player.name} 
                            onRemove={() => field.onChange((field.value || []).filter(id => id !== playerId))}
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              />
              {form.formState.errors.selectedPlayerIds && <p className="text-sm text-destructive">{form.formState.errors.selectedPlayerIds.message}</p>}
            </div>
          )}
          
          {potentialWinners.length > 0 && (
             <div className="space-y-2">
              <Label className="text-lg font-semibold">{t('addResult.winnerLabel')}</Label>
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
                      <SelectTrigger aria-label={t('addResult.winnerPlaceholder')}>
                         <SelectValue placeholder={t('addResult.winnerPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {potentialWinners.map(player => (
                          <SelectItem key={player.id} value={player.id} className={(field.value || []).includes(player.id) ? 'font-bold text-primary' : ''}>
                            {player.name} {(field.value || []).includes(player.id) && t('addResult.selectedWinner')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">
                      {(field.value || []).map(playerId => {
                        const player = getPlayerById(playerId);
                        return player ? (
                          <PlayerTag 
                            key={playerId} 
                            name={player.name} 
                            isWinner
                            onRemove={() => field.onChange((field.value || []).filter(id => id !== playerId))}
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              />
              {form.formState.errors.winnerIds && <p className="text-sm text-destructive">{form.formState.errors.winnerIds.message}</p>}
            </div>
          )}

          <div className="space-y-2 pt-6 border-t border-border">
                <Label className="text-lg font-semibold">{t('addResult.optional.title')}</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full sm:w-[280px] justify-start text-left font-normal",
                        !customDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="me-2 h-4 w-4" />
                        {customDate ? format(customDate, "PPP") : <span>{t('addResult.optional.pickDate')}</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={customDate}
                        onSelect={setCustomDate}
                        disabled={(date) =>
                        date > new Date() || date < new Date("2000-01-01")
                        }
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                    {t('addResult.optional.description')}
                </p>
            </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
            disabled={!form.formState.isValid || !currentUser}
          >
            {t('addResult.recordMatchButton')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

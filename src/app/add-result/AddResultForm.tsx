
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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, Loader2, ThumbsUp, UserCheck, Users } from 'lucide-react';
import { handleSuggestHandicapAction } from './actions';
import type { SuggestHandicapInput, SuggestHandicapOutput } from '@/ai/flows/suggest-handicap';
import type { Game, Player, MatchPlayer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PlayerTag } from '@/components/PlayerTag';
import { useSearchParams } from 'next/navigation';

// MOCK_GAMES can be obtained from AppContext if they become dynamic
const MOCK_STATIC_GAMES_FOR_VALIDATION = [
  { id: 'jackaroo', name: 'Jackaroo', minPlayers: 2, maxPlayers: 4 },
  { id: 'scro', name: 'Scro (سكرو)', minPlayers: 4, maxPlayers: 4 },
  { id: 'baloot', name: 'Baloot (بلوت)', minPlayers: 4, maxPlayers: 4 },
  { id: 'billiards', name: 'Billiards', minPlayers: 2, maxPlayers: 2 },
  { id: 'tennis', name: 'Tennis', minPlayers: 2, maxPlayers: 4 },
  { id: 'custom', name: 'Other Game', minPlayers: 1 },
];


const formSchema = z.object({
  gameId: z.string().min(1, "Please select a game."),
  selectedPlayerIds: z.array(z.string()).min(1, "Please select at least one player."),
  winnerIds: z.array(z.string()).min(1, "Please select at least one winner."),
}).superRefine((data, ctx) => {
  if (data.selectedPlayerIds.length > 0) {
    const game = MOCK_STATIC_GAMES_FOR_VALIDATION.find(g => g.id === data.gameId);
    if (game) {
      if (data.selectedPlayerIds.length < game.minPlayers) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `This game requires at least ${game.minPlayers} players.`,
          path: ['selectedPlayerIds'],
        });
      }
      if (game.maxPlayers && data.selectedPlayerIds.length > game.maxPlayers) {
         ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `This game allows a maximum of ${game.maxPlayers} players.`,
          path: ['selectedPlayerIds'],
        });
      }
      data.winnerIds.forEach(winnerId => {
        if (!data.selectedPlayerIds.includes(winnerId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Winners must be among the selected players.",
            path: ['winnerIds'],
          });
        }
      });
    }
  }
  if (data.winnerIds.length > data.selectedPlayerIds.length) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot have more winners than players.",
      path: ['winnerIds'],
    });
  }
});


export function AddResultForm() {
  const { games, players, addMatch, getGameById, getPlayerById, isClient, currentUser } = useAppContext();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const defaultGameId = searchParams.get('gameId');

  const [selectedGame, setSelectedGame] = useState<Game | null>(defaultGameId ? getGameById(defaultGameId) || null : null);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [potentialWinners, setPotentialWinners] = useState<Player[]>([]);
  
  const [handicapSuggestions, setHandicapSuggestions] = useState<SuggestHandicapOutput | null>(null);
  const [isSuggestingHandicap, setIsSuggestingHandicap] = useState(false);
  const [handicapError, setHandicapError] = useState<string | null>(null);

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
      setSelectedGame(getGameById(defaultGameId) || null);
    }
  }, [defaultGameId, form, getGameById]);

  const watchedGameId = form.watch('gameId');
  const watchedSelectedPlayerIds = form.watch('selectedPlayerIds');

  useEffect(() => {
    const gameFromContext = getGameById(watchedGameId);
    setSelectedGame(gameFromContext || null);
    // Reset players if game changes to ensure player count validation is fresh
    form.setValue('selectedPlayerIds', []);
    form.setValue('winnerIds', []);
    // Update validation context if needed
    // MOCK_STATIC_GAMES_FOR_VALIDATION should be updated if games are dynamic and editable by user
  }, [watchedGameId, getGameById, form]);

  useEffect(() => {
    const currentlySelectedPlayers = players.filter(p => watchedSelectedPlayerIds.includes(p.id));
    setMatchPlayers(
      currentlySelectedPlayers.map(p => ({
        ...p,
        // Use actual stats from player object if available, otherwise defaults
        aiWinRate: p.winRate !== undefined ? p.winRate * 100 : 50,
        aiAverageScore: p.averageScore !== undefined ? p.averageScore : 100,
      }))
    );
    setPotentialWinners(currentlySelectedPlayers);
    form.setValue('winnerIds', form.getValues('winnerIds').filter(id => watchedSelectedPlayerIds.includes(id)));
  }, [watchedSelectedPlayerIds, players, form]);


  const handlePlayerStatChange = (playerId: string, field: 'aiWinRate' | 'aiAverageScore', value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;

    setMatchPlayers(prev => 
      prev.map(p => 
        p.id === playerId ? { ...p, [field]: field === 'aiWinRate' ? Math.max(0, Math.min(100, numericValue)) : numericValue } : p
      )
    );
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to record a match.", variant: "destructive"});
      return;
    }
    const game = getGameById(values.gameId);
    if (!game) {
      toast({ title: "Error", description: "Selected game not found.", variant: "destructive" });
      return;
    }

    const pointsAwarded = values.winnerIds.map(winnerId => {
      const player = getPlayerById(winnerId);
      return {
        playerId: winnerId,
        points: game.pointsPerWin + (handicapSuggestions?.find(s => s.playerName === player?.name)?.handicap || 0),
      };
    });
    
    values.selectedPlayerIds.forEach(playerId => {
      if (!values.winnerIds.includes(playerId)) {
        const player = getPlayerById(playerId);
        const loserHandicap = handicapSuggestions?.find(s => s.playerName === player?.name)?.handicap || 0;
        if (loserHandicap !== 0) { // Only add if handicap is non-zero
           pointsAwarded.push({playerId: playerId, points: loserHandicap });
        }
      }
    });


    addMatch({
      gameId: values.gameId,
      playerIds: values.selectedPlayerIds,
      winnerIds: values.winnerIds,
      pointsAwarded,
      handicapSuggestions: handicapSuggestions || undefined,
    });

    form.reset({ gameId: watchedGameId, selectedPlayerIds: [], winnerIds: [] }); // Keep game selected
    setMatchPlayers([]);
    setPotentialWinners([]);
    setHandicapSuggestions(null);
    setHandicapError(null);
    toast({
      title: "Match Recorded!",
      description: `${game.name} result has been saved.`,
      action: <ThumbsUp className="h-5 w-5 text-green-500" />,
    });
  };

  const handleGetHandicapSuggestions = async () => {
    if (!selectedGame || matchPlayers.length === 0) {
      toast({ title: "Error", description: "Please select a game and players first.", variant: "destructive" });
      return;
    }

    setIsSuggestingHandicap(true);
    setHandicapError(null);
    setHandicapSuggestions(null);

    const handicapInput: SuggestHandicapInput = {
      gameName: selectedGame.name,
      playerStats: matchPlayers.map(p => ({
        playerName: p.name,
        winRate: p.aiWinRate / 100, 
        averageScore: p.aiAverageScore,
      })),
    };

    const result = await handleSuggestHandicapAction(handicapInput);
    setIsSuggestingHandicap(false);

    if ('error' in result) {
      setHandicapError(result.error);
      toast({ title: "Handicap Suggestion Failed", description: result.error, variant: "destructive" });
    } else {
      setHandicapSuggestions(result);
      toast({ title: "Handicap Suggestions Ready!", description: "AI has provided handicap recommendations." });
    }
  };
  
  const availablePlayers = useMemo(() => {
    if (!selectedGame) return players;
    if (selectedGame.maxPlayers && watchedSelectedPlayerIds.length >= selectedGame.maxPlayers) {
      return players.filter(p => watchedSelectedPlayerIds.includes(p.id));
    }
    return players;
  }, [players, selectedGame, watchedSelectedPlayerIds]);


  if (!isClient) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading form...</span></div>;
  }

  if (!currentUser) {
    return (
        <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Please log in to record game results.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2"><UserCheck /> Add New Game Result</CardTitle>
        <CardDescription>Record the outcome of a game and update player scores.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Game Selection */}
          <div className="space-y-2">
            <Label htmlFor="gameId" className="text-lg font-semibold">Game</Label>
            <Controller
              control={form.control}
              name="gameId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={defaultGameId || undefined}>
                  <SelectTrigger id="gameId" aria-label="Select game">
                    <SelectValue placeholder="Select a game" />
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

          {/* Player Selection */}
          {selectedGame && (
            <div className="space-y-2">
              <Label className="text-lg font-semibold flex items-center gap-2"><Users />Players</Label>
              <p className="text-xs text-muted-foreground">
                Select {selectedGame.minPlayers}
                {selectedGame.maxPlayers ? ` to ${selectedGame.maxPlayers}` : ' or more'} players.
              </p>
              <Controller
                control={form.control}
                name="selectedPlayerIds"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Select
                      onValueChange={(playerId) => {
                        if (!playerId || field.value?.includes(playerId)) return;
                        if (selectedGame.maxPlayers && field.value?.length >= selectedGame.maxPlayers) {
                            toast({ title: "Max Players Reached", description: `This game allows a maximum of ${selectedGame.maxPlayers} players.`, variant: "default"});
                            return;
                        }
                        field.onChange([...(field.value || []), playerId]);
                      }}
                       value="" // Reset select after choosing
                    >
                      <SelectTrigger aria-label="Add a player">
                        <SelectValue placeholder="Add a player..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlayers
                          .filter(p => !field.value?.includes(p.id))
                          .map(player => (
                            <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                          ))}
                         {availablePlayers.filter(p => !field.value?.includes(p.id)).length === 0 && <p className="p-2 text-sm text-muted-foreground">All available players selected or no players match.</p>}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">
                      {field.value?.map(playerId => {
                        const player = getPlayerById(playerId);
                        return player ? (
                          <PlayerTag 
                            key={playerId} 
                            name={player.name} 
                            onRemove={() => field.onChange(field.value?.filter(id => id !== playerId))}
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
          
          {/* Winner Selection */}
          {matchPlayers.length > 0 && (
             <div className="space-y-2">
              <Label className="text-lg font-semibold">Winner(s)</Label>
               <Controller
                control={form.control}
                name="winnerIds"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Select
                      onValueChange={(winnerId) => {
                        if (!winnerId) return;
                        const newWinners = field.value?.includes(winnerId)
                          ? field.value?.filter(id => id !== winnerId) 
                          : [...(field.value || []), winnerId]; 
                        field.onChange(newWinners);
                      }}
                       value="" // Reset select after choosing
                    >
                      <SelectTrigger aria-label="Select winners">
                         <SelectValue placeholder="Select winner(s)..." />
                      </SelectTrigger>
                      <SelectContent>
                        {potentialWinners.map(player => (
                          <SelectItem key={player.id} value={player.id} className={field.value?.includes(player.id) ? 'font-bold text-primary' : ''}>
                            {player.name} {field.value?.includes(player.id) && ' (Selected)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <div className="flex flex-wrap gap-2 mt-2 min-h-[30px]">
                      {field.value?.map(playerId => {
                        const player = getPlayerById(playerId);
                        return player ? (
                          <PlayerTag 
                            key={playerId} 
                            name={player.name} 
                            isWinner
                            onRemove={() => field.onChange(field.value?.filter(id => id !== playerId))}
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

          {/* AI Handicap Suggestion Section */}
          {selectedGame && matchPlayers.length >= selectedGame.minPlayers && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-accent flex items-center gap-2"><Bot /> AI Handicap Helper</h3>
                <p className="text-sm text-muted-foreground">
                  Optionally, get AI-powered handicap suggestions. Adjust player stats below for more accurate recommendations. Player stats like Win Rate and Average Score are global and can be managed from the player's profile in the future. For now, you can tweak them here for this specific match's handicap calculation.
                </p>
                <div className="space-y-3">
                  {matchPlayers.map((player) => (
                    <div key={player.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 border rounded-md border-border">
                      <Label className="md:col-span-3 font-medium">{player.name}</Label>
                      <div>
                        <Label htmlFor={`winRate-${player.id}`} className="text-xs">Current Win Rate (%)</Label>
                        <Input
                          id={`winRate-${player.id}`}
                          type="number"
                          min="0" max="100" step="1"
                          value={player.aiWinRate}
                          onChange={(e) => handlePlayerStatChange(player.id, 'aiWinRate', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                       <div>
                        <Label htmlFor={`avgScore-${player.id}`} className="text-xs">Current Avg Score</Label>
                        <Input
                          id={`avgScore-${player.id}`}
                          type="number"
                          step="1"
                          value={player.aiAverageScore}
                          onChange={(e) => handlePlayerStatChange(player.id, 'aiAverageScore', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  type="button" 
                  onClick={handleGetHandicapSuggestions} 
                  disabled={isSuggestingHandicap || matchPlayers.length < (selectedGame?.minPlayers || 0)}
                  variant="outline"
                  className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                >
                  {isSuggestingHandicap ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching Suggestions...</>
                  ) : (
                    "Get Handicap Suggestions"
                  )}
                </Button>

                {handicapError && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{handicapError}</AlertDescription>
                  </Alert>
                )}

                {handicapSuggestions && (
                  <Alert variant="default" className="border-accent bg-accent/10">
                    <Bot className="h-5 w-5 text-accent" />
                    <AlertTitle className="text-accent">AI Handicap Suggestions</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        {handicapSuggestions.map((suggestion, idx) => (
                          <li key={idx}>
                            <strong>{suggestion.playerName}:</strong> 
                            {suggestion.handicap !== undefined ? ` Handicap of ${suggestion.handicap}.` : ' No handicap needed.'}
                            {suggestion.reason && <span className="text-xs block text-muted-foreground italic">Reason: {suggestion.reason}</span>}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs mt-2 text-muted-foreground">Note: Handicaps (if any) will be applied to scores if you record this match now.</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
            disabled={!form.formState.isValid || isSuggestingHandicap || !currentUser}
          >
            Record Match
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}


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

const createFormSchema = (gamesForValidation: Game[]) => z.object({
  gameId: z.string().min(1, "Please select a game."),
  selectedPlayerIds: z.array(z.string()).min(1, "Please select at least one player."),
  winnerIds: z.array(z.string()).min(1, "Please select at least one winner."),
}).superRefine((data, ctx) => {
  if (data.selectedPlayerIds.length > 0) {
    const game = gamesForValidation.find(g => g.id === data.gameId);
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
    } else if (data.gameId) { // Game ID is selected but game not found in context
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Selected game not found. Please refresh or select another game.",
            path: ['gameId'],
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

  const formSchema = useMemo(() => createFormSchema(games), [games]);

  const [selectedGame, setSelectedGame] = useState<Game | null>(defaultGameId ? getGameById(defaultGameId) || null : null);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]); // For AI stats editing
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
      const game = getGameById(defaultGameId);
      setSelectedGame(game || null);
      if (!game) {
        toast({title: "Warning", description: "The pre-selected game could not be found.", variant: "default"})
      }
    }
  }, [defaultGameId, form, getGameById, toast]);

  const watchedGameId = form.watch('gameId');
  const watchedSelectedPlayerIds = form.watch('selectedPlayerIds');

  useEffect(() => {
    const gameFromContext = getGameById(watchedGameId);
    setSelectedGame(gameFromContext || null);
    form.setValue('selectedPlayerIds', []);
    form.setValue('winnerIds', []);
    setHandicapSuggestions(null); 
    setHandicapError(null);
  }, [watchedGameId, getGameById, form]);

  useEffect(() => {
    const currentlySelectedPlayers = players.filter(p => watchedSelectedPlayerIds.includes(p.id));
    setMatchPlayers(
      currentlySelectedPlayers.map(p => ({
        ...p,
        // Initialize AI stats from player's actual stats or defaults
        aiWinRate: p.winRate !== undefined ? p.winRate * 100 : 50, // Convert probability to percentage
        aiAverageScore: p.averageScore !== undefined ? p.averageScore : 100,
      }))
    );
    setPotentialWinners(currentlySelectedPlayers);
    // Ensure winners are a subset of selected players
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

    const pointsAwarded: Array<{ playerId: string; points: number }> = [];
    
    // Award points to winners
    values.winnerIds.forEach(winnerId => {
      const player = getPlayerById(winnerId);
      const handicapAdjustment = handicapSuggestions?.find(s => s.playerName === player?.name && s.handicap !== undefined)?.handicap || 0;
      pointsAwarded.push({
        playerId: winnerId,
        points: game.pointsPerWin + handicapAdjustment,
      });
    });
    
    // Apply handicap (if any) to non-winners if it results in non-zero points
    values.selectedPlayerIds.forEach(playerId => {
      if (!values.winnerIds.includes(playerId)) { // If player is not a winner
        const player = getPlayerById(playerId);
        const handicapAdjustment = handicapSuggestions?.find(s => s.playerName === player?.name && s.handicap !== undefined)?.handicap || 0;
        if (handicapAdjustment !== 0) { // Only add if handicap causes points change
           pointsAwarded.push({playerId: playerId, points: handicapAdjustment });
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

    form.reset({ gameId: watchedGameId, selectedPlayerIds: [], winnerIds: [] }); 
    setMatchPlayers([]);
    setPotentialWinners([]);
    setHandicapSuggestions(null);
    setHandicapError(null);
    toast({
      title: "Match Recorded!",
      description: `${game.name} result has been saved.`,
      action: <ThumbsUp className="h-5 w-5 text-green-400" />, // Changed icon color for visibility
    });
  };

  const handleGetHandicapSuggestions = async () => {
    if (!selectedGame || matchPlayers.length === 0) {
      toast({ title: "Error", description: "Please select a game and players first.", variant: "destructive" });
      return;
    }
     if (matchPlayers.length < selectedGame.minPlayers) {
      toast({ title: "Error", description: `This game requires at least ${selectedGame.minPlayers} players for handicap suggestion.`, variant: "destructive" });
      return;
    }

    setIsSuggestingHandicap(true);
    setHandicapError(null);
    // Do not clear existing suggestions immediately, maybe user wants to compare
    // setHandicapSuggestions(null); 

    const handicapInput: SuggestHandicapInput = {
      gameName: selectedGame.name,
      playerStats: matchPlayers.map(p => ({
        playerName: p.name,
        winRate: p.aiWinRate / 100, // Convert percentage back to probability
        averageScore: p.aiAverageScore,
      })),
    };

    const result = await handleSuggestHandicapAction(handicapInput);
    setIsSuggestingHandicap(false);

    if (result && 'error' in result) {
      setHandicapError(result.error);
      toast({ title: "Handicap Suggestion Failed", description: result.error, variant: "destructive" });
    } else if (result) {
      setHandicapSuggestions(result);
      toast({ title: "Handicap Suggestions Ready!", description: "AI has provided handicap recommendations." });
    } else {
      setHandicapError("Received an unexpected response from the AI.");
      toast({ title: "Handicap Suggestion Error", description: "Received an unexpected response.", variant: "destructive" });
    }
  };
  
  const availablePlayersForSelection = useMemo(() => {
    if (!selectedGame) return players;
    // If max players is set and reached, only show already selected players (to prevent adding more)
    if (selectedGame.maxPlayers && watchedSelectedPlayerIds.length >= selectedGame.maxPlayers) {
      return players.filter(p => watchedSelectedPlayerIds.includes(p.id));
    }
    return players; // Otherwise show all players
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
                        if (!playerId || field.value?.includes(playerId)) return; // Don't add if already selected
                        if (selectedGame.maxPlayers && field.value && field.value.length >= selectedGame.maxPlayers) {
                            toast({ title: "Max Players Reached", description: `This game allows a maximum of ${selectedGame.maxPlayers} players.`, variant: "default"});
                            return;
                        }
                        field.onChange([...(field.value || []), playerId]);
                      }}
                       value="" // Keep selection box clear to act as an "add" button
                    >
                      <SelectTrigger aria-label="Add a player">
                        <SelectValue placeholder="Add a player..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlayersForSelection
                          .filter(p => !(field.value || []).includes(p.id)) // Filter out already selected players
                          .map(player => (
                            <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                          ))}
                         {availablePlayersForSelection.filter(p => !(field.value || []).includes(p.id)).length === 0 && <p className="p-2 text-sm text-muted-foreground">All available players selected or no players match.</p>}
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
          
          {/* Winner Selection */}
          {matchPlayers.length > 0 && potentialWinners.length > 0 && (
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
                        const currentWinners = field.value || [];
                        const newWinners = currentWinners.includes(winnerId)
                          ? currentWinners.filter(id => id !== winnerId) 
                          : [...currentWinners, winnerId]; 
                        field.onChange(newWinners);
                      }}
                       value="" // Keep selection box clear
                    >
                      <SelectTrigger aria-label="Select winners">
                         <SelectValue placeholder="Select winner(s)..." />
                      </SelectTrigger>
                      <SelectContent>
                        {potentialWinners.map(player => (
                          <SelectItem key={player.id} value={player.id} className={(field.value || []).includes(player.id) ? 'font-bold text-primary' : ''}>
                            {player.name} {(field.value || []).includes(player.id) && ' (Selected Winner)'}
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

          {/* AI Handicap Suggestion Section */}
          {selectedGame && matchPlayers.length >= selectedGame.minPlayers && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-accent flex items-center gap-2"><Bot /> AI Handicap Helper</h3>
                <p className="text-sm text-muted-foreground">
                  Optionally, get AI-powered handicap suggestions. Adjust player stats below (Win Rate % and Average Score) for this match's handicap calculation. These adjustments are temporary for this match only.
                </p>
                <div className="space-y-3">
                  {matchPlayers.map((player) => (
                    <div key={player.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 border rounded-md border-border">
                      <Label className="md:col-span-3 font-medium">{player.name}</Label>
                      <div>
                        <Label htmlFor={`winRate-${player.id}`} className="text-xs">Temp. Win Rate (%)</Label>
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
                        <Label htmlFor={`avgScore-${player.id}`} className="text-xs">Temp. Avg Score</Label>
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

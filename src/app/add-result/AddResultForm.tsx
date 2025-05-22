
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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

const formSchema = z.object({
  gameId: z.string().min(1, "Please select a game."),
  selectedPlayerIds: z.array(z.string()).min(1, "Please select at least one player."),
  winnerIds: z.array(z.string()).min(1, "Please select at least one winner."),
  // For AI Handicap suggestions, player stats are collected separately
}).superRefine((data, ctx) => {
  if (data.selectedPlayerIds.length > 0) {
    const game = MOCK_GAMES.find(g => g.id === data.gameId); // Assuming MOCK_GAMES is accessible or pass games via props
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

// Temporary MOCK_GAMES for schema refinement, should be passed or fetched
const MOCK_GAMES = [
  { id: 'jackaroo', name: 'Jackaroo', minPlayers: 2, maxPlayers: 4 },
  { id: 'scro', name: 'Scro (سكرو)', minPlayers: 4, maxPlayers: 4 },
  { id: 'baloot', name: 'Baloot (بلوت)', minPlayers: 4, maxPlayers: 4 },
  { id: 'billiards', name: 'Billiards', minPlayers: 2, maxPlayers: 2 },
  { id: 'tennis', name: 'Tennis', minPlayers: 2, maxPlayers: 4 },
  { id: 'custom', name: 'Other Game', minPlayers: 1 },
];


export function AddResultForm() {
  const { games, players, addMatch, getGameById, getPlayerById, isClient } = useAppContext();
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
    setSelectedGame(getGameById(watchedGameId) || null);
    // Reset players if game changes to ensure player count validation is fresh
    form.setValue('selectedPlayerIds', []);
    form.setValue('winnerIds', []);
  }, [watchedGameId, getGameById, form]);

  useEffect(() => {
    const currentlySelectedPlayers = players.filter(p => watchedSelectedPlayerIds.includes(p.id));
    setMatchPlayers(
      currentlySelectedPlayers.map(p => ({
        ...p,
        aiWinRate: p.winRate !== undefined ? p.winRate * 100 : 50, // Default 50%
        aiAverageScore: p.averageScore !== undefined ? p.averageScore : 100, // Default 100
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
    const game = getGameById(values.gameId);
    if (!game) {
      toast({ title: "Error", description: "Selected game not found.", variant: "destructive" });
      return;
    }

    const pointsAwarded = values.winnerIds.map(winnerId => ({
      playerId: winnerId,
      points: game.pointsPerWin + (handicapSuggestions?.find(s => s.playerName === getPlayerById(winnerId)?.name)?.handicap || 0),
    }));
    
    // Assign 0 points to losers, or handle negative handicaps for losers if applicable.
    // For now, only winners get points based on game's pointsPerWin + their handicap.
    values.selectedPlayerIds.forEach(playerId => {
      if (!values.winnerIds.includes(playerId)) {
        const loserHandicap = handicapSuggestions?.find(s => s.playerName === getPlayerById(playerId)?.name)?.handicap || 0;
        // If a loser has a positive handicap, it means they get points. If negative, they lose points.
        // Let's assume handicap is added to score, so for losers, their "win points" (0) + handicap.
        if (loserHandicap !== 0) {
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

    form.reset({ gameId: "", selectedPlayerIds: [], winnerIds: [] });
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
        winRate: p.aiWinRate / 100, // Convert percentage to 0-1 scale
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
    // Filter out players if max player limit for the game is reached
    if (selectedGame.maxPlayers && watchedSelectedPlayerIds.length >= selectedGame.maxPlayers) {
      return players.filter(p => watchedSelectedPlayerIds.includes(p.id));
    }
    return players;
  }, [players, selectedGame, watchedSelectedPlayerIds]);


  if (!isClient) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading form...</span></div>;
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
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
                          ? field.value?.filter(id => id !== winnerId) // Toggle: remove if already selected
                          : [...(field.value || []), winnerId]; // Toggle: add if not selected
                        field.onChange(newWinners);
                      }}
                    >
                      <SelectTrigger aria-label="Select winners">
                         <SelectValue placeholder="Select winner(s)..." />
                      </SelectTrigger>
                      <SelectContent>
                        {potentialWinners.map(player => (
                          <SelectItem key={player.id} value={player.id} className={field.value?.includes(player.id) ? 'font-bold text-primary' : ''}>
                            {player.name} {field.value?.includes(player.id) && '(Selected)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <div className="flex flex-wrap gap-2 mt-2">
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
                  Optionally, get AI-powered handicap suggestions. Adjust player stats below for more accurate recommendations.
                </p>
                <div className="space-y-3">
                  {matchPlayers.map((player, index) => (
                    <div key={player.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 border rounded-md border-border">
                      <Label className="md:col-span-3 font-medium">{player.name}</Label>
                      <div>
                        <Label htmlFor={`winRate-${player.id}`} className="text-xs">Win Rate (%)</Label>
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
                        <Label htmlFor={`avgScore-${player.id}`} className="text-xs">Average Score</Label>
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
                  disabled={isSuggestingHandicap || matchPlayers.length < (selectedGame?.minPlayers || 2)}
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
            disabled={!form.formState.isValid || isSuggestingHandicap}
          >
            Record Match
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

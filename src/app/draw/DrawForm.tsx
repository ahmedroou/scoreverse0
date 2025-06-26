"use client";

import React, { useState, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, Loader2, Shuffle, Users, Swords, User, CornerDownRight } from 'lucide-react';
import { handleSuggestMatchupsAction } from './actions';
import type { SuggestMatchupsOutput } from '@/ai/flows/suggest-matchups';
import { useToast } from '@/hooks/use-toast';
import { PlayerTag } from '@/components/PlayerTag';
import { AnimatePresence, motion } from 'framer-motion';

const formSchema = z.object({
  gameId: z.string().min(1, "Please select a game."),
  selectedPlayerIds: z.array(z.string()).min(2, "Please select at least two players for the draw."),
});

export function DrawForm() {
  const { games, players, getPlayerById, isClient, currentUser } = useAppContext();
  const { toast } = useToast();

  const [matchups, setMatchups] = useState<SuggestMatchupsOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameId: "",
      selectedPlayerIds: [],
    },
  });

  const watchedSelectedPlayerIds = form.watch('selectedPlayerIds');
  const watchedGameId = form.watch('gameId');

  const availablePlayersForSelection = useMemo(() => {
    return players.filter(p => !watchedSelectedPlayerIds.includes(p.id));
  }, [players, watchedSelectedPlayerIds]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    const game = games.find(g => g.id === values.gameId);
    if (!game) {
      toast({ title: "Error", description: "Selected game not found.", variant: "destructive" });
      return;
    }

    const selectedPlayers = values.selectedPlayerIds.map(id => getPlayerById(id)).filter(p => !!p);
    if (selectedPlayers.length < 2) {
      toast({ title: "Error", description: "Not enough players selected.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setMatchups(null);

    const result = await handleSuggestMatchupsAction({
      gameName: game.name,
      playerNames: selectedPlayers.map(p => p!.name),
    });

    setIsGenerating(false);

    if (result && 'error' in result) {
      setError(result.error);
      toast({ title: "Draw Generation Failed", description: result.error, variant: "destructive" });
    } else if (result) {
      setMatchups(result);
      toast({ title: "Draw Generated!", description: "AI has created the matchups for the round." });
    } else {
      setError("Received an unexpected response from the AI.");
      toast({ title: "Draw Generation Error", description: "Received an unexpected response.", variant: "destructive" });
    }
  };
  
  const resetDraw = () => {
    setMatchups(null);
    setError(null);
    form.reset({ gameId: watchedGameId, selectedPlayerIds: [] });
  }

  if (!isClient) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading...</span></div>;
  }
  
  if (!currentUser) {
    return (
       <div className="container mx-auto py-8">
           <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
               <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
               <CardContent><p>Please log in to use the draw generator.</p></CardContent>
           </Card>
       </div>
   );
 }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2"><Shuffle /> Matchup Generator</CardTitle>
        <CardDescription>Use the power of AI to generate random pairings for your game or tournament.</CardDescription>
      </CardHeader>
      
      {matchups ? (
        <CardContent className="space-y-6">
            <Alert variant="default" className="border-accent bg-accent/10">
                <Bot className="h-5 w-5 text-accent" />
                <AlertTitle className="text-accent">AI Commentary</AlertTitle>
                <AlertDescription>
                    {matchups.commentary || "Here are your matchups!"}
                </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">This Round's Pairings</h3>
                <AnimatePresence>
                    {matchups.pairings.map((pairing, index) => (
                        <motion.div
                            key={`${pairing.player1}-${pairing.player2}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Card className="bg-muted/30">
                                <CardContent className="p-4 flex items-center justify-center text-center gap-4">
                                    <div className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
                                        <User className="h-5 w-5 text-primary"/>
                                        {pairing.player1}
                                    </div>
                                    <Swords className="h-6 w-6 text-destructive"/>
                                     <div className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
                                        <User className="h-5 w-5 text-secondary"/>
                                        {pairing.player2}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {matchups.bye && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: matchups.pairings.length * 0.1 }}
                >
                    <Alert>
                        <AlertTitle className="flex items-center gap-2">
                           <CornerDownRight/> Bye Round
                        </AlertTitle>
                        <AlertDescription>
                            <strong>{matchups.bye}</strong> gets a free pass this round!
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}
             <CardFooter className="pt-6">
                <Button onClick={resetDraw} className="w-full" variant="outline">
                    <Shuffle className="mr-2 h-4 w-4" /> Start a New Draw
                </Button>
            </CardFooter>
        </CardContent>
      ) : (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gameId" className="text-lg font-semibold">Game</Label>
            <Controller
              control={form.control}
              name="gameId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="gameId"><SelectValue placeholder="Select a game for the draw" /></SelectTrigger>
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

          <div className="space-y-2">
            <Label className="text-lg font-semibold flex items-center gap-2"><Users />Players for the Draw</Label>
            <Controller
              control={form.control}
              name="selectedPlayerIds"
              render={({ field }) => (
                <div className="space-y-2">
                  <Select onValueChange={(playerId) => { if (playerId && !field.value?.includes(playerId)) { field.onChange([...(field.value || []), playerId]); } }} value="">
                    <SelectTrigger><SelectValue placeholder="Add a player to the pool..." /></SelectTrigger>
                    <SelectContent>
                      {availablePlayersForSelection.map(player => (
                        <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                      ))}
                      {availablePlayersForSelection.length === 0 && <p className="p-2 text-sm text-muted-foreground">All players added.</p>}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2 min-h-[30px] p-2 border rounded-md bg-muted/20">
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
                    {(field.value || []).length === 0 && <p className="text-sm text-muted-foreground">Select players to include in the draw.</p>}
                  </div>
                </div>
              )}
            />
            {form.formState.errors.selectedPlayerIds && <p className="text-sm text-destructive">{form.formState.errors.selectedPlayerIds.message}</p>}
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
            disabled={isGenerating || !form.formState.isValid}
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Draw...</>
            ) : (
              <><Shuffle className="mr-2 h-5 w-5" /> Generate Matchups</>
            )}
          </Button>
        </CardFooter>
      </form>
      )}
    </Card>
  );
}

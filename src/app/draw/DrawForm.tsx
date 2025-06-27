
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
import { Bot, Loader2, Shuffle, Users, Swords, User, CornerDownRight, UserCheck } from 'lucide-react';
import { handleSuggestMatchupsAction } from './actions';
import type { SuggestMatchupsOutput } from '@/ai/flows/suggest-matchups';
import { useToast } from '@/hooks/use-toast';
import { PlayerTag } from '@/components/PlayerTag';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/hooks/use-language';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const createFormSchema = (t: (key: string) => string) => z.object({
  gameId: z.string().min(1, t('addResult.validation.gameRequired')),
  selectedPlayerIds: z.array(z.string()).min(2, t('addResult.validation.playerRequired')),
});

export function DrawForm() {
  const { games, players, getPlayerById, isClient, currentUser, addMatch, getGameById } = useAppContext();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [matchups, setMatchups] = useState<SuggestMatchupsOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [winners, setWinners] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);

  const formSchema = createFormSchema(t);

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
    
  const selectedPlayers = useMemo(() =>
    players.filter(p => watchedSelectedPlayerIds.includes(p.id)),
    [players, watchedSelectedPlayerIds]
  );

  const nameToIdMap = useMemo(() =>
    new Map(selectedPlayers.map(p => [p.name, p.id])),
    [selectedPlayers]
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({ title: t('auth.authError'), description: t('draw.toasts.authError'), variant: "destructive" });
      return;
    }

    const game = games.find(g => g.id === values.gameId);
    if (!game) {
      toast({ title: t('common.error'), description: t('draw.toasts.gameNotFound'), variant: "destructive" });
      return;
    }

    const currentSelectedPlayers = values.selectedPlayerIds.map(id => getPlayerById(id)).filter(p => !!p);
    if (currentSelectedPlayers.length < 2) {
      toast({ title: t('common.error'), description: t('draw.toasts.notEnoughPlayers'), variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setMatchups(null);
    setWinners({});

    const result = await handleSuggestMatchupsAction({
      gameName: game.name,
      playerNames: currentSelectedPlayers.map(p => p!.name),
      language: language,
    });

    setIsGenerating(false);

    if (result && 'error' in result) {
      setError(result.error);
      toast({ title: t('draw.toasts.drawFailed'), description: result.error, variant: "destructive" });
    } else if (result) {
      setMatchups(result);
      toast({ title: t('draw.toasts.drawSuccess'), description: t('draw.toasts.drawSuccessDesc') });
    } else {
      setError(t('draw.toasts.drawUnexpectedError'));
      toast({ title: t('draw.toasts.drawFailed'), description: t('draw.toasts.drawUnexpectedError'), variant: "destructive" });
    }
  };
  
  const handleRecordResults = async () => {
    if (!currentUser || !matchups) return;
    
    const game = getGameById(watchedGameId);
    if (!game) {
        toast({ title: t('common.error'), description: t('draw.toasts.gameNotFound'), variant: "destructive" });
        return;
    }

    setIsRecording(true);
    try {
        const promises = matchups.pairings.map(pairing => {
            const winnerName = winners[`${pairing.player1}-${pairing.player2}`];
            if (!winnerName) return Promise.resolve();

            const player1Id = nameToIdMap.get(pairing.player1);
            const player2Id = nameToIdMap.get(pairing.player2);
            const winnerId = nameToIdMap.get(winnerName);

            if (!player1Id || !player2Id || !winnerId) {
                console.error("Could not find player ID for name during match recording.");
                return Promise.resolve();
            }
            
            return addMatch({
                gameId: game.id,
                playerIds: [player1Id, player2Id],
                winnerIds: [winnerId],
                pointsAwarded: [{ playerId: winnerId, points: game.pointsPerWin }],
            });
        });

        await Promise.all(promises);

        toast({
            title: t('draw.toasts.resultsRecorded'),
            description: t('draw.toasts.resultsRecordedDesc', { count: matchups.pairings.length })
        });
        resetDraw();

    } catch (error) {
        console.error("Failed to record match results:", error);
        toast({ title: t('common.error'), description: t('draw.toasts.recordResultsError'), variant: "destructive" });
    } finally {
        setIsRecording(false);
    }
  };

  const resetDraw = () => {
    setMatchups(null);
    setError(null);
    setWinners({});
    form.reset({ gameId: watchedGameId, selectedPlayerIds: [] });
  }

  if (!isClient) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ms-2">{t('draw.loading')}</span></div>;
  }
  
  if (!currentUser) {
    return (
       <div className="container mx-auto py-8">
           <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
               <CardHeader><CardTitle>{t('draw.accessDenied')}</CardTitle></CardHeader>
               <CardContent><p>{t('draw.accessDeniedDesc')}</p></CardContent>
           </Card>
       </div>
   );
 }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2"><Shuffle /> {t('draw.pageTitle')}</CardTitle>
        <CardDescription>{t('draw.pageDescription')}</CardDescription>
      </CardHeader>
      
      {matchups ? (
        <CardContent className="space-y-6">
            <Alert variant="default" className="border-accent bg-accent/10">
                <Bot className="h-5 w-5 text-accent" />
                <AlertTitle className="text-accent">{t('draw.aiCommentary')}</AlertTitle>
                <AlertDescription>
                    {matchups.commentary || t('draw.defaultCommentary')}
                </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">{t('draw.roundPairings')}</h3>
                <AnimatePresence>
                    {matchups.pairings.map((pairing, index) => (
                        <motion.div
                            key={`${pairing.player1}-${pairing.player2}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Card className="bg-muted/30 overflow-hidden">
                                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between text-center gap-4">
                                    <div className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
                                        <User className="h-5 w-5 text-primary"/>
                                        {pairing.player1}
                                    </div>
                                    <Swords className="h-6 w-6 text-destructive hidden sm:block"/>
                                     <div className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
                                        <User className="h-5 w-5 text-secondary"/>
                                        {pairing.player2}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-3 bg-background/50 border-t">
                                    <RadioGroup
                                        onValueChange={(winnerName) => {
                                            const pairingKey = `${pairing.player1}-${pairing.player2}`;
                                            setWinners(prev => ({...prev, [pairingKey]: winnerName}));
                                        }}
                                        value={winners[`${pairing.player1}-${pairing.player2}`]}
                                        className="w-full flex justify-center items-center gap-x-6 gap-y-2 flex-wrap"
                                    >
                                        <Label className="font-semibold me-4">{t('draw.selectWinner')}:</Label>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value={pairing.player1} id={`${pairing.player1}-${index}`} />
                                            <Label htmlFor={`${pairing.player1}-${index}`}>{pairing.player1}</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value={pairing.player2} id={`${pairing.player2}-${index}`} />
                                            <Label htmlFor={`${pairing.player2}-${index}`}>{pairing.player2}</Label>
                                        </div>
                                    </RadioGroup>
                                </CardFooter>
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
                           <CornerDownRight/> {t('draw.byeRound')}
                        </AlertTitle>
                        <AlertDescription dangerouslySetInnerHTML={{ __html: t('draw.byeRoundDesc', {playerName: matchups.bye}) }} />
                    </Alert>
                </motion.div>
            )}
             <CardFooter className="pt-6 flex flex-col sm:flex-row gap-2">
                <Button onClick={resetDraw} className="w-full sm:w-auto" variant="outline">
                    <Shuffle className="me-2 h-4 w-4" /> {t('draw.newDrawButton')}
                </Button>
                <Button 
                    onClick={handleRecordResults} 
                    disabled={Object.keys(winners).length !== matchups.pairings.length || isRecording}
                    className="w-full sm:w-auto flex-grow bg-primary hover:bg-primary/90"
                >
                    {isRecording ? <Loader2 className="animate-spin me-2" /> : <UserCheck className="me-2" />}
                    {isRecording ? t('draw.recordingResults') : t('draw.recordResultsButton')}
                </Button>
            </CardFooter>
        </CardContent>
      ) : (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gameId" className="text-lg font-semibold">{t('draw.gameLabel')}</Label>
            <Controller
              control={form.control}
              name="gameId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="gameId"><SelectValue placeholder={t('draw.gamePlaceholder')} /></SelectTrigger>
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
            <Label className="text-lg font-semibold flex items-center gap-2"><Users />{t('draw.playersLabel')}</Label>
            <Controller
              control={form.control}
              name="selectedPlayerIds"
              render={({ field }) => (
                <div className="space-y-2">
                  <Select onValueChange={(playerId) => { if (playerId && !field.value?.includes(playerId)) { field.onChange([...(field.value || []), playerId]); } }} value="">
                    <SelectTrigger><SelectValue placeholder={t('draw.addPlayerPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      {availablePlayersForSelection.map(player => (
                        <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                      ))}
                      {availablePlayersForSelection.length === 0 && <p className="p-2 text-sm text-muted-foreground">{t('draw.allPlayersAdded')}</p>}
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
                    {(field.value || []).length === 0 && <p className="text-sm text-muted-foreground">{t('draw.selectedPlayersPool')}</p>}
                  </div>
                </div>
              )}
            />
            {form.formState.errors.selectedPlayerIds && <p className="text-sm text-destructive">{form.formState.errors.selectedPlayerIds.message}</p>}
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>{t('common.error')}</AlertTitle>
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
              <><Loader2 className="me-2 h-5 w-5 animate-spin" /> {t('draw.generating')}</>
            ) : (
              <><Shuffle className="me-2 h-5 w-5" /> {t('draw.generateButton')}</>
            )}
          </Button>
        </CardFooter>
      </form>
      )}
    </Card>
  );
}

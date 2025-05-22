
"use client";
import { useAppContext } from '@/context/AppContext';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function LeaderboardsPage() {
  const { games, getOverallLeaderboard, getGameLeaderboard, isClient } = useAppContext();

  if (!isClient) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading leaderboards...</span></div>;
  }
  
  const overallScores = getOverallLeaderboard();

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Leaderboards</h1>
        <p className="text-lg text-muted-foreground">See who's dominating the ScoreVerse!</p>
      </header>

      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mb-6">
          <TabsTrigger value="overall" className="py-3 text-base">Overall Ranking</TabsTrigger>
          {games.map(game => (
            <TabsTrigger key={game.id} value={game.id} className="py-3 text-base">{game.name}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overall">
          <LeaderboardTable scores={overallScores} title="Overall Leaderboard" />
        </TabsContent>

        {games.map(game => (
          <TabsContent key={game.id} value={game.id}>
            <LeaderboardTable scores={getGameLeaderboard(game.id)} title={`${game.name} Leaderboard`} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

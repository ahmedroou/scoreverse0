
"use client";
import { useAppContext } from '@/context/AppContext';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BarChart3, AlertTriangle, Layers } from 'lucide-react'; 
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; 

export default function LeaderboardsPage() {
  const { games, getOverallLeaderboard, getGameLeaderboard, isClient, currentUser, getActiveSpace, spaces } = useAppContext();
  const activeSpace = getActiveSpace();

  if (!isClient) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-theme(spacing.32))]"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-lg">Loading leaderboards...</span></div>;
  }
  
  if (!currentUser) {
     return (
        <div className="container mx-auto py-8">
            <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please log in to view leaderboards.</p>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const overallScores = getOverallLeaderboard(); // This now considers activeSpace
  const pageTitle = activeSpace ? `${activeSpace.name} - Leaderboards` : "Global Leaderboards (No Space Selected)";

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary mb-1 flex items-center gap-3"><BarChart3 /> Leaderboards</h1>
                <p className="text-lg text-muted-foreground">See who's dominating in {activeSpace ? `the "${activeSpace.name}" space` : "the global arena"}!</p>
            </div>
            {activeSpace && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border border-border rounded-md bg-card">
                    <Layers className="h-5 w-5 text-accent"/>
                    <span>Active Space: <strong className="text-accent">{activeSpace.name}</strong></span>
                </div>
            )}
        </div>
      </header>

      {(games.length === 0 || spaces.length === 0) && overallScores.length === 0 ? ( // Check if spaces also exist
        <Card className="text-center py-12 bg-card border-border shadow">
          <CardHeader>
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-card-foreground">No Data Yet!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Looks like there are no games, spaces, or recorded matches in the current context.
            </p>
            <p className="text-muted-foreground mt-1">
              Create a space, add some games, and record match results to see leaderboards appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-auto gap-2 mb-6 bg-card p-2 rounded-lg shadow">
            <TabsTrigger value="overall" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">Overall Ranking</TabsTrigger>
            {games.map(game => (
              <TabsTrigger key={game.id} value={game.id} className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">{game.name}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overall">
            <LeaderboardTable scores={overallScores} title={`Overall Leaderboard ${activeSpace ? `(${activeSpace.name})` : '(Global)'}`} />
          </TabsContent>

          {games.map(game => (
            <TabsContent key={game.id} value={game.id}>
              <LeaderboardTable scores={getGameLeaderboard(game.id)} title={`${game.name} Leaderboard ${activeSpace ? `(${activeSpace.name})` : '(Global)'}`} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}


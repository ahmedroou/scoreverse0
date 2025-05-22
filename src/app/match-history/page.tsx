
"use client";
import { useAppContext } from '@/context/AppContext';
import { MatchHistoryCard } from '@/components/MatchHistoryCard';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Search, SlidersHorizontal, X, History, ListFilter } from 'lucide-react'; // Added ListFilter
import { Label } from '@/components/ui/label'; // Added Label

export default function MatchHistoryPage() {
  const { matches, games, players, getGameById, getPlayerById, isClient, currentUser } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('');
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const sortedMatches = useMemo(() => 
    [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [matches]);

  const filteredMatches = useMemo(() => {
    return sortedMatches.filter(match => {
      const game = getGameById(match.gameId);
      const playerNames = match.playerIds.map(id => getPlayerById(id)?.name.toLowerCase() || '');
      const winnerNames = match.winnerIds.map(id => getPlayerById(id)?.name.toLowerCase() || '');
      const lowerSearchTerm = searchTerm.toLowerCase();

      const matchesSearchTerm = 
        game?.name.toLowerCase().includes(lowerSearchTerm) ||
        playerNames.some(name => name.includes(lowerSearchTerm)) ||
        winnerNames.some(name => name.includes(lowerSearchTerm));
      
      const matchesGameFilter = !selectedGameFilter || match.gameId === selectedGameFilter;
      const matchesPlayerFilter = !selectedPlayerFilter || match.playerIds.includes(selectedPlayerFilter) || match.winnerIds.includes(selectedPlayerFilter);

      return matchesSearchTerm && matchesGameFilter && matchesPlayerFilter;
    });
  }, [sortedMatches, searchTerm, selectedGameFilter, selectedPlayerFilter, getGameById, getPlayerById]);

  if (!isClient) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-theme(spacing.32))]"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-lg">Loading match history...</span></div>;
  }
  
  if (!currentUser) {
     return (
        <div className="container mx-auto py-8">
            <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please log in to view match history.</p>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2 flex items-center gap-3"><History /> Match History</h1>
        <p className="text-lg text-muted-foreground">Review past glories, epic showdowns, and analyze game outcomes.</p>
      </header>

      <div className="mb-6 p-4 border border-border rounded-lg bg-card shadow-md">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Search by game, player, winner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-base py-2.5"
              aria-label="Search matches"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full sm:w-auto text-base py-2.5">
            <ListFilter className="h-5 w-5 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
        {showFilters && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-6">
            <div>
              <Label htmlFor="gameFilter" className="text-sm font-medium mb-1.5 block">Filter by Game</Label>
              <Select value={selectedGameFilter} onValueChange={setSelectedGameFilter}>
                <SelectTrigger id="gameFilter" className="text-base py-2.5">
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Games</SelectItem>
                  {games.map(game => (
                    <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="playerFilter" className="text-sm font-medium mb-1.5 block">Filter by Player</Label>
              <Select value={selectedPlayerFilter} onValueChange={setSelectedPlayerFilter}>
                <SelectTrigger id="playerFilter" className="text-base py-2.5">
                  <SelectValue placeholder="All Players" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Players</SelectItem>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             {(selectedGameFilter || selectedPlayerFilter || searchTerm) && (
                <Button 
                    variant="ghost" 
                    onClick={() => {
                        setSearchTerm('');
                        setSelectedGameFilter('');
                        setSelectedPlayerFilter('');
                    }}
                    className="md:col-span-2 text-accent hover:text-accent-foreground hover:bg-accent/10 justify-start text-base py-2.5"
                >
                    <X className="h-5 w-5 mr-2" /> Clear All Filters & Search
                </Button>
            )}
          </div>
        )}
      </div>
      
      {filteredMatches.length > 0 ? (
        <div className="space-y-6">
          {filteredMatches.map(match => (
            <MatchHistoryCard 
              key={match.id} 
              match={match} 
              game={getGameById(match.gameId)}
              getPlayerById={getPlayerById} // Pass getPlayerById
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border rounded-lg shadow">
          <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-2xl font-semibold text-card-foreground">No Matches Found</p>
          <p className="text-md text-muted-foreground mt-2">
            Try adjusting your search or filters, or go record a new match!
          </p>
           <Link href="/add-result" passHref legacyBehavior>
             <Button className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">Record First Match</Button>
           </Link>
        </div>
      )}
    </div>
  );
}

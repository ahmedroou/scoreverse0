
"use client";
import { useAppContext } from '@/context/AppContext';
import { MatchHistoryCard } from '@/components/MatchHistoryCard';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Search, SlidersHorizontal, X } from 'lucide-react';

export default function MatchHistoryPage() {
  const { matches, games, players, getGameById, getPlayerById, isClient } = useAppContext();
  
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
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading match history...</span></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <header className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Match History</h1>
        <p className="text-lg text-muted-foreground">Review past glories and epic showdowns.</p>
      </header>

      <div className="mb-6 p-4 border border-border rounded-lg bg-card shadow">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Search by game, player, winner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full sm:w-auto">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gameFilter" className="text-sm font-medium">Filter by Game</Label>
              <Select value={selectedGameFilter} onValueChange={setSelectedGameFilter}>
                <SelectTrigger id="gameFilter">
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
              <Label htmlFor="playerFilter" className="text-sm font-medium">Filter by Player</Label>
              <Select value={selectedPlayerFilter} onValueChange={setSelectedPlayerFilter}>
                <SelectTrigger id="playerFilter">
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
                    className="md:col-span-2 text-accent hover:text-accent-foreground"
                >
                    <X className="h-4 w-4 mr-2" /> Clear Filters
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
              players={players}
              getPlayerById={getPlayerById}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-2xl text-muted-foreground">No matches found.</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters, or record a new match!</p>
        </div>
      )}
    </div>
  );
}

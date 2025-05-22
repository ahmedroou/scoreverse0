
"use client";
import { useAppContext } from '@/context/AppContext';
import { GameCard } from '@/components/GameCard';
import { Input } from "@/components/ui/input";
import { useState, useMemo } from 'react';

export default function GameLibraryPage() {
  const { games, isClient } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGames = useMemo(() => {
    if (!searchTerm) return games;
    return games.filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [games, searchTerm]);

  if (!isClient) {
    return <div className="flex justify-center items-center h-full"><p>Loading games...</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Game Library</h1>
        <p className="text-lg text-muted-foreground">Browse available games or record a new match.</p>
        <Input 
          type="text"
          placeholder="Search games..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-4 max-w-sm"
        />
      </header>
      
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No games found matching your search.</p>
        </div>
      )}
    </div>
  );
}

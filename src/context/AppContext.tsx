
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Game, Player, Match, ScoreData, MatchPlayer } from '@/types';
import { MOCK_GAMES, MOCK_PLAYERS } from '@/data/mock-data';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  games: Game[];
  players: Player[];
  matches: Match[];
  addPlayer: (name: string) => void;
  addMatch: (matchData: Omit<Match, 'id' | 'date'>) => void;
  updatePlayer: (playerId: string, newName: string) => void;
  getGameById: (gameId: string) => Game | undefined;
  getPlayerById: (playerId: string) => Player | undefined;
  getOverallLeaderboard: () => ScoreData[];
  getGameLeaderboard: (gameId: string) => ScoreData[];
  isClient: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>(MOCK_GAMES);
  const [players, setPlayers] = useState<Player[]>(() => {
    if (typeof window !== 'undefined') {
      const savedPlayers = localStorage.getItem('scoreverse-players');
      return savedPlayers ? JSON.parse(savedPlayers) : MOCK_PLAYERS;
    }
    return MOCK_PLAYERS;
  });
  const [matches, setMatches] = useState<Match[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMatches = localStorage.getItem('scoreverse-matches');
      return savedMatches ? JSON.parse(savedMatches) : [];
    }
    return [];
  });
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('scoreverse-matches', JSON.stringify(matches));
    }
  }, [matches, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('scoreverse-players', JSON.stringify(players));
    }
  }, [players, isClient]);

  const addPlayer = useCallback((name: string) => {
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      // Default winRate and averageScore can be added if desired for new players
      // winRate: 0, 
      // averageScore: 0 
    };
    setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
    toast({
      title: "Player Added",
      description: `${name} has been added to the roster.`,
    });
  }, [toast]);

  const addMatch = useCallback((matchData: Omit<Match, 'id' | 'date'>) => {
    const newMatch: Match = {
      ...matchData,
      id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
    };
    setMatches(prevMatches => [...prevMatches, newMatch]);
  }, []);

  const updatePlayer = useCallback((playerId: string, newName: string) => {
    setPlayers(prevPlayers => 
      prevPlayers.map(p => 
        p.id === playerId ? { ...p, name: newName } : p
      )
    );
    toast({
      title: "Player Updated",
      description: `Player name changed to ${newName}.`,
    });
  }, [toast]);

  const getGameById = useCallback((gameId: string) => {
    return games.find(g => g.id === gameId);
  }, [games]);

  const getPlayerById = useCallback((playerId: string) => {
    return players.find(p => p.id === playerId);
  }, [players]);

  const calculateScores = useCallback((filteredMatches: Match[]): ScoreData[] => {
    const scores: Record<string, Omit<ScoreData, 'playerName'>> = {};

    players.forEach(player => {
      scores[player.id] = { playerId: player.id, totalPoints: 0, gamesPlayed: 0, wins: 0 };
    });

    filteredMatches.forEach(match => {
      match.playerIds.forEach(playerId => {
        if (scores[playerId]) {
          scores[playerId].gamesPlayed += 1;
        }
      });
      match.pointsAwarded.forEach(pa => {
        if (scores[pa.playerId]) {
          scores[pa.playerId].totalPoints += pa.points;
        }
      });
      match.winnerIds.forEach(winnerId => {
        if (scores[winnerId]) {
          scores[winnerId].wins += 1;
        }
      });
    });
    
    return Object.values(scores).map(s => ({
      ...s,
      playerName: getPlayerById(s.playerId)?.name || 'Unknown Player'
    })).sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins || a.gamesPlayed - b.gamesPlayed);

  }, [players, getPlayerById]);


  const getOverallLeaderboard = useCallback((): ScoreData[] => {
    return calculateScores(matches);
  }, [matches, calculateScores]);

  const getGameLeaderboard = useCallback((gameId: string): ScoreData[] => {
    const gameMatches = matches.filter(match => match.gameId === gameId);
    return calculateScores(gameMatches);
  }, [matches, calculateScores]);


  return (
    <AppContext.Provider value={{ 
      games, 
      players, 
      matches,
      addPlayer, 
      addMatch,
      updatePlayer, 
      getGameById, 
      getPlayerById,
      getOverallLeaderboard,
      getGameLeaderboard,
      isClient
    }}>
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

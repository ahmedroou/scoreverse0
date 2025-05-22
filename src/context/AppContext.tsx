
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Game, Player, Match, ScoreData } from '@/types';
import { MOCK_GAMES, MOCK_PLAYERS as INITIAL_MOCK_PLAYERS } from '@/data/mock-data';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Removed usePathname as it's not used here directly

interface UserAccount {
  id: string;
  username: string;
  // Password is not stored for this prototype for security reasons
}

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
  currentUser: UserAccount | null;
  login: (username: string) => boolean;
  signup: (username: string) => boolean;
  logout: () => void;
  isLoadingAuth: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const REGISTERED_USERS_LS_KEY = 'scoreverse-registered-users';
const CURRENT_USER_LS_KEY = 'scoreverse-current-user';
const PLAYERS_LS_KEY = 'scoreverse-players';
const MATCHES_LS_KEY = 'scoreverse-matches';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>(MOCK_GAMES);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load initial data from localStorage
  useEffect(() => {
    if (isClient) {
      const savedRegisteredUsers = localStorage.getItem(REGISTERED_USERS_LS_KEY);
      if (savedRegisteredUsers) {
        setRegisteredUsers(JSON.parse(savedRegisteredUsers));
      }

      const savedCurrentUser = localStorage.getItem(CURRENT_USER_LS_KEY);
      if (savedCurrentUser) {
        const user = JSON.parse(savedCurrentUser);
        setCurrentUser(user);
        const savedPlayers = localStorage.getItem(PLAYERS_LS_KEY);
        setPlayers(savedPlayers ? JSON.parse(savedPlayers) : INITIAL_MOCK_PLAYERS);
        const savedMatches = localStorage.getItem(MATCHES_LS_KEY);
        setMatches(savedMatches ? JSON.parse(savedMatches) : []);
      } else {
        setPlayers(INITIAL_MOCK_PLAYERS); 
        setMatches([]);
      }
      setIsLoadingAuth(false);
    }
  }, [isClient]);

  // Persist registered users
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(REGISTERED_USERS_LS_KEY, JSON.stringify(registeredUsers));
    }
  }, [registeredUsers, isClient]);

  // Persist current user
  useEffect(() => {
    if (isClient) {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_LS_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_LS_KEY);
      }
    }
  }, [currentUser, isClient]);
  
  // Persist matches
  useEffect(() => {
    if (isClient && currentUser) { 
      localStorage.setItem(MATCHES_LS_KEY, JSON.stringify(matches));
    }
  }, [matches, isClient, currentUser]);

  // Persist players
  useEffect(() => {
    if (isClient && currentUser) { 
      localStorage.setItem(PLAYERS_LS_KEY, JSON.stringify(players));
    }
  }, [players, isClient, currentUser]);


  const login = useCallback((username: string): boolean => {
    setIsLoadingAuth(true);
    const userExists = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      setCurrentUser(userExists);
      const savedPlayers = localStorage.getItem(PLAYERS_LS_KEY);
      setPlayers(savedPlayers ? JSON.parse(savedPlayers) : INITIAL_MOCK_PLAYERS);
      const savedMatches = localStorage.getItem(MATCHES_LS_KEY);
      setMatches(savedMatches ? JSON.parse(savedMatches) : []);
      toast({ title: "Logged In", description: `Welcome back, ${username}!` });
      setIsLoadingAuth(false);
      return true;
    }
    toast({ title: "Login Failed", description: "User not found.", variant: "destructive" });
    setIsLoadingAuth(false);
    return false;
  }, [registeredUsers, toast]);

  const signup = useCallback((username: string): boolean => {
    setIsLoadingAuth(true);
    const userExists = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      toast({ title: "Signup Failed", description: "Username already taken.", variant: "destructive" });
      setIsLoadingAuth(false);
      return false;
    }
    const newUser: UserAccount = { id: `user-${Date.now()}`, username };
    setRegisteredUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setPlayers(INITIAL_MOCK_PLAYERS); 
    setMatches([]);
    toast({ title: "Account Created", description: `Welcome, ${username}!` });
    setIsLoadingAuth(false);
    return true;
  }, [registeredUsers, toast]);

  const logout = useCallback(() => {
    setIsLoadingAuth(true);
    setCurrentUser(null);
    setPlayers(INITIAL_MOCK_PLAYERS);
    setMatches([]);
    localStorage.removeItem(PLAYERS_LS_KEY);
    localStorage.removeItem(MATCHES_LS_KEY);
    toast({ title: "Logged Out", description: "You have been logged out." });
    router.push('/auth');
    setIsLoadingAuth(false);
  }, [toast, router]);

  const addPlayer = useCallback((name: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add players.", variant: "destructive"});
      return;
    }
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      winRate: 0.5, // Default win rate
      averageScore: 100, // Default average score
    };
    setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
    toast({
      title: "Player Added",
      description: `${name} has been added to the roster.`,
    });
  }, [currentUser, toast]);

  const getGameById = useCallback((gameId: string) => {
    return games.find(g => g.id === gameId);
  }, [games]);

  const getPlayerById = useCallback((playerId: string) => {
    return players.find(p => p.id === playerId);
  }, [players]);

  const addMatch = useCallback((matchData: Omit<Match, 'id' | 'date'>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to record matches.", variant: "destructive"});
      return;
    }
    const newMatch: Match = {
      ...matchData,
      id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
    };
    setMatches(prevMatches => [...prevMatches, newMatch]);
    
    const game = getGameById(newMatch.gameId);
    if (game) {
        // Create a new players array with updated stats to avoid direct mutation
        const updatedPlayers = players.map(p => {
          if (newMatch.playerIds.includes(p.id)) {
            // Clone player to update, to ensure a new object reference for state update
            const updatedPlayer = { ...p }; 
            const isWinner = newMatch.winnerIds.includes(p.id);
            
            // Consider all matches for this player and this specific game to calculate new winRate
            const allMatchesForPlayerInThisGame = matches
              .filter(m => m.playerIds.includes(p.id) && m.gameId === newMatch.gameId)
              .concat(newMatch); // Include the current new match

            const totalGamesPlayedInThisGame = allMatchesForPlayerInThisGame.length;
            const totalWinsInThisGame = allMatchesForPlayerInThisGame.filter(m => m.winnerIds.includes(p.id)).length;

            updatedPlayer.winRate = totalGamesPlayedInThisGame > 0 ? totalWinsInThisGame / totalGamesPlayedInThisGame : 0.5;
            // averageScore update would need more specific logic based on how scores are tracked per match
            return updatedPlayer;
          }
          return p;
        });
        setPlayers(updatedPlayers);
    }
  }, [currentUser, toast, players, getPlayerById, getGameById, matches, games]); // Added 'games' due to getGameById


  const updatePlayer = useCallback((playerId: string, newName: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to update players.", variant: "destructive"});
      return;
    }
    setPlayers(prevPlayers => 
      prevPlayers.map(p => 
        p.id === playerId ? { ...p, name: newName } : p
      )
    );
    toast({
      title: "Player Updated",
      description: `Player name changed to ${newName}.`,
    });
  }, [currentUser, toast]);


  const calculateScores = useCallback((filteredMatches: Match[]): ScoreData[] => {
    const playerScores: Record<string, ScoreData> = {};

    players.forEach(player => {
      playerScores[player.id] = { 
        playerId: player.id, 
        playerName: player.name, 
        totalPoints: 0, 
        gamesPlayed: 0, 
        wins: 0 
      };
    });

    filteredMatches.forEach(match => {
      match.playerIds.forEach(playerId => {
        if (playerScores[playerId]) {
          playerScores[playerId].gamesPlayed += 1;
        } else {
          const p = getPlayerById(playerId); // getPlayerById is from the outer scope
          if (p) {
             playerScores[playerId] = { playerId: p.id, playerName: p.name, totalPoints: 0, gamesPlayed: 1, wins: 0 };
          }
        }
      });
      match.pointsAwarded.forEach(pa => {
        if (playerScores[pa.playerId]) {
          playerScores[pa.playerId].totalPoints += pa.points;
        }
      });
      match.winnerIds.forEach(winnerId => {
        if (playerScores[winnerId]) {
          playerScores[winnerId].wins += 1;
        }
      });
    });
    
    return Object.values(playerScores)
      .filter(s => s.gamesPlayed > 0 || s.totalPoints !== 0) 
      .sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins || a.gamesPlayed - b.gamesPlayed || a.playerName.localeCompare(b.playerName));

  }, [getPlayerById, players]); // Keep players here because playerScores initialization depends on it. getPlayerById alone might not be enough if players array itself changes structure for initialization.


  const getOverallLeaderboard = useCallback((): ScoreData[] => {
    if (!currentUser || !isClient) return [];
    return calculateScores(matches);
  }, [matches, calculateScores, currentUser, isClient]);

  const getGameLeaderboard = useCallback((gameId: string): ScoreData[] => {
    if (!currentUser || !isClient) return [];
    const gameMatches = matches.filter(match => match.gameId === gameId);
    return calculateScores(gameMatches);
  }, [matches, calculateScores, currentUser, isClient]);


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
      isClient,
      currentUser,
      login,
      signup,
      logout,
      isLoadingAuth
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

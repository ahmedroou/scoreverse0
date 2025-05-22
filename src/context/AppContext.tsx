
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Game, Player, Match, ScoreData } from '@/types';
import { MOCK_GAMES, MOCK_PLAYERS as INITIAL_MOCK_PLAYERS } from '@/data/mock-data';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';

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
  const pathname = usePathname();

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
        // Load user-specific data or global data
        const savedPlayers = localStorage.getItem(PLAYERS_LS_KEY);
        setPlayers(savedPlayers ? JSON.parse(savedPlayers) : INITIAL_MOCK_PLAYERS);
        const savedMatches = localStorage.getItem(MATCHES_LS_KEY);
        setMatches(savedMatches ? JSON.parse(savedMatches) : []);
      } else {
        // No user logged in, clear sensitive data or use defaults
        setPlayers(INITIAL_MOCK_PLAYERS); // Or empty array if players are user-specific
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
    if (isClient && currentUser) { // Only save if a user is logged in
      localStorage.setItem(MATCHES_LS_KEY, JSON.stringify(matches));
    }
  }, [matches, isClient, currentUser]);

  // Persist players
  useEffect(() => {
    if (isClient && currentUser) { // Only save if a user is logged in
      localStorage.setItem(PLAYERS_LS_KEY, JSON.stringify(players));
    }
  }, [players, isClient, currentUser]);


  const login = useCallback((username: string): boolean => {
    const userExists = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      setCurrentUser(userExists);
      // Load their specific data if applicable, or global data
      const savedPlayers = localStorage.getItem(PLAYERS_LS_KEY);
      setPlayers(savedPlayers ? JSON.parse(savedPlayers) : INITIAL_MOCK_PLAYERS);
      const savedMatches = localStorage.getItem(MATCHES_LS_KEY);
      setMatches(savedMatches ? JSON.parse(savedMatches) : []);
      toast({ title: "Logged In", description: `Welcome back, ${username}!` });
      return true;
    }
    toast({ title: "Login Failed", description: "User not found.", variant: "destructive" });
    return false;
  }, [registeredUsers, toast]);

  const signup = useCallback((username: string): boolean => {
    const userExists = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      toast({ title: "Signup Failed", description: "Username already taken.", variant: "destructive" });
      return false;
    }
    const newUser: UserAccount = { id: `user-${Date.now()}`, username };
    setRegisteredUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    // Initialize data for new user
    setPlayers(INITIAL_MOCK_PLAYERS); // Or empty if players should be added by user
    setMatches([]);
    toast({ title: "Account Created", description: `Welcome, ${username}!` });
    return true;
  }, [registeredUsers, toast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    // Clear user-specific data or reset to defaults
    setPlayers(INITIAL_MOCK_PLAYERS);
    setMatches([]);
    localStorage.removeItem(PLAYERS_LS_KEY);
    localStorage.removeItem(MATCHES_LS_KEY);
    toast({ title: "Logged Out", description: "You have been logged out." });
    router.push('/auth');
  }, [toast, router]);

  const addPlayer = useCallback((name: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add players.", variant: "destructive"});
      return;
    }
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
    };
    setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
    toast({
      title: "Player Added",
      description: `${name} has been added to the roster.`,
    });
  }, [currentUser, toast]);

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
  }, [currentUser, toast]);

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
        } else if (getPlayerById(playerId)) { // Player might have been added after some matches
            scores[playerId] = { playerId: playerId, totalPoints: 0, gamesPlayed: 1, wins: 0 };
        }
      });
      match.pointsAwarded.forEach(pa => {
        if (scores[pa.playerId]) {
          scores[pa.playerId].totalPoints += pa.points;
        } else if (getPlayerById(pa.playerId)){
            scores[pa.playerId] = { playerId: pa.playerId, totalPoints: pa.points, gamesPlayed: 0, wins: 0 }; // gamesPlayed will be incremented above
        }
      });
      match.winnerIds.forEach(winnerId => {
        if (scores[winnerId]) {
          scores[winnerId].wins += 1;
        } else if(getPlayerById(winnerId)) {
             scores[winnerId] = { playerId: winnerId, totalPoints: 0, gamesPlayed: 0, wins: 1 };
        }
      });
    });
    
    return Object.values(scores).map(s => ({
      ...s,
      playerName: getPlayerById(s.playerId)?.name || 'Unknown Player'
    })).filter(s => s.playerName !== 'Unknown Player') // Filter out players that might have been deleted
    .sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins || a.gamesPlayed - b.gamesPlayed);

  }, [players, getPlayerById]);


  const getOverallLeaderboard = useCallback((): ScoreData[] => {
    if (!currentUser) return [];
    return calculateScores(matches);
  }, [matches, calculateScores, currentUser]);

  const getGameLeaderboard = useCallback((gameId: string): ScoreData[] => {
    if (!currentUser) return [];
    const gameMatches = matches.filter(match => match.gameId === gameId);
    return calculateScores(gameMatches);
  }, [matches, calculateScores, currentUser]);


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

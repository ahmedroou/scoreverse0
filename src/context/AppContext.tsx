
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Game, Player, Match, ScoreData, Space } from '@/types';
import { MOCK_GAMES, MOCK_PLAYERS as INITIAL_MOCK_PLAYERS } from '@/data/mock-data';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface UserAccount {
  id: string;
  username: string;
}

interface AppContextType {
  games: Game[];
  players: Player[];
  matches: Match[];
  spaces: Space[];
  activeSpaceId: string | null;
  addPlayer: (name: string) => void;
  addMatch: (matchData: Omit<Match, 'id' | 'date' | 'spaceId'>) => void; // spaceId will be added internally
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
  addSpace: (name: string) => void;
  updateSpace: (spaceId: string, newName: string) => void;
  deleteSpace: (spaceId: string) => void;
  setActiveSpaceId: (spaceId: string | null) => void;
  getSpacesForCurrentUser: () => Space[];
  getActiveSpace: () => Space | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const REGISTERED_USERS_LS_KEY = 'scoreverse-registered-users';
const CURRENT_USER_LS_KEY = 'scoreverse-current-user';
const PLAYERS_LS_KEY_PREFIX = 'scoreverse-players-'; // Per user
const MATCHES_LS_KEY_PREFIX = 'scoreverse-matches-'; // Per user
const SPACES_LS_KEY_PREFIX = 'scoreverse-spaces-'; // Per user
const ACTIVE_SPACE_LS_KEY_PREFIX = 'scoreverse-active-space-'; // Per user

const DEFAULT_SPACE_NAME = "Personal Space";

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>(MOCK_GAMES);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceIdState] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load registered users and current user (once on client mount)
  useEffect(() => {
    if (isClient) {
      const savedRegisteredUsers = localStorage.getItem(REGISTERED_USERS_LS_KEY);
      if (savedRegisteredUsers) {
        setRegisteredUsers(JSON.parse(savedRegisteredUsers));
      }

      const savedCurrentUser = localStorage.getItem(CURRENT_USER_LS_KEY);
      if (savedCurrentUser) {
        setCurrentUser(JSON.parse(savedCurrentUser));
      }
      setIsLoadingAuth(false); // Auth loading done after this
    }
  }, [isClient]);

  // Load user-specific data when currentUser changes or on initial client load if currentUser is already set
  useEffect(() => {
    if (isClient && currentUser) {
      const playersKey = `${PLAYERS_LS_KEY_PREFIX}${currentUser.id}`;
      const matchesKey = `${MATCHES_LS_KEY_PREFIX}${currentUser.id}`;
      const spacesKey = `${SPACES_LS_KEY_PREFIX}${currentUser.id}`;
      const activeSpaceKey = `${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`;

      const savedPlayers = localStorage.getItem(playersKey);
      setPlayers(savedPlayers ? JSON.parse(savedPlayers) : INITIAL_MOCK_PLAYERS);

      const savedMatches = localStorage.getItem(matchesKey);
      setMatches(savedMatches ? JSON.parse(savedMatches) : []);

      const savedSpaces = localStorage.getItem(spacesKey);
      const userSpaces: Space[] = savedSpaces ? JSON.parse(savedSpaces) : [];
      
      if (userSpaces.length === 0) {
        // If user has no spaces, create a default "Personal Space" for them
        const defaultSpaceId = `space-default-${currentUser.id}-${Date.now()}`;
        const defaultSpace: Space = { id: defaultSpaceId, name: DEFAULT_SPACE_NAME, ownerId: currentUser.id };
        setSpaces([defaultSpace]);
        setActiveSpaceIdState(defaultSpaceId); // Set this new default space as active
        localStorage.setItem(spacesKey, JSON.stringify([defaultSpace]));
        localStorage.setItem(activeSpaceKey, JSON.stringify(defaultSpaceId));
      } else {
        setSpaces(userSpaces);
        const savedActiveSpaceId = localStorage.getItem(activeSpaceKey);
        // Ensure the saved active space ID is valid and belongs to the user's current spaces
        const validActiveSpace = userSpaces.find(s => s.id === (savedActiveSpaceId ? JSON.parse(savedActiveSpaceId) : null));
        setActiveSpaceIdState(validActiveSpace ? validActiveSpace.id : (userSpaces[0]?.id || null));
      }
    } else if (isClient && !currentUser) { // User logged out or no user
      setPlayers(INITIAL_MOCK_PLAYERS); // Reset to initial mock players or an empty array
      setMatches([]);
      setSpaces([]);
      setActiveSpaceIdState(null);
    }
  }, [isClient, currentUser]);


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
  
  // Persist user-specific data
  useEffect(() => {
    if (isClient && currentUser) {
      localStorage.setItem(`${PLAYERS_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(players));
      localStorage.setItem(`${MATCHES_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(matches));
      localStorage.setItem(`${SPACES_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(spaces));
      if (activeSpaceId) {
        localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(activeSpaceId));
      } else {
        // If activeSpaceId is null, we might want to remove it or store null
        localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(null));
      }
    }
  }, [players, matches, spaces, activeSpaceId, isClient, currentUser]);


  const login = useCallback((username: string): boolean => {
    setIsLoadingAuth(true);
    const userExists = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      setCurrentUser(userExists); // This will trigger the useEffect to load user-specific data
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
    
    // Initialize new user's data
    setPlayers(INITIAL_MOCK_PLAYERS);
    setMatches([]);
    const defaultSpaceId = `space-default-${newUser.id}-${Date.now()}`;
    const defaultSpace: Space = { id: defaultSpaceId, name: DEFAULT_SPACE_NAME, ownerId: newUser.id };
    setSpaces([defaultSpace]);
    setActiveSpaceIdState(defaultSpaceId); // Set the new default space as active for the new user
  
    setCurrentUser(newUser); // Set current user *after* initializing their data
    toast({ title: "Account Created", description: `Welcome, ${username}!` });
    setIsLoadingAuth(false);
    return true;
  }, [registeredUsers, toast]);

  const logout = useCallback(() => {
    setIsLoadingAuth(true);
    const currentUsername = currentUser?.username;
    setCurrentUser(null);
    // Data clearing for players, matches, spaces, activeSpaceId is handled by useEffect listening to currentUser becoming null
    if (currentUsername) {
        toast({ title: "Logged Out", description: `Goodbye, ${currentUsername}!` });
    } else {
        toast({ title: "Logged Out", description: "You have been logged out." });
    }
    router.push('/auth');
    setIsLoadingAuth(false);
  }, [toast, router, currentUser]);

  const addPlayer = useCallback((name: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add players.", variant: "destructive"});
      return;
    }
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      winRate: 0, // Initialize with 0, will be calculated
      averageScore: 0, // Initialize with 0
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

  const addMatch = useCallback((matchData: Omit<Match, 'id' | 'date' | 'spaceId'>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to record matches.", variant: "destructive"});
      return;
    }
    const newMatch: Match = {
      ...matchData,
      id: `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString(),
      spaceId: activeSpaceId || undefined, 
    };
    
    setMatches(prevMatches => {
      const updatedMatches = [...prevMatches, newMatch];
      
      // Recalculate player stats after adding the new match
      const game = getGameById(newMatch.gameId);
      if (game) {
          const updatedPlayers = players.map(p => {
            if (newMatch.playerIds.includes(p.id)) {
              const playerClone = { ...p }; 
              // Filter matches for this specific player, game, and space context
              const allMatchesForPlayerInThisGame = updatedMatches
                .filter(m => 
                    m.playerIds.includes(p.id) && 
                    m.gameId === newMatch.gameId &&
                    m.spaceId === (activeSpaceId || undefined) // Match current space context
                );

              const totalGamesPlayedInThisGame = allMatchesForPlayerInThisGame.length;
              const totalWinsInThisGame = allMatchesForPlayerInThisGame.filter(m => m.winnerIds.includes(p.id)).length;

              playerClone.winRate = totalGamesPlayedInThisGame > 0 ? totalWinsInThisGame / totalGamesPlayedInThisGame : 0;
              
              // Placeholder for average score - this would need more complex tracking if not part of pointsAwarded
              // playerClone.averageScore = ... 
              return playerClone;
            }
            return p;
          });
          setPlayers(updatedPlayers); // Update players state with new stats
      }
      return updatedMatches; // Return updated matches for setMatches
    });

  }, [currentUser, toast, players, getGameById, matches, activeSpaceId]);


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
        } else { // Should not happen if players list is comprehensive
          const p = getPlayerById(playerId);
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

  }, [getPlayerById, players]);


  const getOverallLeaderboard = useCallback((): ScoreData[] => {
    if (!currentUser || !isClient) return [];
    const filteredMatches = activeSpaceId ? matches.filter(m => m.spaceId === activeSpaceId) : matches.filter(m => m.spaceId === undefined);
    return calculateScores(filteredMatches);
  }, [matches, calculateScores, currentUser, isClient, activeSpaceId]);

  const getGameLeaderboard = useCallback((gameId: string): ScoreData[] => {
    if (!currentUser || !isClient) return [];
    const gameMatches = activeSpaceId 
        ? matches.filter(match => match.gameId === gameId && match.spaceId === activeSpaceId)
        : matches.filter(match => match.gameId === gameId && match.spaceId === undefined);
    return calculateScores(gameMatches);
  }, [matches, calculateScores, currentUser, isClient, activeSpaceId]);

  // --- Space Management Functions ---
  const addSpace = useCallback((name: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add spaces.", variant: "destructive"});
      return;
    }
    const newSpace: Space = {
      id: `space-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      ownerId: currentUser.id,
    };
    setSpaces(prevSpaces => {
      const updatedSpaces = [...prevSpaces, newSpace];
      // If adding the first space for this user (after default or if no default existed)
      // or if no active space is currently set, make the new space active.
      if (updatedSpaces.length === 1 || !activeSpaceId) {
        setActiveSpaceIdState(newSpace.id);
      }
      return updatedSpaces;
    });
    toast({ title: "Space Created", description: `Space "${name}" has been created.` });
  }, [currentUser, toast, activeSpaceId]);

  const updateSpace = useCallback((spaceId: string, newName: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "Login required.", variant: "destructive"});
      return;
    }
    setSpaces(prevSpaces => prevSpaces.map(s => 
      s.id === spaceId && s.ownerId === currentUser.id ? { ...s, name: newName } : s
    ));
    toast({ title: "Space Updated", description: "Space name has been changed." });
  }, [currentUser, toast]);

  const deleteSpace = useCallback((spaceId: string) => {
     if (!currentUser) {
      toast({ title: "Error", description: "Login required.", variant: "destructive"});
      return;
    }
    const userOwnedSpaces = spaces.filter(s => s.ownerId === currentUser.id);
    if (userOwnedSpaces.length <= 1 && userOwnedSpaces.find(s => s.id === spaceId)) {
        toast({ title: "Cannot Delete", description: "You must have at least one space.", variant: "destructive"});
        return;
    }

    setSpaces(prevSpaces => {
      const remainingSpaces = prevSpaces.filter(s => {
          if (s.id === spaceId && s.ownerId === currentUser.id) {
              // If deleting the active space, set active to the first of the remaining spaces, or null
              if (activeSpaceId === spaceId) {
                  const otherUserSpaces = prevSpaces.filter(os => os.id !== spaceId && os.ownerId === currentUser.id);
                  setActiveSpaceIdState(otherUserSpaces.length > 0 ? otherUserSpaces[0].id : null);
              }
              return false; // delete it
          }
          return true; // keep it
      });
      return remainingSpaces;
    });

    // Also remove matches associated with this space (or mark them as global if preferred)
    setMatches(prevMatches => prevMatches.filter(m => m.spaceId !== spaceId));
    toast({ title: "Space Deleted", description: "The space and its associated matches have been deleted." });
  }, [currentUser, toast, spaces, activeSpaceId]);
  
  const setActiveSpaceId = useCallback((spaceId: string | null) => {
    if (!currentUser) {
        // This can happen on logout, so don't show an error toast
        setActiveSpaceIdState(null);
        return;
    }
    // Ensure the spaceId belongs to the current user or is null
    const spaceExists = spaceId === null || spaces.some(s => s.id === spaceId && s.ownerId === currentUser.id);
    if (spaceExists) {
        setActiveSpaceIdState(spaceId);
        const spaceName = spaceId ? spaces.find(s=>s.id === spaceId)?.name : "Global (No Space)";
        if (spaceId !== activeSpaceId) { // Only toast if it's a change
          toast({ title: "Active Space Changed", description: `Now viewing: ${spaceName}`});
        }
    } else {
        toast({ title: "Error", description: "Invalid space selected.", variant: "destructive"});
    }
  }, [currentUser, spaces, toast, activeSpaceId]);

  const getSpacesForCurrentUser = useCallback((): Space[] => {
    if (!currentUser) return [];
    return spaces.filter(s => s.ownerId === currentUser.id);
  }, [currentUser, spaces]);
  
  const getActiveSpace = useCallback((): Space | undefined => {
    if (!currentUser || !activeSpaceId) return undefined;
    return spaces.find(s => s.id === activeSpaceId && s.ownerId === currentUser.id);
  }, [currentUser, activeSpaceId, spaces]);


  return (
    <AppContext.Provider value={{ 
      games, 
      players, 
      matches,
      spaces,
      activeSpaceId,
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
      isLoadingAuth,
      addSpace,
      updateSpace,
      deleteSpace,
      setActiveSpaceId,
      getSpacesForCurrentUser,
      getActiveSpace
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


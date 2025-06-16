
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Game, Player, Match, ScoreData, Space, UserAccount } from '@/types';
import { MOCK_GAMES, MOCK_PLAYERS as INITIAL_MOCK_PLAYERS } from '@/data/mock-data';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AppContextType {
  games: Game[];
  players: Player[];
  matches: Match[];
  spaces: Space[];
  activeSpaceId: string | null;
  addPlayer: (name: string) => void;
  deletePlayer: (playerId: string) => void;
  addMatch: (matchData: Omit<Match, 'id' | 'date' | 'spaceId'>) => void; // spaceId will be added internally
  updatePlayer: (playerId: string, newName: string) => void;
  getGameById: (gameId: string) => Game | undefined;
  getPlayerById: (playerId: string) => Player | undefined;
  getOverallLeaderboard: () => ScoreData[];
  getGameLeaderboard: (gameId: string) => ScoreData[];
  isClient: boolean;
  currentUser: UserAccount | null;
  login: (username: string, password?: string) => boolean; // password is now optional for backward compatibility during transition, but required for new logins
  signup: (username: string, password?: string) => boolean; // password is now optional for backward compatibility during transition, but required for new signups
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

  useEffect(() => {
    if (isClient) {
      // For this prototype, storing passwords in localStorage is insecure.
      // A real application would use a secure backend authentication system.
      console.warn("PROTOTYPE SECURITY WARNING: User credentials (including passwords if implemented) are stored in localStorage for demonstration purposes only. This is not secure for production applications.");
      const savedRegisteredUsers = localStorage.getItem(REGISTERED_USERS_LS_KEY);
      if (savedRegisteredUsers) {
        setRegisteredUsers(JSON.parse(savedRegisteredUsers));
      }
    }
  }, [isClient]);
  
  useEffect(() => {
    if (isClient) {
      const savedCurrentUser = localStorage.getItem(CURRENT_USER_LS_KEY);
      if (savedCurrentUser) {
        const user = JSON.parse(savedCurrentUser) as UserAccount;
        // Verify user exists and if they have a password, it should be handled by login logic
        if (registeredUsers.find(ru => ru.id === user.id)) {
          setCurrentUser(user);
        } else {
          // If user in localStorage isn't in registeredUsers, clear it.
          localStorage.removeItem(CURRENT_USER_LS_KEY);
          setCurrentUser(null);
        }
      }
      setIsLoadingAuth(false); 
    }
  }, [isClient, registeredUsers]); 

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
      let userSpaces: Space[] = savedSpaces ? JSON.parse(savedSpaces) : [];
      
      if (userSpaces.length === 0) {
        const defaultSpaceId = `space-default-${currentUser.id}-${Date.now()}`;
        const defaultSpace: Space = { id: defaultSpaceId, name: DEFAULT_SPACE_NAME, ownerId: currentUser.id };
        userSpaces = [defaultSpace]; 
        localStorage.setItem(spacesKey, JSON.stringify(userSpaces)); 
        setActiveSpaceIdState(defaultSpaceId);
        localStorage.setItem(activeSpaceKey, JSON.stringify(defaultSpaceId)); 
      }
      setSpaces(userSpaces); 

      const savedActiveSpaceId = localStorage.getItem(activeSpaceKey);
      const activeIdFromJson = savedActiveSpaceId ? JSON.parse(savedActiveSpaceId) : null;
      const validActiveSpace = userSpaces.find(s => s.id === activeIdFromJson);
      
      setActiveSpaceIdState(validActiveSpace ? validActiveSpace.id : (userSpaces[0]?.id || null));

    } else if (isClient && !currentUser) { 
      setPlayers(INITIAL_MOCK_PLAYERS); 
      setMatches([]);
      setSpaces([]);
      setActiveSpaceIdState(null);
    }
  }, [isClient, currentUser]);


  useEffect(() => {
    if (isClient) {
      localStorage.setItem(REGISTERED_USERS_LS_KEY, JSON.stringify(registeredUsers));
    }
  }, [registeredUsers, isClient]);

  useEffect(() => {
    if (isClient) {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_LS_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_LS_KEY);
      }
    }
  }, [currentUser, isClient]);
  
  useEffect(() => {
    if (isClient && currentUser) {
      localStorage.setItem(`${PLAYERS_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(players));
      localStorage.setItem(`${MATCHES_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(matches));
      localStorage.setItem(`${SPACES_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(spaces));
      localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(activeSpaceId));
    }
  }, [players, matches, spaces, activeSpaceId, isClient, currentUser]);


  const login = useCallback((username: string, password?: string): boolean => {
    setIsLoadingAuth(true);
    const userExists = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (userExists) {
      // For this prototype, we check the insecurely stored password.
      // Users created before password implementation might not have a password field.
      // This logic assumes new users WILL have passwords.
      if (userExists.password === password) {
        setCurrentUser(userExists); 
        toast({ title: "Logged In", description: `Welcome back, ${username}!` });
        setIsLoadingAuth(false);
        return true;
      } else if (!userExists.password && !password) {
         // Fallback for users created before password system, allowing login if no password was set and none provided
        console.warn(`User ${username} logged in without a password. This is a legacy case.`);
        setCurrentUser(userExists);
        toast({ title: "Logged In (Legacy)", description: `Welcome back, ${username}! Consider re-registering with a password for future compatibility.` });
        setIsLoadingAuth(false);
        return true;
      }
    }
    toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
    setIsLoadingAuth(false);
    return false;
  }, [registeredUsers, toast]);

  const signup = useCallback((username: string, password?: string): boolean => {
    setIsLoadingAuth(true);
    if (!password || password.length < 6) {
      toast({ title: "Signup Failed", description: "Password must be at least 6 characters.", variant: "destructive" });
      setIsLoadingAuth(false);
      return false;
    }

    const userExists = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      toast({ title: "Signup Failed", description: "Username already taken.", variant: "destructive" });
      setIsLoadingAuth(false);
      return false;
    }
    const newUser: UserAccount = { id: `user-${Date.now()}`, username, password }; // Password is stored here
    
    const initialPlayers = INITIAL_MOCK_PLAYERS;
    const initialMatches: Match[] = [];
    const defaultSpaceId = `space-default-${newUser.id}-${Date.now()}`;
    const defaultSpace: Space = { id: defaultSpaceId, name: DEFAULT_SPACE_NAME, ownerId: newUser.id };
    const initialSpaces = [defaultSpace];

    if(isClient) {
        localStorage.setItem(`${PLAYERS_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialPlayers));
        localStorage.setItem(`${MATCHES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialMatches));
        localStorage.setItem(`${SPACES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialSpaces));
        localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(defaultSpaceId));
    }
    
    setPlayers(initialPlayers);
    setMatches(initialMatches);
    setSpaces(initialSpaces);
    setActiveSpaceIdState(defaultSpaceId);
    
    setRegisteredUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser); 
    
    toast({ title: "Account Created", description: `Welcome, ${username}!` });
    setIsLoadingAuth(false);
    return true;
  }, [registeredUsers, toast, isClient]);

  const logout = useCallback(() => {
    setIsLoadingAuth(true);
    const currentUsername = currentUser?.username;
    setCurrentUser(null); 
    if (currentUsername) {
        toast({ title: "Logged Out", description: `Goodbye, ${currentUsername}!` });
    } else {
        toast({ title: "Logged Out", description: "You have been logged out." });
    }
    router.push('/auth');
    // Clear user-specific data upon logout for privacy in a shared browser scenario
    // (though players/matches might ideally persist if a user logs back in)
    // For this prototype, a full clear for the logged-out user is simpler.
    // However, we only clear localStorage for current_user_ls_key, and rely on 
    // the currentUser guard in useEffects to not load/save other data.
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
      winRate: 0, 
      averageScore: 0, 
    };
    setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
    toast({
      title: "Player Added",
      description: `${name} has been added to the roster.`,
    });
  }, [currentUser, toast]);

  const deletePlayer = useCallback((playerId: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to delete players.", variant: "destructive" });
      return;
    }
    const playerToDelete = players.find(p => p.id === playerId);
    if (!playerToDelete) {
        toast({ title: "Error", description: "Player not found.", variant: "destructive" });
        return;
    }

    setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
    setMatches(prevMatches => 
      prevMatches.map(match => ({
        ...match,
        playerIds: match.playerIds.filter(id => id !== playerId),
        winnerIds: match.winnerIds.filter(id => id !== playerId),
        pointsAwarded: match.pointsAwarded.filter(pa => pa.playerId !== playerId),
        handicapSuggestions: match.handicapSuggestions?.filter(hs => hs.playerName !== playerToDelete.name) 
      })).filter(match => match.playerIds.length > 0) 
    );

    toast({
      title: "Player Deleted",
      description: `${playerToDelete.name} has been removed.`,
    });
  }, [currentUser, players, toast]);

  const getGameById = useCallback((gameId: string) => {
    return games.find(g => g.id === gameId);
  }, [games]);

  const getPlayerById = useCallback((playerId: string): Player | undefined => {
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
      const game = getGameById(newMatch.gameId);
      if (game) {
          const updatedPlayers = players.map(p => {
            let playerClone = { ...p }; 
            if (newMatch.playerIds.includes(p.id)) {
              const allMatchesForPlayerInThisGame = updatedMatches
                .filter(m => 
                    m.playerIds.includes(p.id) && 
                    m.gameId === newMatch.gameId &&
                    m.spaceId === (activeSpaceId || undefined) 
                );

              const totalGamesPlayedInThisGame = allMatchesForPlayerInThisGame.length;
              const totalWinsInThisGame = allMatchesForPlayerInThisGame.filter(m => m.winnerIds.includes(p.id)).length;
              
              // Create a new object for the player to ensure state update
              const updatedPlayer = { ...p };
              updatedPlayer.winRate = totalGamesPlayedInThisGame > 0 ? totalWinsInThisGame / totalGamesPlayedInThisGame : (p.winRate || 0);
              return updatedPlayer;
            }
            return p; // Return original player object if not involved in this match
          });
          setPlayers(updatedPlayers); 
      }
      return updatedMatches;
    });

  }, [currentUser, toast, players, getGameById, activeSpaceId]); 

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

  const calculateScores = useCallback((filteredMatchesForCalc: Match[]): ScoreData[] => {
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

    filteredMatchesForCalc.forEach(match => {
      match.playerIds.forEach(playerId => {
        const player = getPlayerById(playerId); // getPlayerById is already a dependency of calculateScores
        if (player) { 
            if (!playerScores[playerId]) { 
                 playerScores[playerId] = { playerId: player.id, playerName: player.name, totalPoints: 0, gamesPlayed: 0, wins: 0 };
            }
            playerScores[playerId].gamesPlayed += 1;
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

  }, [players, getPlayerById]);

  const getOverallLeaderboard = useCallback((): ScoreData[] => {
    if (!currentUser || !isClient) return [];
    const filteredBoardMatches = activeSpaceId ? matches.filter(m => m.spaceId === activeSpaceId) : matches.filter(m => m.spaceId === undefined);
    return calculateScores(filteredBoardMatches);
  }, [matches, calculateScores, currentUser, isClient, activeSpaceId]);

  const getGameLeaderboard = useCallback((gameId: string): ScoreData[] => {
    if (!currentUser || !isClient) return [];
    const gameMatches = activeSpaceId 
        ? matches.filter(match => match.gameId === gameId && match.spaceId === activeSpaceId)
        : matches.filter(match => match.gameId === gameId && match.spaceId === undefined);
    return calculateScores(gameMatches);
  }, [matches, calculateScores, currentUser, isClient, activeSpaceId]);

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

  const deleteSpace = useCallback((spaceIdToDelete: string) => {
     if (!currentUser) {
      toast({ title: "Error", description: "Login required.", variant: "destructive"});
      return;
    }
    const userOwnedSpaces = spaces.filter(s => s.ownerId === currentUser.id);
    if (userOwnedSpaces.length <= 1 && userOwnedSpaces.find(s => s.id === spaceIdToDelete)) {
        toast({ title: "Cannot Delete", description: "You must have at least one space.", variant: "destructive"});
        return;
    }

    setSpaces(prevSpaces => {
      const remainingSpaces = prevSpaces.filter(s => {
          if (s.id === spaceIdToDelete && s.ownerId === currentUser.id) {
              if (activeSpaceId === spaceIdToDelete) {
                  const otherUserSpaces = prevSpaces.filter(os => os.id !== spaceIdToDelete && os.ownerId === currentUser.id);
                  setActiveSpaceIdState(otherUserSpaces.length > 0 ? otherUserSpaces[0].id : null);
              }
              return false; 
          }
          return true; 
      });
      return remainingSpaces;
    });
    
    setMatches(prevMatches => prevMatches.filter(m => m.spaceId !== spaceIdToDelete));
    toast({ title: "Space Deleted", description: "The space and its associated matches have been deleted." });
  }, [currentUser, toast, spaces, activeSpaceId, matches]); 
  
  const setActiveSpaceId = useCallback((newActiveSpaceId: string | null) => {
    if (!currentUser) {
        setActiveSpaceIdState(null);
        return;
    }
    const spaceExists = newActiveSpaceId === null || spaces.some(s => s.id === newActiveSpaceId && s.ownerId === currentUser.id);
    if (spaceExists) {
        if (newActiveSpaceId !== activeSpaceId) { 
            setActiveSpaceIdState(newActiveSpaceId);
            const spaceName = newActiveSpaceId ? spaces.find(s=>s.id === newActiveSpaceId)?.name : "Global (No Space)";
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
      deletePlayer,
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

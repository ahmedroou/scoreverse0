
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Game, Player, Match, ScoreData, Space, UserAccount } from '@/types';
import { INITIAL_MOCK_GAMES, INITIAL_MOCK_PLAYERS } from '@/data/mock-data.tsx';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { HelpCircle } from 'lucide-react'; // For default game icon

interface AppContextType {
  games: Game[];
  players: Player[];
  matches: Match[];
  spaces: Space[];
  activeSpaceId: string | null;
  addPlayer: (name: string, avatarUrl?: string) => void;
  deletePlayer: (playerId: string) => void;
  addMatch: (matchData: Omit<Match, 'id' | 'date' | 'spaceId'>) => void;
  updatePlayer: (playerId: string, playerData: Partial<Omit<Player, 'id'>>) => void;
  getGameById: (gameId: string) => Game | undefined;
  getPlayerById: (playerId: string) => Player | undefined;
  getOverallLeaderboard: () => ScoreData[];
  getGameLeaderboard: (gameId: string) => ScoreData[];
  isClient: boolean;
  currentUser: UserAccount | null;
  login: (username: string, password?: string) => boolean; 
  signup: (username: string, password?: string) => boolean; 
  logout: () => void;
  isLoadingAuth: boolean;
  addSpace: (name: string) => void;
  updateSpace: (spaceId: string, newName: string) => void;
  deleteSpace: (spaceId: string) => void;
  setActiveSpaceId: (spaceId: string | null) => void;
  getSpacesForCurrentUser: () => Space[];
  getActiveSpace: () => Space | undefined;
  authPageImageUrl: string;
  setAuthPageImageUrl: (url: string) => void;
  addGame: (gameData: Omit<Game, 'id' | 'icon'>) => void;
  updateGame: (gameId: string, gameData: Partial<Omit<Game, 'id' | 'icon'>>) => void;
  deleteGame: (gameId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const REGISTERED_USERS_LS_KEY = 'scoreverse-registered-users';
const CURRENT_USER_LS_KEY = 'scoreverse-current-user';
const PLAYERS_LS_KEY_PREFIX = 'scoreverse-players-'; 
const MATCHES_LS_KEY_PREFIX = 'scoreverse-matches-'; 
const SPACES_LS_KEY_PREFIX = 'scoreverse-spaces-'; 
const ACTIVE_SPACE_LS_KEY_PREFIX = 'scoreverse-active-space-'; 
const AUTH_PAGE_IMAGE_URL_LS_KEY = 'scoreverse-authPageImageUrl';
const GAMES_LS_KEY_PREFIX = 'scoreverse-games-'; // New key for games
const DEFAULT_AUTH_IMAGE_URL = 'https://placehold.co/300x200.png';

const DEFAULT_SPACE_NAME = "Personal Space";

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceIdState] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authPageImageUrl, setAuthPageImageUrlState] = useState<string>(DEFAULT_AUTH_IMAGE_URL);

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      console.warn("PROTOTYPE SECURITY WARNING: User credentials (including passwords if implemented) are stored in localStorage for demonstration purposes only. This is not secure for production applications.");
      const savedRegisteredUsers = localStorage.getItem(REGISTERED_USERS_LS_KEY);
      if (savedRegisteredUsers) {
        setRegisteredUsers(JSON.parse(savedRegisteredUsers));
      }
      const savedAuthImageUrl = localStorage.getItem(AUTH_PAGE_IMAGE_URL_LS_KEY);
      if (savedAuthImageUrl) {
        setAuthPageImageUrlState(JSON.parse(savedAuthImageUrl));
      }
    }
  }, [isClient]);
  
  useEffect(() => {
    if (isClient) {
      const savedCurrentUser = localStorage.getItem(CURRENT_USER_LS_KEY);
      if (savedCurrentUser) {
        const user = JSON.parse(savedCurrentUser) as UserAccount;
        if (registeredUsers.find(ru => ru.id === user.id)) {
          setCurrentUser(user);
        } else {
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
      const gamesKey = `${GAMES_LS_KEY_PREFIX}${currentUser.id}`;

      const savedPlayers = localStorage.getItem(playersKey);
      setPlayers(savedPlayers ? JSON.parse(savedPlayers) : INITIAL_MOCK_PLAYERS);

      const savedMatches = localStorage.getItem(matchesKey);
      setMatches(savedMatches ? JSON.parse(savedMatches) : []);

      const savedGames = localStorage.getItem(gamesKey);
      setGames(savedGames ? JSON.parse(savedGames) : INITIAL_MOCK_GAMES);


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
      // When logged out, clear user-specific data from state
      setPlayers([]); 
      setGames([]);
      setMatches([]);
      setSpaces([]);
      setActiveSpaceIdState(null);
    }
  }, [isClient, currentUser]);


  useEffect(() => {
    if (isClient) {
      localStorage.setItem(REGISTERED_USERS_LS_KEY, JSON.stringify(registeredUsers));
      localStorage.setItem(AUTH_PAGE_IMAGE_URL_LS_KEY, JSON.stringify(authPageImageUrl));
    }
  }, [registeredUsers, authPageImageUrl, isClient]);

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
      localStorage.setItem(`${GAMES_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(games));
    }
  }, [players, matches, spaces, activeSpaceId, games, isClient, currentUser]);


  const login = useCallback((username: string, password?: string): boolean => {
    setIsLoadingAuth(true);
    const userExists = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (userExists) {
      if (userExists.password === password) {
        setCurrentUser(userExists); 
        toast({ title: "Logged In", description: `Welcome back, ${username}!` });
        setIsLoadingAuth(false);
        return true;
      } else if (!userExists.password && !password) { // Legacy: user might exist without password
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
    const newUser: UserAccount = { id: `user-${Date.now()}`, username, password }; 
    
    // Initialize with default data for the new user
    const initialUserPlayers = INITIAL_MOCK_PLAYERS;
    const initialUserGames = INITIAL_MOCK_GAMES;
    const initialUserMatches: Match[] = [];
    const defaultSpaceId = `space-default-${newUser.id}-${Date.now()}`;
    const defaultSpace: Space = { id: defaultSpaceId, name: DEFAULT_SPACE_NAME, ownerId: newUser.id };
    const initialUserSpaces = [defaultSpace];

    if(isClient) {
        localStorage.setItem(`${PLAYERS_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialUserPlayers));
        localStorage.setItem(`${GAMES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialUserGames));
        localStorage.setItem(`${MATCHES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialUserMatches));
        localStorage.setItem(`${SPACES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialUserSpaces));
        localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(defaultSpaceId));
    }
    
    // Set state for the newly signed up user directly (will be overwritten if they log out and back in, but good for immediate use)
    setPlayers(initialUserPlayers);
    setGames(initialUserGames);
    setMatches(initialUserMatches);
    setSpaces(initialUserSpaces);
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
    // Reset local state to defaults, ready for next login or to clear sensitive data
    setPlayers([]);
    setGames([]);
    setMatches([]);
    setSpaces([]);
    setActiveSpaceIdState(null);

    if (currentUsername) {
        toast({ title: "Logged Out", description: `Goodbye, ${currentUsername}!` });
    } else {
        toast({ title: "Logged Out", description: "You have been logged out." });
    }
    router.push('/auth');
    setIsLoadingAuth(false);
  }, [toast, router, currentUser]);

  const addPlayer = useCallback((name: string, avatarUrl?: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add players.", variant: "destructive"});
      return;
    }
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      avatarUrl,
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
      // Update player win rates (simplified example, might need more robust logic for specific games)
      const game = getGameById(newMatch.gameId);
      if (game) {
          const updatedPlayers = players.map(p => {
            if (newMatch.playerIds.includes(p.id)) {
              // Recalculate win rate for players involved in this match, for this game type, within the current space context
              const allMatchesForPlayerInThisGameAndSpace = updatedMatches
                .filter(m => 
                    m.playerIds.includes(p.id) && 
                    m.gameId === newMatch.gameId &&
                    m.spaceId === (activeSpaceId || undefined) // Filter by active space or global if no space active
                );

              const totalGamesPlayedInThisGameAndSpace = allMatchesForPlayerInThisGameAndSpace.length;
              const totalWinsInThisGameAndSpace = allMatchesForPlayerInThisGameAndSpace.filter(m => m.winnerIds.includes(p.id)).length;
              
              const playerCopy = { ...p };
              // Potentially merge with existing winRate if it's an overall stat, or make it game-specific
              playerCopy.winRate = totalGamesPlayedInThisGameAndSpace > 0 ? totalWinsInThisGameAndSpace / totalGamesPlayedInThisGameAndSpace : (p.winRate || 0);
              // Average score update would need more context on how scores are recorded per match
              return playerCopy;
            }
            return p; 
          });
          setPlayers(updatedPlayers); // Persist updated player stats
      }
      return updatedMatches;
    });

  }, [currentUser, toast, players, getGameById, activeSpaceId]); // Added activeSpaceId dependency

  const updatePlayer = useCallback((playerId: string, playerData: Partial<Omit<Player, 'id'>>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to update players.", variant: "destructive"});
      return;
    }
    let oldName = '';
    setPlayers(prevPlayers => 
      prevPlayers.map(p => {
        if (p.id === playerId) {
          oldName = p.name;
          return { ...p, ...playerData };
        }
        return p;
      })
    );
    toast({
      title: "Player Updated",
      description: `Details for ${playerData.name || oldName} have been updated.`,
    });
  }, [currentUser, toast]);

  const calculateScores = useCallback((filteredMatchesForCalc: Match[]): ScoreData[] => {
    const playerScores: Record<string, ScoreData> = {};

    players.forEach(player => { 
      playerScores[player.id] = { 
        playerId: player.id, 
        playerName: player.name,
        avatarUrl: player.avatarUrl,
        totalPoints: 0, 
        gamesPlayed: 0, 
        wins: 0 
      };
    });

    filteredMatchesForCalc.forEach(match => {
      match.playerIds.forEach(playerId => {
        const player = getPlayerById(playerId); 
        if (player) { 
            if (!playerScores[playerId]) { 
                 playerScores[playerId] = { playerId: player.id, playerName: player.name, avatarUrl: player.avatarUrl, totalPoints: 0, gamesPlayed: 0, wins: 0 };
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
              // If the deleted space was active, set active space to another user-owned space or null
              if (activeSpaceId === spaceIdToDelete) {
                  const otherUserSpaces = prevSpaces.filter(os => os.id !== spaceIdToDelete && os.ownerId === currentUser.id);
                  setActiveSpaceIdState(otherUserSpaces.length > 0 ? otherUserSpaces[0].id : null);
              }
              return false; // Remove the space
          }
          return true; // Keep other spaces
      });
      return remainingSpaces;
    });
    
    // Also remove matches associated with the deleted space
    setMatches(prevMatches => prevMatches.filter(m => m.spaceId !== spaceIdToDelete));
    toast({ title: "Space Deleted", description: "The space and its associated matches have been deleted." });
  }, [currentUser, toast, spaces, activeSpaceId, matches]); // Added matches dependency
  
  const setActiveSpaceId = useCallback((newActiveSpaceId: string | null) => {
    if (!currentUser) {
        setActiveSpaceIdState(null);
        return;
    }
    // Allow setting to null (global context) or to a space owned by the user
    const spaceExists = newActiveSpaceId === null || spaces.some(s => s.id === newActiveSpaceId && s.ownerId === currentUser.id);
    if (spaceExists) {
        if (newActiveSpaceId !== activeSpaceId) { // Only update and toast if it's a change
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

  const setAuthPageImageUrl = useCallback((url: string) => {
    if (!url) { // If URL is empty, reset to default
        setAuthPageImageUrlState(DEFAULT_AUTH_IMAGE_URL);
        toast({ title: "Image URL Reset", description: "Auth page image reset to default."});
    } else {
        setAuthPageImageUrlState(url);
        toast({ title: "Image URL Updated", description: "Auth page image has been changed."});
    }
  }, [toast]);

  const addGame = useCallback((gameData: Omit<Game, 'id' | 'icon'>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add games.", variant: "destructive" });
      return;
    }
    const newGame: Game = {
      ...gameData,
      id: `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      icon: HelpCircle, // Default icon for user-added games
    };
    setGames(prevGames => [...prevGames, newGame]);
    toast({ title: "Game Added", description: `${newGame.name} has been added to the library.` });
  }, [currentUser, toast]);

  const updateGame = useCallback((gameId: string, gameData: Partial<Omit<Game, 'id' | 'icon'>>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to update games.", variant: "destructive" });
      return;
    }
    setGames(prevGames =>
      prevGames.map(game =>
        game.id === gameId ? { ...game, ...gameData } : game
      )
    );
    toast({ title: "Game Updated", description: "Game details have been updated." });
  }, [currentUser, toast]);

  const deleteGame = useCallback((gameId: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to delete games.", variant: "destructive" });
      return;
    }
    const isGameUsed = matches.some(match => match.gameId === gameId);
    if (isGameUsed) {
      toast({
        title: "Cannot Delete Game",
        description: "This game is used in recorded matches and cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    const gameToDelete = games.find(g => g.id === gameId);
    setGames(prevGames => prevGames.filter(game => game.id !== gameId));
    if (gameToDelete) {
        toast({ title: "Game Deleted", description: `${gameToDelete.name} has been removed from the library.` });
    }
  }, [currentUser, matches, games, toast]);


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
      getActiveSpace,
      authPageImageUrl,
      setAuthPageImageUrl,
      addGame,
      updateGame,
      deleteGame,
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

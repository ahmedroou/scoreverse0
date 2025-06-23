
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Game, Player, Match, ScoreData, Space, UserAccount, PlayerStats } from '@/types';
import { INITIAL_MOCK_GAMES, INITIAL_MOCK_PLAYERS } from '@/data/mock-data.tsx';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const PUBLIC_SHARES_LS_KEY = 'scoreverse-public-shares';

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
  getPlayerStats: (playerId: string) => PlayerStats | null;
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
  addGame: (gameData: Omit<Game, 'id' | 'icon' | 'ownerId'>) => void;
  updateGame: (gameId: string, gameData: Partial<Omit<Game, 'id' | 'icon' | 'ownerId'>>) => void;
  deleteGame: (gameId: string) => void;
  shareSpace: (spaceId: string) => string | null;
  unshareSpace: (spaceId: string) => void;
  getUserById: (userId: string) => UserAccount | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const REGISTERED_USERS_LS_KEY = 'scoreverse-registered-users';
const CURRENT_USER_LS_KEY = 'scoreverse-current-user';
const PLAYERS_LS_KEY_PREFIX = 'scoreverse-players-'; 
const MATCHES_LS_KEY_PREFIX = 'scoreverse-matches-'; 
const SPACES_LS_KEY_PREFIX = 'scoreverse-spaces-'; 
const ACTIVE_SPACE_LS_KEY_PREFIX = 'scoreverse-active-space-'; 
const GAMES_LS_KEY_PREFIX = 'scoreverse-games-';

const DEFAULT_SPACE_NAME = "Personal Space";
const ADMIN_USERNAME = 'admin'; // Hardcoded admin username

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>([]);
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

  // Main data loading and scoping effect
  useEffect(() => {
    if (!isClient || !currentUser) {
      // Clear data if logged out
      setPlayers([]); 
      setGames([]);
      setMatches([]);
      setSpaces([]);
      setActiveSpaceIdState(null);
      return;
    }

    // ADMIN DATA LOADING
    if (currentUser.isAdmin) {
      let allPlayers: Player[] = [];
      let allGames: Game[] = [];
      let allMatches: Match[] = [];
      let allSpaces: Space[] = [];

      registeredUsers.forEach(user => {
        const userPlayers: Player[] = JSON.parse(localStorage.getItem(`${PLAYERS_LS_KEY_PREFIX}${user.id}`) || '[]');
        const userGames: Game[] = JSON.parse(localStorage.getItem(`${GAMES_LS_KEY_PREFIX}${user.id}`) || '[]');
        const userMatches: Match[] = JSON.parse(localStorage.getItem(`${MATCHES_LS_KEY_PREFIX}${user.id}`) || '[]');
        const userSpaces: Space[] = JSON.parse(localStorage.getItem(`${SPACES_LS_KEY_PREFIX}${user.id}`) || '[]');
        
        allPlayers.push(...userPlayers);
        allGames.push(...userGames);
        allMatches.push(...userMatches);
        allSpaces.push(...userSpaces);
      });
      
      setPlayers(allPlayers);
      setGames(allGames);
      setMatches(allMatches);
      setSpaces(allSpaces);

      // Admin active space is loaded from their own storage
      const adminActiveSpaceKey = `${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`;
      const savedActiveSpaceId = localStorage.getItem(adminActiveSpaceKey);
      setActiveSpaceIdState(savedActiveSpaceId ? JSON.parse(savedActiveSpaceId) : null);

    } else {
      // REGULAR USER DATA LOADING
      const playersKey = `${PLAYERS_LS_KEY_PREFIX}${currentUser.id}`;
      const matchesKey = `${MATCHES_LS_KEY_PREFIX}${currentUser.id}`;
      const spacesKey = `${SPACES_LS_KEY_PREFIX}${currentUser.id}`;
      const activeSpaceKey = `${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`;
      const gamesKey = `${GAMES_LS_KEY_PREFIX}${currentUser.id}`;

      const savedPlayers = localStorage.getItem(playersKey);
      setPlayers(savedPlayers ? JSON.parse(savedPlayers) : INITIAL_MOCK_PLAYERS.map(p => ({...p, id: `${p.id}-${currentUser.id}-${Math.random().toString(36).substring(2, 9)}`, ownerId: currentUser.id})));

      const savedMatches = localStorage.getItem(matchesKey);
      setMatches(savedMatches ? JSON.parse(savedMatches) : []);

      const savedGames = localStorage.getItem(gamesKey);
      setGames(savedGames ? JSON.parse(savedGames) : INITIAL_MOCK_GAMES.map(g => ({...g, id: `${g.id}-${currentUser.id}-${Math.random().toString(36).substring(2, 9)}`, ownerId: currentUser.id})));

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
    }

  }, [isClient, currentUser, registeredUsers]);


  // Effect for saving data to localStorage
  useEffect(() => {
    if (isClient && currentUser && !currentUser.isAdmin) {
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
        const userToLogin = {...userExists};
        if(userToLogin.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()){
            userToLogin.isAdmin = true;
        }
        setCurrentUser(userToLogin); 
        if (isClient) {
          localStorage.setItem(CURRENT_USER_LS_KEY, JSON.stringify(userToLogin));
        }
        toast({ title: "Logged In", description: `Welcome back, ${username}!` });
        setIsLoadingAuth(false);
        return true;
      }
    }
    toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
    setIsLoadingAuth(false);
    return false;
  }, [registeredUsers, toast, isClient]);

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
    if(newUser.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()){
        newUser.isAdmin = true;
    }
    
    const updatedRegisteredUsers = [...registeredUsers, newUser];
    setRegisteredUsers(updatedRegisteredUsers);
    setCurrentUser(newUser);

    if(isClient) {
        const initialUserPlayers = INITIAL_MOCK_PLAYERS.map(p => ({...p, id: `player-${p.id}-${newUser.id}-${Math.random().toString(36).substring(2, 9)}`, ownerId: newUser.id}));
        const initialUserGames = INITIAL_MOCK_GAMES.map(g => ({...g, id: `game-${g.id}-${newUser.id}-${Math.random().toString(36).substring(2, 9)}`, ownerId: newUser.id}));
        const initialUserMatches: Match[] = [];
        const defaultSpaceId = `space-default-${newUser.id}-${Date.now()}`;
        const defaultSpace: Space = { id: defaultSpaceId, name: DEFAULT_SPACE_NAME, ownerId: newUser.id };
        const initialUserSpaces = [defaultSpace];

        localStorage.setItem(`${PLAYERS_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialUserPlayers));
        localStorage.setItem(`${GAMES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialUserGames));
        localStorage.setItem(`${MATCHES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialUserMatches));
        localStorage.setItem(`${SPACES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialUserSpaces));
        localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(defaultSpaceId));
        localStorage.setItem(REGISTERED_USERS_LS_KEY, JSON.stringify(updatedRegisteredUsers));
        localStorage.setItem(CURRENT_USER_LS_KEY, JSON.stringify(newUser));
    }
    
    toast({ title: "Account Created", description: `Welcome, ${username}!` });
    setIsLoadingAuth(false);
    return true;
  }, [registeredUsers, toast, isClient]);

  const logout = useCallback(() => {
    setIsLoadingAuth(true);
    const currentUsername = currentUser?.username;
    if (isClient) {
      localStorage.removeItem(CURRENT_USER_LS_KEY);
    }
    setCurrentUser(null); 
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
  }, [toast, router, currentUser, isClient]);

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
      ownerId: currentUser.id,
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
    
    // Admin can delete any player, regular user can only delete their own
    if (!currentUser.isAdmin && playerToDelete.ownerId !== currentUser.id) {
        toast({ title: "Permission Denied", description: "You can only delete players you own.", variant: "destructive" });
        return;
    }

    // Update state first
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
    
    // Persist change to the correct user's localStorage
    if (isClient) {
        const ownerId = playerToDelete.ownerId;
        const playersKey = `${PLAYERS_LS_KEY_PREFIX}${ownerId}`;
        const currentPlayers = JSON.parse(localStorage.getItem(playersKey) || '[]') as Player[];
        const updatedPlayers = currentPlayers.filter(p => p.id !== playerId);
        localStorage.setItem(playersKey, JSON.stringify(updatedPlayers));
        
        // Also update matches for that user
        const matchesKey = `${MATCHES_LS_KEY_PREFIX}${ownerId}`;
        const currentMatches = JSON.parse(localStorage.getItem(matchesKey) || '[]') as Match[];
        const updatedMatches = currentMatches.map(match => ({
          ...match,
          playerIds: match.playerIds.filter(id => id !== playerId),
          winnerIds: match.winnerIds.filter(id => id !== playerId),
        })).filter(match => match.playerIds.length > 0);
        localStorage.setItem(matchesKey, JSON.stringify(updatedMatches));
    }


    toast({
      title: "Player Deleted",
      description: `${playerToDelete.name} has been removed.`,
    });
  }, [currentUser, players, toast, isClient]);

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
      if (currentUser.isAdmin) return updatedMatches; // Don't update player stats for admin match additions

      // Recalculate and update player stats
      const game = getGameById(newMatch.gameId);
      if (game) {
          const updatedPlayers = players.map(p => {
            if (newMatch.playerIds.includes(p.id)) {
              const allMatchesForPlayerInThisGameAndSpace = updatedMatches
                .filter(m => 
                    m.playerIds.includes(p.id) && 
                    m.gameId === newMatch.gameId &&
                    m.spaceId === (activeSpaceId || undefined)
                );

              const totalGamesPlayedInThisGameAndSpace = allMatchesForPlayerInThisGameAndSpace.length;
              const totalWinsInThisGameAndSpace = allMatchesForPlayerInThisGameAndSpace.filter(m => m.winnerIds.includes(p.id)).length;
              
              const playerCopy = { ...p };
              playerCopy.winRate = totalGamesPlayedInThisGameAndSpace > 0 ? totalWinsInThisGameAndSpace / totalGamesPlayedInThisGameAndSpace : (p.winRate || 0);
              return playerCopy;
            }
            return p; 
          });
          setPlayers(updatedPlayers);
      }
      return updatedMatches;
    });

  }, [currentUser, toast, players, getGameById, activeSpaceId]);

  const updatePlayer = useCallback((playerId: string, playerData: Partial<Omit<Player, 'id' | 'ownerId'>>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to update players.", variant: "destructive"});
      return;
    }
    let oldName = '';
    let ownerId = '';

    setPlayers(prevPlayers => 
      prevPlayers.map(p => {
        if (p.id === playerId) {
          if (!currentUser.isAdmin && p.ownerId !== currentUser.id) return p;
          oldName = p.name;
          ownerId = p.ownerId;
          return { ...p, ...playerData };
        }
        return p;
      })
    );
    
    if (isClient && ownerId) {
        const playersKey = `${PLAYERS_LS_KEY_PREFIX}${ownerId}`;
        const currentPlayers: Player[] = JSON.parse(localStorage.getItem(playersKey) || '[]') as Player[];
        const updatedPlayers = currentPlayers.map(p => p.id === playerId ? { ...p, ...playerData } : p);
        localStorage.setItem(playersKey, JSON.stringify(updatedPlayers));
    }

    toast({
      title: "Player Updated",
      description: `Details for ${playerData.name || oldName} have been updated.`,
    });
  }, [currentUser, toast, isClient]);

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
    let filteredBoardMatches = matches;
    if (!currentUser.isAdmin) {
      filteredBoardMatches = activeSpaceId ? matches.filter(m => m.spaceId === activeSpaceId) : matches.filter(m => m.spaceId === undefined);
    }
    return calculateScores(filteredBoardMatches);
  }, [matches, calculateScores, currentUser, isClient, activeSpaceId]);

  const getGameLeaderboard = useCallback((gameId: string): ScoreData[] => {
    if (!currentUser || !isClient) return [];
    let gameMatches = matches.filter(match => match.gameId === gameId);
    if (!currentUser.isAdmin) {
      gameMatches = activeSpaceId 
        ? gameMatches.filter(match => match.spaceId === activeSpaceId)
        : gameMatches.filter(match => match.spaceId === undefined);
    }
    return calculateScores(gameMatches);
  }, [matches, calculateScores, currentUser, isClient, activeSpaceId]);
  
  const getPlayerStats = useCallback((playerId: string): PlayerStats | null => {
    const player = getPlayerById(playerId);
    if (!player) return null;

    let relevantMatches = matches;
    if (!currentUser?.isAdmin) {
       relevantMatches = activeSpaceId 
        ? matches.filter(m => m.spaceId === activeSpaceId) 
        : matches.filter(m => m.spaceId === undefined);
    }

    const playerMatches = relevantMatches
        .filter(m => m.playerIds.includes(playerId))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (playerMatches.length === 0) {
        return { player, totalGames: 0, totalWins: 0, totalLosses: 0, winRate: 0, currentStreak: { type: 'W', count: 0 }, longestWinStreak: 0, longestLossStreak: 0, totalPoints: 0, averagePointsPerMatch: 0, gameStats: [] };
    }

    let totalWins = 0, totalPoints = 0, currentWinStreak = 0, currentLossStreak = 0, longestWinStreak = 0, longestLossStreak = 0;
    let lastResult: 'W' | 'L' | null = null;
    
    playerMatches.forEach(match => {
        const isWinner = match.winnerIds.includes(playerId);
        if (isWinner) {
            totalWins++;
            currentWinStreak++;
            currentLossStreak = 0;
            if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
            lastResult = 'W';
        } else {
            currentLossStreak++;
            currentWinStreak = 0;
            if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak;
            lastResult = 'L';
        }
        totalPoints += match.pointsAwarded.find(p => p.playerId === playerId)?.points || 0;
    });

    const totalGames = playerMatches.length;
    const currentStreak = !lastResult ? { type: 'W' as const, count: 0 } : (lastResult === 'W' ? { type: 'W' as const, count: currentWinStreak } : { type: 'L' as const, count: currentLossStreak });
    
    const gameStatsMap = new Map<string, { game: Game; wins: number; losses: number; gamesPlayed: number }>();
    playerMatches.forEach(match => {
        const game = getGameById(match.gameId);
        if (!game) return;
        if (!gameStatsMap.has(game.id)) gameStatsMap.set(game.id, { game, wins: 0, losses: 0, gamesPlayed: 0 });
        const stats = gameStatsMap.get(game.id)!;
        stats.gamesPlayed++;
        if (match.winnerIds.includes(playerId)) stats.wins++; else stats.losses++;
    });

    return {
        player, totalGames, totalWins, totalLosses: totalGames - totalWins, winRate: totalGames > 0 ? totalWins / totalGames : 0,
        currentStreak, longestWinStreak, longestLossStreak, totalPoints, averagePointsPerMatch: totalGames > 0 ? totalPoints / totalGames : 0,
        gameStats: Array.from(gameStatsMap.values()).map(s => ({...s, winRate: s.gamesPlayed > 0 ? s.wins / s.gamesPlayed : 0})),
    };
  }, [matches, activeSpaceId, getPlayerById, getGameById, currentUser]);

  const addSpace = useCallback((name: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add spaces.", variant: "destructive"});
      return;
    }
    const newSpace: Space = { id: `space-${Date.now()}`, name, ownerId: currentUser.id };
    setSpaces(prevSpaces => {
      const updatedSpaces = [...prevSpaces, newSpace];
      if (updatedSpaces.length === 1 || !activeSpaceId) setActiveSpaceIdState(newSpace.id);
      return updatedSpaces;
    });
    toast({ title: "Space Created", description: `Space "${name}" has been created.` });
  }, [currentUser, toast, activeSpaceId]);

  const updateSpace = useCallback((spaceId: string, newName: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "Login required.", variant: "destructive"});
      return;
    }
    let ownerId = '';
    setSpaces(prevSpaces => prevSpaces.map(s => {
      if (s.id === spaceId && (currentUser.isAdmin || s.ownerId === currentUser.id)) {
        ownerId = s.ownerId;
        return { ...s, name: newName };
      }
      return s;
    }));
    
    if (isClient && ownerId) {
        const spacesKey = `${SPACES_LS_KEY_PREFIX}${ownerId}`;
        const currentSpaces: Space[] = JSON.parse(localStorage.getItem(spacesKey) || '[]') as Space[];
        const updatedSpaces = currentSpaces.map(s => s.id === spaceId ? { ...s, name: newName } : s);
        localStorage.setItem(spacesKey, JSON.stringify(updatedSpaces));
    }
    
    toast({ title: "Space Updated", description: "Space name has been changed." });
  }, [currentUser, toast, isClient]);
  
  const getSpacesForCurrentUser = useCallback((): Space[] => {
    if (!currentUser) return [];
    if (currentUser.isAdmin) return spaces;
    return spaces.filter(s => s.ownerId === currentUser.id);
  }, [currentUser, spaces]);

  const deleteSpace = useCallback((spaceIdToDelete: string) => {
     if (!currentUser) {
      toast({ title: "Error", description: "Login required.", variant: "destructive"});
      return;
    }
    const spaceToDelete = spaces.find(s => s.id === spaceIdToDelete);
    if (!spaceToDelete) return;

    if (!currentUser.isAdmin && spaceToDelete.ownerId !== currentUser.id) {
        toast({ title: "Permission Denied", description: "You can only delete spaces you own.", variant: "destructive"});
        return;
    }
    
    const userOwnedSpaces = getSpacesForCurrentUser();
    if (!currentUser.isAdmin && userOwnedSpaces.length <= 1 && userOwnedSpaces.find(s => s.id === spaceIdToDelete)) {
        toast({ title: "Cannot Delete", description: "You must have at least one space.", variant: "destructive"});
        return;
    }
    
    const ownerId = spaceToDelete.ownerId;
    
    setSpaces(prev => prev.filter(s => s.id !== spaceIdToDelete));
    setMatches(prev => prev.filter(m => m.spaceId !== spaceIdToDelete));

     if (isClient) {
        const spacesKey = `${SPACES_LS_KEY_PREFIX}${ownerId}`;
        const currentSpacesInStorage = JSON.parse(localStorage.getItem(spacesKey) || '[]') as Space[];
        const updatedSpacesInStorage = currentSpacesInStorage.filter(s => s.id !== spaceIdToDelete);
        localStorage.setItem(spacesKey, JSON.stringify(updatedSpacesInStorage));

        const matchesKey = `${MATCHES_LS_KEY_PREFIX}${ownerId}`;
        const currentMatchesInStorage = JSON.parse(localStorage.getItem(matchesKey) || '[]') as Match[];
        const updatedMatchesInStorage = currentMatchesInStorage.filter(m => m.spaceId !== spaceIdToDelete);
        localStorage.setItem(matchesKey, JSON.stringify(updatedMatchesInStorage));
     }

    if (activeSpaceId === spaceIdToDelete) {
      const remainingUserSpacesAfterDelete = spaces.filter(s => s.id !== spaceIdToDelete && s.ownerId === currentUser.id);
      const newActiveId = currentUser.isAdmin ? null : (remainingUserSpacesAfterDelete[0]?.id || null);
      setActiveSpaceIdState(newActiveId);
    }
    toast({ title: "Space Deleted", description: `The space "${spaceToDelete.name}" and its matches have been deleted.` });
  }, [currentUser, toast, spaces, activeSpaceId, isClient, getSpacesForCurrentUser]);
  
  const setActiveSpaceId = useCallback((newActiveSpaceId: string | null) => {
    if (!currentUser) {
        setActiveSpaceIdState(null);
        return;
    }
    setActiveSpaceIdState(newActiveSpaceId);
    if(isClient){
      localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(newActiveSpaceId));
    }
    if (!currentUser.isAdmin) { // Admins don't need space changed toasts
        const spaceName = newActiveSpaceId ? spaces.find(s=>s.id === newActiveSpaceId)?.name : "Global (No Space)";
        toast({ title: "Active Space Changed", description: `Now viewing: ${spaceName}`});
    }
  }, [currentUser, spaces, toast, isClient]);
  
  const getActiveSpace = useCallback((): Space | undefined => {
    if (!activeSpaceId) return undefined;
    return spaces.find(s => s.id === activeSpaceId);
  }, [activeSpaceId, spaces]);

  const addGame = useCallback((gameData: Omit<Game, 'id' | 'icon' | 'ownerId'>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add games.", variant: "destructive" });
      return;
    }
    const newGame: Game = {
      ...gameData,
      id: `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      icon: 'HelpCircle',
      ownerId: currentUser.id,
    };
    setGames(prevGames => [...prevGames, newGame]);
    toast({ title: "Game Added", description: `${newGame.name} has been added to the library.` });
  }, [currentUser, toast]);

  const updateGame = useCallback((gameId: string, gameData: Partial<Omit<Game, 'id' | 'icon' | 'ownerId'>>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to update games.", variant: "destructive" });
      return;
    }
    let ownerId = '';
    setGames(prevGames =>
      prevGames.map(game => {
        if (game.id === gameId && (currentUser.isAdmin || game.ownerId === currentUser.id)) {
            ownerId = game.ownerId;
            return { ...game, ...gameData };
        }
        return game;
      })
    );
    
    if (isClient && ownerId) {
        const gamesKey = `${GAMES_LS_KEY_PREFIX}${ownerId}`;
        const currentGames: Game[] = JSON.parse(localStorage.getItem(gamesKey) || '[]') as Game[];
        const updatedGames = currentGames.map(g => g.id === gameId ? { ...g, ...gameData } : g);
        localStorage.setItem(gamesKey, JSON.stringify(updatedGames));
    }
    
    toast({ title: "Game Updated", description: "Game details have been updated." });
  }, [currentUser, toast, isClient]);

  const deleteGame = useCallback((gameId: string) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to delete games.", variant: "destructive" });
      return;
    }
    const gameToDelete = games.find(g => g.id === gameId);
    if (!gameToDelete) return;

    if (!currentUser.isAdmin && gameToDelete.ownerId !== currentUser.id) {
        toast({ title: "Permission Denied", description: "You can only delete games you own.", variant: "destructive" });
        return;
    }
    
    const isGameUsed = matches.some(match => match.gameId === gameId);
    if (isGameUsed) {
      toast({ title: "Cannot Delete Game", description: "This game is used in recorded matches.", variant: "destructive" });
      return;
    }
    
    setGames(prevGames => prevGames.filter(game => game.id !== gameId));

    if (isClient) {
        const ownerId = gameToDelete.ownerId;
        const gamesKey = `${GAMES_LS_KEY_PREFIX}${ownerId}`;
        const currentGames = JSON.parse(localStorage.getItem(gamesKey) || '[]') as Game[];
        const updatedGames = currentGames.filter(g => g.id !== gameId);
        localStorage.setItem(gamesKey, JSON.stringify(updatedGames));
    }

    toast({ title: "Game Deleted", description: `${gameToDelete.name} has been removed.` });
  }, [currentUser, matches, games, toast, isClient]);
  
  const shareSpace = useCallback((spaceId: string): string | null => {
    if (!currentUser || !isClient) return null;
    const spaceToShare = spaces.find(s => s.id === spaceId);
    if (!spaceToShare) return null;

    const shareId = spaceToShare.shareId || `share-${Date.now()}`;
    const updatedSpace = { ...spaceToShare, shareId };
    
    setSpaces(prev => prev.map(s => s.id === spaceId ? updatedSpace : s));

    const spaceMatches = matches.filter(m => m.spaceId === spaceId);
    const playerIdsInSpace = new Set<string>();
    spaceMatches.forEach(m => m.playerIds.forEach(pid => playerIdsInSpace.add(pid)));
    const spacePlayers = players.filter(p => playerIdsInSpace.has(p.id));
    
    const gameIdsInSpace = new Set(spaceMatches.map(m => m.gameId));
    const spaceGames = games.filter(g => gameIdsInSpace.has(g.id));

    const sharedDataPayload = { space: updatedSpace, players: spacePlayers, matches: spaceMatches, games: spaceGames };
    
    if (isClient) {
      try {
          const allShares = JSON.parse(localStorage.getItem(PUBLIC_SHARES_LS_KEY) || '{}');
          allShares[shareId] = sharedDataPayload;
          localStorage.setItem(PUBLIC_SHARES_LS_KEY, JSON.stringify(allShares));
      } catch(e) {
          toast({ title: "Sharing Error", description: "Could not save sharing data.", variant: "destructive"});
          return null;
      }
    }
    
    return shareId;
  }, [isClient, currentUser, spaces, matches, players, games, toast]);

  const unshareSpace = useCallback((spaceId: string) => {
    if (!currentUser || !isClient) return;
    
    const spaceToUnshare = spaces.find(s => s.id === spaceId);
    if (!spaceToUnshare || !spaceToUnshare.shareId) return;

    const shareId = spaceToUnshare.shareId;
    const { shareId: _, ...rest } = spaceToUnshare;
    const updatedSpace: Space = rest;
    
    setSpaces(prev => prev.map(s => s.id === spaceId ? updatedSpace : s));
    
    if (isClient) {
      try {
          const allShares = JSON.parse(localStorage.getItem(PUBLIC_SHARES_LS_KEY) || '{}');
          delete allShares[shareId];
          localStorage.setItem(PUBLIC_SHARES_LS_KEY, JSON.stringify(allShares));
      } catch(e) { console.error("Failed to update shared data in localStorage", e); }
    }
  }, [isClient, currentUser, spaces]);
  
  const getUserById = useCallback((userId: string) => {
    return registeredUsers.find(u => u.id === userId);
  }, [registeredUsers]);


  return (
    <AppContext.Provider value={{ 
      games, players, matches, spaces, activeSpaceId, addPlayer, deletePlayer, addMatch, updatePlayer, 
      getGameById, getPlayerById, getOverallLeaderboard, getGameLeaderboard, getPlayerStats, isClient,
      currentUser, login, signup, logout, isLoadingAuth, addSpace, updateSpace, deleteSpace, 
      setActiveSpaceId, getSpacesForCurrentUser, getActiveSpace, addGame, updateGame, deleteGame,
      shareSpace, unshareSpace, getUserById
    }}>
      {children}
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

    
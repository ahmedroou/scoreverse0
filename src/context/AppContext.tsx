
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Game, Player, Match, ScoreData, Space, UserAccount, PlayerStats, Tournament } from '@/types';
import { INITIAL_MOCK_GAMES, INITIAL_MOCK_PLAYERS } from '@/data/mock-data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import pako from 'pako';

interface AppContextType {
  games: Game[];
  players: Player[];
  matches: Match[];
  spaces: Space[];
  tournaments: Tournament[];
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
  getUserById: (userId: string) => UserAccount | undefined;
  addTournament: (tournamentData: Omit<Tournament, 'id' | 'status' | 'ownerId' | 'winnerPlayerId' | 'dateCompleted'>) => void;
  updateTournament: (tournamentId: string, tournamentData: Partial<Omit<Tournament, 'id' | 'ownerId'>>) => void;
  deleteTournament: (tournamentId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const REGISTERED_USERS_LS_KEY = 'scoreverse-registered-users';
const CURRENT_USER_LS_KEY = 'scoreverse-current-user';
const PLAYERS_LS_KEY_PREFIX = 'scoreverse-players-'; 
const MATCHES_LS_KEY_PREFIX = 'scoreverse-matches-'; 
const SPACES_LS_KEY_PREFIX = 'scoreverse-spaces-'; 
const TOURNAMENTS_LS_KEY_PREFIX = 'scoreverse-tournaments-';
const ACTIVE_SPACE_LS_KEY_PREFIX = 'scoreverse-active-space-'; 
const GAMES_LS_KEY_PREFIX = 'scoreverse-games-';

const DEFAULT_SPACE_NAME = "Personal Space";
const ADMIN_USERNAME = 'admin'; // Hardcoded admin username

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
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

  // Effect to load user data from localStorage and initialize auth state
  useEffect(() => {
    if (isClient) {
      const savedRegisteredUsersJSON = localStorage.getItem(REGISTERED_USERS_LS_KEY);
      const allUsers = savedRegisteredUsersJSON ? (JSON.parse(savedRegisteredUsersJSON) as UserAccount[]) : [];
      
      const adminUserExists = allUsers.some(u => u.username.toLowerCase() === ADMIN_USERNAME);
      if (!adminUserExists) {
        allUsers.push({ id: `user-admin-${Date.now()}`, username: ADMIN_USERNAME, password: 'password', isAdmin: true });
        localStorage.setItem(REGISTERED_USERS_LS_KEY, JSON.stringify(allUsers));
      }
      setRegisteredUsers(allUsers);

      const savedCurrentUserJSON = localStorage.getItem(CURRENT_USER_LS_KEY);
      if (savedCurrentUserJSON) {
        const potentialUser = JSON.parse(savedCurrentUserJSON) as UserAccount;
        const isValidUser = allUsers.some(u => u.id === potentialUser.id && u.username === potentialUser.username);
        if (isValidUser) {
          setCurrentUser(potentialUser);
        } else {
          localStorage.removeItem(CURRENT_USER_LS_KEY);
          setCurrentUser(null);
        }
      }
      
      setIsLoadingAuth(false);
    }
  }, [isClient]);

  // Main data loading and scoping effect
  useEffect(() => {
    if (!isClient || !currentUser) {
      setPlayers([]); 
      setGames([]);
      setMatches([]);
      setSpaces([]);
      setTournaments([]);
      setActiveSpaceIdState(null);
      return;
    }

    // ADMIN DATA LOADING
    if (currentUser.isAdmin) {
      let allPlayers: Player[] = [];
      let allGames: Game[] = [];
      let allMatches: Match[] = [];
      let allSpaces: Space[] = [];
      let allTournaments: Tournament[] = [];

      registeredUsers.forEach(user => {
        allPlayers.push(...(JSON.parse(localStorage.getItem(`${PLAYERS_LS_KEY_PREFIX}${user.id}`) || '[]')));
        allGames.push(...(JSON.parse(localStorage.getItem(`${GAMES_LS_KEY_PREFIX}${user.id}`) || '[]')));
        allMatches.push(...(JSON.parse(localStorage.getItem(`${MATCHES_LS_KEY_PREFIX}${user.id}`) || '[]')));
        allSpaces.push(...(JSON.parse(localStorage.getItem(`${SPACES_LS_KEY_PREFIX}${user.id}`) || '[]')));
        allTournaments.push(...(JSON.parse(localStorage.getItem(`${TOURNAMENTS_LS_KEY_PREFIX}${user.id}`) || '[]')));
      });
      
      setPlayers(allPlayers);
      setGames(allGames);
      setMatches(allMatches);
      setSpaces(allSpaces);
      setTournaments(allTournaments);

      const adminActiveSpaceKey = `${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`;
      const savedActiveSpaceId = localStorage.getItem(adminActiveSpaceKey);
      setActiveSpaceIdState(savedActiveSpaceId ? JSON.parse(savedActiveSpaceId) : null);

    } else {
      // REGULAR USER DATA LOADING
      const playersKey = `${PLAYERS_LS_KEY_PREFIX}${currentUser.id}`;
      const matchesKey = `${MATCHES_LS_KEY_PREFIX}${currentUser.id}`;
      const spacesKey = `${SPACES_LS_KEY_PREFIX}${currentUser.id}`;
      const gamesKey = `${GAMES_LS_KEY_PREFIX}${currentUser.id}`;
      const tournamentsKey = `${TOURNAMENTS_LS_KEY_PREFIX}${currentUser.id}`;
      const activeSpaceKey = `${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`;

      setPlayers(JSON.parse(localStorage.getItem(playersKey) || '[]'));
      setMatches(JSON.parse(localStorage.getItem(matchesKey) || '[]'));
      setGames(JSON.parse(localStorage.getItem(gamesKey) || '[]'));
      setTournaments(JSON.parse(localStorage.getItem(tournamentsKey) || '[]'));

      let userSpaces: Space[] = JSON.parse(localStorage.getItem(spacesKey) || '[]');
      
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


  // Effect for saving data to localStorage for non-admin users
  useEffect(() => {
    if (isClient && currentUser && !currentUser.isAdmin) {
      localStorage.setItem(`${PLAYERS_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(players));
      localStorage.setItem(`${MATCHES_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(matches));
      localStorage.setItem(`${SPACES_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(spaces));
      localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(activeSpaceId));
      localStorage.setItem(`${GAMES_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(games));
      localStorage.setItem(`${TOURNAMENTS_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(tournaments));
    }
  }, [players, matches, spaces, activeSpaceId, games, tournaments, isClient, currentUser]);

  const login = useCallback((username: string, password?: string): boolean => {
    const userExists = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists && userExists.password === password) {
      const userToLogin = {...userExists};
      if(userToLogin.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()){
          userToLogin.isAdmin = true;
      }
      setCurrentUser(userToLogin); 
      if (isClient) localStorage.setItem(CURRENT_USER_LS_KEY, JSON.stringify(userToLogin));
      toast({ title: "Logged In", description: `Welcome back, ${username}!` });
      return true;
    }
    toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
    return false;
  }, [registeredUsers, toast, isClient]);

  const signup = useCallback((username: string, password?: string): boolean => {
    if (!password || password.length < 6) {
      toast({ title: "Signup Failed", description: "Password must be at least 6 characters.", variant: "destructive" });
      return false;
    }
    if (registeredUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      toast({ title: "Signup Failed", description: "Username already taken.", variant: "destructive" });
      return false;
    }
    const newUser: UserAccount = { id: `user-${Date.now()}`, username, password, isAdmin: username.toLowerCase() === ADMIN_USERNAME };
    
    const updatedRegisteredUsers = [...registeredUsers, newUser];
    setRegisteredUsers(updatedRegisteredUsers);
    setCurrentUser(newUser);

    if(isClient) {
        const initialUserPlayers = INITIAL_MOCK_PLAYERS.map(p => ({...p, id: `player-${p.id}-${newUser.id}-${Math.random().toString(36).substring(2, 9)}`, ownerId: newUser.id}));
        const initialUserGames = INITIAL_MOCK_GAMES.map(g => ({...g, id: `game-${g.id}-${newUser.id}-${Math.random().toString(36).substring(2, 9)}`, ownerId: newUser.id}));
        const defaultSpaceId = `space-default-${newUser.id}-${Date.now()}`;
        const defaultSpace: Space = { id: defaultSpaceId, name: DEFAULT_SPACE_NAME, ownerId: newUser.id };
        
        localStorage.setItem(`${PLAYERS_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialUserPlayers));
        localStorage.setItem(`${GAMES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(initialUserGames));
        localStorage.setItem(`${MATCHES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify([]));
        localStorage.setItem(`${SPACES_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify([defaultSpace]));
        localStorage.setItem(`${TOURNAMENTS_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify([]));
        localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${newUser.id}`, JSON.stringify(defaultSpaceId));
        
        localStorage.setItem(REGISTERED_USERS_LS_KEY, JSON.stringify(updatedRegisteredUsers));
        localStorage.setItem(CURRENT_USER_LS_KEY, JSON.stringify(newUser));
    }
    
    toast({ title: "Account Created", description: `Welcome, ${username}!` });
    return true;
  }, [registeredUsers, toast, isClient]);

  const logout = useCallback(() => {
    const currentUsername = currentUser?.username;
    if (isClient) localStorage.removeItem(CURRENT_USER_LS_KEY);
    setCurrentUser(null);
    toast({ title: "Logged Out", description: `Goodbye, ${currentUsername}!` });
    router.push('/auth');
  }, [toast, router, currentUser, isClient]);

  const addPlayer = useCallback((name: string, avatarUrl?: string) => {
    if (!currentUser) return;
    const newPlayer: Player = {
      id: `player-${Date.now()}`, name, avatarUrl, winRate: 0, averageScore: 0, ownerId: currentUser.id,
    };
    setPlayers(p => [...p, newPlayer]);
    toast({ title: "Player Added", description: `${name} has been added.` });
  }, [currentUser, toast]);

  const deletePlayer = useCallback((playerId: string) => {
    if (!currentUser) return;
    const playerToDelete = players.find(p => p.id === playerId);
    if (!playerToDelete) return;
    if (!currentUser.isAdmin && playerToDelete.ownerId !== currentUser.id) return;

    setPlayers(p => p.filter(pl => pl.id !== playerId));
    setMatches(m => m.map(match => ({
        ...match,
        playerIds: match.playerIds.filter(id => id !== playerId),
        winnerIds: match.winnerIds.filter(id => id !== playerId),
      })).filter(match => match.playerIds.length > 0) 
    );
    toast({ title: "Player Deleted", description: `${playerToDelete.name} has been removed.`});
  }, [currentUser, players, toast]);

  const getGameById = useCallback((gameId: string) => games.find(g => g.id === gameId), [games]);
  const getPlayerById = useCallback((playerId: string) => players.find(p => p.id === playerId), [players]);

  const calculateScores = useCallback((filteredMatchesForCalc: Match[]): ScoreData[] => {
    const playerScores: Record<string, ScoreData> = {};
    const relevantPlayerIds = new Set(filteredMatchesForCalc.flatMap(m => m.playerIds));
    const relevantPlayers = players.filter(p => relevantPlayerIds.has(p.id));

    relevantPlayers.forEach(player => { 
      playerScores[player.id] = { 
        playerId: player.id, playerName: player.name, avatarUrl: player.avatarUrl,
        totalPoints: 0, gamesPlayed: 0, wins: 0 
      };
    });

    filteredMatchesForCalc.forEach(match => {
      match.playerIds.forEach(playerId => {
        if (playerScores[playerId]) playerScores[playerId].gamesPlayed += 1;
      });
      match.pointsAwarded.forEach(pa => {
        if (playerScores[pa.playerId]) playerScores[pa.playerId].totalPoints += pa.points;
      });
      match.winnerIds.forEach(winnerId => {
        if (playerScores[winnerId]) playerScores[winnerId].wins += 1;
      });
    });
    
    return Object.values(playerScores)
      .sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins);
  }, [players]);

  const addMatch = useCallback((matchData: Omit<Match, 'id' | 'date' | 'spaceId'>) => {
    if (!currentUser) return;
    const newMatch: Match = {
      ...matchData,
      id: `match-${Date.now()}`, date: new Date().toISOString(), spaceId: activeSpaceId || undefined,
    };
    const updatedMatches = [...matches, newMatch];
    setMatches(updatedMatches);

    // Tournament Completion Check
    const relevantMatchesForGame = updatedMatches.filter(m => m.gameId === newMatch.gameId && m.spaceId === (activeSpaceId || undefined));
    const gameLeaderboard = calculateScores(relevantMatchesForGame);
    const activeTournamentsForGame = tournaments.filter(t => t.gameId === newMatch.gameId && t.status === 'active');
    
    const newlyCompletedTournaments = activeTournamentsForGame.map(tourney => {
      const winner = gameLeaderboard.find(score => score.totalPoints >= tourney.targetPoints);
      if (winner) {
        return { ...tourney, status: 'completed' as const, winnerPlayerId: winner.playerId, dateCompleted: new Date().toISOString() };
      }
      return null;
    }).filter((t): t is Tournament => t !== null);

    if (newlyCompletedTournaments.length > 0) {
      const winner = getPlayerById(newlyCompletedTournaments[0].winnerPlayerId!);
      if(winner) toast({ title: "🏆 Tournament Finished!", description: `${winner.name} won the "${newlyCompletedTournaments[0].name}" tournament!` });
      
      setTournaments(prev => prev.map(t => newlyCompletedTournaments.find(ct => ct.id === t.id) || t));
    }
  }, [currentUser, activeSpaceId, matches, tournaments, calculateScores, getPlayerById, toast]);

  const updatePlayer = useCallback((playerId: string, playerData: Partial<Omit<Player, 'id' | 'ownerId'>>) => {
    if (!currentUser) return;
    setPlayers(p => p.map(player => {
      if (player.id === playerId && (currentUser.isAdmin || player.ownerId === currentUser.id)) {
        return { ...player, ...playerData };
      }
      return player;
    }));
    toast({ title: "Player Updated" });
  }, [currentUser, toast]);

  const getOverallLeaderboard = useCallback(() => {
    const filtered = activeSpaceId ? matches.filter(m => m.spaceId === activeSpaceId) : matches.filter(m => m.spaceId === undefined);
    return calculateScores(filtered);
  }, [matches, activeSpaceId, calculateScores]);

  const getGameLeaderboard = useCallback((gameId: string) => {
    let gameMatches = matches.filter(m => m.gameId === gameId);
    if (activeSpaceId) gameMatches = gameMatches.filter(m => m.spaceId === activeSpaceId);
    else gameMatches = gameMatches.filter(m => m.spaceId === undefined);
    return calculateScores(gameMatches);
  }, [matches, activeSpaceId, calculateScores]);
  
  const getPlayerStats = useCallback((playerId: string): PlayerStats | null => {
    const player = getPlayerById(playerId);
    if (!player) return null;
    const playerMatches = matches.filter(m => m.playerIds.includes(playerId)).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (playerMatches.length === 0) return { player, totalGames: 0, totalWins: 0, totalLosses: 0, winRate: 0, currentStreak: { type: 'W', count: 0 }, longestWinStreak: 0, longestLossStreak: 0, totalPoints: 0, averagePointsPerMatch: 0, gameStats: [] };

    let totalWins = 0, totalPoints = 0, currentWinStreak = 0, currentLossStreak = 0, longestWinStreak = 0, longestLossStreak = 0;
    playerMatches.forEach(match => {
        if (match.winnerIds.includes(playerId)) {
            totalWins++;
            currentWinStreak++;
            currentLossStreak = 0;
            if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
        } else {
            currentLossStreak++;
            currentWinStreak = 0;
            if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak;
        }
        totalPoints += match.pointsAwarded.find(p => p.playerId === playerId)?.points || 0;
    });

    const lastResult = playerMatches.length > 0 ? (playerMatches[playerMatches.length - 1].winnerIds.includes(playerId) ? 'W' : 'L') : null;
    const currentStreak = !lastResult ? { type: 'W', count: 0 } : (lastResult === 'W' ? { type: 'W', count: currentWinStreak } : { type: 'L', count: currentLossStreak });
    
    const gameStatsMap = new Map<string, PlayerGameStats>();
    playerMatches.forEach(match => {
      const game = getGameById(match.gameId);
      if (!game) return;
      if (!gameStatsMap.has(game.id)) gameStatsMap.set(game.id, { game, wins: 0, losses: 0, gamesPlayed: 0, winRate: 0 });
      const stats = gameStatsMap.get(game.id)!;
      stats.gamesPlayed++;
      if (match.winnerIds.includes(playerId)) stats.wins++; else stats.losses++;
      stats.winRate = stats.gamesPlayed > 0 ? stats.wins / stats.gamesPlayed : 0;
    });

    return {
        player, totalGames: playerMatches.length, totalWins, totalLosses: playerMatches.length - totalWins, winRate: playerMatches.length > 0 ? totalWins / playerMatches.length : 0,
        currentStreak, longestWinStreak, longestLossStreak, totalPoints, averagePointsPerMatch: playerMatches.length > 0 ? totalPoints / playerMatches.length : 0,
        gameStats: Array.from(gameStatsMap.values()),
    };
  }, [matches, getPlayerById, getGameById]);
  
  const getSpacesForCurrentUser = useCallback(() => {
    if (!currentUser) return [];
    return currentUser.isAdmin ? spaces : spaces.filter(s => s.ownerId === currentUser.id);
  }, [currentUser, spaces]);

  const addSpace = useCallback((name: string) => {
    if (!currentUser) return;
    const newSpace: Space = { id: `space-${Date.now()}`, name, ownerId: currentUser.id };
    setSpaces(s => [...s, newSpace]);
    if (!activeSpaceId) setActiveSpaceIdState(newSpace.id);
    toast({ title: "Space Created", description: `Space "${name}" created.` });
  }, [currentUser, toast, activeSpaceId]);

  const updateSpace = useCallback((spaceId: string, newName: string) => {
    if (!currentUser) return;
    setSpaces(s => s.map(space => space.id === spaceId && (currentUser.isAdmin || space.ownerId === currentUser.id) ? { ...space, name: newName } : space));
    toast({ title: "Space Updated" });
  }, [currentUser, toast]);

  const deleteSpace = useCallback((spaceIdToDelete: string) => {
    if (!currentUser) return;
    const space = spaces.find(s => s.id === spaceIdToDelete);
    if (!space) return;
    if (!currentUser.isAdmin && space.ownerId !== currentUser.id) return;
    if (!currentUser.isAdmin && getSpacesForCurrentUser().length <= 1) {
        toast({ title: "Cannot Delete", description: "You must have at least one space.", variant: "destructive"});
        return;
    }
    setSpaces(s => s.filter(sp => sp.id !== spaceIdToDelete));
    setMatches(m => m.filter(match => match.spaceId !== spaceIdToDelete));
    if (activeSpaceId === spaceIdToDelete) setActiveSpaceIdState(currentUser.isAdmin ? null : getSpacesForCurrentUser()[0]?.id || null);
    toast({ title: "Space Deleted", description: `Space "${space.name}" deleted.` });
  }, [currentUser, toast, spaces, activeSpaceId, getSpacesForCurrentUser]);
  
  const setActiveSpaceId = useCallback((newActiveSpaceId: string | null) => {
    setActiveSpaceIdState(newActiveSpaceId);
    if(isClient && currentUser) localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${currentUser.id}`, JSON.stringify(newActiveSpaceId));
  }, [currentUser, isClient]);
  
  const getActiveSpace = useCallback(() => activeSpaceId ? spaces.find(s => s.id === activeSpaceId) : undefined, [activeSpaceId, spaces]);

  const addGame = useCallback((gameData: Omit<Game, 'id' | 'icon' | 'ownerId'>) => {
    if (!currentUser) return;
    const newGame: Game = { ...gameData, id: `game-${Date.now()}`, icon: 'HelpCircle', ownerId: currentUser.id };
    setGames(g => [...g, newGame]);
    toast({ title: "Game Added", description: `${newGame.name} added.` });
  }, [currentUser, toast]);

  const updateGame = useCallback((gameId: string, gameData: Partial<Omit<Game, 'id' | 'icon' | 'ownerId'>>) => {
    if (!currentUser) return;
    setGames(g => g.map(game => game.id === gameId && (currentUser.isAdmin || game.ownerId === currentUser.id) ? { ...game, ...gameData } : game));
    toast({ title: "Game Updated" });
  }, [currentUser, toast]);

  const deleteGame = useCallback((gameId: string) => {
    if (!currentUser) return;
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    if (!currentUser.isAdmin && game.ownerId !== currentUser.id) return;
    if (matches.some(m => m.gameId === gameId)) {
      toast({ title: "Cannot Delete", description: "Game is used in recorded matches.", variant: "destructive" });
      return;
    }
    setGames(g => g.filter(gm => gm.id !== gameId));
    toast({ title: "Game Deleted", description: `${game.name} removed.` });
  }, [currentUser, matches, games, toast]);
  
  const shareSpace = useCallback((spaceId: string): string | null => {
    if (!isClient) return null;
    const spaceToShare = spaces.find(s => s.id === spaceId);
    if (!spaceToShare) return null;
    const spaceMatches = matches.filter(m => m.spaceId === spaceId);
    const playerIdsInSpace = new Set<string>(spaceMatches.flatMap(m => m.playerIds));
    const spacePlayers = players.filter(p => playerIdsInSpace.has(p.id));
    const gameIdsInSpace = new Set(spaceMatches.map(m => m.gameId));
    const spaceGames = games.filter(g => gameIdsInSpace.has(g.id));
    const sharedData = { space: spaceToShare, players: spacePlayers, matches: spaceMatches, games: spaceGames };
    try {
      const json = JSON.stringify(sharedData);
      const compressed = pako.deflate(json, { to: 'string' });
      const encoded = btoa(compressed);
      return `${window.location.origin}/share/${spaceId}?data=${encodeURIComponent(encoded)}`;
    } catch (e) {
      toast({ title: "Sharing Error", variant: "destructive"});
      return null;
    }
  }, [isClient, spaces, matches, players, games, toast]);
  
  const getUserById = useCallback((userId: string) => registeredUsers.find(u => u.id === userId), [registeredUsers]);

  const addTournament = useCallback((data: Omit<Tournament, 'id' | 'status' | 'ownerId' | 'winnerPlayerId' | 'dateCompleted'>) => {
    if (!currentUser) return;
    const newTournament: Tournament = {
      ...data,
      id: `tour-${Date.now()}`,
      status: 'active',
      ownerId: currentUser.id,
    };
    setTournaments(t => [...t, newTournament]);
    toast({ title: "Tournament Created!", description: `The "${data.name}" tournament is now active.` });
  }, [currentUser, toast]);

  const updateTournament = useCallback((id: string, data: Partial<Omit<Tournament, 'id' | 'ownerId'>>) => {
     if (!currentUser) return;
     setTournaments(t => t.map(tour => {
       if (tour.id === id && (currentUser.isAdmin || tour.ownerId === currentUser.id)) {
         return { ...tour, ...data };
       }
       return tour;
     }));
     toast({ title: "Tournament Updated" });
  }, [currentUser, toast]);

  const deleteTournament = useCallback((id: string) => {
    if (!currentUser) return;
    const tourToDelete = tournaments.find(t => t.id === id);
    if (!tourToDelete) return;
    if (!currentUser.isAdmin && tourToDelete.ownerId !== currentUser.id) return;

    setTournaments(t => t.filter(tour => tour.id !== id));
    toast({ title: "Tournament Deleted" });
  }, [currentUser, tournaments, toast]);

  return (
    <AppContext.Provider value={{ 
      games, players, matches, spaces, tournaments, activeSpaceId, addPlayer, deletePlayer, addMatch, updatePlayer, 
      getGameById, getPlayerById, getOverallLeaderboard, getGameLeaderboard, getPlayerStats, isClient,
      currentUser, login, signup, logout, isLoadingAuth, addSpace, updateSpace, deleteSpace, 
      setActiveSpaceId, getSpacesForCurrentUser, getActiveSpace, addGame, updateGame, deleteGame,
      shareSpace, getUserById, addTournament, updateTournament, deleteTournament
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

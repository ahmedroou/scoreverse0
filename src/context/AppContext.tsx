
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import pako from 'pako';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  deleteDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import { auth, db, isFirebaseConfigured, firebaseConfig } from '@/lib/firebase';
import type { Game, Player, Match, ScoreData, Space, UserAccount, PlayerStats, Tournament } from '@/types';
import { INITIAL_MOCK_GAMES, INITIAL_MOCK_PLAYERS } from '@/data/mock-data';
import { useToast } from '@/hooks/use-toast';
import { playSound } from '@/lib/audio';

interface AppContextType {
  games: Game[];
  players: Player[];
  matches: Match[];
  spaces: Space[];
  tournaments: Tournament[];
  allUsers: UserAccount[]; // For admin
  activeSpaceId: string | null;
  addPlayer: (name: string, avatarUrl?: string) => Promise<void>;
  deletePlayer: (playerId: string) => Promise<void>;
  addMatch: (matchData: Omit<Match, 'id' | 'date' | 'spaceId'>) => Promise<void>;
  updatePlayer: (playerId: string, playerData: Partial<Omit<Player, 'id'>>) => Promise<void>;
  getGameById: (gameId: string) => Game | undefined;
  getPlayerById: (playerId: string) => Player | undefined;
  getOverallLeaderboard: () => ScoreData[];
  getGameLeaderboard: (gameId: string) => ScoreData[];
  getPlayerStats: (playerId: string) => PlayerStats | null;
  isClient: boolean;
  currentUser: UserAccount | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>; 
  signup: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>; 
  logout: () => Promise<void>;
  isLoadingAuth: boolean;
  addSpace: (name: string) => Promise<void>;
  updateSpace: (spaceId: string, newName: string) => Promise<void>;
  deleteSpace: (spaceId: string) => Promise<void>;
  setActiveSpaceId: (spaceId: string | null) => void;
  getSpacesForCurrentUser: () => Space[];
  getActiveSpace: () => Space | undefined;
  addGame: (gameData: Omit<Game, 'id' | 'icon' | 'ownerId'>) => Promise<void>;
  updateGame: (gameId: string, gameData: Partial<Omit<Game, 'id' | 'icon' | 'ownerId'>>) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  shareSpace: (spaceId: string) => string | null;
  getUserById: (userId: string) => UserAccount | undefined; // Admin function, needs all users
  deleteUserAccount: (userId: string) => Promise<void>; // Admin function
  addTournament: (tournamentData: Omit<Tournament, 'id' | 'status' | 'ownerId' | 'winnerPlayerId' | 'dateCompleted'>) => Promise<void>;
  updateTournament: (tournamentId: string, tournamentData: Partial<Omit<Tournament, 'id' | 'ownerId'>>) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  firebaseConfigured: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ACTIVE_SPACE_LS_KEY_PREFIX = 'scoreverse-active-space-'; 

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]); // For admin use
  
  const [activeSpaceId, setActiveSpaceIdState] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleFirestoreError = (error: Error, dataType: string) => {
    console.error(`Firestore Error (${dataType}):`, error);
    toast({
      title: "Database Read Error",
      description: `Could not fetch ${dataType} data. This is often caused by Firebase security rules. You may be seeing out-of-date information.`,
      variant: "destructive",
      duration: 10000,
    });
    playSound('error');
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Central effect for auth state and real-time data fetching from Firestore
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoadingAuth(true);
      if (user) {
        setFirebaseUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        
        // This onSnapshot listener handles user profile updates in real-time
        const unsubUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as UserAccount;
            setCurrentUser(userData);
            const savedActiveSpaceId = localStorage.getItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${user.uid}`);
            setActiveSpaceIdState(savedActiveSpaceId ? JSON.parse(savedActiveSpaceId) : null);
          } else {
            console.error("User document not found in Firestore. Logging out.");
            signOut(auth);
          }
        }, (error) => handleFirestoreError(error, "user profile"));

        // Setup real-time listeners for all user-specific data
        const unsubPlayers = onSnapshot(collection(db, 'users', user.uid, 'players'), (snapshot) => {
          const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
          setPlayers(playersData);
        }, (error) => handleFirestoreError(error, "players"));

        const unsubGames = onSnapshot(collection(db, 'users', user.uid, 'games'), (snapshot) => {
          const gamesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
          setGames(gamesData);
        }, (error) => handleFirestoreError(error, "games"));

        const unsubMatches = onSnapshot(collection(db, 'users', user.uid, 'matches'), (snapshot) => {
          const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
          setMatches(matchesData);
        }, (error) => handleFirestoreError(error, "matches"));

        const unsubSpaces = onSnapshot(collection(db, 'users', user.uid, 'spaces'), (snapshot) => {
          const spacesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Space));
          setSpaces(spacesData);
           if (spacesData.length > 0) {
              const currentActiveSpace = localStorage.getItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${user.uid}`);
              const activeId = currentActiveSpace ? JSON.parse(currentActiveSpace) : null;
              if (!spacesData.some(s => s.id === activeId)) {
                setActiveSpaceIdState(spacesData[0].id);
              }
           } else {
              setActiveSpaceIdState(null);
           }
        }, (error) => handleFirestoreError(error, "spaces"));

        const unsubTournaments = onSnapshot(collection(db, 'users', user.uid, 'tournaments'), (snapshot) => {
          const tournamentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
          setTournaments(tournamentsData);
        }, (error) => handleFirestoreError(error, "tournaments"));

        setIsLoadingAuth(false);

        // Return a cleanup function to unsubscribe from all listeners
        return () => {
          unsubUserDoc();
          unsubPlayers();
          unsubGames();
          unsubMatches();
          unsubSpaces();
          unsubTournaments();
        };

      } else {
        // No user is signed in
        setCurrentUser(null);
        setFirebaseUser(null);
        setPlayers([]);
        setGames([]);
        setMatches([]);
        setSpaces([]);
        setTournaments([]);
        setAllUsers([]);
        setActiveSpaceIdState(null);
        setIsLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [isClient]);

  // Effect for Admin to load all users
  useEffect(() => {
    if (currentUser?.isAdmin) {
      const usersCollectionRef = collection(db, 'users');
      const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
        const usersData = snapshot.docs.map(doc => doc.data() as UserAccount);
        setAllUsers(usersData);
      }, (error) => handleFirestoreError(error, "all user list (admin)"));
      return () => unsubscribe();
    } else {
      setAllUsers([]);
    }
  }, [currentUser]);


  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    if (!isFirebaseConfigured() || !password) {
      const err = "Firebase is not configured correctly.";
      setError(err);
      return { success: false, error: err };
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
           await signOut(auth);
           const err = "Login Issue: Your account exists, but your user profile could not be found. This can happen with very old accounts. Please sign up again or check Firestore security rules.";
           setError(err);
           playSound('error');
           return { success: false, error: err };
      }
      
      const userData = docSnap.data() as UserAccount;
      toast({ title: "Logged In", description: `Welcome back, ${userData.username}!` });
      router.push('/dashboard');
      return { success: true };
    } catch (error: any) {
      console.error("Login failed:", error);
      let errMessage = "Invalid email or password.";
      if (error.code === 'auth/invalid-credential') {
        errMessage = "Invalid email or password provided.";
      }
      setError(errMessage);
      playSound('error');
      return { success: false, error: errMessage };
    }
  };

  const signup = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
     setError(null);
     if (!isFirebaseConfigured() || !password) {
      const err = "Firebase is not configured correctly.";
      setError(err);
      return { success: false, error: err };
    }
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Derive username from email (part before @)
      const username = email.split('@')[0];

      // Create user profile document in Firestore
      const userDocData: UserAccount = { id: newUser.uid, username, email: newUser.email, isAdmin: false };
      await setDoc(doc(db, "users", newUser.uid), userDocData);

      // Create initial data (default space, players, games) in a batch
      const batch = writeBatch(db);
      const defaultSpaceRef = doc(collection(db, 'users', newUser.uid, 'spaces'));
      batch.set(defaultSpaceRef, { name: "Personal Space", ownerId: newUser.uid });
      
      INITIAL_MOCK_PLAYERS.forEach(player => {
        const playerRef = doc(collection(db, 'users', newUser.uid, 'players'));
        batch.set(playerRef, { ...player, ownerId: newUser.uid });
      });

      INITIAL_MOCK_GAMES.forEach(game => {
        const gameRef = doc(collection(db, 'users', newUser.uid, 'games'));
        batch.set(gameRef, { ...game, ownerId: newUser.uid });
      });
      
      await batch.commit();

      // Set the new space as active in localStorage
      localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${newUser.uid}`, JSON.stringify(defaultSpaceRef.id));
      router.push('/dashboard');
      toast({ title: "Account Created", description: `Welcome, ${username}!` });
      playSound('success');
      return { success: true };

    } catch (error: any) {
       console.error("Signup failed:", error);
       let err = "Failed to create account. Please try again.";
       if (error.code === 'auth/email-already-in-use') {
         err = "This email address is already in use.";
       }
       setError(err);
       playSound('error');
       return { success: false, error: err };
    }
  };

  const logout = async () => {
    const currentUsername = currentUser?.username;
    await signOut(auth);
    toast({ title: "Logged Out", description: `Goodbye, ${currentUsername}!` });
    router.push('/auth');
  };
  
  // Firestore-backed data modification functions
  const addPlayer = async (name: string, avatarUrl?: string) => {
    if (!firebaseUser) return;
    const playersCollection = collection(db, 'users', firebaseUser.uid, 'players');
    const newPlayerData: Omit<Player, 'id'> = { name, winRate: 0, averageScore: 0, ownerId: firebaseUser.uid };
    if (avatarUrl) {
      newPlayerData.avatarUrl = avatarUrl;
    }
    await addDoc(playersCollection, newPlayerData);
    toast({ title: "Player Added", description: `${name} has been added.` });
    playSound('success');
  };

  const deletePlayer = async (playerId: string) => {
    if (!firebaseUser) return;
    const playerDocRef = doc(db, 'users', firebaseUser.uid, 'players', playerId);
    await deleteDoc(playerDocRef);
    // Note: Deleting player from matches is complex and might be better handled with a cloud function or left as is.
    toast({ title: "Player Deleted", description: `Player has been removed.`});
  };

  const updatePlayer = async (playerId: string, playerData: Partial<Omit<Player, 'id' | 'ownerId'>>) => {
    if (!firebaseUser) return;
    const playerDocRef = doc(db, 'users', firebaseUser.uid, 'players', playerId);
    await updateDoc(playerDocRef, playerData);
    toast({ title: "Player Updated" });
  };

  const addGame = async (gameData: Omit<Game, 'id' | 'icon' | 'ownerId'>) => {
    if (!firebaseUser) return;
    const gamesCollection = collection(db, 'users', firebaseUser.uid, 'games');
    
    // Create a mutable copy to safely delete undefined properties
    const newGameData: Partial<Omit<Game, 'id'>> = { ...gameData, icon: 'HelpCircle', ownerId: firebaseUser.uid };
    
    if (newGameData.description === '' || newGameData.description === undefined) {
      delete newGameData.description;
    }
    if (newGameData.maxPlayers === undefined || newGameData.maxPlayers === 0) {
       delete newGameData.maxPlayers;
    }
    
    await addDoc(gamesCollection, newGameData);
    toast({ title: "Game Added", description: `${gameData.name} added.` });
    playSound('success');
  };
  
  const updateGame = async (gameId: string, gameData: Partial<Omit<Game, 'id' | 'icon' | 'ownerId'>>) => {
    if (!firebaseUser) return;
    const gameDocRef = doc(db, 'users', firebaseUser.uid, 'games', gameId);
    await updateDoc(gameDocRef, gameData);
    toast({ title: "Game Updated" });
  };

  const deleteGame = async (gameId: string) => {
    if (!firebaseUser) return;
    // Check if game is used in matches
    const q = query(collection(db, 'users', firebaseUser.uid, 'matches'), where("gameId", "==", gameId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        toast({ title: "Cannot Delete", description: "Game is used in recorded matches.", variant: "destructive" });
        playSound('error');
        return;
    }
    const gameDocRef = doc(db, 'users', firebaseUser.uid, 'games', gameId);
    await deleteDoc(gameDocRef);
    toast({ title: "Game Deleted" });
  };

  const addSpace = async (name: string) => {
    if (!firebaseUser) return;
    const spacesCollection = collection(db, 'users', firebaseUser.uid, 'spaces');
    const newSpaceRef = await addDoc(spacesCollection, { name, ownerId: firebaseUser.uid });
    if (!activeSpaceId) {
        setActiveSpaceId(newSpaceRef.id);
    }
    toast({ title: "Space Created", description: `Space "${name}" created.` });
    playSound('success');
  };
  
  const updateSpace = async (spaceId: string, newName: string) => {
    if (!firebaseUser) return;
    const spaceDocRef = doc(db, 'users', firebaseUser.uid, 'spaces', spaceId);
    await updateDoc(spaceDocRef, { name: newName });
    toast({ title: "Space Updated" });
  };

  const deleteSpace = async (spaceIdToDelete: string) => {
    if (!firebaseUser) return;
    const userSpaces = await getSpacesForCurrentUser();
    if (userSpaces.length <= 1) {
        toast({ title: "Cannot Delete", description: "You must have at least one space.", variant: "destructive"});
        playSound('error');
        return;
    }
    // Batch delete space and all its matches
    const batch = writeBatch(db);
    const spaceDocRef = doc(db, 'users', firebaseUser.uid, 'spaces', spaceIdToDelete);
    batch.delete(spaceDocRef);
    const matchesQuery = query(collection(db, 'users', firebaseUser.uid, 'matches'), where("spaceId", "==", spaceIdToDelete));
    const matchesSnapshot = await getDocs(matchesQuery);
    matchesSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    if (activeSpaceId === spaceIdToDelete) {
        // Find a new space to set as active, or null if none are left (shouldn't happen due to guard clause)
        const newActiveSpace = spaces.find(s => s.id !== spaceIdToDelete);
        setActiveSpaceId(newActiveSpace?.id || null);
    }
    toast({ title: "Space Deleted", description: `Space and its matches deleted.` });
  };
  
  const addTournament = async (data: Omit<Tournament, 'id' | 'status' | 'ownerId' | 'winnerPlayerId' | 'dateCompleted'>) => {
     if (!firebaseUser) return;
     const tournamentsCollection = collection(db, 'users', firebaseUser.uid, 'tournaments');
     await addDoc(tournamentsCollection, { ...data, status: 'active', ownerId: firebaseUser.uid });
     toast({ title: "Tournament Created!", description: `The "${data.name}" tournament is now active.` });
     playSound('success');
  };
  
  const updateTournament = async (id: string, data: Partial<Omit<Tournament, 'id' | 'ownerId'>>) => {
     if (!firebaseUser) return;
     const tourDocRef = doc(db, 'users', firebaseUser.uid, 'tournaments', id);
     await updateDoc(tourDocRef, data);
     toast({ title: "Tournament Updated" });
  };

  const deleteTournament = async (id: string) => {
    if (!firebaseUser) return;
    const tourDocRef = doc(db, 'users', firebaseUser.uid, 'tournaments', id);
    await deleteDoc(tourDocRef);
    toast({ title: "Tournament Deleted" });
  };

  // Helper/Getter functions
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
      .filter(s => s.gamesPlayed > 0 || s.totalPoints !== 0)
      .sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins);
  }, [players]);

  const addMatch = useCallback(async (matchData: Omit<Match, 'id' | 'date' | 'spaceId'>) => {
    if (!firebaseUser) return;

    // Create a new object for Firestore, ensuring no `undefined` values are sent.
    const newMatchForDb: { [key: string]: any } = {
      ...matchData,
      date: new Date().toISOString(),
    };

    if (activeSpaceId) {
      newMatchForDb.spaceId = activeSpaceId;
    }
    
    // Explicitly delete the key if the value is undefined, as Firestore doesn't support it.
    if (newMatchForDb.handicapSuggestions === undefined) {
        delete newMatchForDb.handicapSuggestions;
    }

    const matchesCollection = collection(db, 'users', firebaseUser.uid, 'matches');
    await addDoc(matchesCollection, newMatchForDb);
    
    // Tournament Completion Check
    // We can use the cleaned `newMatchForDb` object for local calculations too.
    const allMatchesForUser = [...matches, {...newMatchForDb, id: 'temp' } as Match]; 
    const relevantMatchesForGame = allMatchesForUser.filter(m => m.gameId === newMatchForDb.gameId && m.spaceId === (activeSpaceId || undefined));
    const gameLeaderboard = calculateScores(relevantMatchesForGame);
    const activeTournamentsForGame = tournaments.filter(t => t.gameId === newMatchForDb.gameId && t.status === 'active');
    
    for (const tourney of activeTournamentsForGame) {
      const winner = gameLeaderboard.find(score => score.totalPoints >= tourney.targetPoints);
      if (winner) {
        const tourneyRef = doc(db, 'users', firebaseUser.uid, 'tournaments', tourney.id);
        await updateDoc(tourneyRef, {
            status: 'completed',
            winnerPlayerId: winner.playerId,
            dateCompleted: new Date().toISOString()
        });
        const winnerPlayer = getPlayerById(winner.playerId);
        toast({ title: "🏆 Tournament Finished!", description: `${winnerPlayer?.name || 'A player'} won the "${tourney.name}" tournament!` });
      }
    }
  }, [firebaseUser, activeSpaceId, matches, tournaments, toast, calculateScores, getPlayerById]);

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
        const points = match.pointsAwarded.find(p => p.playerId === playerId)?.points || 0;
        totalPoints += points;
    });

    const lastResult = playerMatches.length > 0 ? (playerMatches[playerMatches.length - 1].winnerIds.includes(playerId) ? 'W' : 'L') : null;
    const currentStreak = !lastResult ? { type: 'W', count: 0 } : (lastResult === 'W' ? { type: 'W', count: currentWinStreak } : { type: 'L', count: currentLossStreak });
    
    const gameStatsMap = new Map<string, any>(); // Using 'any' for simplicity here
    playerMatches.forEach(match => {
      const game = getGameById(match.gameId);
      if (!game) return;
      if (!gameStatsMap.has(game.id)) gameStatsMap.set(game.id, { game, wins: 0, losses: 0, gamesPlayed: 0 });
      const stats = gameStatsMap.get(game.id)!;
      stats.gamesPlayed++;
      if (match.winnerIds.includes(playerId)) stats.wins++; else stats.losses++;
    });

    const gameStatsArray = Array.from(gameStatsMap.values()).map(gs => ({...gs, winRate: gs.gamesPlayed > 0 ? gs.wins / gs.gamesPlayed : 0 }));


    return {
        player, totalGames: playerMatches.length, totalWins, totalLosses: playerMatches.length - totalWins, winRate: playerMatches.length > 0 ? totalWins / playerMatches.length : 0,
        currentStreak, longestWinStreak, longestLossStreak, totalPoints, averagePointsPerMatch: playerMatches.length > 0 ? totalPoints / playerMatches.length : 0,
        gameStats: gameStatsArray,
    };
  }, [matches, getPlayerById, getGameById]);
  
  const getSpacesForCurrentUser = useCallback(() => {
    if (!currentUser) return [];
    if (currentUser.isAdmin) return spaces;
    return spaces.filter(s => s.ownerId === currentUser.id);
  }, [currentUser, spaces]);
  
  const setActiveSpaceId = useCallback((newActiveSpaceId: string | null) => {
    setActiveSpaceIdState(newActiveSpaceId);
    if(isClient && firebaseUser) {
      localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${firebaseUser.uid}`, JSON.stringify(newActiveSpaceId));
    }
  }, [firebaseUser, isClient]);
  
  const getActiveSpace = useCallback(() => activeSpaceId ? spaces.find(s => s.id === activeSpaceId) : undefined, [activeSpaceId, spaces]);
  
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
  
  const getUserById = useCallback((userId: string) => {
    // This will only work for admin users, as only they have the `allUsers` list populated.
    return allUsers.find(u => u.id === userId);
  }, [allUsers]);

  const deleteUserAccount = async (userIdToDelete: string) => {
    if (!currentUser?.isAdmin) {
      toast({ title: "Permission Denied", description: "You do not have permission to delete users.", variant: "destructive" });
      return;
    }
    if (currentUser.id === userIdToDelete) {
        toast({ title: "Action Not Allowed", description: "You cannot delete your own account.", variant: "destructive" });
        return;
    }

    try {
        const batch = writeBatch(db);

        // Delete main user document
        const userDocRef = doc(db, 'users', userIdToDelete);
        batch.delete(userDocRef);

        // Delete all documents in user's subcollections
        const subcollections = ['players', 'games', 'matches', 'spaces', 'tournaments'];
        for (const sub of subcollections) {
            const subcollectionRef = collection(db, 'users', userIdToDelete, sub);
            const snapshot = await getDocs(subcollectionRef);
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        
        await batch.commit();

        toast({ title: "User Account Deleted", description: "The user's account and all associated data have been deleted from the database." });
        // NOTE: The user still exists in Firebase Auth. Deleting from Auth requires admin privileges on the backend (e.g., Cloud Function)
        // and cannot be done securely from the client.
    } catch (error) {
        console.error("Error deleting user account:", error);
        toast({ title: "Error", description: "Failed to delete user account. See console for details.", variant: "destructive" });
    }
  };


  return (
    <AppContext.Provider value={{ 
      games, players, matches, spaces, tournaments, allUsers, activeSpaceId, addPlayer, deletePlayer, addMatch, updatePlayer, 
      getGameById, getPlayerById, getOverallLeaderboard, getGameLeaderboard, getPlayerStats, isClient,
      currentUser, login, signup, logout, isLoadingAuth, addSpace, updateSpace, deleteSpace, 
      setActiveSpaceId, getSpacesForCurrentUser, getActiveSpace, addGame, updateGame, deleteGame,
      shareSpace, getUserById, deleteUserAccount, addTournament, updateTournament, deleteTournament,
      firebaseConfigured: isFirebaseConfigured()
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

    

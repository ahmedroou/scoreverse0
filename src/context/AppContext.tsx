
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';


import { auth, db, storage, isFirebaseConfigured, firebaseConfig } from '@/lib/firebase';
import type { Game, Player, Match, ScoreData, Space, UserAccount, PlayerStats, Tournament, PublicShareData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { playSound } from '@/lib/audio';
import { useLanguage } from '@/hooks/use-language';

interface AppContextType {
  games: Game[];
  players: Player[];
  matches: Match[];
  spaces: Space[];
  tournaments: Tournament[];
  allUsers: UserAccount[];
  activeSpaceId: string | null;
  addPlayer: (name: string, avatarFile?: File) => Promise<void>;
  deletePlayer: (playerId: string) => Promise<void>;
  deleteAllPlayers: () => Promise<void>;
  addMatch: (matchData: Omit<Match, 'id' | 'spaceId' | 'date'> & { date?: string }) => Promise<void>;
  updatePlayer: (playerId: string, playerData: { name: string; avatarFile?: File }) => Promise<void>;
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
  getUserById: (userId: string) => UserAccount | undefined;
  deleteUserAccount: (userId: string) => Promise<void>;
  addTournament: (tournamentData: Omit<Tournament, 'id' | 'status' | 'ownerId' | 'winnerPlayerId' | 'dateCompleted' | 'spaceId'>) => Promise<void>;
  updateTournament: (tournamentId: string, tournamentData: Partial<Omit<Tournament, 'id' | 'ownerId'>>) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  deleteMatch: (matchId: string) => Promise<void>;
  updateMatch: (matchId: string, matchData: Partial<Pick<Match, 'winnerIds' | 'pointsAwarded'>>) => Promise<void>;
  clearSpaceHistory: (spaceId: string) => Promise<void>;
  firebaseConfigured: boolean;
  getLiveShareUrl: () => Promise<string | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ACTIVE_SPACE_LS_KEY_PREFIX = 'scoreverse-active-space-'; 

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  
  const [activeSpaceId, setActiveSpaceIdState] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();

  const handleFirestoreError = (error: Error, dataType: string) => {
    console.error(`Firestore Error (${dataType}):`, error);
    toast({
      title: t('common.error'),
      description: `Could not fetch ${dataType} data.`,
      variant: "destructive",
      duration: 10000,
    });
    playSound('error');
  };

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const updateLiveShareData = useCallback(async () => {
    if (!currentUser || !currentUser.shareId) return;

    const publicData: PublicShareData = {
      owner: { username: currentUser.username },
      ownerId: currentUser.id,
      type: 'live',
      players,
      games,
      matches,
      spaces,
      tournaments,
    };
    
    try {
      const shareDocRef = doc(db, 'public_shares', currentUser.shareId);
      await setDoc(shareDocRef, publicData, { merge: true });
    } catch (e) {
      console.error("Failed to update public share data:", e);
    }
  }, [currentUser, players, games, matches, spaces, tournaments]);

  useEffect(() => {
    if (currentUser?.shareId) {
      updateLiveShareData();
    }
  }, [currentUser, players, games, matches, spaces, tournaments, updateLiveShareData]);


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

        const unsubPlayers = onSnapshot(collection(db, 'users', user.uid, 'players'), (snapshot) => {
          setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)));
        }, (error) => handleFirestoreError(error, "players"));

        const unsubGames = onSnapshot(collection(db, 'users', user.uid, 'games'), (snapshot) => {
          setGames(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game)));
        }, (error) => handleFirestoreError(error, "games"));

        const unsubMatches = onSnapshot(collection(db, 'users', user.uid, 'matches'), (snapshot) => {
          setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
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
          setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament)));
        }, (error) => handleFirestoreError(error, "tournaments"));

        setIsLoadingAuth(false);

        return () => {
          unsubUserDoc();
          unsubPlayers();
          unsubGames();
          unsubMatches();
          unsubSpaces();
          unsubTournaments();
        };

      } else {
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

  useEffect(() => {
    if (currentUser?.isAdmin) {
      const usersCollectionRef = collection(db, 'users');
      const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => doc.data() as UserAccount));
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
           const err = t('auth.loginIssue');
           setError(err);
           playSound('error');
           return { success: false, error: err };
      }
      
      const userData = docSnap.data() as UserAccount;
      toast({ title: t('auth.loginSuccess'), description: t('auth.welcomeUser', {username: userData.username}) });
      router.push('/dashboard');
      return { success: true };
    } catch (error: any) {
      console.error("Login failed:", error);
      let errMessage = t('auth.invalidCredentials');
      if (error.code === 'auth/invalid-credential') {
        errMessage = t('auth.invalidCredentials');
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const username = email.split('@')[0];
      const shareId = newUser.uid;

      const userDocData: UserAccount = { id: newUser.uid, username, email: newUser.email, isAdmin: false, shareId };
      await setDoc(doc(db, "users", newUser.uid), userDocData);

      const batch = writeBatch(db);
      const defaultSpaceRef = doc(collection(db, 'users', newUser.uid, 'spaces'));
      batch.set(defaultSpaceRef, { name: "Personal Space", ownerId: newUser.uid });
      
      await batch.commit();

      localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${newUser.uid}`, JSON.stringify(defaultSpaceRef.id));
      router.push('/dashboard');
      toast({ title: t('auth.signupSuccess'), description: t('auth.welcomeUser', {username}) });
      playSound('success');
      return { success: true };

    } catch (error: any) {
       console.error("Signup failed:", error);
       let err = t('auth.signupFailed');
       if (error.code === 'auth/email-already-in-use') {
         err = t('auth.emailInUse');
       }
       setError(err);
       playSound('error');
       return { success: false, error: err };
    }
  };

  const logout = async () => {
    const currentUsername = currentUser?.username;
    await signOut(auth);
    toast({ title: t('header.logout'), description: `Goodbye, ${currentUsername}!` });
    router.push('/auth');
  };
  
  const addPlayer = useCallback(async (name: string, avatarFile?: File) => {
    if (!firebaseUser) {
        toast({ title: t('auth.authError'), description: "You must be logged in.", variant: "destructive" });
        return;
    }
    try {
      let avatarUrl: string | undefined = undefined;
      if (avatarFile) {
        const filePath = `avatars/${firebaseUser.uid}/${Date.now()}-${avatarFile.name}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, avatarFile);
        avatarUrl = await getDownloadURL(snapshot.ref);
      }

      const playersCollection = collection(db, 'users', firebaseUser.uid, 'players');
      const newPlayerData: Omit<Player, 'id'> = { name, winRate: 0, averageScore: 0, ownerId: firebaseUser.uid };
      if (avatarUrl) {
        newPlayerData.avatarUrl = avatarUrl;
      }
      await addDoc(playersCollection, newPlayerData);
      toast({ title: t('players.toasts.playerAdded'), description: t('players.toasts.playerAddedDesc', {name}) });
      playSound('success');
    } catch (e) {
        console.error("Failed to add player:", e);
        toast({ title: t('common.error'), description: 'Failed to add the player. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, toast, t]);

  const deletePlayer = useCallback(async (playerId: string) => {
    if (!firebaseUser) {
        toast({ title: t('auth.authError'), description: "You must be logged in to perform this action.", variant: "destructive" });
        return;
    }
    const playerDocRef = doc(db, 'users', firebaseUser.uid, 'players', playerId);
    try {
        const playerToDelete = players.find(p => p.id === playerId);
        if (playerToDelete?.avatarUrl) {
            try {
                const avatarRef = ref(storage, playerToDelete.avatarUrl);
                await deleteObject(avatarRef);
            } catch (storageError: any) {
                if (storageError.code !== 'storage/object-not-found') {
                    console.warn("Could not delete player avatar from storage:", storageError);
                }
            }
        }
        await deleteDoc(playerDocRef);
        toast({ title: t('players.toasts.playerDeleted'), description: t('players.toasts.playerDeletedDesc')});
    } catch (e) {
        console.error("Failed to delete player:", e);
        toast({ title: t('common.error'), description: 'Failed to delete the player. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, toast, t, players]);

  const deleteAllPlayers = useCallback(async () => {
    if (!firebaseUser) {
        toast({ title: t('auth.authError'), description: "You must be logged in.", variant: "destructive" });
        return;
    }
    if (players.length === 0) {
        toast({ title: t('common.noData'), description: t('players.toasts.noPlayersToDelete') });
        return;
    }
    try {
        const batch = writeBatch(db);
        const playersCollectionRef = collection(db, 'users', firebaseUser.uid, 'players');
        const querySnapshot = await getDocs(playersCollectionRef);
        if (querySnapshot.empty) {
            toast({ title: t('common.noData'), description: t('players.toasts.noPlayersToDelete') });
            return;
        }
        querySnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        toast({ title: t('players.toasts.allPlayersDeleted'), description: t('players.toasts.allPlayersDeletedDesc') });
        playSound('success');
    } catch (e) {
        console.error("Failed to delete all players:", e);
        toast({ title: t('common.error'), description: 'Failed to delete all players. Please try again.', variant: 'destructive' });
        playSound('error');
    }
  }, [firebaseUser, players, toast, t]);


  const updatePlayer = useCallback(async (playerId: string, playerData: { name: string; avatarFile?: File }) => {
    if (!firebaseUser) {
       toast({ title: t('auth.authError'), description: "You must be logged in to perform this action.", variant: "destructive" });
       return;
    }
    try {
      const playerDocRef = doc(db, 'users', firebaseUser.uid, 'players', playerId);
      const updateData: Partial<Omit<Player, 'id' | 'ownerId'>> = { name: playerData.name };
      if (playerData.avatarFile) {
        const filePath = `avatars/${firebaseUser.uid}/${playerId}/${Date.now()}-${playerData.avatarFile.name}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, playerData.avatarFile);
        updateData.avatarUrl = await getDownloadURL(snapshot.ref);
      }
      await updateDoc(playerDocRef, updateData);
      toast({ title: t('players.toasts.playerUpdated') });
    } catch (e) {
       console.error("Failed to update player:", e);
       toast({ title: t('common.error'), description: 'Failed to update the player. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, toast, t]);


  const addGame = useCallback(async (gameData: Omit<Game, 'id' | 'icon' | 'ownerId'>) => {
    if (!firebaseUser) return;
    try {
        const gamesCollection = collection(db, 'users', firebaseUser.uid, 'games');
        const newGameData: Partial<Omit<Game, 'id'>> = { ...gameData, icon: 'HelpCircle', ownerId: firebaseUser.uid };
        if (!newGameData.description) delete newGameData.description;
        if (!newGameData.maxPlayers) delete newGameData.maxPlayers;
        await addDoc(gamesCollection, newGameData);
        toast({ title: t('games.toasts.gameAdded'), description: t('games.toasts.gameAddedDesc', {name: gameData.name}) });
        playSound('success');
    } catch (e) {
        console.error("Failed to add game:", e);
        toast({ title: t('common.error'), description: 'Failed to add the game. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, toast, t]);
  
  const updateGame = useCallback(async (gameId: string, gameData: Partial<Omit<Game, 'id' | 'icon' | 'ownerId'>>) => {
    if (!firebaseUser) return;
    try {
        const gameDocRef = doc(db, 'users', firebaseUser.uid, 'games', gameId);
        await updateDoc(gameDocRef, gameData);
        toast({ title: t('games.toasts.gameUpdated') });
    } catch (e) {
        console.error("Failed to update game:", e);
        toast({ title: t('common.error'), description: 'Failed to update the game. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, toast, t]);

  const deleteGame = useCallback(async (gameId: string) => {
    if (!firebaseUser) return;
    try {
        const q = query(collection(db, 'users', firebaseUser.uid, 'matches'), where("gameId", "==", gameId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            toast({ title: t('games.toasts.cannotDelete'), description: t('games.toasts.gameInUse'), variant: "destructive" });
            playSound('error');
            return;
        }
        const gameDocRef = doc(db, 'users', firebaseUser.uid, 'games', gameId);
        await deleteDoc(gameDocRef);
        toast({ title: t('games.toasts.gameDeleted') });
    } catch(e) {
        console.error("Failed to delete game:", e);
        toast({ title: t('common.error'), description: 'Failed to delete the game. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, toast, t]);


  const addSpace = useCallback(async (name: string) => {
    if (!firebaseUser) return;
    try {
        const spacesCollection = collection(db, 'users', firebaseUser.uid, 'spaces');
        const newSpaceRef = await addDoc(spacesCollection, { name, ownerId: firebaseUser.uid });
        if (!activeSpaceId) {
            setActiveSpaceIdState(newSpaceRef.id);
        }
        toast({ title: t('spaces.toasts.spaceCreated'), description: t('spaces.toasts.spaceCreatedDesc', {name}) });
        playSound('success');
    } catch(e) {
        console.error("Failed to add space:", e);
        toast({ title: t('common.error'), description: 'Failed to add the space. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, activeSpaceId, toast, t]);
  
  const updateSpace = useCallback(async (spaceId: string, newName: string) => {
    if (!firebaseUser) return;
    try {
        const spaceDocRef = doc(db, 'users', firebaseUser.uid, 'spaces', spaceId);
        await updateDoc(spaceDocRef, { name: newName });
        toast({ title: t('spaces.toasts.spaceUpdated') });
    } catch(e) {
        console.error("Failed to update space:", e);
        toast({ title: t('common.error'), description: 'Failed to update the space. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, toast, t]);


  const getSpacesForCurrentUser = useCallback(() => {
    if (!currentUser) return [];
    if (currentUser.isAdmin) return spaces;
    return spaces.filter(s => s.ownerId === currentUser.id);
  }, [currentUser, spaces]);

  const deleteSpace = useCallback(async (spaceIdToDelete: string) => {
    if (!firebaseUser || !currentUser) return;
     const userSpaces = getSpacesForCurrentUser();
    if (userSpaces.length <= 1 && !currentUser.isAdmin) {
        toast({ title: t('spaces.toasts.cannotDelete'), description: t('spaces.toasts.mustHaveOne'), variant: "destructive"});
        playSound('error');
        return;
    }
    try {
        const batch = writeBatch(db);
        const spaceDocRef = doc(db, 'users', firebaseUser.uid, 'spaces', spaceIdToDelete);
        batch.delete(spaceDocRef);

        const matchesQuery = query(collection(db, 'users', firebaseUser.uid, 'matches'), where("spaceId", "==", spaceIdToDelete));
        const matchesSnapshot = await getDocs(matchesQuery);
        matchesSnapshot.forEach(doc => batch.delete(doc.ref));

        const tournamentsQuery = query(collection(db, 'users', firebaseUser.uid, 'tournaments'), where("spaceId", "==", spaceIdToDelete));
        const tournamentsSnapshot = await getDocs(tournamentsQuery);
        tournamentsSnapshot.forEach(doc => batch.delete(doc.ref));

        await batch.commit();

        if (activeSpaceId === spaceIdToDelete) {
            const newActiveSpace = spaces.find(s => s.id !== spaceIdToDelete) ?? (getSpacesForCurrentUser().find(s => s.id !== spaceIdToDelete));
            setActiveSpaceIdState(newActiveSpace?.id || null);
        }
        toast({ title: t('spaces.toasts.spaceDeleted'), description: t('spaces.toasts.spaceDeletedDesc') });
    } catch (e) {
         console.error("Failed to delete space:", e);
         toast({ title: t('common.error'), description: 'Failed to delete the space. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, currentUser, spaces, activeSpaceId, toast, t, getSpacesForCurrentUser]);
  
  const addTournament = useCallback(async (data: Omit<Tournament, 'id' | 'status' | 'ownerId' | 'winnerPlayerId' | 'dateCompleted' | 'spaceId'>) => {
     if (!firebaseUser) return;
     try {
        const tournamentsCollection = collection(db, 'users', firebaseUser.uid, 'tournaments');
        const newTournamentData: { [key: string]: any } = { 
            ...data, 
            status: 'active', 
            ownerId: firebaseUser.uid,
            spaceId: activeSpaceId,
        };
        await addDoc(tournamentsCollection, newTournamentData);
        toast({ title: t('tournaments.toasts.tournamentCreated'), description: t('tournaments.toasts.tournamentCreatedDesc', {name: data.name}) });
        playSound('success');
     } catch(e) {
        console.error("Failed to add tournament:", e);
        toast({ title: t('common.error'), description: 'Failed to create tournament. Please try again.', variant: 'destructive' });
     }
  }, [firebaseUser, activeSpaceId, toast, t]);
  
  const updateTournament = useCallback(async (id: string, data: Partial<Omit<Tournament, 'id' | 'ownerId'>>) => {
     if (!firebaseUser) return;
     try {
        const tourDocRef = doc(db, 'users', firebaseUser.uid, 'tournaments', id);
        await updateDoc(tourDocRef, data);
        toast({ title: t('tournaments.toasts.tournamentUpdated') });
     } catch(e) {
        console.error("Failed to update tournament:", e);
        toast({ title: t('common.error'), description: 'Failed to update tournament. Please try again.', variant: 'destructive' });
     }
  }, [firebaseUser, toast, t]);

  const deleteTournament = useCallback(async (id: string) => {
    if (!firebaseUser) return;
    try {
        const tourDocRef = doc(db, 'users', firebaseUser.uid, 'tournaments', id);
        await deleteDoc(tourDocRef);
        toast({ title: t('tournaments.toasts.tournamentDeleted') });
    } catch(e) {
        console.error("Failed to delete tournament:", e);
        toast({ title: t('common.error'), description: 'Failed to delete tournament. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, toast, t]);

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

  const addMatch = useCallback(async (matchData: Omit<Match, 'id' | 'spaceId' | 'date'> & { date?: string }) => {
    if (!firebaseUser) return;
    try {
      const newMatchForDb: { [key: string]: any } = { 
          ...matchData,
          date: matchData.date || new Date().toISOString(),
          spaceId: activeSpaceId, 
      };
      if (!newMatchForDb.handicapSuggestions) delete newMatchForDb.handicapSuggestions;

      const matchesCollection = collection(db, 'users', firebaseUser.uid, 'matches');
      await addDoc(matchesCollection, newMatchForDb);
      
      const allMatchesForUser = [...matches, {...newMatchForDb, id: 'temp' } as Match]; 
      const relevantMatchesForGame = allMatchesForUser.filter(m => m.gameId === newMatchForDb.gameId && (m.spaceId || null) === (activeSpaceId || null));
      const gameLeaderboard = calculateScores(relevantMatchesForGame);
      const activeTournamentsForGame = tournaments.filter(t => t.gameId === newMatchForDb.gameId && t.status === 'active' && (t.spaceId || null) === (activeSpaceId || null));
      
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
          toast({ title: t('tournaments.toasts.tournamentFinished'), description: t('tournaments.toasts.tournamentWinner', {winnerName: winnerPlayer?.name || '', tournamentName: tourney.name}) });
        }
      }

    } catch (e) {
      console.error("Failed to add match:", e);
      toast({ title: t('common.error'), description: 'Failed to record the match. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, activeSpaceId, matches, tournaments, toast, calculateScores, getPlayerById, t]);

  const getOverallLeaderboard = useCallback(() => {
    const filtered = matches.filter(m => (m.spaceId || null) === (activeSpaceId || null));
    return calculateScores(filtered);
  }, [matches, activeSpaceId, calculateScores]);

  const getGameLeaderboard = useCallback((gameId: string) => {
    const gameMatches = matches.filter(m => m.gameId === gameId && (m.spaceId || null) === (activeSpaceId || null));
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
    
    const gameStatsMap = new Map<string, any>();
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
  
  const setActiveSpaceId = useCallback((newActiveSpaceId: string | null) => {
    setActiveSpaceIdState(newActiveSpaceId);
    if(isClient && firebaseUser) {
      localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${firebaseUser.uid}`, JSON.stringify(newActiveSpaceId));
    }
  }, [firebaseUser, isClient]);
  
  const getActiveSpace = useCallback(() => activeSpaceId ? spaces.find(s => s.id === activeSpaceId) : undefined, [activeSpaceId, spaces]);
  
  const getUserById = useCallback((userId: string) => {
    return allUsers.find(u => u.id === userId);
  }, [allUsers]);

  const deleteUserAccount = useCallback(async (userIdToDelete: string) => {
    if (!currentUser?.isAdmin) {
      toast({ title: t('users.toasts.permissionDenied'), description: t('users.toasts.permissionDeniedDesc'), variant: "destructive" });
      return;
    }
    if (currentUser.id === userIdToDelete) {
        toast({ title: t('users.toasts.cannotDeleteSelf'), description: t('users.toasts.cannotDeleteSelfDesc'), variant: "destructive" });
        return;
    }
    try {
        const userDocRef = doc(db, 'users', userIdToDelete);
        const batch = writeBatch(db);
        batch.delete(userDocRef);
        
        const subcollections = ['players', 'games', 'matches', 'spaces', 'tournaments'];
        for (const sub of subcollections) {
            const subcollectionRef = collection(db, 'users', userIdToDelete, sub);
            const snapshot = await getDocs(subcollectionRef);
            snapshot.forEach(doc => batch.delete(doc.ref));
        }

        const shareDocRef = doc(db, 'public_shares', userIdToDelete);
        batch.delete(shareDocRef);

        await batch.commit();
        toast({ title: t('users.toasts.userDeleted'), description: t('users.toasts.userDeletedDesc') });
    } catch (error) {
        console.error("Error deleting user account:", error);
        toast({ title: t('common.error'), description: t('users.toasts.deleteError'), variant: "destructive" });
    }
  }, [currentUser, toast, t]);
  
  const deleteMatch = useCallback(async (matchId: string) => {
    if (!firebaseUser) return;
    try {
        const matchDocRef = doc(db, 'users', firebaseUser.uid, 'matches', matchId);
        await deleteDoc(matchDocRef);
        toast({ title: t('common.success'), description: t('matchHistory.toasts.deleted') });
    } catch (e) {
        console.error("Failed to delete match:", e);
        toast({ title: t('common.error'), description: 'Failed to delete the match. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, toast, t]);

  const updateMatch = useCallback(async (matchId: string, matchData: Partial<Pick<Match, 'winnerIds' | 'pointsAwarded'>>) => {
      if (!firebaseUser) return;
      try {
        const matchDocRef = doc(db, 'users', firebaseUser.uid, 'matches', matchId);
        await updateDoc(matchDocRef, matchData);
        toast({ title: t('common.success'), description: t('matchHistory.toasts.updated') });
      } catch (e) {
        console.error("Failed to update match:", e);
        toast({ title: t('common.error'), description: 'Failed to update the match. Please try again.', variant: 'destructive' });
      }
  }, [firebaseUser, toast, t]);
  
  const clearSpaceHistory = useCallback(async (spaceId: string) => {
    if (!firebaseUser) return;
    try {
        const batch = writeBatch(db);
        const matchesQuery = query(collection(db, 'users', firebaseUser.uid, 'matches'), where("spaceId", "==", spaceId));
        const matchesSnapshot = await getDocs(matchesQuery);
        const tournamentsQuery = query(collection(db, 'users', firebaseUser.uid, 'tournaments'), where("spaceId", "==", spaceId));
        const tournamentsSnapshot = await getDocs(tournamentsQuery);

        if (matchesSnapshot.empty && tournamentsSnapshot.empty) {
            toast({ title: t('common.noData'), description: t('spaces.toasts.noMatchesToClear') });
            return;
        }

        matchesSnapshot.forEach(doc => batch.delete(doc.ref));
        tournamentsSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        toast({ title: t('common.success'), description: t('spaces.toasts.historyCleared') });
    } catch (e) {
        console.error("Failed to clear space history:", e);
        toast({ title: t('common.error'), description: 'Failed to clear space history. Please try again.', variant: 'destructive' });
    }
  }, [firebaseUser, toast, t]);
  
  const getLiveShareUrl = useCallback(async (): Promise<string | null> => {
    if (!currentUser?.shareId) {
      toast({ title: t('common.error'), description: "Share ID not found for user.", variant: "destructive" });
      return null;
    }
    await updateLiveShareData(); // Make sure data is fresh before sharing
    if (typeof window !== 'undefined') {
      const baseUrl = `${window.location.origin}/share/${currentUser.shareId}`;
      // If there's an active space, append it as a query parameter
      if (activeSpaceId) {
        return `${baseUrl}?space=${activeSpaceId}`;
      }
      return baseUrl;
    }
    return null;
  }, [currentUser, updateLiveShareData, toast, activeSpaceId]);

  return (
    <AppContext.Provider value={{ 
      games, players, matches, spaces, tournaments, allUsers, activeSpaceId, addPlayer, deletePlayer, deleteAllPlayers, addMatch, updatePlayer, 
      getGameById, getPlayerById, getOverallLeaderboard, getGameLeaderboard, getPlayerStats, isClient,
      currentUser, login, signup, logout, isLoadingAuth, addSpace, updateSpace, deleteSpace, 
      setActiveSpaceId, getSpacesForCurrentUser, getActiveSpace, addGame, updateGame, deleteGame,
      getUserById, deleteUserAccount, addTournament, updateTournament, deleteTournament,
      deleteMatch, updateMatch, clearSpaceHistory, getLiveShareUrl,
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

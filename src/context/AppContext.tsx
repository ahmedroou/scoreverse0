
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
  Unsubscribe,
  deleteField,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';


import { auth, db, storage, isFirebaseConfigured, firebaseConfig } from '@/lib/firebase';
import type { Game, Player, Match, ScoreData, Space, UserAccount, PlayerStats, Tournament, PublicShareData, SpaceRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { playSound } from '@/lib/audio';
import { useLanguage } from '@/hooks/use-language';
import { useMemo } from 'react';

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
  joinSpaceWithCode: (code: string) => Promise<boolean>;
  generateInviteCode: (spaceId: string) => Promise<void>;
  updateMemberRole: (spaceId: string, memberId: string, role: SpaceRole) => Promise<void>;
  removeMemberFromSpace: (spaceId: string, memberId: string) => Promise<void>;
  leaveSpace: (spaceId: string, ownerId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ACTIVE_SPACE_LS_KEY_PREFIX = 'scoreverse-active-space-'; 

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ownedData, setOwnedData] = useState({
      games: [] as Game[],
      players: [] as Player[],
      matches: [] as Match[],
      spaces: [] as Space[],
      tournaments: [] as Tournament[],
  });
  const [joinedData, setJoinedData] = useState<Record<string, typeof ownedData>>({});
  
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  
  const [activeSpaceId, setActiveSpaceIdState] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

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

  const spaces = useMemo(() => {
    const allSpaces = [...ownedData.spaces];
    const joinedSpaceIds = new Set(allSpaces.map(s => s.id));
    Object.values(joinedData).forEach(data => {
        if (data && data.spaces) {
            data.spaces.forEach(space => {
                if(!joinedSpaceIds.has(space.id)) {
                    allSpaces.push(space);
                    joinedSpaceIds.add(space.id);
                }
            });
        }
    });
    return allSpaces;
  }, [ownedData.spaces, joinedData]);

  const { games, players, matches, tournaments } = useMemo(() => {
      const activeSpace = spaces.find(s => s.id === activeSpaceId);
      if (activeSpace && activeSpace.ownerId !== currentUser?.id) {
          const ownerData = joinedData[activeSpace.ownerId];
          return {
              games: ownerData?.games || [],
              players: ownerData?.players || [],
              matches: (ownerData?.matches || []).filter(m => m.spaceId === activeSpaceId),
              tournaments: (ownerData?.tournaments || []).filter(t => t.spaceId === activeSpaceId),
          };
      }
      // If global context or owned space, use owned data
      const filteredMatches = ownedData.matches.filter(m => (m.spaceId || null) === (activeSpaceId || null));
      const filteredTournaments = ownedData.tournaments.filter(t => (t.spaceId || null) === (activeSpaceId || null));
      return { ...ownedData, matches: filteredMatches, tournaments: filteredTournaments };
  }, [activeSpaceId, spaces, ownedData, joinedData, currentUser]);
  
  useEffect(() => {
    if (!isFirebaseConfigured()) {
        setIsLoadingAuth(false);
        return;
    }

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        setIsLoadingAuth(true);
        if (user) {
            setFirebaseUser(user);
            const userDocRef = doc(db, 'users', user.uid);
            return onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data() as UserAccount;
                    setCurrentUser(userData);
                    const savedActiveSpaceId = localStorage.getItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${user.uid}`);
                    setActiveSpaceIdState(savedActiveSpaceId ? JSON.parse(savedActiveSpaceId) : null);
                } else {
                    signOut(auth);
                }
                setIsLoadingAuth(false);
            }, (error) => {
                handleFirestoreError(error, "user profile");
                setIsLoadingAuth(false);
            });
        } else {
            setCurrentUser(null);
            setFirebaseUser(null);
            setOwnedData({ games: [], players: [], matches: [], spaces: [], tournaments: [] });
            setJoinedData({});
            setIsLoadingAuth(false);
        }
    });

    return () => authUnsubscribe();
  }, []);

  // Admin: fetch all users
  useEffect(() => {
    if (!currentUser?.isAdmin) {
        setAllUsers([]);
        return;
    }
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => doc.data() as UserAccount));
    }, (error) => handleFirestoreError(error, "all user list (admin)"));

    return () => unsub();
  }, [currentUser?.isAdmin]);

  // Listener for owned data
  useEffect(() => {
    if (!currentUser) return;

    const collectionsToWatch = ['players', 'games', 'matches', 'tournaments', 'spaces'];
    const unsubscribers = collectionsToWatch.map(coll => {
        const q = query(collection(db, 'users', currentUser.id, coll));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOwnedData(prev => ({...prev, [coll]: data}));
        }, (error) => handleFirestoreError(error, `owned ${coll}`));
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [currentUser]);

  // Listener for joined spaces data
  useEffect(() => {
      if (!currentUser?.joinedSpaces) {
        setJoinedData({});
        return;
      }
      
      const ownerIdSet = new Set(Object.keys(currentUser.joinedSpaces));
      const unsubscribers: Unsubscribe[] = [];

      ownerIdSet.forEach(ownerId => {
          const collectionsToWatch = ['players', 'games', 'matches', 'tournaments', 'spaces'];
          collectionsToWatch.forEach(coll => {
              const q = query(collection(db, 'users', ownerId, coll));
              const unsub = onSnapshot(q, (snapshot) => {
                  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  setJoinedData(prev => ({
                      ...prev,
                      [ownerId]: {
                          ...(prev[ownerId] || { games: [], players: [], matches: [], spaces: [], tournaments: [] }),
                          [coll]: data
                      }
                  }))
              }, (error) => { /* Errors expected if rules deny access, can be ignored */ });
              unsubscribers.push(unsub);
          });
      });
      
      // Cleanup: remove data for owners that are no longer relevant
      setJoinedData(currentJoinedData => {
        const newJoinedData = { ...currentJoinedData };
        Object.keys(newJoinedData).forEach(ownerId => {
            if (!ownerIdSet.has(ownerId)) {
                delete newJoinedData[ownerId];
            }
        });
        return newJoinedData;
      });

      return () => unsubscribers.forEach(unsub => unsub());

  }, [currentUser?.joinedSpaces]);


  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured() || !password) return { success: false, error: "Firebase is not configured." };
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
           await signOut(auth);
           return { success: false, error: t('auth.loginIssue') };
      }
      toast({ title: t('auth.loginSuccess'), description: t('auth.welcomeUser', {username: docSnap.data().username}) });
      router.push('/dashboard');
      return { success: true };
    } catch (error: any) {
      const errMessage = t('auth.invalidCredentials');
      playSound('error');
      return { success: false, error: errMessage };
    }
  };

  const signup = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
     if (!isFirebaseConfigured() || !password) return { success: false, error: "Firebase is not configured." };
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      const username = email.split('@')[0];
      const userDocData: UserAccount = { id: newUser.uid, username, email: newUser.email!, isAdmin: false, shareId: newUser.uid, joinedSpaces: {} };
      await setDoc(doc(db, "users", newUser.uid), userDocData);

      const spaceRef = doc(collection(db, 'users', newUser.uid, 'spaces'));
      await setDoc(spaceRef, { name: "Personal Space", ownerId: newUser.uid, members: {[newUser.uid]: 'owner'} });
      
      router.push('/dashboard');
      toast({ title: t('auth.signupSuccess'), description: t('auth.welcomeUser', {username}) });
      playSound('success');
      return { success: true };
    } catch (error: any) {
       let err = t('auth.signupFailed');
       if (error.code === 'auth/email-already-in-use') err = t('auth.emailInUse');
       playSound('error');
       return { success: false, error: err };
    }
  };

  const logout = async () => {
    const currentUsername = currentUser?.username;
    await signOut(auth);
    router.push('/auth');
    toast({ title: t('header.logout'), description: `Goodbye, ${currentUsername}!` });
  };
  
  const addPlayer = useCallback(async (name: string, avatarFile?: File) => {
    if (!currentUser) return;
    try {
      let avatarUrl: string | undefined = undefined;
      if (avatarFile) {
        const filePath = `avatars/${currentUser.id}/${Date.now()}-${avatarFile.name}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, avatarFile);
        avatarUrl = await getDownloadURL(snapshot.ref);
      }
      const newPlayerData: Omit<Player, 'id'> = { name, winRate: 0, averageScore: 0, ownerId: currentUser.id };
      if (avatarUrl) newPlayerData.avatarUrl = avatarUrl;
      await addDoc(collection(db, 'users', currentUser.id, 'players'), newPlayerData);
      toast({ title: t('players.toasts.playerAdded'), description: t('players.toasts.playerAddedDesc', {name}) });
      playSound('success');
    } catch (e) {
        toast({ title: t('common.error'), description: 'Failed to add the player.', variant: 'destructive' });
    }
  }, [currentUser, toast, t]);

  const deletePlayer = useCallback(async (playerId: string) => {
    if (!currentUser) return;
    try {
        const playerToDelete = ownedData.players.find(p => p.id === playerId);
        if (playerToDelete?.avatarUrl) {
            try {
                await deleteObject(ref(storage, playerToDelete.avatarUrl));
            } catch (storageError: any) {
                if (storageError.code !== 'storage/object-not-found') console.warn("Could not delete avatar:", storageError);
            }
        }
        await deleteDoc(doc(db, 'users', currentUser.id, 'players', playerId));
        toast({ title: t('players.toasts.playerDeleted')});
    } catch (e) {
        toast({ title: t('common.error'), description: 'Failed to delete the player.', variant: 'destructive' });
    }
  }, [currentUser, toast, t, ownedData.players]);

  const deleteAllPlayers = useCallback(async () => {
    if (!currentUser || ownedData.players.length === 0) return;
    try {
        const batch = writeBatch(db);
        const q = await getDocs(collection(db, 'users', currentUser.id, 'players'));
        q.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        toast({ title: t('players.toasts.allPlayersDeleted') });
        playSound('success');
    } catch (e) {
        toast({ title: t('common.error'), description: 'Failed to delete all players.', variant: 'destructive' });
        playSound('error');
    }
  }, [currentUser, ownedData.players, toast, t]);

  const updatePlayer = useCallback(async (playerId: string, playerData: { name: string; avatarFile?: File }) => {
    if (!currentUser) return;
    try {
      const updateData: Partial<Player> = { name: playerData.name };
      if (playerData.avatarFile) {
        const snapshot = await uploadBytes(ref(storage, `avatars/${currentUser.id}/${playerId}/${Date.now()}`), playerData.avatarFile);
        updateData.avatarUrl = await getDownloadURL(snapshot.ref);
      }
      await updateDoc(doc(db, 'users', currentUser.id, 'players', playerId), updateData);
      toast({ title: t('players.toasts.playerUpdated') });
    } catch (e) {
       toast({ title: t('common.error'), description: 'Failed to update player.', variant: 'destructive' });
    }
  }, [currentUser, toast, t]);

  const addGame = useCallback(async (gameData: Omit<Game, 'id' | 'icon' | 'ownerId'>) => {
    if (!currentUser) return;
    try {
        const newGameData = { ...gameData, icon: 'HelpCircle', ownerId: currentUser.id };
        if (!newGameData.description) delete newGameData.description;
        if (!newGameData.maxPlayers) delete newGameData.maxPlayers;
        await addDoc(collection(db, 'users', currentUser.id, 'games'), newGameData);
        toast({ title: t('games.toasts.gameAdded'), description: t('games.toasts.gameAddedDesc', {name: gameData.name}) });
        playSound('success');
    } catch (e) {
        toast({ title: t('common.error'), description: 'Failed to add game.', variant: 'destructive' });
    }
  }, [currentUser, toast, t]);
  
  const updateGame = useCallback(async (gameId: string, gameData: Partial<Omit<Game, 'id' | 'icon' | 'ownerId'>>) => {
    if (!currentUser) return;
    try {
        await updateDoc(doc(db, 'users', currentUser.id, 'games', gameId), gameData);
        toast({ title: t('games.toasts.gameUpdated') });
    } catch (e) {
        toast({ title: t('common.error'), description: 'Failed to update game.', variant: 'destructive' });
    }
  }, [currentUser, toast, t]);

  const deleteGame = useCallback(async (gameId: string) => {
    if (!currentUser) return;
    try {
        const q = query(collection(db, 'users', currentUser.id, 'matches'), where("gameId", "==", gameId));
        if (!(await getDocs(q)).empty) {
            toast({ title: t('games.toasts.cannotDelete'), description: t('games.toasts.gameInUse'), variant: "destructive" });
            playSound('error');
            return;
        }
        await deleteDoc(doc(db, 'users', currentUser.id, 'games', gameId));
        toast({ title: t('games.toasts.gameDeleted') });
    } catch(e) {
        toast({ title: t('common.error'), description: 'Failed to delete game.', variant: 'destructive' });
    }
  }, [currentUser, toast, t]);
  
  const generateInviteCode = useCallback(async (spaceId: string) => {
      if (!currentUser) return;
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const batch = writeBatch(db);
      
      const spaceRef = doc(db, 'users', currentUser.id, 'spaces', spaceId);
      batch.update(spaceRef, { inviteCode: code });
      
      const inviteRef = doc(db, 'spaceInvites', code);
      batch.set(inviteRef, { ownerId: currentUser.id, spaceId: spaceId });
      
      await batch.commit();
      toast({ title: t('spaces.toasts.codeGenerated') });
  }, [currentUser, toast, t]);
  
  const addSpace = useCallback(async (name: string) => {
    if (!currentUser) return;
    try {
        const newSpaceRef = doc(collection(db, 'users', currentUser.id, 'spaces'));
        await setDoc(newSpaceRef, { 
            name, 
            ownerId: currentUser.id,
            members: { [currentUser.id]: 'owner' }
        });
        await generateInviteCode(newSpaceRef.id);
        if (!activeSpaceId) setActiveSpaceIdState(newSpaceRef.id);
        toast({ title: t('spaces.toasts.spaceCreated'), description: t('spaces.toasts.spaceCreatedDesc', {name}) });
        playSound('success');
    } catch(e) {
        toast({ title: t('common.error'), description: 'Failed to add space.', variant: 'destructive' });
    }
  }, [currentUser, activeSpaceId, toast, t, generateInviteCode]);
  
  const updateSpace = useCallback(async (spaceId: string, newName: string) => {
    if (!currentUser) return;
    try {
        await updateDoc(doc(db, 'users', currentUser.id, 'spaces', spaceId), { name: newName });
        toast({ title: t('spaces.toasts.spaceUpdated') });
    } catch(e) {
        toast({ title: t('common.error'), description: 'Failed to update space.', variant: 'destructive' });
    }
  }, [currentUser, toast, t]);

  const deleteSpace = useCallback(async (spaceIdToDelete: string) => {
    if (!currentUser) return;
    try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'users', currentUser.id, 'spaces', spaceIdToDelete));
        
        const matchesSnapshot = await getDocs(query(collection(db, 'users', currentUser.id, 'matches'), where("spaceId", "==", spaceIdToDelete)));
        matchesSnapshot.forEach(d => batch.delete(d.ref));

        const tournamentsSnapshot = await getDocs(query(collection(db, 'users', currentUser.id, 'tournaments'), where("spaceId", "==", spaceIdToDelete)));
        tournamentsSnapshot.forEach(d => batch.delete(d.ref));
        
        await batch.commit();

        if (activeSpaceId === spaceIdToDelete) {
            setActiveSpaceIdState(null);
        }
        toast({ title: t('spaces.toasts.spaceDeleted') });
    } catch (e) {
         toast({ title: t('common.error'), description: 'Failed to delete space.', variant: 'destructive' });
    }
  }, [currentUser, activeSpaceId, toast, t]);
  
  const addTournament = useCallback(async (data: Omit<Tournament, 'id' | 'status' | 'ownerId' | 'winnerPlayerId' | 'dateCompleted' | 'spaceId'>) => {
     if (!currentUser) return;
     const spaceOwnerId = spaces.find(s => s.id === activeSpaceId)?.ownerId || currentUser.id;
     try {
        await addDoc(collection(db, 'users', spaceOwnerId, 'tournaments'), { ...data, status: 'active', ownerId: currentUser.id, spaceId: activeSpaceId });
        toast({ title: t('tournaments.toasts.tournamentCreated'), description: t('tournaments.toasts.tournamentCreatedDesc', {name: data.name}) });
        playSound('success');
     } catch(e) {
        toast({ title: t('common.error'), description: 'Failed to create tournament.', variant: 'destructive' });
     }
  }, [currentUser, activeSpaceId, spaces, toast, t]);
  
  const updateTournament = useCallback(async (id: string, data: Partial<Omit<Tournament, 'id' | 'ownerId'>>) => {
     if (!currentUser) return;
     const spaceOwnerId = spaces.find(s => s.id === activeSpaceId)?.ownerId || currentUser.id;
     try {
        await updateDoc(doc(db, 'users', spaceOwnerId, 'tournaments', id), data);
        toast({ title: t('tournaments.toasts.tournamentUpdated') });
     } catch(e) {
        toast({ title: t('common.error'), description: 'Failed to update tournament.', variant: 'destructive' });
     }
  }, [currentUser, activeSpaceId, spaces, toast, t]);

  const deleteTournament = useCallback(async (id: string) => {
    if (!currentUser) return;
    const spaceOwnerId = spaces.find(s => s.id === activeSpaceId)?.ownerId || currentUser.id;
    try {
        await deleteDoc(doc(db, 'users', spaceOwnerId, 'tournaments', id));
        toast({ title: t('tournaments.toasts.tournamentDeleted') });
    } catch(e) {
        toast({ title: t('common.error'), description: 'Failed to delete tournament.', variant: 'destructive' });
    }
  }, [currentUser, activeSpaceId, spaces, toast, t]);

  const getGameById = useCallback((gameId: string) => games.find(g => g.id === gameId), [games]);
  const getPlayerById = useCallback((playerId: string) => players.find(p => p.id === playerId), [players]);

  const calculateScores = useCallback((matchesForCalc: Match[]): ScoreData[] => {
    const playerScores: Record<string, ScoreData> = {};
    const relevantPlayerIds = new Set(matchesForCalc.flatMap(m => m.playerIds));
    const relevantPlayers = players.filter(p => relevantPlayerIds.has(p.id));
    relevantPlayers.forEach(player => { playerScores[player.id] = { playerId: player.id, playerName: player.name, avatarUrl: player.avatarUrl, totalPoints: 0, gamesPlayed: 0, wins: 0 }; });
    matchesForCalc.forEach(match => {
      match.playerIds.forEach(playerId => { if (playerScores[playerId]) playerScores[playerId].gamesPlayed += 1; });
      match.pointsAwarded.forEach(pa => { if (playerScores[pa.playerId]) playerScores[pa.playerId].totalPoints += pa.points; });
      match.winnerIds.forEach(winnerId => { if (playerScores[winnerId]) playerScores[winnerId].wins += 1; });
    });
    return Object.values(playerScores).filter(s => s.gamesPlayed > 0 || s.totalPoints !== 0).sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins);
  }, [players]);

  const addMatch = useCallback(async (matchData: Omit<Match, 'id' | 'spaceId' | 'date'> & { date?: string }) => {
    if (!currentUser) return;
    const spaceOwnerId = spaces.find(s => s.id === activeSpaceId)?.ownerId || currentUser.id;
    try {
      const newMatchForDb = { ...matchData, date: matchData.date || new Date().toISOString(), spaceId: activeSpaceId };
      if (!newMatchForDb.handicapSuggestions) delete newMatchForDb.handicapSuggestions;

      await addDoc(collection(db, 'users', spaceOwnerId, 'matches'), newMatchForDb);
      
      const allMatchesForUser = [...matches, {...newMatchForDb, id: 'temp' } as Match]; 
      const gameLeaderboard = calculateScores(allMatchesForUser.filter(m => m.gameId === newMatchForDb.gameId));
      
      for (const tourney of tournaments.filter(t=>t.status === 'active' && t.gameId === newMatchForDb.gameId)) {
        const winner = gameLeaderboard.find(score => score.totalPoints >= tourney.targetPoints);
        if (winner) {
          await updateDoc(doc(db, 'users', spaceOwnerId, 'tournaments', tourney.id), { status: 'completed', winnerPlayerId: winner.playerId, dateCompleted: new Date().toISOString() });
          toast({ title: t('tournaments.toasts.tournamentFinished'), description: t('tournaments.toasts.tournamentWinner', {winnerName: getPlayerById(winner.playerId)?.name || '', tournamentName: tourney.name}) });
        }
      }

    } catch (e) {
      toast({ title: t('common.error'), description: 'Failed to record the match.', variant: 'destructive' });
    }
  }, [currentUser, activeSpaceId, matches, tournaments, toast, calculateScores, getPlayerById, t, spaces]);

  const getOverallLeaderboard = useCallback(() => calculateScores(matches), [matches, calculateScores]);
  const getGameLeaderboard = useCallback((gameId: string) => calculateScores(matches.filter(m => m.gameId === gameId)), [matches, calculateScores]);
  
  const getPlayerStats = useCallback((playerId: string): PlayerStats | null => {
    const player = getPlayerById(playerId);
    if (!player) return null;
    const playerMatches = matches.filter(m => m.playerIds.includes(playerId)).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (playerMatches.length === 0) return { player, totalGames: 0, totalWins: 0, totalLosses: 0, winRate: 0, currentStreak: { type: 'W', count: 0 }, longestWinStreak: 0, longestLossStreak: 0, totalPoints: 0, averagePointsPerMatch: 0, gameStats: [] };

    let totalWins = 0, totalPoints = 0, currentWinStreak = 0, currentLossStreak = 0, longestWinStreak = 0, longestLossStreak = 0;
    playerMatches.forEach(match => {
        if (match.winnerIds.includes(playerId)) {
            totalWins++; currentWinStreak++; currentLossStreak = 0;
            if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
        } else {
            currentLossStreak++; currentWinStreak = 0;
            if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak;
        }
        totalPoints += match.pointsAwarded.find(p => p.playerId === playerId)?.points || 0;
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

    return { player, totalGames: playerMatches.length, totalWins, totalLosses: playerMatches.length - totalWins, winRate: playerMatches.length > 0 ? totalWins / playerMatches.length : 0, currentStreak, longestWinStreak, longestLossStreak, totalPoints, averagePointsPerMatch: playerMatches.length > 0 ? totalPoints / playerMatches.length : 0, gameStats: gameStatsArray };
  }, [matches, getPlayerById, getGameById]);
  
  const setActiveSpaceId = useCallback((newActiveSpaceId: string | null) => {
    setActiveSpaceIdState(newActiveSpaceId);
    if(isClient && firebaseUser) localStorage.setItem(`${ACTIVE_SPACE_LS_KEY_PREFIX}${firebaseUser.uid}`, JSON.stringify(newActiveSpaceId));
  }, [firebaseUser, isClient]);
  
  const getActiveSpace = useCallback(() => activeSpaceId ? spaces.find(s => s.id === activeSpaceId) : undefined, [activeSpaceId, spaces]);
  
  const getUserById = useCallback((userId: string) => allUsers.find(u => u.id === userId), [allUsers]);

  const deleteUserAccount = useCallback(async (userIdToDelete: string) => {
    if (!currentUser?.isAdmin) return;
    if (currentUser.id === userIdToDelete) {
        toast({ title: t('users.toasts.cannotDeleteSelf'), variant: "destructive" });
        return;
    }
    try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'users', userIdToDelete));
        const subcollections = ['players', 'games', 'matches', 'spaces', 'tournaments'];
        for (const sub of subcollections) {
            const snapshot = await getDocs(collection(db, 'users', userIdToDelete, sub));
            snapshot.forEach(d => batch.delete(d.ref));
        }
        batch.delete(doc(db, 'public_shares', userIdToDelete));
        await batch.commit();
        toast({ title: t('users.toasts.userDeleted') });
    } catch (error) {
        toast({ title: t('common.error'), description: t('users.toasts.deleteError'), variant: "destructive" });
    }
  }, [currentUser, toast, t]);
  
  const deleteMatch = useCallback(async (matchId: string) => {
    if (!currentUser) return;
    const spaceOwnerId = spaces.find(s => s.id === activeSpaceId)?.ownerId || currentUser.id;
    try {
        await deleteDoc(doc(db, 'users', spaceOwnerId, 'matches', matchId));
        toast({ title: t('common.success'), description: t('matchHistory.toasts.deleted') });
    } catch (e) {
        toast({ title: t('common.error'), description: 'Failed to delete match.', variant: 'destructive' });
    }
  }, [currentUser, activeSpaceId, spaces, toast, t]);

  const updateMatch = useCallback(async (matchId: string, matchData: Partial<Pick<Match, 'winnerIds' | 'pointsAwarded'>>) => {
      if (!currentUser) return;
      const spaceOwnerId = spaces.find(s => s.id === activeSpaceId)?.ownerId || currentUser.id;
      try {
        await updateDoc(doc(db, 'users', spaceOwnerId, 'matches', matchId), matchData);
        toast({ title: t('common.success'), description: t('matchHistory.toasts.updated') });
      } catch (e) {
        toast({ title: t('common.error'), description: 'Failed to update match.', variant: 'destructive' });
      }
  }, [currentUser, activeSpaceId, spaces, toast, t]);
  
  const clearSpaceHistory = useCallback(async (spaceId: string) => {
    if (!currentUser) return;
    try {
        const batch = writeBatch(db);
        const matchesQuery = query(collection(db, 'users', currentUser.id, 'matches'), where("spaceId", "==", spaceId));
        const tournamentsQuery = query(collection(db, 'users', currentUser.id, 'tournaments'), where("spaceId", "==", spaceId));
        const [matchesSnapshot, tournamentsSnapshot] = await Promise.all([getDocs(matchesQuery), getDocs(tournamentsQuery)]);
        if (matchesSnapshot.empty && tournamentsSnapshot.empty) {
            toast({ title: t('common.noData'), description: t('spaces.toasts.noMatchesToClear') });
            return;
        }
        matchesSnapshot.forEach(d => batch.delete(d.ref));
        tournamentsSnapshot.forEach(d => batch.delete(d.ref));
        await batch.commit();
        toast({ title: t('common.success'), description: t('spaces.toasts.historyCleared') });
    } catch (e) {
        toast({ title: t('common.error'), description: 'Failed to clear space history.', variant: 'destructive' });
    }
  }, [currentUser, toast, t]);
  
  const getLiveShareUrl = useCallback(async (): Promise<string | null> => {
    if (!currentUser?.shareId) return null;
    if (typeof window !== 'undefined') {
      const baseUrl = `${window.location.origin}/share/${currentUser.shareId}`;
      return activeSpaceId ? `${baseUrl}?space=${activeSpaceId}` : baseUrl;
    }
    return null;
  }, [currentUser, activeSpaceId]);
  
  const joinSpaceWithCode = useCallback(async (code: string): Promise<boolean> => {
    if (!currentUser || !code) return false;
    try {
        const inviteRef = doc(db, 'spaceInvites', code);
        const inviteSnap = await getDoc(inviteRef);
        if (!inviteSnap.exists()) {
            toast({ title: t('common.error'), description: t('spaces.joinDialog.validation.codeInvalid'), variant: 'destructive' });
            return false;
        }
        const { ownerId, spaceId } = inviteSnap.data();
        if (ownerId === currentUser.id) {
             toast({ title: t('common.error'), description: t('spaces.joinDialog.validation.alreadyOwner'), variant: 'destructive' });
            return false;
        }

        const batch = writeBatch(db);
        const spaceRef = doc(db, 'users', ownerId, 'spaces', spaceId);
        batch.update(spaceRef, { [`members.${currentUser.id}`]: 'viewer' });
        
        const userRef = doc(db, 'users', currentUser.id);
        batch.update(userRef, { [`joinedSpaces.${ownerId}.${spaceId}`]: true });
        
        await batch.commit();
        toast({ title: t('common.success'), description: t('spaces.joinDialog.joinSuccess') });
        setActiveSpaceIdState(spaceId);
        return true;
    } catch (e) {
        console.error("Failed to join space:", e)
        toast({ title: t('common.error'), description: 'Failed to join space. Please check permissions or try again.', variant: 'destructive' });
        return false;
    }
  }, [currentUser, toast, t]);

  const updateMemberRole = useCallback(async (spaceId: string, memberId: string, role: SpaceRole) => {
      const space = spaces.find(s => s.id === spaceId);
      if (!currentUser || !space || space.ownerId !== currentUser.id) return;
      try {
        const spaceRef = doc(db, 'users', currentUser.id, 'spaces', spaceId);
        await updateDoc(spaceRef, { [`members.${memberId}`]: role });
        toast({ title: t('spaces.toasts.roleUpdated') });
      } catch (e) {
          toast({ title: t('common.error'), description: t('spaces.toasts.roleUpdateFailed'), variant: 'destructive' });
      }
  }, [currentUser, spaces, toast, t]);

  const removeMemberFromSpace = useCallback(async (spaceId: string, memberId: string) => {
      const space = spaces.find(s => s.id === spaceId);
      if (!currentUser || !space || space.ownerId !== currentUser.id) return;
      try {
        const batch = writeBatch(db);
        const spaceRef = doc(db, 'users', currentUser.id, 'spaces', spaceId);
        batch.update(spaceRef, { [`members.${memberId}`]: deleteField() });
        
        const memberUserRef = doc(db, 'users', memberId);
        batch.update(memberUserRef, { [`joinedSpaces.${space.ownerId}.${spaceId}`]: deleteField() });
        
        await batch.commit();
        toast({ title: t('spaces.toasts.memberRemoved') });
      } catch (e) {
         toast({ title: t('common.error'), description: t('spaces.toasts.removeFailed'), variant: 'destructive' });
      }
  }, [currentUser, spaces, toast, t]);
  
  const leaveSpace = useCallback(async (spaceId: string, ownerId: string) => {
    if (!currentUser) return;
    try {
        const batch = writeBatch(db);
        const spaceRef = doc(db, 'users', ownerId, 'spaces', spaceId);
        if (spaceRef) {
          batch.update(spaceRef, { [`members.${currentUser.id}`]: deleteField() });
        }

        const userRef = doc(db, 'users', currentUser.id);
        batch.update(userRef, { [`joinedSpaces.${ownerId}.${spaceId}`]: deleteField() });

        await batch.commit();
        if (activeSpaceId === spaceId) setActiveSpaceIdState(null);
        toast({ title: t('common.success'), description: t('spaces.leaveDialog.leaveSuccess') });
    } catch (e) {
        toast({ title: t('common.error'), description: 'Failed to leave space.', variant: 'destructive' });
    }
  }, [currentUser, activeSpaceId, toast, t]);

  return (
    <AppContext.Provider value={{ 
      games, players, matches, spaces, tournaments, allUsers, activeSpaceId, addPlayer, deletePlayer, deleteAllPlayers, addMatch, updatePlayer, 
      getGameById, getPlayerById, getOverallLeaderboard, getGameLeaderboard, getPlayerStats, isClient,
      currentUser, login, signup, logout, isLoadingAuth, addSpace, updateSpace, deleteSpace, 
      setActiveSpaceId, getActiveSpace, addGame, updateGame, deleteGame,
      getUserById, deleteUserAccount, addTournament, updateTournament, deleteTournament,
      deleteMatch, updateMatch, clearSpaceHistory, getLiveShareUrl,
      firebaseConfigured: isFirebaseConfigured(),
      joinSpaceWithCode, generateInviteCode, updateMemberRole, removeMemberFromSpace, leaveSpace
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

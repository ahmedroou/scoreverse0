
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { doc, getDoc, collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Player, Game, Match, Tournament, Share, UserAccount } from '@/types';

export async function GET(request: NextRequest, { params }: { params: { shareId: string } }) {
  const { shareId } = params;

  if (!shareId) {
    return NextResponse.json({ error: 'Share ID is missing' }, { status: 400 });
  }

  try {
    const shareDocRef = doc(db, 'shares', shareId);
    const shareDocSnap = await getDoc(shareDocRef);

    if (!shareDocSnap.exists()) {
      return NextResponse.json({ error: 'Share link not found or invalid' }, { status: 404 });
    }

    const shareData = shareDocSnap.data() as Omit<Share, 'id'>;
    const { ownerId, spaceId } = shareData;

    // Add a guard clause to ensure the share document is not malformed.
    if (!ownerId) {
      console.error(`Share document ${shareId} is corrupted and missing an ownerId.`);
      return NextResponse.json({ error: 'The share link data is corrupted.' }, { status: 500 });
    }

    // Fetch owner username
    const ownerDocRef = doc(db, 'users', ownerId);
    const ownerDocSnap = await getDoc(ownerDocRef);
    const ownerUsername = ownerDocSnap.exists() ? (ownerDocSnap.data() as UserAccount).username : 'Unknown User';


    // Fetch all data for the owner
    const playersRef = collection(db, `users/${ownerId}/players`);
    const gamesRef = collection(db, `users/${ownerId}/games`);
    const matchesRef = collection(db, `users/${ownerId}/matches`);
    const tournamentsRef = collection(db, `users/${ownerId}/tournaments`);

    const [playersSnap, gamesSnap, matchesSnap, tournamentsSnap] = await Promise.all([
        getDocs(playersRef),
        getDocs(gamesRef),
        getDocs(matchesRef),
        getDocs(tournamentsRef),
    ]);

    const players: Player[] = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
    const games: Game[] = gamesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
    
    const allMatches: Match[] = matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
    const allTournaments: Tournament[] = tournamentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));

    // Filter by spaceId. Handle null or undefined spaceId for global context.
    const currentSpaceId = spaceId || null;
    const matches = allMatches.filter(m => (m.spaceId || null) === currentSpaceId);
    const tournaments = allTournaments.filter(t => (t.spaceId || null) === currentSpaceId);

    // Get the name of the space, if it exists
    let spaceName = null;
    if (spaceId) {
        const spaceDocRef = doc(db, `users/${ownerId}/spaces`, spaceId);
        const spaceDocSnap = await getDoc(spaceDocRef);
        if (spaceDocSnap.exists()) {
            spaceName = spaceDocSnap.data()?.name || null;
        }
    }

    return NextResponse.json({
        players,
        games,
        matches,
        tournaments,
        spaceName,
        ownerUsername,
    });

  } catch (error) {
    console.error(`Error fetching share data for ID ${shareId}:`, error);
    return NextResponse.json({ error: 'An internal error occurred while fetching shared data.' }, { status: 500 });
  }
}

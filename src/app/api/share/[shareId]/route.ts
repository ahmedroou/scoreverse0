
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Game, Player, Match, Space, Tournament, UserAccount, PublicShareData } from '@/types';

export async function GET(request: NextRequest, { params }: { params: { shareId: string } }) {
  const { shareId } = params;

  if (!shareId || typeof shareId !== 'string') {
    return NextResponse.json({ error: 'Invalid share ID format.' }, { status: 400 });
  }

  try {
    const shareDocRef = doc(db, 'shares', shareId);
    const shareDocSnap = await getDoc(shareDocRef);

    if (!shareDocSnap.exists()) {
      return NextResponse.json({ error: 'Share link not found or invalid.' }, { status: 404 });
    }

    const { ownerId } = shareDocSnap.data();

    if (!ownerId) {
      return NextResponse.json({ error: 'Share link is corrupt or invalid.' }, { status: 500 });
    }

    const userDocRef = doc(db, 'users', ownerId);
    const [
        userDocSnap,
        playersSnap,
        gamesSnap,
        matchesSnap,
        tournamentsSnap,
        spacesSnap,
    ] = await Promise.all([
        getDoc(userDocRef),
        getDocs(collection(db, 'users', ownerId, 'players')),
        getDocs(collection(db, 'users', ownerId, 'games')),
        getDocs(collection(db, 'users', ownerId, 'matches')),
        getDocs(collection(db, 'users', ownerId, 'tournaments')),
        getDocs(collection(db, 'users', ownerId, 'spaces')),
    ]);

    if (!userDocSnap.exists()) {
        return NextResponse.json({ error: 'Shared user not found.' }, { status: 404 });
    }
    
    const ownerData = userDocSnap.data() as UserAccount;

    const data: PublicShareData = {
      owner: {
          username: ownerData.username,
      },
      players: playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)),
      games: gamesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game)),
      matches: matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)),
      tournaments: tournamentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament)),
      spaces: spacesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Space)),
    };

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error(`Error fetching share data for ${shareId}:`, error);
    return NextResponse.json({ error: 'An internal error occurred while fetching shared data.' }, { status: 500 });
  }
}

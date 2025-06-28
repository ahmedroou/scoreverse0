
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const ownerId = request.nextUrl.searchParams.get('ownerId');
  const spaceId = request.nextUrl.searchParams.get('spaceId');

  if (!ownerId || !spaceId) {
    return NextResponse.json({ error: 'Missing ownerId or spaceId' }, { status: 400 });
  }

  try {
    const spaceDocRef = doc(db, 'users', ownerId, 'spaces', spaceId);
    const spaceDoc = await getDoc(spaceDocRef);

    if (!spaceDoc.exists()) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }
    
    const spaceData = { id: spaceDoc.id, ...spaceDoc.data() };

    const playersQuery = collection(db, 'users', ownerId, 'players');
    const gamesQuery = collection(db, 'users', ownerId, 'games');
    const matchesQuery = query(collection(db, 'users', ownerId, 'matches'), where('spaceId', '==', spaceId));
    const tournamentsQuery = query(collection(db, 'users', ownerId, 'tournaments'), where('spaceId', '==', spaceId));

    const [playersSnapshot, gamesSnapshot, matchesSnapshot, tournamentsSnapshot] = await Promise.all([
      getDocs(playersQuery),
      getDocs(gamesQuery),
      getDocs(matchesQuery),
      getDocs(tournamentsQuery),
    ]);

    const players = playersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const games = gamesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const matches = matchesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const tournaments = tournamentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      space: spaceData,
      players,
      games,
      matches,
      tournaments,
    });

  } catch (error) {
    console.error('Error fetching shared space data:', error);
    return NextResponse.json({ error: 'An internal error occurred while fetching shared data.' }, { status: 500 });
  }
}

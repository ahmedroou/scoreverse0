
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicShareData } from '@/types';

// Force the route to be dynamic and not cached. This ensures the latest data is always fetched.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { shareId: string } }) {
  const { shareId } = params;

  if (!shareId || typeof shareId !== 'string') {
    return NextResponse.json({ error: 'Invalid share ID format.' }, { status: 400 });
  }

  try {
    const shareDocRef = doc(db, 'public_shares', shareId);
    const shareDocSnap = await getDoc(shareDocRef);

    if (!shareDocSnap.exists()) {
      return NextResponse.json({ error: 'Share link not found or invalid.' }, { status: 404 });
    }

    const data = shareDocSnap.data() as PublicShareData;

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });

  } catch (error) {
    console.error(`Error fetching share data for ${shareId}:`, error);
    return NextResponse.json({ error: 'An internal error occurred while fetching shared data.' }, { status: 500 });
  }
}

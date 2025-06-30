
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicShareData } from '@/types';

// This setting ensures that the response for this route is never cached,
// and the data is always fetched fresh from the database on every request.
export const revalidate = 0;

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
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error(`Error fetching share data for ${shareId}:`, error);
    return NextResponse.json({ error: 'An internal error occurred while fetching shared data.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This API endpoint has been disabled as the sharing feature was removed.
export async function GET(request: NextRequest, { params }: { params: { shareId: string } }) {
  return NextResponse.json({ error: 'This feature has been disabled.' }, { status: 404 });
}


"use client"; // Required for client-side hooks like useAppContext

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { currentUser, isLoadingAuth } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (currentUser) {
        router.replace('/dashboard'); // Redirect to dashboard if logged in
      } else {
        router.replace('/auth');
      }
    }
  }, [currentUser, isLoadingAuth, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-background text-foreground">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-semibold text-primary">Loading ScoreVerse</h1>
      <p className="text-md text-muted-foreground">Please wait a moment...</p>
    </div>
  );
}

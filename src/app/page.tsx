"use client";

import { Loader2 } from 'lucide-react';

export default function HomePage() {
  // The main layout component (ProtectedLayout) now handles all redirection
  // from the root page. This component just serves as a loading placeholder.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-background text-foreground">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-semibold text-primary">Loading ScoreVerse</h1>
      <p className="text-md text-muted-foreground">Please wait a moment...</p>
    </div>
  );
}

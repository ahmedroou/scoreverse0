import { DrawForm } from './DrawForm';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Helper component to allow DrawForm to use client-side hooks
function DrawFormWrapper() {
  return <DrawForm />;
}

export default function DrawPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow-xl">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading Draw Tool...</p>
        </div>
      }>
        <DrawFormWrapper />
      </Suspense>
    </div>
  );
}

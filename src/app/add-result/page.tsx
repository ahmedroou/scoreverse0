
import { AddResultForm } from './AddResultForm';
import { Suspense } from 'react';
import { Label } from '@/components/ui/label'; // Example, not actually used but shows Suspense needs context sometimes
import { Loader2 } from 'lucide-react';

// Helper component to allow AddResultForm to use useSearchParams
function AddResultFormWrapper() {
  // useSearchParams() must be used within a Suspense boundary
  return <AddResultForm />;
}

export default function AddResultPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-64 p-8 bg-card rounded-lg shadow-xl">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading game form...</p>
        </div>
      }>
        <AddResultFormWrapper />
      </Suspense>
    </div>
  );
}

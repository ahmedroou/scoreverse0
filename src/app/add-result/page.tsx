
import { AddResultForm } from './AddResultForm';
import { Suspense } from 'react';

// Helper component to allow AddResultForm to use useSearchParams
function AddResultFormWrapper() {
  return <AddResultForm />;
}

export default function AddResultPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div className="text-center p-8">Loading form...</div>}>
        <AddResultFormWrapper />
      </Suspense>
    </div>
  );
}

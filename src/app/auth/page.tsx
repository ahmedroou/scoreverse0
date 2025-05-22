
import { AuthForm } from './AuthForm';
import { Suspense } from 'react';

export default function AuthPage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center py-8">
      <Suspense fallback={<div className="text-center p-8">Loading form...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}

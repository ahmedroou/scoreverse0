"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useAppContext } from '@/context/AppContext';

export default function HomePage() {
  const { currentUser, isLoadingAuth } = useAppContext();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication status is resolved.
    if (!isLoadingAuth) {
      if (currentUser) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
  }, [currentUser, isLoadingAuth, router]);

  // Render a full-page loader while waiting for the redirect.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-background text-foreground">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-semibold text-primary">{t('header.title')}</h1>
      <p className="text-md text-muted-foreground">{t('common.loading')}</p>
    </div>
  );
}

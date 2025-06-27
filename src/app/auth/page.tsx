
'use client';

import { AuthForm } from './AuthForm';
import { Suspense } from 'react';
import { useLanguage } from '@/hooks/use-language';

export default function AuthPage() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center py-8">
      <Suspense fallback={<div className="text-center p-8">{t('common.loading')}</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}

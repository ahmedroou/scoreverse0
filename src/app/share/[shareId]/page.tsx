"use client";

import { ShieldQuestion } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Suspense } from 'react';

function SharedPageContent() {
  const { t } = useLanguage();
  return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 justify-center text-2xl font-bold text-destructive">
              <ShieldQuestion className="h-8 w-8" />
              {t('share.errorTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t('share.errorDescription')}</p>
          </CardContent>
        </Card>
      </div>
  );
}

export default function SharedPage() {
    return (
        <Suspense>
            <SharedPageContent />
        </Suspense>
    )
}

"use client";

import React from 'react';
import { ShieldX } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SharedPage() {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
            <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
                <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-center text-2xl font-bold text-destructive">
                    <ShieldX className="h-8 w-8" />
                    {t('share.errorTitle')}
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{t('share.errorDescription')}</p>
                    <Link href="/dashboard" passHref legacyBehavior>
                        <Button variant="default">Go to Dashboard</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

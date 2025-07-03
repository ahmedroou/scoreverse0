"use client";

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

interface AdBannerProps {
  'data-ad-client': string;
  'data-ad-slot': string;
  'data-ad-format'?: string;
  'data-full-width-responsive'?: string;
}

const AdBanner: React.FC<AdBannerProps> = (props) => {
    const { t } = useLanguage();

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('Ad push error:', err);
    }
  }, []);
  
  // This is a placeholder for development. When you have your real ad client and slot,
  // the real ad will show up.
  if (props['data-ad-client'].startsWith('ca-pub-0000000000000000')) {
    return (
        <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center text-muted-foreground h-24">
                <Megaphone className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">{t('common.advertisement')}</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="ad-container" style={{ overflow: 'hidden' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        {...props}
      ></ins>
    </div>
  );
};

// Main component to be used in pages
export const AppAdBanner = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000"; // IMPORTANT: Replace with your Publisher ID
    script.async = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <AdBanner
      data-ad-client="ca-pub-0000000000000000" // IMPORTANT: Replace with your Publisher ID
      data-ad-slot="0000000000" // IMPORTANT: Replace with your Ad Slot ID
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
};

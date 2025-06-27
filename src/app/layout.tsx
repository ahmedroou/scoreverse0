
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AppLayoutClient } from '@/components/layout/AppLayoutClient';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata: Metadata = {
  title: 'ScoreVerse - Track Your Games',
  description: 'A modern app to track scores for your favorite multiplayer games.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#A050BE" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans bg-background text-foreground`}>
        <LanguageProvider>
          <AppLayoutClient>
            {children}
          </AppLayoutClient>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}

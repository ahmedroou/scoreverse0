import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AppLayoutClient } from '@/components/layout/AppLayoutClient';
import { Toaster } from '@/components/ui/toaster';

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
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#A050BE" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans bg-background text-foreground`}>
        <AppLayoutClient>
          {children}
        </AppLayoutClient>
        <Toaster />
      </body>
    </html>
  );
}

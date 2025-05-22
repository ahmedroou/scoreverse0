import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AppLayoutClient } from '@/components/layout/AppLayoutClient';

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
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans bg-background text-foreground`}>
        <AppLayoutClient>
          {children}
        </AppLayoutClient>
      </body>
    </html>
  );
}

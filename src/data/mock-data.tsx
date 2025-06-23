import React from 'react';
import type { Game, Player } from '@/types';

// A simple circle SVG can represent a billiard ball.
const BilliardBallIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);


export const MOCK_GAMES: Omit<Game, 'ownerId'>[] = [
  { id: 'jackaroo', name: 'Jackaroo', icon: 'Dices', pointsPerWin: 3, description: 'A strategic board game.', minPlayers: 2, maxPlayers: 4 },
  { id: 'scro', name: 'Scro (سكرو)', icon: 'Users', pointsPerWin: 2, description: 'A popular card game.', minPlayers: 4, maxPlayers: 4 },
  { id: 'baloot', name: 'Baloot (بلوت)', icon: 'Users', pointsPerWin: 2, description: 'A trick-taking card game.', minPlayers: 4, maxPlayers: 4 },
  { id: 'billiards', name: 'Billiards', icon: 'BilliardBallIcon', pointsPerWin: 1, description: 'Classic cue sport.', minPlayers: 2, maxPlayers: 2 },
  { id: 'tennis', name: 'Tennis', icon: 'Medal', pointsPerWin: 1, description: 'Racket sport.', minPlayers: 2, maxPlayers: 4 },
  { id: 'custom', name: 'Other Game', icon: 'HelpCircle', pointsPerWin: 1, description: 'A custom game added by users.', minPlayers: 1 },
];

export const INITIAL_MOCK_GAMES: Omit<Game, 'ownerId'>[] = MOCK_GAMES;

export const MOCK_PLAYERS: Omit<Player, 'ownerId'>[] = [
  { id: 'player1', name: 'Shadow Striker', winRate: 0.6, averageScore: 150 },
  { id: 'player2', name: 'Crimson Comet', winRate: 0.45, averageScore: 120 },
  { id: 'player3', name: 'Azure Phantom', winRate: 0.7, averageScore: 180 },
  { id: 'player4', name: 'Golden Flash', winRate: 0.3, averageScore: 100 },
  { id: 'player5', name: 'Mystic Blade', winRate: 0.55, averageScore: 140 },
];

export const INITIAL_MOCK_PLAYERS: Omit<Player, 'ownerId'>[] = MOCK_PLAYERS;

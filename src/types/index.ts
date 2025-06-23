import type { LucideIcon } from "lucide-react";
import type { SuggestHandicapOutput } from "@/ai/flows/suggest-handicap";

export interface Game {
  id: string;
  name: string;
  icon?: string;
  pointsPerWin: number;
  description?: string;
  minPlayers: number;
  maxPlayers?: number;
  ownerId: string;
}

export interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  // For AI Handicap Suggestions & potential future stats display
  winRate?: number; // 0 to 1, represents probability
  averageScore?: number;
  ownerId: string;
}

// Extends Player for form-specific input where winRate might be 0-100
export interface MatchPlayer extends Player {
  aiWinRate: number; // Percentage based (0-100) for form input
  aiAverageScore: number; // Score for form input
}

export interface Space {
  id: string;
  name:string;
  ownerId: string; // ID of the user who owns this space
  shareId?: string; // Optional: A unique ID for public sharing
}

export interface Match {
  id: string;
  gameId: string;
  date: string; // ISO string
  playerIds: string[];
  winnerIds: string[];
  pointsAwarded: Array<{ playerId: string; points: number }>;
  handicapSuggestions?: SuggestHandicapOutput; // Store the suggestions made for this match
  spaceId?: string; // Optional: ID of the space this match belongs to
}

export interface ScoreData {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string; // Added for password authentication
  isAdmin?: boolean;
}

export interface PlayerGameStats {
  game: Game;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
}

export interface PlayerStats {
  player: Player;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  currentStreak: { type: 'W' | 'L'; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
  totalPoints: number;
  averagePointsPerMatch: number;
  gameStats: PlayerGameStats[];
}

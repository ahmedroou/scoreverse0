import type { LucideIcon } from "lucide-react";
import type { SuggestHandicapOutput } from "@/ai/flows/suggest-handicap";

export interface Game {
  id: string;
  name: string;
  icon?: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  pointsPerWin: number;
  description?: string;
  minPlayers: number;
  maxPlayers?: number;
}

export interface Player {
  id: string;
  name: string;
  // For AI Handicap Suggestions
  winRate?: number; // 0 to 1
  averageScore?: number;
}

export interface MatchPlayer extends Player {
  // For AI Handicap form
  aiWinRate: number;
  aiAverageScore: number;
}

export interface Match {
  id: string;
  gameId: string;
  date: string; // ISO string
  playerIds: string[];
  winnerIds: string[];
  pointsAwarded: Array<{ playerId: string; points: number }>;
  handicapSuggestions?: SuggestHandicapOutput; // Store the suggestions made for this match
}

export interface ScoreData {
  playerId: string;
  playerName: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
}

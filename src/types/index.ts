
import type { LucideIcon } from "lucide-react";
import type { SuggestHandicapOutput } from "@/ai/flows/suggest-handicap";

export type SpaceRole = 'owner' | 'editor' | 'viewer';

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
  winRate?: number;
  averageScore?: number;
  ownerId: string;
}

export interface MatchPlayer extends Player {
  aiWinRate: number; 
  aiAverageScore: number; 
}

export interface Space {
  id: string;
  name: string;
  ownerId: string;
  inviteCode?: string;
  members: Record<string, SpaceRole>; // Map of userId to role
}

export interface Match {
  id:string;
  gameId: string;
  date: string; // ISO string
  playerIds: string[];
  winnerIds: string[];
  pointsAwarded: Array<{ playerId: string; points: number }>;
  handicapSuggestions?: SuggestHandicapOutput;
  spaceId: string | null;
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
  email: string;
  isAdmin?: boolean;
  shareId?: string;
  // Map of an owner's ID to a map of space IDs the user has joined from that owner.
  // e.g., { "owner-abc": { "space-123": true } }
  joinedSpaces: Record<string, Record<string, boolean>>;
}

export interface PlayerGameStats {
  game: Game;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
}

export interface Tournament {
  id: string;
  name: string;
  gameId: string;
  targetPoints: number;
  status: 'active' | 'completed';
  winnerPlayerId?: string;
  dateCompleted?: string; // ISO string
  ownerId: string;
  spaceId: string | null;
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

export interface PublicShareData {
  owner: {
      username: string;
  };
  ownerId: string;
  type: 'live';
  players: Player[];
  games: Game[];
  matches: Match[];
  spaces: Space[];
  tournaments: Tournament[];
}

    
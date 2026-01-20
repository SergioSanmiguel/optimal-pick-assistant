// Type definitions for the entire application

export enum Role {
  TOP = 'top',
  JUNGLE = 'jungle',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
  UTILITY = 'utility'
}

export interface Champion {
  id: number;
  key: string;
  name: string;
  roles: Role[];
}

export interface ChampionStats {
  championId: number;
  role: Role;
  winRate: number;
  pickRate: number;
  banRate: number;
  matches: number;
  tier: string;
  rank: number;
}

export interface Matchup {
  championId: number;
  opponentId: number;
  role: Role;
  winRate: number;
  matches: number;
}

export interface Synergy {
  championId: number;
  allyId: number;
  role: Role;
  winRate: number;
  matches: number;
}

export interface ChampionSelectState {
  myTeam: PickedChampion[];
  enemyTeam: PickedChampion[];
  bannedChampions: number[];
  myRole?: Role;
  phase: 'ban' | 'pick' | 'finished';
  timer: number;
}

export interface PickedChampion {
  championId: number;
  role?: Role;
  summonerId?: string;
}

export interface RecommendationWeights {
  winRate: number;      // Weight for champion win rate (0-1)
  pickRate: number;     // Weight for popularity (0-1)
  counterScore: number; // Weight for matchup advantage (0-1)
  synergyScore: number; // Weight for team synergy (0-1)
}

export interface RecommendationScore {
  championId: number;
  championName: string;
  role: Role;
  totalScore: number;
  breakdown: {
    winRateScore: number;
    pickRateScore: number;
    counterScore: number;
    synergyScore: number;
  };
  stats: ChampionStats;
  reasoning: string[];
}

export interface RecommendationRequest {
  currentState: ChampionSelectState;
  weights?: Partial<RecommendationWeights>;
  topN?: number;
}

export interface RecommendationResponse {
  recommendations: RecommendationScore[];
  timestamp: number;
  patch: string;
}

export interface LCUCredentials {
  port: number;
  token: string;
  protocol: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface DataServiceConfig {
  cacheDuration: number; // milliseconds
  retryAttempts: number;
  retryDelay: number;
  sampleSize: number; // Number of matches to analyze per champion
  minMatches: number; // Minimum matches required for stats
}

// Error types
export class LCUConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LCUConnectionError';
  }
}

export class DataFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataFetchError';
  }
}
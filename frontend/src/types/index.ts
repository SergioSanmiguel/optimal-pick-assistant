// Shared types for frontend (mirror backend types)

export enum Role {
  TOP = 'top',
  JUNGLE = 'jungle',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
  UTILITY = 'utility'
}

export interface Champion {
  id: number;
  name: string;
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

export interface PickedChampion {
  championId: number;
  role?: Role;
  summonerId?: string;
}

export interface ChampionSelectState {
  myTeam: PickedChampion[];
  enemyTeam: PickedChampion[];
  bannedChampions: number[];
  myRole?: Role;
  phase: 'ban' | 'pick' | 'finished';
  timer: number;
}

export interface RecommendationWeights {
  winRate: number;
  pickRate: number;
  counterScore: number;
  synergyScore: number;
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

export interface RecommendationResponse {
  recommendations: RecommendationScore[];
  timestamp: number;
  patch: string;
}

export interface AppStatus {
  status: string;
  lcuConnected: boolean;
  patch: string;
  cache: {
    size: number;
    keys: string[];
  };
  timestamp: number;
}
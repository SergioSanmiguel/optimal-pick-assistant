import config from '../config';
import dataService from './data.service';
import logger from '../utils/logger';
import {
  Role,
  ChampionSelectState,
  RecommendationWeights,
  RecommendationScore,
  ChampionStats,
  Matchup,
  Synergy
} from '../types';

/**
 * Core recommendation engine
 * Implements multi-factor weighted scoring algorithm
 */
class RecommendationService {
  private championsMap: Map<number, string> | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.championsMap = await dataService.getAllChampions();
      logger.info('Recommendation service initialized');
    } catch (error) {
      logger.error('Failed to initialize recommendation service', error);
    }
  }

  /**
   * Generate champion recommendations based on current game state
   */
  async getRecommendations(
    state: ChampionSelectState,
    weights: RecommendationWeights = config.defaultWeights,
    topN: number = 5
  ): Promise<RecommendationScore[]> {
    if (!state.myRole) {
      throw new Error('Role must be specified to generate recommendations');
    }

    if (!this.championsMap) {
      this.championsMap = await dataService.getAllChampions();
    }

    logger.info(`Generating recommendations for ${state.myRole}`);

    // Get all available champions (exclude picked and banned)
    const pickedIds = new Set([
      ...state.myTeam.map(p => p.championId),
      ...state.enemyTeam.map(p => p.championId),
      ...state.bannedChampions
    ]);

    const availableChampions = Array.from(this.championsMap.keys())
      .filter(id => !pickedIds.has(id));

    // Calculate scores for each available champion
    const scores = await Promise.all(
      availableChampions.map(championId =>
        this.calculateChampionScore(championId, state, weights)
      )
    );

    // Filter out null scores and sort by total score
    const validScores = scores
      .filter((score): score is RecommendationScore => score !== null)
      .sort((a, b) => b.totalScore - a.totalScore);

    logger.info(`Generated ${validScores.length} recommendations`);
    return validScores.slice(0, topN);
  }

  /**
   * Calculate comprehensive score for a single champion
   */
  private async calculateChampionScore(
    championId: number,
    state: ChampionSelectState,
    weights: RecommendationWeights
  ): Promise<RecommendationScore | null> {
    const role = state.myRole!;

    // Fetch base stats
    const stats = await dataService.getChampionStats(championId, role);
    if (!stats || stats.matches < 100) {
      // Skip champions with insufficient data
      return null;
    }

    // Calculate individual score components
    const winRateScore = this.calculateWinRateScore(stats);
    const pickRateScore = this.calculatePickRateScore(stats);
    const counterScore = await this.calculateCounterScore(championId, state, role);
    const synergyScore = await this.calculateSynergyScore(championId, state, role);

    // Apply weights to calculate total score
    const totalScore = 
      (winRateScore * weights.winRate) +
      (pickRateScore * weights.pickRate) +
      (counterScore * weights.counterScore) +
      (synergyScore * weights.synergyScore);

    // Generate reasoning
    const reasoning = this.generateReasoning(
      stats,
      { winRateScore, pickRateScore, counterScore, synergyScore },
      state
    );

    return {
      championId,
      championName: this.championsMap!.get(championId) || 'Unknown',
      role,
      totalScore,
      breakdown: {
        winRateScore,
        pickRateScore,
        counterScore,
        synergyScore
      },
      stats,
      reasoning
    };
  }

  /**
   * Calculate win rate score (0-100)
   * Champions with higher win rates get higher scores
   */
  private calculateWinRateScore(stats: ChampionStats): number {
    // Normalize win rate to 0-100 scale
    // 50% WR = 50 score, 55% WR = 100 score
    const baseScore = (stats.winRate - 0.45) * 200;
    return Math.max(0, Math.min(100, baseScore));
  }

  /**
   * Calculate pick rate score (0-100)
   * Popular champions are generally safer picks
   */
  private calculatePickRateScore(stats: ChampionStats): number {
    // Normalize pick rate (typically 0-20%)
    // 5% pick rate = 50 score, 10%+ = 100 score
    const baseScore = (stats.pickRate / 0.10) * 100;
    return Math.max(0, Math.min(100, baseScore));
  }

  /**
   * Calculate counter score based on matchups against enemy team
   * Higher score = better matchups
   */
  private async calculateCounterScore(
    championId: number,
    state: ChampionSelectState,
    role: Role
  ): Promise<number> {
    if (!config.features.enableCounterCalculation || state.enemyTeam.length === 0) {
      return 50; // Neutral score if no enemies picked
    }

    const matchupPromises = state.enemyTeam.map(enemy =>
      dataService.getMatchupData(championId, enemy.championId, role)
    );

    const matchups = await Promise.all(matchupPromises);
    const validMatchups = matchups.filter((m): m is Matchup => m !== null && m.matches >= 50);

    if (validMatchups.length === 0) {
      return 50; // Neutral if no matchup data
    }

    // Average win rate across all matchups
    const avgWinRate = validMatchups.reduce((sum, m) => sum + m.winRate, 0) / validMatchups.length;

    // Normalize to 0-100 (45% WR = 0, 50% = 50, 55% = 100)
    const score = ((avgWinRate - 0.45) / 0.10) * 100;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate synergy score based on team composition
   * Higher score = better synergy with allies
   */
  private async calculateSynergyScore(
    championId: number,
    state: ChampionSelectState,
    role: Role
  ): Promise<number> {
    if (!config.features.enableSynergyCalculation || state.myTeam.length === 0) {
      return 50; // Neutral score if no allies
    }

    const synergyPromises = state.myTeam.map(ally =>
      dataService.getSynergyData(championId, ally.championId, role)
    );

    const synergies = await Promise.all(synergyPromises);
    const validSynergies = synergies.filter((s): s is Synergy => s !== null && s.matches >= 30);

    if (validSynergies.length === 0) {
      return 50; // Neutral if no synergy data
    }

    // Average win rate with all allies
    const avgWinRate = validSynergies.reduce((sum, s) => sum + s.winRate, 0) / validSynergies.length;

    // Normalize to 0-100
    const score = ((avgWinRate - 0.48) / 0.08) * 100;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate human-readable reasoning for recommendation
   */
  private generateReasoning(
    stats: ChampionStats,
    scores: {
      winRateScore: number;
      pickRateScore: number;
      counterScore: number;
      synergyScore: number;
    },
    state: ChampionSelectState
  ): string[] {
    const reasons: string[] = [];

    // Win rate reasoning
    if (stats.winRate >= 0.52) {
      reasons.push(`Strong ${(stats.winRate * 100).toFixed(1)}% win rate in ${stats.tier} tier`);
    } else if (stats.winRate >= 0.50) {
      reasons.push(`Solid ${(stats.winRate * 100).toFixed(1)}% win rate`);
    }

    // Pick rate reasoning
    if (stats.pickRate >= 0.10) {
      reasons.push('Very popular pick - proven reliability');
    } else if (stats.pickRate >= 0.05) {
      reasons.push('Popular meta pick');
    } else if (stats.pickRate < 0.02) {
      reasons.push('Niche pick - consider team comfort');
    }

    // Counter reasoning
    if (scores.counterScore >= 70) {
      reasons.push('Excellent matchup into enemy composition');
    } else if (scores.counterScore >= 55) {
      reasons.push('Favorable matchups');
    } else if (scores.counterScore < 40) {
      reasons.push('Challenging matchups - requires skill');
    }

    // Synergy reasoning
    if (scores.synergyScore >= 65 && state.myTeam.length > 0) {
      reasons.push('Strong synergy with team composition');
    } else if (scores.synergyScore < 40 && state.myTeam.length > 0) {
      reasons.push('Limited synergy with current team');
    }

    // Default if no specific reasons
    if (reasons.length === 0) {
      reasons.push('Balanced pick for current situation');
    }

    return reasons;
  }

  /**
   * Normalize weights to ensure they sum to 1.0
   */
  normalizeWeights(weights: Partial<RecommendationWeights>): RecommendationWeights {
    const defaultWeights = config.defaultWeights;
    const merged = { ...defaultWeights, ...weights };
    
    const sum = merged.winRate + merged.pickRate + merged.counterScore + merged.synergyScore;
    
    return {
      winRate: merged.winRate / sum,
      pickRate: merged.pickRate / sum,
      counterScore: merged.counterScore / sum,
      synergyScore: merged.synergyScore / sum
    };
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
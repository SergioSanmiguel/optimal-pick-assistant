import config from '../config';
import statsAggregatorService from './stats-aggregator.service';
import riotApiService from './riot-api.service';
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
 * Core recommendation engine using Riot API data
 */
class RecommendationService {
  private championsMap: Map<number, any> | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.championsMap = await riotApiService.getAllChampions();
      logger.info(`Recommendation service initialized with ${this.championsMap.size} champions`);
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
      this.championsMap = await riotApiService.getAllChampions();
    }

    logger.info(`Generating recommendations for ${state.myRole}`);

    // Get all available champions
    const pickedIds = new Set([
      ...state.myTeam.map(p => p.championId),
      ...state.enemyTeam.map(p => p.championId),
      ...state.bannedChampions
    ]);

    const availableChampions = Array.from(this.championsMap.keys())
      .filter(id => !pickedIds.has(id));

    // Calculate scores concurrently (limited batches to respect rate limits)
    const batchSize = 10;
    const allScores: RecommendationScore[] = [];

    for (let i = 0; i < availableChampions.length; i += batchSize) {
      const batch = availableChampions.slice(i, i + batchSize);
      const batchScores = await Promise.all(
        batch.map(championId =>
          this.calculateChampionScore(championId, state, weights)
        )
      );
      allScores.push(...batchScores.filter((s): s is RecommendationScore => s !== null));
    }

    // Sort by total score
    const validScores = allScores.sort((a, b) => b.totalScore - a.totalScore);

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

    // Fetch stats from aggregated Riot API data
    const stats = await statsAggregatorService.getChampionStats(championId, role);
    if (!stats || stats.matches < config.dataService.minMatches) {
      return null;
    }

    // Calculate individual components
    const winRateScore = this.calculateWinRateScore(stats);
    const pickRateScore = this.calculatePickRateScore(stats);
    const counterScore = await this.calculateCounterScore(championId, state, role);
    const synergyScore = await this.calculateSynergyScore(championId, state, role);

    // Apply weights
    const totalScore = 
      (winRateScore * weights.winRate) +
      (pickRateScore * weights.pickRate) +
      (counterScore * weights.counterScore) +
      (synergyScore * weights.synergyScore);

    const reasoning = this.generateReasoning(
      stats,
      { winRateScore, pickRateScore, counterScore, synergyScore },
      state
    );

    const championData = this.championsMap!.get(championId);

    return {
      championId,
      championName: championData?.name || 'Unknown',
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

  private calculateWinRateScore(stats: ChampionStats): number {
    const baseScore = (stats.winRate - 0.45) * 200;
    return Math.max(0, Math.min(100, baseScore));
  }

  private calculatePickRateScore(stats: ChampionStats): number {
    // Since we can't get true pick rate from Riot API, use tier as proxy
    const tierScores: { [key: string]: number } = {
      'S': 80,
      'A': 60,
      'B': 40,
      'C': 20,
      'D': 10
    };
    return tierScores[stats.tier] || 50;
  }

  private async calculateCounterScore(
    championId: number,
    state: ChampionSelectState,
    role: Role
  ): Promise<number> {
    if (!config.features.enableCounterCalculation || state.enemyTeam.length === 0) {
      return 50;
    }

    const matchupPromises = state.enemyTeam.map(enemy =>
      statsAggregatorService.getMatchupData(championId, enemy.championId, role)
    );

    const matchups = await Promise.all(matchupPromises);
    const validMatchups = matchups.filter((m): m is Matchup => m !== null && m.matches >= 10);

    if (validMatchups.length === 0) {
      return 50;
    }

    const avgWinRate = validMatchups.reduce((sum, m) => sum + m.winRate, 0) / validMatchups.length;
    const score = ((avgWinRate - 0.45) / 0.10) * 100;
    return Math.max(0, Math.min(100, score));
  }

  private async calculateSynergyScore(
    championId: number,
    state: ChampionSelectState,
    role: Role
  ): Promise<number> {
    if (!config.features.enableSynergyCalculation || state.myTeam.length === 0) {
      return 50;
    }

    const synergyPromises = state.myTeam.map(ally =>
      statsAggregatorService.getSynergyData(championId, ally.championId, role)
    );

    const synergies = await Promise.all(synergyPromises);
    const validSynergies = synergies.filter((s): s is Synergy => s !== null && s.matches >= 5);

    if (validSynergies.length === 0) {
      return 50;
    }

    const avgWinRate = validSynergies.reduce((sum, s) => sum + s.winRate, 0) / validSynergies.length;
    const score = ((avgWinRate - 0.48) / 0.08) * 100;
    return Math.max(0, Math.min(100, score));
  }

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

    if (stats.winRate >= 0.52) {
      reasons.push(`Strong ${(stats.winRate * 100).toFixed(1)}% win rate in ${stats.tier} tier`);
    } else if (stats.winRate >= 0.50) {
      reasons.push(`Solid ${(stats.winRate * 100).toFixed(1)}% win rate`);
    }

    if (stats.tier === 'S' || stats.tier === 'A') {
      reasons.push(`High tier champion (${stats.tier} tier)`);
    }

    if (scores.counterScore >= 70) {
      reasons.push('Excellent matchup into enemy composition');
    } else if (scores.counterScore >= 55) {
      reasons.push('Favorable matchups');
    } else if (scores.counterScore < 40) {
      reasons.push('Challenging matchups - requires skill');
    }

    if (scores.synergyScore >= 65 && state.myTeam.length > 0) {
      reasons.push('Strong synergy with team composition');
    }

    if (stats.matches < 50) {
      reasons.push('Limited data - results may vary');
    }

    if (reasons.length === 0) {
      reasons.push('Balanced pick for current situation');
    }

    return reasons;
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
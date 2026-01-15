import axios, { AxiosInstance } from 'axios';
import config from '../config';
import cacheService from './cache.service';
import logger from '../utils/logger';
import { ChampionStats, Matchup, Synergy, Role, DataFetchError } from '../types';

/**
 * Service to fetch champion statistics from external sources (U.GG)
 * Implements caching and retry logic for reliability
 */
class DataService {
  private client: AxiosInstance;
  // @ts-ignore TS6133
  private currentPatch: string | null = null;

  constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'OptimalPickAssistant/1.0'
      }
    });
  }

  /**
   * Fetch current game patch version
   */
  async getCurrentPatch(): Promise<string> {
    const cacheKey = 'patch:current';
    const cached = cacheService.get<string>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch from Data Dragon (Riot's official CDN)
      const response = await this.client.get('https://ddragon.leagueoflegends.com/api/versions.json');
      const latestPatch = response.data[0];
      
      this.currentPatch = latestPatch;
      cacheService.set(cacheKey, latestPatch, config.cache.patchDataExpiry);
      logger.info(`Current patch: ${latestPatch}`);
      
      return latestPatch;
    } catch (error) {
      logger.error('Failed to fetch current patch', error);
      throw new DataFetchError('Could not determine current patch version');
    }
  }

  /**
   * Fetch champion statistics for a specific role
   * Source: U.GG aggregated statistics
   */
  async getChampionStats(championId: number, role: Role): Promise<ChampionStats | null> {
    const patch = await this.getCurrentPatch();
    const cacheKey = `stats:${championId}:${role}:${patch}`;
    
    const cached = cacheService.get<ChampionStats>(cacheKey);
    if (cached) return cached;

    try {
      // U.GG API endpoint (unofficial but stable)
      // Format: https://stats2.u.gg/lol/1.5/champion_stats/{region}/{patch}/ranked_solo_5x5/{championId}/{role}.json
      const url = `https://stats2.u.gg/lol/1.5/champion_stats/world/${patch}/ranked_solo_5x5/${championId}/${role}.json`;
      
      const response = await this.retryRequest(() => this.client.get(url));
      
      if (!response.data) {
        return null;
      }

      // U.GG returns array format: [winRate, pickRate, banRate, matches, ...]
      const data = response.data;
      const stats: ChampionStats = {
        championId,
        role,
        winRate: data[0] / 100, // Convert percentage to decimal
        pickRate: data[1] / 100,
        banRate: data[2] / 100,
        matches: data[3] || 0,
        tier: this.calculateTier(data[0], data[1]),
        rank: data[4] || 0
      };

      cacheService.set(cacheKey, stats, config.cache.championStatsExpiry);
      return stats;
    } catch (error) {
      logger.warn(`Failed to fetch stats for champion ${championId} ${role}`, error);
      return null;
    }
  }

  /**
   * Fetch matchup data (champion vs opponent)
   */
  async getMatchupData(championId: number, opponentId: number, role: Role): Promise<Matchup | null> {
    const patch = await this.getCurrentPatch();
    const cacheKey = `matchup:${championId}:${opponentId}:${role}:${patch}`;
    
    const cached = cacheService.get<Matchup>(cacheKey);
    if (cached) return cached;

    try {
      // U.GG matchup endpoint
      const url = `https://stats2.u.gg/lol/1.5/matchups/${patch}/ranked_solo_5x5/${championId}/${role}.json`;
      
      const response = await this.retryRequest(() => this.client.get(url));
      
      if (!response.data || !response.data[opponentId]) {
        return null;
      }

      const matchupData = response.data[opponentId];
      const matchup: Matchup = {
        championId,
        opponentId,
        role,
        winRate: matchupData[0] / 100,
        matches: matchupData[1] || 0
      };

      cacheService.set(cacheKey, matchup, config.cache.matchupDataExpiry);
      return matchup;
    } catch (error) {
      logger.warn(`Failed to fetch matchup data: ${championId} vs ${opponentId}`, error);
      return null;
    }
  }

  /**
   * Fetch synergy data (champion with ally)
   */
  async getSynergyData(championId: number, allyId: number, role: Role): Promise<Synergy | null> {
    const patch = await this.getCurrentPatch();
    const cacheKey = `synergy:${championId}:${allyId}:${role}:${patch}`;
    
    const cached = cacheService.get<Synergy>(cacheKey);
    if (cached) return cached;

    try {
      // U.GG duo endpoint for synergies
      const url = `https://stats2.u.gg/lol/1.5/duo/${patch}/ranked_solo_5x5/${championId}/${role}.json`;
      
      const response = await this.retryRequest(() => this.client.get(url));
      
      if (!response.data || !response.data[allyId]) {
        return null;
      }

      const synergyData = response.data[allyId];
      const synergy: Synergy = {
        championId,
        allyId,
        role,
        winRate: synergyData[0] / 100,
        matches: synergyData[1] || 0
      };

      cacheService.set(cacheKey, synergy, config.cache.matchupDataExpiry);
      return synergy;
    } catch (error) {
      logger.debug(`No synergy data for ${championId} with ${allyId}`);
      return null;
    }
  }

  /**
   * Fetch all champions data (static)
   */
  async getAllChampions(): Promise<Map<number, string>> {
    const cacheKey = 'champions:all';
    const cached = cacheService.get<Map<number, string>>(cacheKey);
    if (cached) return cached;

    try {
      const patch = await this.getCurrentPatch();
      const url = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion.json`;
      
      const response = await this.client.get(url);
      const championsMap = new Map<number, string>();

      for (const [_key, data] of Object.entries(response.data.data) as [string, any][]) {
        championsMap.set(parseInt(data.key), data.name);
      }

      cacheService.set(cacheKey, championsMap, config.cache.patchDataExpiry);
      return championsMap;
    } catch (error) {
      logger.error('Failed to fetch champions list', error);
      throw new DataFetchError('Could not fetch champions data');
    }
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= config.dataService.retryAttempts) {
        throw error;
      }

      const delay = config.dataService.retryDelay * Math.pow(2, attempt - 1);
      logger.debug(`Retry attempt ${attempt} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  /**
   * Calculate tier based on win rate and pick rate
   */
  private calculateTier(winRate: number, pickRate: number): string {
    const wr = winRate / 100;
    const pr = pickRate / 100;
    
    // S tier: High win rate and decent pick rate
    if (wr >= 0.52 && pr >= 0.03) return 'S';
    
    // A tier: Good win rate or popular
    if (wr >= 0.51 || (wr >= 0.50 && pr >= 0.05)) return 'A';
    
    // B tier: Average performance
    if (wr >= 0.49 || pr >= 0.05) return 'B';
    
    // C tier: Below average
    if (wr >= 0.47) return 'C';
    
    // D tier: Poor performance
    return 'D';
  }

  /**
   * Warmup cache with popular champions data
   */
  async warmupCache(topChampions: number[], roles: Role[]): Promise<void> {
    logger.info('Warming up cache with popular champions...');
    
    const promises: Promise<any>[] = [];
    for (const championId of topChampions) {
      for (const role of roles) {
        promises.push(this.getChampionStats(championId, role));
      }
    }

    await Promise.allSettled(promises);
    logger.info('Cache warmup completed');
  }
}

export const dataService = new DataService();
export default dataService;
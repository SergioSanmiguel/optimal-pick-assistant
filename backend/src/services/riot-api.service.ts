import axios, { AxiosInstance } from 'axios';
import config from '../config';
import logger from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';

/**
 * Official Riot Games API Service
 * Handles all interactions with Riot's APIs with proper rate limiting
 */
class RiotApiService {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private readonly region: string;
  private readonly platform: string;

  constructor() {
    this.region = config.riot.region; // 'americas', 'europe', 'asia'
    this.platform = config.riot.platform; // 'euw1', 'na1', etc.
    
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'X-Riot-Token': config.riot.apiKey
      }
    });

    // Riot API rate limits: 20 requests/second, 100 requests/2 minutes
    this.rateLimiter = new RateLimiter(20, 1000); // 20 per second
  }

  /**
   * Get Data Dragon version (for static data)
   */
  async getLatestVersion(): Promise<string> {
    try {
      const response = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
      return response.data[0];
    } catch (error) {
      logger.error('Failed to fetch Data Dragon version', error);
      return '14.1.1'; // Fallback
    }
  }

  /**
   * Get all champions from Data Dragon
   */
  async getAllChampions(): Promise<Map<number, any>> {
    try {
      const version = await this.getLatestVersion();
      const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
      
      const response = await axios.get(url);
      const championsMap = new Map<number, any>();

      for (const [key, data] of Object.entries(response.data.data) as [string, any][]) {
        championsMap.set(parseInt(data.key), {
          id: parseInt(data.key),
          key: key,
          name: data.name,
          title: data.title,
          tags: data.tags // ['Mage', 'Assassin']
        });
      }

      return championsMap;
    } catch (error) {
      logger.error('Failed to fetch champions', error);
      throw error;
    }
  }

  /**
   * Get summoner by name (for testing or lookup)
   */
  async getSummonerByName(summonerName: string): Promise<any> {
    await this.rateLimiter.waitForSlot();
    
    try {
      const url = `https://${this.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Summoner not found: ${summonerName}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Get summoner by encrypted PUUID
   */
  async getSummonerByPuuid(puuid: string): Promise<any> {
    await this.rateLimiter.waitForSlot();
    
    try {
      const url = `https://${this.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch summoner by PUUID', error);
      throw error;
    }
  }

  /**
   * Get match IDs for a player (last N matches)
   */
  async getMatchIds(puuid: string, count: number = 100, queue?: number): Promise<string[]> {
    await this.rateLimiter.waitForSlot();
    
    try {
      let url = `https://${this.region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
      
      // Queue types: 420 = Ranked Solo, 440 = Ranked Flex
      if (queue) {
        url += `&queue=${queue}`;
      }

      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch match IDs', error);
      throw error;
    }
  }

  /**
   * Get detailed match data
   */
  async getMatch(matchId: string): Promise<any> {
    await this.rateLimiter.waitForSlot();
    
    try {
      const url = `https://${this.region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch match ${matchId}`, error);
      throw error;
    }
  }

  /**
   * Get featured games (spectator-v4)
   * Useful for getting recent high-elo games
   */
  async getFeaturedGames(): Promise<any> {
    await this.rateLimiter.waitForSlot();
    
    try {
      const url = `https://${this.platform}.api.riotgames.com/lol/spectator/v4/featured-games`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch featured games', error);
      throw error;
    }
  }

  /**
   * Get current game for a summoner (if in game)
   */
  async getCurrentGame(summonerId: string): Promise<any> {
    await this.rateLimiter.waitForSlot();
    
    try {
      const url = `https://${this.platform}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Not in game
      }
      throw error;
    }
  }

  /**
   * Get challenger players (for high-elo data sampling)
   */
  async getChallengerPlayers(): Promise<string[]> {
    await this.rateLimiter.waitForSlot();
    
    try {
      const url = `https://${this.platform}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`;
      const response = await this.client.get(url);
      
      // Return summoner IDs
      return response.data.entries.map((entry: any) => entry.summonerId);
    } catch (error) {
      logger.error('Failed to fetch challenger players', error);
      return [];
    }
  }

  /**
   * Get master players (for data sampling)
   */
  async getMasterPlayers(): Promise<string[]> {
    await this.rateLimiter.waitForSlot();
    
    try {
      const url = `https://${this.platform}.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5`;
      const response = await this.client.get(url);
      return response.data.entries.map((entry: any) => entry.summonerId);
    } catch (error) {
      logger.error('Failed to fetch master players', error);
      return [];
    }
  }

  /**
   * Batch get matches (with rate limiting)
   */
  async getMatchesBatch(matchIds: string[]): Promise<any[]> {
    const matches: any[] = [];
    
    for (const matchId of matchIds) {
      try {
        const match = await this.getMatch(matchId);
        matches.push(match);
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        logger.warn(`Skipping match ${matchId} due to error`);
        continue;
      }
    }
    
    return matches;
  }
}

export const riotApiService = new RiotApiService();
export default riotApiService;
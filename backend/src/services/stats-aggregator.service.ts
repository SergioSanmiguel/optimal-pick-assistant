import riotApiService from './riot-api.service';
import cacheService from './cache.service';
import logger from '../utils/logger';
import { ChampionStats, Role } from '../types';

/**
 * Aggregates match data to calculate champion statistics
 * Since Riot API doesn't provide aggregated stats, we calculate them from matches
 */
class StatsAggregatorService {
  private readonly SAMPLE_SIZE = 200; // Number of matches to analyze per champion
  private readonly MIN_MATCHES = 30; // Minimum matches for reliable stats

  /**
   * Get aggregated champion stats from recent matches
   * Uses challenger/master games for high-quality data
   */
  async getChampionStats(championId: number, role: Role): Promise<ChampionStats | null> {
    const cacheKey = `riot-stats:${championId}:${role}`;
    const cached = cacheService.get<ChampionStats>(cacheKey);
    if (cached) return cached;

    try {
      logger.info(`Calculating stats for champion ${championId} in ${role}`);

      // Get sample matches (from high-elo players for better data)
      const matches = await this.getSampleMatches(championId, role);

      if (matches.length < this.MIN_MATCHES) {
        logger.warn(`Insufficient data for champion ${championId} ${role}: ${matches.length} matches`);
        return null;
      }

      // Calculate statistics
      const stats = this.calculateStats(championId, role, matches);
      
      // Cache for 1 hour
      cacheService.set(cacheKey, stats, 3600000);
      
      return stats;
    } catch (error) {
      logger.error(`Failed to get stats for champion ${championId}`, error);
      return null;
    }
  }

  /**
   * Get sample matches for analysis
   * Strategy: Use high-elo player matches for quality data
   */
  private async getSampleMatches(championId: number, role: Role): Promise<any[]> {
    const cacheKey = `matches-sample:${championId}:${role}`;
    const cached = cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get high-elo players (challenger/master)
      const highEloPlayers = await this.getHighEloPlayers();
      
      const allMatches: any[] = [];
      
      // Sample matches from multiple players
      for (const summonerId of highEloPlayers.slice(0, 10)) { // Top 10 players
        try {
          // Get summoner's PUUID
          const summoner = await riotApiService.getSummonerByPuuid(summonerId);
          if (!summoner) continue;

          // Get their match history (ranked only)
          const matchIds = await riotApiService.getMatchIds(summoner.puuid, 20, 420);
          
          // Fetch matches
          const matches = await riotApiService.getMatchesBatch(matchIds);
          
          // Filter for matches with our champion
          const relevantMatches = matches.filter(match => 
            this.matchHasChampion(match, championId, role)
          );
          
          allMatches.push(...relevantMatches);
          
          // Stop if we have enough data
          if (allMatches.length >= this.SAMPLE_SIZE) break;
          
        } catch (error) {
          logger.warn(`Failed to get matches for summoner ${summonerId}`);
          continue;
        }
      }

      // Cache for 2 hours
      cacheService.set(cacheKey, allMatches, 7200000);
      
      return allMatches.slice(0, this.SAMPLE_SIZE);
    } catch (error) {
      logger.error('Failed to get sample matches', error);
      return [];
    }
  }

  /**
   * Check if match contains the champion in the specified role
   */
  private matchHasChampion(match: any, championId: number, role: Role): boolean {
    const participants = match.info.participants;
    
    return participants.some((p: any) => 
      p.championId === championId && 
      this.normalizeRole(p.teamPosition) === role
    );
  }

  /**
   * Normalize Riot API role to our Role enum
   */
  private normalizeRole(riotRole: string): Role | null {
    const roleMap: { [key: string]: Role } = {
      'TOP': Role.TOP,
      'JUNGLE': Role.JUNGLE,
      'MIDDLE': Role.MIDDLE,
      'BOTTOM': Role.BOTTOM,
      'UTILITY': Role.UTILITY
    };
    
    return roleMap[riotRole] || null;
  }

  /**
   * Calculate statistics from match data
   */
  private calculateStats(championId: number, role: Role, matches: any[]): ChampionStats {
    const performances = matches.map(match => {
      const participant = match.info.participants.find((p: any) => 
        p.championId === championId && 
        this.normalizeRole(p.teamPosition) === role
      );
      
      return {
        win: participant.win,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        gameDuration: match.info.gameDuration
      };
    });

    const wins = performances.filter(p => p.win).length;
    const winRate = wins / performances.length;

    // Calculate tier based on win rate
    const tier = this.calculateTier(winRate);

    return {
      championId,
      role,
      winRate,
      pickRate: 0.05, // We can't calculate pickrate without full dataset
      banRate: 0, // We can't calculate banrate without full dataset
      matches: performances.length,
      tier,
      rank: 0 // We'll rank champions later when comparing
    };
  }

  /**
   * Calculate tier based on win rate
   */
  private calculateTier(winRate: number): string {
    if (winRate >= 0.53) return 'S';
    if (winRate >= 0.51) return 'A';
    if (winRate >= 0.49) return 'B';
    if (winRate >= 0.47) return 'C';
    return 'D';
  }

  /**
   * Get high-elo players for sampling
   * Cached for 24 hours
   */
  private async getHighEloPlayers(): Promise<string[]> {
    const cacheKey = 'high-elo-players';
    const cached = cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get challenger players
      const challengerPlayers = await riotApiService.getChallengerPlayers();
      
      // Get master players as fallback
      const masterPlayers = await riotApiService.getMasterPlayers();
      
      const allPlayers = [...challengerPlayers, ...masterPlayers];
      
      // Cache for 24 hours
      cacheService.set(cacheKey, allPlayers, 86400000);
      
      return allPlayers;
    } catch (error) {
      logger.error('Failed to get high-elo players', error);
      return [];
    }
  }

  /**
   * Calculate matchup data (champion vs opponent)
   */
  async getMatchupData(championId: number, opponentId: number, role: Role): Promise<any> {
    const cacheKey = `matchup:${championId}:${opponentId}:${role}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Get matches where both champions appear
      const matches = await this.getSampleMatches(championId, role);
      
      const matchupMatches = matches.filter(match => {
        const participants = match.info.participants;
        const hasChampion = participants.some((p: any) => 
          p.championId === championId && this.normalizeRole(p.teamPosition) === role
        );
        const hasOpponent = participants.some((p: any) => 
          p.championId === opponentId
        );
        return hasChampion && hasOpponent;
      });

      if (matchupMatches.length < 10) {
        return null; // Not enough data
      }

      const wins = matchupMatches.filter(match => {
        const champion = match.info.participants.find((p: any) => p.championId === championId);
        return champion.win;
      }).length;

      const matchup = {
        championId,
        opponentId,
        role,
        winRate: wins / matchupMatches.length,
        matches: matchupMatches.length
      };

      cacheService.set(cacheKey, matchup, 7200000); // 2 hours
      return matchup;
    } catch (error) {
      logger.error('Failed to calculate matchup data', error);
      return null;
    }
  }

  /**
   * Calculate synergy data (champion with ally)
   */
  async getSynergyData(championId: number, allyId: number, role: Role): Promise<any> {
    const cacheKey = `synergy:${championId}:${allyId}:${role}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const matches = await this.getSampleMatches(championId, role);
      
      // Find matches where both champions are on same team
      const synergyMatches = matches.filter(match => {
        const participants = match.info.participants;
        const championParticipant = participants.find((p: any) => 
          p.championId === championId && this.normalizeRole(p.teamPosition) === role
        );
        
        if (!championParticipant) return false;
        
        const allyParticipant = participants.find((p: any) => 
          p.championId === allyId && p.teamId === championParticipant.teamId
        );
        
        return !!allyParticipant;
      });

      if (synergyMatches.length < 5) {
        return null;
      }

      const wins = synergyMatches.filter(match => {
        const champion = match.info.participants.find((p: any) => p.championId === championId);
        return champion.win;
      }).length;

      const synergy = {
        championId,
        allyId,
        role,
        winRate: wins / synergyMatches.length,
        matches: synergyMatches.length
      };

      cacheService.set(cacheKey, synergy, 7200000);
      return synergy;
    } catch (error) {
      logger.error('Failed to calculate synergy data', error);
      return null;
    }
  }
}

export const statsAggregatorService = new StatsAggregatorService();
export default statsAggregatorService;
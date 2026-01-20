import { Request, Response } from 'express';
import { recommendationService } from '../services/recommendation.service';
import riotApiService from '../services/riot-api.service';
import lcuService from '../services/lcu.service';
import cacheService from '../services/cache.service';
import logger from '../utils/logger';
import { RecommendationRequest, RecommendationResponse, RecommendationWeights } from '../types';
import config from '../config/config';

/**
 * API Controller handling HTTP requests
 */
export class ApiController {

  /**
   * POST /api/recommendations
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const request: RecommendationRequest = req.body;

      if (!request.currentState) {
        res.status(400).json({ error: 'currentState is required' });
        return;
      }

      if (!request.currentState.myRole) {
        res.status(400).json({ error: 'myRole is required in currentState' });
        return;
      }

      // Merge weights with defaults to avoid undefined values
      const weights: RecommendationWeights = {
        ...config.defaultWeights,
        ...(request.weights || {})
      };

      const recommendations = await recommendationService.getRecommendations(
        request.currentState,
        weights,
        request.topN || 5
      );

      const response: RecommendationResponse = {
        recommendations,
        timestamp: Date.now(),
        patch: 'latest'
      };

      res.json(response);

    } catch (error) {
      logger.error('Failed to generate recommendations', error);
      res.status(500).json({
        error: 'Failed to generate recommendations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/champion-select
   */
  async getChampionSelect(_req: Request, res: Response): Promise<void> {
    try {
      const session = await lcuService.getChampionSelectSession();
      if (!session) {
        res.status(404).json({ error: 'No active champion select session' });
        return;
      }
      res.json(session);
    } catch (error) {
      logger.error('Failed to fetch champion select session', error);
      res.status(500).json({ error: 'Failed to fetch champion select session' });
    }
  }

  /**
   * GET /api/status
   */
  async getStatus(_req: Request, res: Response): Promise<void> {
    try {
      const isConnected = lcuService.isClientConnected();
      const cacheStats = cacheService.getStats();

      res.json({
        status: 'ok',
        lcuConnected: isConnected,
        cache: cacheStats,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Status check failed', error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/champions
   */
  async getChampions(_req: Request, res: Response): Promise<void> {
    try {
      const championsMap = await riotApiService.getAllChampions();
      const champions = Array.from(championsMap.values()).map(c => ({
        id: c.id,
        name: c.name
      }));
      res.json(champions);
    } catch (error) {
      logger.error('Failed to fetch champions', error);
      res.status(500).json({ error: 'Failed to fetch champions list' });
    }
  }

  /**
   * GET /api/champion/:id/stats/:role
   */
  async getChampionStats(req: Request, res: Response): Promise<void> {
    try {
      const championId = parseInt(req.params.id, 10);
      const role = req.params.role as any;

      if (isNaN(championId)) {
        res.status(400).json({ error: 'Invalid champion ID' });
        return;
      }

      const stats = await recommendationService.calculateChampionScore(championId, { 
        myRole: role, 
        myTeam: [], 
        enemyTeam: [], 
        bannedChampions: [], 
        phase: 'pick', 
        timer: 0 
      }, config.defaultWeights);

      if (!stats) {
        res.status(404).json({ error: 'Champion stats not found' });
        return;
      }

      res.json(stats);

    } catch (error) {
      logger.error('Failed to fetch champion stats', error);
      res.status(500).json({ error: 'Failed to fetch champion stats' });
    }
  }

  /**
   * POST /api/cache/clear
   */
  async clearCache(_req: Request, res: Response): Promise<void> {
    try {
      cacheService.clear();
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      logger.error('Failed to clear cache', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }

  /**
   * POST /api/cache/warmup
   */
  async warmupCache(_req: Request, res: Response): Promise<void> {
    try {
      // Top 30 champions to warmup cache
      const topChampions = [
        157, 238, 64, 11, 555, 777, 110, 234, 202, 120,
        145, 81, 89, 92, 67, 498, 39, 99, 105, 35,
        236, 22, 412, 221, 121, 18, 103, 268, 141, 76
      ];
      const roles = ['top', 'jungle', 'middle', 'bottom', 'utility'] as any[];

      for (const championId of topChampions) {
        for (const role of roles) {
          await recommendationService.calculateChampionScore(championId, {
            myRole: role,
            myTeam: [],
            enemyTeam: [],
            bannedChampions: [],
            phase: 'pick',
            timer: 0
          }, config.defaultWeights);
        }
      }

      res.json({ message: 'Cache warmup completed' });
    } catch (error) {
      logger.error('Failed to warmup cache', error);
      res.status(500).json({ error: 'Failed to warmup cache' });
    }
  }
}

export const apiController = new ApiController();


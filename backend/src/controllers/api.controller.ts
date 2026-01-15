import { Request, Response } from 'express';
import recommendationService from '../services/recommendation.service';
import lcuService from '../services/lcu.service';
import dataService from '../services/data.service';
import cacheService from '../services/cache.service';
import logger from '../utils/logger';
import { RecommendationRequest, RecommendationResponse } from '../types';

/**
 * API Controller handling HTTP requests
 */
export class ApiController {
  /**
   * GET /api/recommendations
   * Generate champion recommendations based on current game state
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

      const recommendations = await recommendationService.getRecommendations(
        request.currentState,
        request.weights ? recommendationService.normalizeWeights(request.weights) : undefined,
        request.topN || 5
      );

      const patch = await dataService.getCurrentPatch();

      const response: RecommendationResponse = {
        recommendations,
        timestamp: Date.now(),
        patch
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
   * Get current champion select session from League Client
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
   * Check service health and connection status
   */
  async getStatus(_req: Request, res: Response): Promise<void> {
    try {
      const isConnected = lcuService.isClientConnected();
      const patch = await dataService.getCurrentPatch();
      const cacheStats = cacheService.getStats();

      res.json({
        status: 'ok',
        lcuConnected: isConnected,
        patch,
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
   * Get list of all champions
   */
  async getChampions(_req: Request, res: Response): Promise<void> {
    try {
      const championsMap = await dataService.getAllChampions();
      const champions = Array.from(championsMap.entries()).map(([id, name]) => ({
        id,
        name
      }));

      res.json(champions);
    } catch (error) {
      logger.error('Failed to fetch champions', error);
      res.status(500).json({ error: 'Failed to fetch champions list' });
    }
  }

  /**
   * GET /api/champion/:id/stats/:role
   * Get statistics for a specific champion and role
   */
  async getChampionStats(req: Request, res: Response): Promise<void> {
    try {
      const championId = parseInt(req.params.id, 10);
      const role = req.params.role as any;

      if (isNaN(championId)) {
        res.status(400).json({ error: 'Invalid champion ID' });
        return;
      }

      const stats = await dataService.getChampionStats(championId, role);
      
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
   * Clear all cached data
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
   * Warmup cache with popular champions
   */
  async warmupCache(_req: Request, res: Response): Promise<void> {
    try {
      // Top 30 most popular champions (by champion key)
      const topChampions = [
        157, 238, 64, 11, 555, 777, 110, 234, 202, 120,
        145, 81, 89, 92, 67, 498, 39, 99, 105, 35,
        236, 22, 412, 221, 121, 18, 103, 268, 141, 76
      ];
      
      const roles = ['top', 'jungle', 'middle', 'bottom', 'utility'] as any[];
      
      await dataService.warmupCache(topChampions, roles);
      
      res.json({ message: 'Cache warmup completed' });
    } catch (error) {
      logger.error('Failed to warmup cache', error);
      res.status(500).json({ error: 'Failed to warmup cache' });
    }
  }
}

export const apiController = new ApiController();
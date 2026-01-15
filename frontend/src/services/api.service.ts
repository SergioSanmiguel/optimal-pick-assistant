import axios, { AxiosInstance } from 'axios';
import {
  RecommendationResponse,
  ChampionSelectState,
  RecommendationWeights,
  AppStatus,
  Champion,
  ChampionStats,
  Role
} from '../types';

/**
 * API service for communication with backend
 */
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get champion recommendations
   */
  async getRecommendations(
    currentState: ChampionSelectState,
    weights?: Partial<RecommendationWeights>,
    topN: number = 5
  ): Promise<RecommendationResponse> {
    const response = await this.client.post<RecommendationResponse>('/recommendations', {
      currentState,
      weights,
      topN
    });
    return response.data;
  }

  /**
   * Get current champion select session from LCU
   */
  async getChampionSelect(): Promise<any> {
    const response = await this.client.get('/champion-select');
    return response.data;
  }

  /**
   * Get application status
   */
  async getStatus(): Promise<AppStatus> {
    const response = await this.client.get<AppStatus>('/status');
    return response.data;
  }

  /**
   * Get all champions
   */
  async getChampions(): Promise<Champion[]> {
    const response = await this.client.get<Champion[]>('/champions');
    return response.data;
  }

  /**
   * Get champion stats for specific role
   */
  async getChampionStats(championId: number, role: Role): Promise<ChampionStats> {
    const response = await this.client.get<ChampionStats>(`/champion/${championId}/stats/${role}`);
    return response.data;
  }

  /**
   * Clear backend cache
   */
  async clearCache(): Promise<void> {
    await this.client.post('/cache/clear');
  }

  /**
   * Warmup cache with popular champions
   */
  async warmupCache(): Promise<void> {
    await this.client.post('/cache/warmup');
  }
}

export const apiService = new ApiService();
export default apiService;
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';
import { 
  AppStatus, 
  ChampionSelectState, 
  RecommendationScore, 
  RecommendationWeights,
  Role 
} from '../types';

/**
 * Hook to fetch and monitor application status
 */
export function useAppStatus() {
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiService.getStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    // Poll status every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { status, isLoading, error, refetch: fetchStatus };
}


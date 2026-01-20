import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';
import { 
  AppStatus, 
  ChampionSelectState, 
  RecommendationScore, 
  RecommendationWeights,
  Role 
} from '../types';

export function useRecommendations(
  championSelect: ChampionSelectState | null,
  selectedRole: Role | undefined,
  weights: RecommendationWeights
) {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!championSelect || !selectedRole) return; // <- no borrar el array actual

    setIsLoading(true);
    try {
      const response = await apiService.getRecommendations(
        { ...championSelect, myRole: selectedRole },
        weights,
        5
      );
      if (response?.recommendations) {
        setRecommendations(prev => [...prev]); // <- opcional merge si quieres animación
        setRecommendations(response.recommendations); // actualizar
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
      // no vaciar recommendations
    } finally {
      setIsLoading(false);
    }
  }, [championSelect, selectedRole, weights]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, isLoading, error, refetch: fetchRecommendations };
}

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';
import { 
  AppStatus, 
  ChampionSelectState, 
  RecommendationScore, 
  RecommendationWeights,
  Role 
} from '../types';

export function useChampionSelect() {
  const [championSelect, setChampionSelect] = useState<ChampionSelectState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchChampionSelect = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getChampionSelect();
      
      // Transform LCU data to our format
      if (data) {
        const transformed: ChampionSelectState = {
          myTeam: data.myTeam?.map((p: any) => ({
            championId: p.championId,
            role: p.assignedPosition?.toLowerCase() as Role,
            summonerId: p.summonerId
          })) || [],
          enemyTeam: data.theirTeam?.map((p: any) => ({
            championId: p.championId,
            role: p.assignedPosition?.toLowerCase() as Role,
            summonerId: p.summonerId
          })) || [],
          bannedChampions: [
            ...(data.bans?.myTeamBans || []),
            ...(data.bans?.theirTeamBans || [])
          ].map((b: any) => b.championId),
          myRole: data.localPlayerCellId !== undefined 
            ? data.myTeam?.[data.localPlayerCellId]?.assignedPosition?.toLowerCase() as Role
            : undefined,
          phase: data.timer?.phase || 'pick',
          timer: data.timer?.adjustedTimeLeftInPhase || 0
        };
        
        setChampionSelect(transformed);
      } else {
        setChampionSelect(null);
      }
      
      setError(null);
    } catch (err) {
      setError(err as Error);
      setChampionSelect(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChampionSelect();
    
    // Poll every 2 seconds during champion select
    const interval = setInterval(fetchChampionSelect, 2000);
    
    return () => clearInterval(interval);
  }, [fetchChampionSelect]);

  return { championSelect, isLoading, error, refetch: fetchChampionSelect };
}

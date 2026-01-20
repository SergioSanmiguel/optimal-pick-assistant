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
        setChampionSelect(prev => ({ ...prev, ...transformed })); // <- merge con datos previos
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
      // no borrar championSelect para evitar flash blanco
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChampionSelect();
    const interval = setInterval(fetchChampionSelect, 2000);
    return () => clearInterval(interval);
  }, [fetchChampionSelect]);

  return { championSelect, isLoading, error, refetch: fetchChampionSelect };
}


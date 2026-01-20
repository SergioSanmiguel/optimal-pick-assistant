import { Users, Swords, Ban } from 'lucide-react';
import { ChampionSelectState } from '../types';
import React from 'react';

interface TeamCompositionProps {
  championSelect: ChampionSelectState | null;
  isLoading: boolean;
}

// Componente memoizado
const TeamCompositionComponent = ({ championSelect, isLoading }: TeamCompositionProps) => {
  // Skeleton mientras carga
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
            <div className="h-4 bg-slate-800 rounded w-1/3" />
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-12 bg-slate-800 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!championSelect) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center">
          <Users className="text-slate-600" size={24} />
        </div>
        <p className="text-sm text-slate-500">No active champion select</p>
      </div>
    );
  }

  // Función para renderizar equipo
  const renderTeam = (team: typeof championSelect.myTeam, isEnemy = false) => {
    const bgGradient = isEnemy ? 'from-red-500/20 to-orange-500/20' : 'from-emerald-500/20 to-cyan-500/20';
    const Icon = isEnemy ? Swords : Users;
    const teamName = isEnemy ? 'Enemy Team' : 'Your Team';

    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-lg ${isEnemy ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
            <Icon size={16} className={isEnemy ? 'text-red-400' : 'text-emerald-400'} />
          </div>
          <h3 className="text-sm font-semibold text-white">{teamName}</h3>
          <span className="ml-auto text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
            {team.length}/5
          </span>
        </div>

        <div className="space-y-2">
          {team.length > 0 ? (
            team.map((pick, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-3 p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-slate-700/30 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bgGradient} flex items-center justify-center font-mono text-xs ${isEnemy ? 'text-red-400' : 'text-emerald-400'}`}>
                  #{pick.championId}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">Champion {pick.championId}</p>
                  {pick.role && <p className="text-xs text-slate-500 capitalize">{pick.role}</p>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-600 text-center py-4">No picks yet</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderTeam(championSelect.myTeam, false)}
      {renderTeam(championSelect.enemyTeam, true)}

      {/* Bans */}
      {championSelect.bannedChampions.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Ban size={16} className="text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Banned Champions</h3>
            <span className="ml-auto text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
              {championSelect.bannedChampions.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {championSelect.bannedChampions.map((ban, idx) => (
              <div
                key={idx}
                className="w-12 h-12 rounded-lg bg-slate-800/50 border border-slate-700/30 flex items-center justify-center relative group"
              >
                <span className="text-xs font-mono text-slate-600">#{ban}</span>
                <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 rounded-lg transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Memoiza para que no se re-renderice si no cambian props
export default React.memo(TeamCompositionComponent, (prev, next) => {
  return prev.championSelect === next.championSelect && prev.isLoading === next.isLoading;
});

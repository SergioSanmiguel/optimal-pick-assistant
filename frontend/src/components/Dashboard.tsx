import { RefreshCw } from 'lucide-react';
import RoleSelector from './RoleSelector';
import TeamComposition from './TeamComposition';
import RecommendationCards from './RecommendationCards';
import { ChampionSelectState, RecommendationScore, Role } from '../types';

interface DashboardProps {
  championSelect: ChampionSelectState | null;
  recommendations: RecommendationScore[];
  selectedRole: Role | undefined;
  onRoleChange: (role: Role) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function Dashboard({
  championSelect,
  recommendations,
  selectedRole,
  onRoleChange,
  onRefresh,
  isLoading
}: DashboardProps) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Panel - Team Info */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <RoleSelector
          selectedRole={selectedRole}
          onRoleChange={onRoleChange}
        />
        
        <TeamComposition
          championSelect={championSelect}
          isLoading={isLoading}
        />
      </div>

      {/* Right Panel - Recommendations */}
      <div className="col-span-12 lg:col-span-8">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Top Recommendations
              </h2>
              <p className="text-sm text-slate-400">
                AI-powered champion suggestions based on current meta
              </p>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading || !selectedRole}
              className="group relative px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
            >
              <div className="flex items-center gap-2">
                <RefreshCw 
                  size={18} 
                  className={`text-white ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} 
                />
                <span className="font-semibold text-white text-sm">
                  {isLoading ? 'Analyzing...' : 'Refresh'}
                </span>
              </div>
            </button>
          </div>

          {!selectedRole ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <p className="text-slate-400 text-lg">Select your role to begin</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-slate-800/50 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <RecommendationCards recommendations={recommendations} />
          )}
        </div>
      </div>
    </div>
  );
}
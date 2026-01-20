import { useState, useEffect } from 'react';
import { Activity, Settings as SettingsIcon, Zap, TrendingUp } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StatusBar from './components/StatusBar';
import Settings from './components/Settings';
import { useAppStatus } from './hooks/useAppStatus';
import { useChampionSelect } from './hooks/useChampionSelect';
import { useRecommendations } from './hooks/useRecommendations';
import { Role, RecommendationWeights } from './types';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [weights, setWeights] = useState<RecommendationWeights>({
    winRate: 0.40,
    pickRate: 0.10,
    counterScore: 0.30,
    synergyScore: 0.20
  });

  const { status, isLoading: statusLoading } = useAppStatus();
  const { championSelect, isLoading: csLoading } = useChampionSelect();
  const { recommendations, isLoading: recsLoading, refetch } = useRecommendations(
    championSelect,
    selectedRole,
    weights
  );

  useEffect(() => {
    if (championSelect?.myRole && !selectedRole) {
      setSelectedRole(championSelect.myRole);
    }
  }, [championSelect, selectedRole]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
      
      <div className="relative">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur-lg opacity-50" />
                  <div className="relative bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-lg">
                    <Zap className="text-white" size={28} strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Optimal Pick
                  </h1>
                  <p className="text-sm text-slate-400 flex items-center gap-2">
                    <Activity size={14} />
                    Powered by Riot Games API
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <StatusBar 
                  isConnected={status?.lcuConnected || false}
                  patch={status?.patch}
                  isLoading={statusLoading}
                />
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="group p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300"
                  title="Settings"
                >
                  <SettingsIcon 
                    size={20} 
                    className="text-slate-400 group-hover:text-cyan-400 group-hover:rotate-90 transition-all duration-300" 
                  />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {statusLoading ? (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" />
                </div>
                <p className="text-slate-400">Initializing systems...</p>
              </div>
            </div>
          ) : !status?.lcuConnected ? (
            <div className="max-w-2xl mx-auto mt-20">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="text-amber-400" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  League Client Offline
                </h2>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Start the League of Legends client to receive real-time champion recommendations during champion select
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-slate-500 bg-slate-800/30 px-4 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Waiting for connection...
                </div>
              </div>
            </div>
          ) : (
            <Dashboard
              championSelect={championSelect}
              recommendations={recommendations}
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
              onRefresh={refetch}
              isLoading={csLoading || recsLoading}
            />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          weights={weights}
          onWeightsChange={setWeights}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
import { useState, useEffect } from 'react';
import { Shield, Settings, RefreshCw } from 'lucide-react';
import StatusIndicator from './components/StatusIndicator';
import ChampionSelectMonitor from './components/ChampionSelectMonitor';
import RecommendationList from './components/RecommendationList';
import SettingsPanel from './components/Settings';
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

  // Auto-select role from champion select if available
  useEffect(() => {
    if (championSelect?.myRole && !selectedRole) {
      setSelectedRole(championSelect.myRole);
    }
  }, [championSelect, selectedRole]);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lol-dark via-lol-darker to-lol-dark text-white font-lol">
      {/* Header */}
      <header className="border-b border-lol-border bg-lol-panel/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-lol-gold" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-lol-gold">Optimal Pick Assistant</h1>
              <p className="text-xs text-gray-400">League of Legends Champion Recommender</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <StatusIndicator 
              isConnected={status?.lcuConnected || false}
              patch={status?.patch}
            />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-lol-panel transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {statusLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lol-gold"></div>
          </div>
        ) : !status?.lcuConnected ? (
          <div className="bg-lol-panel border border-lol-border rounded-lg p-8 text-center">
            <Shield className="mx-auto mb-4 text-gray-500" size={48} />
            <h2 className="text-xl font-semibold mb-2">League Client Not Connected</h2>
            <p className="text-gray-400 mb-4">
              Please start the League of Legends client to use the Pick Assistant
            </p>
            <p className="text-sm text-gray-500">
              The app will automatically connect when the client is running
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Champion Select Monitor */}
            <div className="lg:col-span-1">
              <ChampionSelectMonitor
                championSelect={championSelect}
                selectedRole={selectedRole}
                onRoleChange={setSelectedRole}
                isLoading={csLoading}
              />
            </div>

            {/* Right Panel - Recommendations */}
            <div className="lg:col-span-2">
              <div className="bg-lol-panel border border-lol-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-lol-gold">
                    Recommended Champions
                  </h2>
                  <button
                    onClick={handleRefresh}
                    disabled={recsLoading || !selectedRole}
                    className="flex items-center gap-2 px-4 py-2 bg-lol-gold/10 hover:bg-lol-gold/20 text-lol-gold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={16} className={recsLoading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

                {!selectedRole ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>Please select your role to get recommendations</p>
                  </div>
                ) : recsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lol-gold"></div>
                  </div>
                ) : (
                  <RecommendationList recommendations={recommendations} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel
          weights={weights}
          onWeightsChange={setWeights}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
import { X, RotateCcw, Save } from 'lucide-react';
import { RecommendationWeights } from '../types';

interface SettingsPanelProps {
  weights: RecommendationWeights;
  onWeightsChange: (weights: RecommendationWeights) => void;
  onClose: () => void;
}

export default function SettingsPanel({ weights, onWeightsChange, onClose }: SettingsPanelProps) {
  const handleWeightChange = (key: keyof RecommendationWeights, value: number) => {
    onWeightsChange({
      ...weights,
      [key]: value
    });
  };

  const resetDefaults = () => {
    onWeightsChange({
      winRate: 0.40,
      pickRate: 0.10,
      counterScore: 0.30,
      synergyScore: 0.20
    });
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Recommendation Settings
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Fine-tune how champions are ranked
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-sm text-slate-300 mb-2">
              <span className="font-semibold text-white">How it works:</span> Each factor is weighted and combined to calculate the final recommendation score. Higher weights prioritize that metric.
            </p>
            <p className="text-xs text-slate-500">
              Weights are automatically normalized during calculation, so their relative proportions matter most.
            </p>
          </div>

          {/* Weight Sliders */}
          <div className="space-y-5">
            <WeightSlider
              label="Win Rate"
              description="Champion's overall win rate in the role"
              icon="🏆"
              value={weights.winRate}
              onChange={(v) => handleWeightChange('winRate', v)}
              color="from-yellow-500 to-amber-500"
            />

            <WeightSlider
              label="Meta Strength"
              description="How popular/reliable the champion is"
              icon="📊"
              value={weights.pickRate}
              onChange={(v) => handleWeightChange('pickRate', v)}
              color="from-blue-500 to-cyan-500"
            />

            <WeightSlider
              label="Counter Score"
              description="Matchup advantage vs enemy champions"
              icon="⚔️"
              value={weights.counterScore}
              onChange={(v) => handleWeightChange('counterScore', v)}
              color="from-red-500 to-orange-500"
            />

            <WeightSlider
              label="Synergy Score"
              description="Team composition compatibility"
              icon="🤝"
              value={weights.synergyScore}
              onChange={(v) => handleWeightChange('synergyScore', v)}
              color="from-purple-500 to-pink-500"
            />
          </div>

          {/* Total Weight Info */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total Weight:</span>
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {totalWeight.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(totalWeight * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex gap-3">
          <button
            onClick={resetDefaults}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all duration-300"
          >
            <RotateCcw size={18} />
            <span className="font-semibold">Reset to Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
          >
            <Save size={18} />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function WeightSlider({ label, description, icon, value, onChange, color }: {
  label: string;
  description: string;
  icon: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}) {
  const percentage = (value * 100).toFixed(0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <label className="text-sm font-semibold text-white">{label}</label>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${color} shadow-lg`}>
          <span className="text-sm font-bold text-white">{percentage}%</span>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider w-full"
      />
    </div>
  );
}
import { X } from 'lucide-react';
import { RecommendationWeights } from '../../types';

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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-lol-panel border border-lol-border rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-lol-border">
          <h2 className="text-lg font-semibold text-lol-gold">Recommendation Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-lol-darker rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-400">
            Adjust the weights to customize how recommendations are calculated. 
            Higher values prioritize that factor more.
          </p>

          {/* Weight Sliders */}
          <div className="space-y-4">
            <WeightSlider
              label="Win Rate"
              description="Champion's overall win rate in the role"
              value={weights.winRate}
              onChange={(v) => handleWeightChange('winRate', v)}
            />

            <WeightSlider
              label="Pick Rate"
              description="How popular/reliable the champion is"
              value={weights.pickRate}
              onChange={(v) => handleWeightChange('pickRate', v)}
            />

            <WeightSlider
              label="Counter Score"
              description="Matchup advantage vs enemy champions"
              value={weights.counterScore}
              onChange={(v) => handleWeightChange('counterScore', v)}
            />

            <WeightSlider
              label="Synergy Score"
              description="Team composition compatibility"
              value={weights.synergyScore}
              onChange={(v) => handleWeightChange('synergyScore', v)}
            />
          </div>

          {/* Total Weight Info */}
          <div className="pt-4 border-t border-lol-border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Total Weight:</span>
              <span className="font-semibold text-lol-gold">
                {(weights.winRate + weights.pickRate + weights.counterScore + weights.synergyScore).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Weights are automatically normalized during calculation
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-lol-border flex gap-3">
          <button
            onClick={resetDefaults}
            className="flex-1 px-4 py-2 bg-lol-darker hover:bg-lol-dark text-white rounded-lg transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-lol-gold hover:bg-lol-gold/90 text-lol-dark font-semibold rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function WeightSlider({ label, description, value, onChange }: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-200">{label}</label>
        <span className="text-sm font-semibold text-lol-gold">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-lol-darker rounded-lg appearance-none cursor-pointer slider"
      />
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}
import { Trophy, TrendingUp, Users as UsersIcon, Swords } from 'lucide-react';
import { RecommendationScore } from '../../types';

interface RecommendationListProps {
  recommendations: RecommendationScore[];
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No recommendations available</p>
        <p className="text-sm mt-2">Try selecting a different role or adjusting weights</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <RecommendationCard key={rec.championId} recommendation={rec} rank={index + 1} />
      ))}
    </div>
  );
}

function RecommendationCard({ recommendation, rank }: { recommendation: RecommendationScore; rank: number }) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'text-yellow-400';
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-gray-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-lol-darker border border-lol-border rounded-lg p-4 hover:border-lol-gold transition-colors">
      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
            rank === 1 ? 'bg-lol-gold text-lol-dark' : 'bg-lol-panel text-gray-400'
          }`}>
            {rank}
          </div>
        </div>

        {/* Champion Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{recommendation.championName}</h3>
            <span className={`text-sm font-bold ${getTierColor(recommendation.stats.tier)}`}>
              {recommendation.stats.tier} Tier
            </span>
            <div className="ml-auto">
              <div className="text-right">
                <div className="text-lg font-bold text-lol-gold">
                  {recommendation.totalScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-400">Score</div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            <StatItem
              icon={<Trophy size={14} />}
              label="Win Rate"
              value={`${(recommendation.stats.winRate * 100).toFixed(1)}%`}
              score={recommendation.breakdown.winRateScore}
            />
            <StatItem
              icon={<TrendingUp size={14} />}
              label="Pick Rate"
              value={`${(recommendation.stats.pickRate * 100).toFixed(1)}%`}
              score={recommendation.breakdown.pickRateScore}
            />
            <StatItem
              icon={<Swords size={14} />}
              label="Matchup"
              value={`${recommendation.breakdown.counterScore.toFixed(0)}/100`}
              score={recommendation.breakdown.counterScore}
            />
            <StatItem
              icon={<UsersIcon size={14} />}
              label="Synergy"
              value={`${recommendation.breakdown.synergyScore.toFixed(0)}/100`}
              score={recommendation.breakdown.synergyScore}
            />
          </div>

          {/* Reasoning */}
          <div className="space-y-1">
            {recommendation.reasoning.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-lol-gold mt-0.5">•</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, score }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  score: number;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={`text-sm font-semibold ${getScoreColor(score)}`}>
        {value}
      </div>
    </div>
  );
}
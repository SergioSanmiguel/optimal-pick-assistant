import { Trophy, Target, Users as UsersIcon, Swords, TrendingUp, Crown } from 'lucide-react';
import { RecommendationScore } from '../types';

interface RecommendationCardsProps {
  recommendations: RecommendationScore[];
}

export default function RecommendationCards({ recommendations }: RecommendationCardsProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
          <Target className="text-slate-600" size={32} />
        </div>
        <p className="text-slate-400 mb-2">No recommendations available</p>
        <p className="text-sm text-slate-600">Try adjusting your settings or wait for more picks</p>
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
  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'S': return 'from-yellow-500 to-amber-500';
      case 'A': return 'from-emerald-500 to-green-500';
      case 'B': return 'from-blue-500 to-cyan-500';
      case 'C': return 'from-slate-500 to-slate-600';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  const getTierIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-400" size={24} />;
    return <Trophy className="text-slate-400" size={20} />;
  };

  return (
    <div className="group relative bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 rounded-xl p-5 transition-all duration-300">
      {/* Rank Badge */}
      <div className="absolute -top-3 -left-3">
        <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
          rank === 1 
            ? 'bg-gradient-to-br from-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/25' 
            : 'bg-slate-700 group-hover:bg-slate-600'
        }`}>
          {rank === 1 && (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl blur-xl opacity-50" />
          )}
          <span className="relative text-white">{rank}</span>
        </div>
      </div>

      <div className="flex items-start gap-5 ml-8">
        {/* Champion Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-white">
              {recommendation.championName}
            </h3>
            
            <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${getTierGradient(recommendation.stats.tier)} shadow-lg`}>
              <span className="text-xs font-bold text-white">
                {recommendation.stats.tier} Tier
              </span>
            </div>

            <div className="ml-auto">
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {recommendation.totalScore.toFixed(0)}
                </div>
                <div className="text-xs text-slate-500">score</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <StatPill
              icon={<Trophy size={14} />}
              label="Win Rate"
              value={`${(recommendation.stats.winRate * 100).toFixed(1)}%`}
              score={recommendation.breakdown.winRateScore}
            />
            <StatPill
              icon={<TrendingUp size={14} />}
              label="Meta"
              value={recommendation.stats.tier}
              score={recommendation.breakdown.pickRateScore}
            />
            <StatPill
              icon={<Swords size={14} />}
              label="vs Enemy"
              value={`${recommendation.breakdown.counterScore.toFixed(0)}`}
              score={recommendation.breakdown.counterScore}
            />
            <StatPill
              icon={<UsersIcon size={14} />}
              label="Synergy"
              value={`${recommendation.breakdown.synergyScore.toFixed(0)}`}
              score={recommendation.breakdown.synergyScore}
            />
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            {recommendation.reasoning.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                <span className="text-slate-300">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value, score }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  score: number;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400';
    if (score >= 50) return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400';
    return 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400';
  };

  return (
    <div className={`bg-gradient-to-br ${getScoreColor(score)} border rounded-lg p-3 text-center`}>
      <div className="flex items-center justify-center gap-1 mb-1.5 text-slate-400">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-sm font-bold">
        {value}
      </div>
    </div>
  );
}
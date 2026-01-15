import { Users, Swords } from 'lucide-react';
import { ChampionSelectState, Role } from '../types';

interface ChampionSelectMonitorProps {
  championSelect: ChampionSelectState | null;
  selectedRole: Role | undefined;
  onRoleChange: (role: Role) => void;
  isLoading: boolean;
}

const ROLES = [
  { value: Role.TOP, label: 'Top', icon: '🛡️' },
  { value: Role.JUNGLE, label: 'Jungle', icon: '🌲' },
  { value: Role.MIDDLE, label: 'Mid', icon: '⚔️' },
  { value: Role.BOTTOM, label: 'ADC', icon: '🏹' },
  { value: Role.UTILITY, label: 'Support', icon: '💚' }
];

export default function ChampionSelectMonitor({
  championSelect,
  selectedRole,
  onRoleChange,
  isLoading
}: ChampionSelectMonitorProps) {
  return (
    <div className="bg-lol-panel border border-lol-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-lol-gold">Champion Select</h2>

      {/* Role Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-300">Your Role</label>
        <div className="grid grid-cols-5 gap-2">
          {ROLES.map((role) => (
            <button
              key={role.value}
              onClick={() => onRoleChange(role.value)}
              className={`p-3 rounded-lg text-center transition-all ${
                selectedRole === role.value
                  ? 'bg-lol-gold text-lol-dark font-semibold'
                  : 'bg-lol-darker hover:bg-lol-darker/70 text-gray-300'
              }`}
              title={role.label}
            >
              <div className="text-xl mb-1">{role.icon}</div>
              <div className="text-xs">{role.label}</div>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lol-gold mx-auto mb-2"></div>
          <p className="text-sm">Loading champion select...</p>
        </div>
      ) : !championSelect ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No active champion select</p>
          <p className="text-xs mt-2">Start a game to see live data</p>
        </div>
      ) : (
        <>
          {/* Your Team */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-green-400" />
              <h3 className="text-sm font-semibold text-green-400">Your Team</h3>
            </div>
            <div className="space-y-2">
              {championSelect.myTeam.length > 0 ? (
                championSelect.myTeam.map((pick, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-lol-darker rounded"
                  >
                    <div className="w-8 h-8 bg-lol-panel rounded flex items-center justify-center text-xs">
                      #{pick.championId}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Champion {pick.championId}</p>
                      {pick.role && (
                        <p className="text-xs text-gray-400 capitalize">{pick.role}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-2">No picks yet</p>
              )}
            </div>
          </div>

          {/* Enemy Team */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Swords size={16} className="text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">Enemy Team</h3>
            </div>
            <div className="space-y-2">
              {championSelect.enemyTeam.length > 0 ? (
                championSelect.enemyTeam.map((pick, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-lol-darker rounded"
                  >
                    <div className="w-8 h-8 bg-lol-panel rounded flex items-center justify-center text-xs">
                      #{pick.championId}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Champion {pick.championId}</p>
                      {pick.role && (
                        <p className="text-xs text-gray-400 capitalize">{pick.role}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-2">No picks yet</p>
              )}
            </div>
          </div>

          {/* Bans */}
          {championSelect.bannedChampions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-300">Banned</h3>
              <div className="flex flex-wrap gap-2">
                {championSelect.bannedChampions.map((ban, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 bg-lol-darker rounded flex items-center justify-center text-xs opacity-50"
                  >
                    #{ban}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
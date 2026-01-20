import { Role } from '../types';
import React from 'react';

interface RoleSelectorProps {
  selectedRole: Role | undefined;
  onRoleChange: (role: Role) => void;
}

const ROLES = [
  { value: Role.TOP, label: 'Top', icon: '⚔️', color: 'from-red-500 to-orange-500', hoverColor: 'hover:shadow-red-500/25' },
  { value: Role.JUNGLE, label: 'Jungle', icon: '🌲', color: 'from-green-500 to-emerald-500', hoverColor: 'hover:shadow-green-500/25' },
  { value: Role.MIDDLE, label: 'Mid', icon: '⭐', color: 'from-yellow-500 to-amber-500', hoverColor: 'hover:shadow-yellow-500/25' },
  { value: Role.BOTTOM, label: 'ADC', icon: '🏹', color: 'from-blue-500 to-cyan-500', hoverColor: 'hover:shadow-blue-500/25' },
  { value: Role.UTILITY, label: 'Support', icon: '💚', color: 'from-purple-500 to-pink-500', hoverColor: 'hover:shadow-purple-500/25' }
];

// Botón memoizado individual para cada role
const RoleButton = React.memo(
  ({ role, selectedRole, onRoleChange }: { role: typeof ROLES[0]; selectedRole: Role | undefined; onRoleChange: (role: Role) => void }) => {
    const isSelected = selectedRole === role.value;
    return (
      <button
        onClick={() => onRoleChange(role.value)}
        className={`group relative p-4 rounded-xl transition-all duration-300 ${
          isSelected
            ? `bg-gradient-to-br ${role.color} shadow-lg ${role.hoverColor}`
            : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50'
        }`}
        title={role.label}
      >
        {isSelected && (
          <div className={`absolute inset-0 bg-gradient-to-br ${role.color} rounded-xl blur-xl opacity-30`} />
        )}
        <div className="relative">
          <div className={`text-3xl mb-2 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
            {role.icon}
          </div>
          <div className={`text-xs font-semibold transition-colors ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
            {role.label}
          </div>
        </div>
      </button>
    );
  },
  (prev, next) => prev.selectedRole === next.selectedRole // solo re-render si cambia el selectedRole
);

const RoleSelectorComponent = ({ selectedRole, onRoleChange }: RoleSelectorProps) => {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Select Your Role</h3>
      <div className="grid grid-cols-5 gap-3">
        {ROLES.map((role) => (
          <RoleButton key={role.value} role={role} selectedRole={selectedRole} onRoleChange={onRoleChange} />
        ))}
      </div>
    </div>
  );
};

// Memoiza todo el selector para evitar renders innecesarios
export default React.memo(RoleSelectorComponent, (prev, next) => prev.selectedRole === next.selectedRole);

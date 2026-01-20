import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface StatusBarProps {
  isConnected: boolean;
  patch?: string;
  isLoading: boolean;
}

export default function StatusBar({ isConnected, patch, isLoading }: StatusBarProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <Loader2 size={16} className="text-slate-400 animate-spin" />
        <span className="text-sm text-slate-400">Connecting...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-300 ${
      isConnected 
        ? 'bg-emerald-500/10 border-emerald-500/30' 
        : 'bg-slate-800/30 border-slate-700/50'
    }`}>
      <div className="relative">
        {isConnected ? (
          <>
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-50" />
            <Wifi size={16} className="relative text-emerald-400" />
          </>
        ) : (
          <WifiOff size={16} className="text-slate-500" />
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${
          isConnected ? 'text-emerald-400' : 'text-slate-500'
        }`}>
          {isConnected ? 'Connected' : 'Offline'}
        </span>
        
        {patch && isConnected && (
          <>
            <div className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400 font-mono">v{patch}</span>
          </>
        )}
      </div>
    </div>
  );
}
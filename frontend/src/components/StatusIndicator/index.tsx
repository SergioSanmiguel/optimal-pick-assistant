import { Circle } from 'lucide-react';

interface StatusIndicatorProps {
  isConnected: boolean;
  patch?: string;
}

export default function StatusIndicator({ isConnected, patch }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-lol-panel rounded-lg border border-lol-border">
      <div className="flex items-center gap-2">
        <Circle
          size={8}
          className={`${
            isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'
          }`}
        />
        <span className="text-sm font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {patch && (
        <>
          <div className="w-px h-4 bg-lol-border" />
          <span className="text-xs text-gray-400">Patch {patch}</span>
        </>
      )}
    </div>
  );
}
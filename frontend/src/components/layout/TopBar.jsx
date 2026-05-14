import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function TopBar() {
  const { user } = useAuth();
  
  return (
    <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-void/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
        Command Center <span className="text-zinc-800 mx-2">/</span> <span className="text-neon-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">Terminal</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse glow-neon-green" />
           <span className="text-[10px] font-bold text-neon-green uppercase tracking-widest">Live Sync</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-neon-pink font-black text-xs shadow-[0_0_10px_rgba(255,0,255,0.2)]">
          {user?.display_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </div>
  );
}

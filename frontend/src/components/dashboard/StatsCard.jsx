import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export function StatsCard({ label, value, icon: Icon, description, className }) {
  return (
    <Card className={cn('relative overflow-hidden group', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-zinc-100 tabular-nums">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-800/50 text-zinc-400 group-hover:text-accent transition-colors">
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      {description && (
        <p className="mt-4 text-[13px] text-zinc-500">{description}</p>
      )}
      
      {/* Subtle bottom highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </Card>
  );
}

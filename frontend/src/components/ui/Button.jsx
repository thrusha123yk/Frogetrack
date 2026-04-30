import React from 'react';
import { cn } from '../../lib/utils';

export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  type = 'button',
  disabled,
  ...props 
}) {
  const base = 'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none select-none';

  const variants = {
    primary: [
      'relative overflow-hidden',
      'bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700',
      'text-white',
      'border border-purple-500/40',
      'shadow-[0_0_15px_rgba(139,92,246,0.4),0_2px_8px_rgba(0,0,0,0.4)]',
      'hover:shadow-[0_0_25px_rgba(139,92,246,0.6),0_4px_16px_rgba(0,0,0,0.5)]',
      'hover:from-violet-500 hover:via-purple-500 hover:to-violet-600',
    ].join(' '),

    secondary: [
      'bg-purple-950/60 backdrop-blur-sm',
      'text-purple-200',
      'border border-purple-700/40',
      'hover:bg-purple-900/60 hover:border-purple-600/60',
      'hover:shadow-[0_0_12px_rgba(139,92,246,0.2)]',
    ].join(' '),

    ghost: [
      'text-purple-400',
      'hover:text-purple-200 hover:bg-purple-900/40',
    ].join(' '),

    danger: [
      'bg-rose-950/40 text-rose-400',
      'border border-rose-800/40',
      'hover:bg-rose-900/50 hover:border-rose-700/60',
    ].join(' '),
  };

  return (
    <button 
      type={type}
      disabled={disabled}
      className={cn(base, variants[variant] || variants.primary, className)}
      {...props}
    >
      {children}
    </button>
  );
}

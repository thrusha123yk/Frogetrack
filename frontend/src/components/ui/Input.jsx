import React from 'react';
import { cn } from '../../lib/utils';

export function Input({ 
  label, 
  helperText, 
  error, 
  className = '', 
  id,
  ...props 
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-xs font-semibold text-purple-400 uppercase tracking-wider px-0.5"
        >
          {label}
        </label>
      )}
      <input 
        id={inputId}
        className={cn(
          'flex h-11 w-full rounded-xl border bg-purple-950/40 backdrop-blur-sm px-3.5 py-2.5',
          'text-sm text-purple-100 placeholder:text-purple-600/60',
          'transition-all duration-200',
          'focus-visible:outline-none',
          error 
            ? 'border-rose-500/50 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500' 
            : 'border-purple-700/30 focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500/60 focus-visible:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
        )}
        {...props}
      />
      {(helperText || error) && (
        <p className={cn('text-xs px-0.5', error ? 'text-rose-400' : 'text-purple-600')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

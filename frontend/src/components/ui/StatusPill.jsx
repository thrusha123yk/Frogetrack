import React from 'react';

export function StatusPill({ 
  children, 
  status = 'neutral', // 'success', 'danger', 'warning', 'info', 'neutral'
  className = '' 
}) {
  let statusClass = '';
  switch (status) {
    case 'success':
      statusClass = 'pill-success';
      break;
    case 'danger':
      statusClass = 'pill-danger';
      break;
    case 'warning':
      statusClass = 'pill-warning';
      break;
    default:
      statusClass = 'bg-zinc-800 text-zinc-400 border border-zinc-700/50';
  }

  return (
    <span className={`pill ${statusClass} ${className}`}>
      {children}
    </span>
  );
}

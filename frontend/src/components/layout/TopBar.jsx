import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function TopBar() {
  const { user } = useAuth();
  
  return (
    <div className="h-16 flex items-center justify-between px-8 border-b border-subtle bg-canvas/80 backdrop-blur-md sticky top-0 z-10">
      <div className="text-secondary text-body-sm font-medium">
        Overview / <span className="text-primary">Dashboard</span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Placeholder for future global search if needed */}
        <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center border border-default text-caption font-bold">
          {user?.display_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </div>
  );
}

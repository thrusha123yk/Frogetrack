import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RoleGuard({ allowedRoles, children }) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
    <div className="h-screen w-full flex items-center justify-center" style={{backgroundColor:'#09090b'}}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:'#6366f1',borderTopColor:'transparent'}}></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

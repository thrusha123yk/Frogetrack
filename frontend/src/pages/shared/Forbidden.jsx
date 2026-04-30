import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export function Forbidden() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleGoHome = () => {
    if (role === 'mentor') {
      navigate('/dashboard');
    } else if (role === 'student') {
      navigate('/me/attendance');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-void">
      <div className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none z-0" 
             style={{ background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.08) 0%, transparent 70%)' }}>
      </div>
      
      <div className="card max-w-md w-full text-center relative z-10 space-y-6">
        <div className="w-16 h-16 rounded-full bg-danger-bg flex items-center justify-center mx-auto border border-danger-border">
          <ShieldAlert size={32} className="text-danger-fg" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-h1">Access Denied</h1>
          <p className="text-body-lg text-secondary">
            You don't have permission to view this page. If you think this is a mistake, contact your administrator.
          </p>
        </div>
        
        <Button className="w-full" onClick={handleGoHome}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}

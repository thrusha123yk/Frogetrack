import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mentor'); // 'mentor' | 'student'
  
  const [identifier, setIdentifier] = useState(''); // Email for mentor, USN for student
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const email = activeTab === 'mentor' ? identifier : `${identifier.toUpperCase()}@forge.local`;

    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder') {
      setError('Supabase is not configured. Please add your credentials.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Check if student is using default password (USN)
      if (activeTab === 'student' && password.toUpperCase() === identifier.toUpperCase()) {
        setNeedsPasswordChange(true);
        setLoading(false);
        return;
      }

      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please check your login details.');
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to update password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <div className="w-full max-w-[420px] relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center shadow-premium-lg">
            <Sparkles size={24} className="text-zinc-950" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">ForgeTrack</h1>
            <p className="text-sm text-zinc-500 font-medium">Enterprise Attendance Management</p>
          </div>
        </div>

        <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl p-8 md:p-10">
          {needsPasswordChange ? (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-accent">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-xl font-bold text-zinc-100">Secure Account</h2>
                <p className="text-sm text-zinc-400">
                  Please set a new password to continue.
                </p>
              </div>

              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? 'Updating...' : 'Set Password & Login'}
              </Button>
            </form>
          ) : (
            <div className="space-y-8">
              {/* Tabs */}
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/50">
                <button
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200",
                    activeTab === 'mentor' 
                      ? "bg-zinc-800 text-zinc-100 shadow-premium" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  onClick={() => { setActiveTab('mentor'); setError(''); }}
                >
                  Mentor
                </button>
                <button
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200",
                    activeTab === 'student' 
                      ? "bg-zinc-800 text-zinc-100 shadow-premium" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  onClick={() => { setActiveTab('student'); setError(''); }}
                >
                  Student
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <Input
                  label={activeTab === 'mentor' ? 'Business Email' : 'Student USN'}
                  type={activeTab === 'mentor' ? 'email' : 'text'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeTab === 'mentor' ? 'name@company.com' : '4SH24...'}
                  className="bg-zinc-950/50"
                />
                
                <div className="space-y-1">
                  <Input
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-zinc-950/50"
                  />
                  {activeTab === 'mentor' && (
                    <div className="flex justify-end px-1">
                      <button type="button" className="text-xs text-zinc-500 hover:text-accent transition-colors font-medium">
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-xl border border-red-400/20 animate-in fade-in zoom-in-95 duration-200">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-11 group" disabled={loading}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign in to dashboard <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-zinc-600 font-medium tracking-wide uppercase">
          Protected by Enterprise-grade Security
        </p>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* ── Background Neon Orbs ──────────────────────────────── */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-cyan/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-pink/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-[4000ms]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-void border border-white/5 rounded-full pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Branding */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-pink to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(255,0,255,0.3)] animate-neon-pulse">
            <Sparkles size={32} className="text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Forge<span className="text-neon-pink">Track</span>
            </h1>
            <p className="text-sm text-zinc-500 font-medium">Welcome Back</p>
          </div>
        </div>

        <Card className="border-white/10 bg-zinc-950/40 backdrop-blur-3xl p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
          
          {needsPasswordChange ? (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2 text-center mb-8">
                <div className="w-14 h-14 rounded-full bg-neon-cyan/10 flex items-center justify-center mx-auto mb-4 text-neon-cyan glow-neon-cyan border border-neon-cyan/20">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white">Set Your Password</h2>
                <p className="text-sm text-zinc-500 font-medium">
                  Please set a new password for your account
                </p>
              </div>

              <Input
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-void/50 border-zinc-800 focus:border-neon-cyan"
              />

              {error && (
                <div className="flex items-center gap-3 text-neon-pink text-xs font-semibold bg-neon-pink/5 p-4 rounded-xl border border-neon-pink/20">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full h-12 bg-neon-cyan hover:bg-neon-cyan/80 text-void font-bold glow-neon-cyan border-none" disabled={loading}>
                {loading ? 'Processing...' : 'Confirm Password'}
              </Button>
            </form>
          ) : (
            <div className="space-y-10">
              {/* Tabs */}
              <div className="flex bg-void p-1 rounded-2xl border border-white/5 shadow-inner">
                <button
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                    activeTab === 'mentor' 
                      ? "bg-zinc-900 text-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.15)] border border-neon-cyan/20" 
                      : "text-zinc-600 hover:text-zinc-400"
                  )}
                  onClick={() => { setActiveTab('mentor'); setError(''); }}
                >
                  Mentor Access
                </button>
                <button
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                    activeTab === 'student' 
                      ? "bg-zinc-900 text-neon-pink shadow-[0_0_15px_rgba(255,0,255,0.15)] border border-neon-pink/20" 
                      : "text-zinc-600 hover:text-zinc-400"
                  )}
                  onClick={() => { setActiveTab('student'); setError(''); }}
                >
                  Student Portal
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-6">
                  <Input
                    label={activeTab === 'mentor' ? 'Email Address' : 'Student USN'}
                    type={activeTab === 'mentor' ? 'email' : 'text'}
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={activeTab === 'mentor' ? 'mentor@example.com' : 'Enter your USN'}
                    className="bg-void/50 border-zinc-800 focus:border-neon-cyan h-12"
                  />
                  
                  <div className="space-y-2">
                    <Input
                      label="Password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-void/50 border-zinc-800 focus:border-neon-cyan h-12"
                    />
                    {activeTab === 'mentor' && (
                      <div className="flex justify-end px-1">
                        <button type="button" className="text-xs text-zinc-600 hover:text-neon-pink transition-colors font-medium">
                          Forgot Password?
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 text-neon-pink text-xs font-semibold bg-neon-pink/5 p-4 rounded-xl border border-neon-pink/20 animate-in fade-in zoom-in-95 duration-300">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className={cn(
                  "w-full h-14 group font-bold transition-all border-none text-white shadow-xl",
                  activeTab === 'mentor' ? "bg-neon-cyan/80 hover:bg-neon-cyan glow-neon-cyan" : "bg-neon-pink/80 hover:bg-neon-pink glow-neon-pink"
                )} disabled={loading}>
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="flex items-center gap-3">
                      Login <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </div>
          )}
        </Card>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-zinc-800" />
            <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">ForgeTrack Security</p>
            <div className="h-px w-8 bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

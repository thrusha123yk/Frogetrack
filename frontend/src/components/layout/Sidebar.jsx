import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  History,
  BookOpen,
  Upload,
  UserCheck,
  Calendar,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const { role, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const mentorLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-neon-cyan', glow: 'shadow-[0_0_10px_var(--color-neon-cyan-glow)]' },
    { to: '/attendance', label: 'Mark Attendance', icon: CheckSquare, color: 'text-neon-green', glow: 'shadow-[0_0_10px_var(--color-neon-green-glow)]' },
    { to: '/history', label: 'Student History', icon: History, color: 'text-neon-pink', glow: 'shadow-[0_0_10px_var(--color-neon-pink-glow)]' },
    { to: '/materials', label: 'Materials', icon: BookOpen, color: 'text-purple-400', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.3)]' },
  ];

  const dataLinks = [
    { to: '/upload', label: 'Manual Import', icon: Upload, color: 'text-neon-cyan', glow: 'shadow-[0_0_10px_var(--color-neon-cyan-glow)]' },
    { to: '/ai-upload', label: 'AI Smart Upload', icon: Sparkles, color: 'text-neon-pink', glow: 'shadow-[0_0_10px_var(--color-neon-pink-glow)]' },
  ];

  const studentLinks = [
    { to: '/me/attendance', label: 'My Attendance', icon: UserCheck, color: 'text-neon-green' },
    { to: '/me/upcoming', label: 'Upcoming', icon: Calendar, color: 'text-neon-cyan' },
    { to: '/me/materials', label: 'Materials', icon: BookOpen, color: 'text-purple-400' },
  ];

  return (
    <div className="w-[280px] h-screen bg-void/80 backdrop-blur-xl border-r border-white/5 flex flex-col fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">

      {/* Brand */}
      <div className="h-20 flex items-center px-8 gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-pink to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(255,0,255,0.4)] group cursor-pointer hover:scale-110 transition-transform">
          <Sparkles size={22} className="text-white animate-pulse" />
        </div>
        <span className="font-bold text-2xl text-white tracking-tight">
          Forge<span className="text-neon-pink">Track</span>
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-10 custom-scrollbar">

        {role === 'mentor' && (
          <>
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-600 px-4 py-2 uppercase tracking-widest">
                General
              </p>
              <div className="space-y-1">
                {mentorLinks.map(link => (
                  <NavItem key={link.to} {...link} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-600 px-4 py-2 uppercase tracking-widest">
                Management
              </p>
              <div className="space-y-1">
                {dataLinks.map(link => (
                  <NavItem key={link.to} {...link} />
                ))}
              </div>
            </div>
          </>
        )}

        {role === 'student' && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-600 px-4 py-2 uppercase tracking-widest">
              Student Portal
            </p>
            <div className="space-y-1">
              {studentLinks.map(link => (
                <NavItem key={link.to} {...link} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* User Section */}
      <div className="p-6 mt-auto">
        <div className="group relative p-4 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-neon-cyan/30 transition-all mb-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 p-[2px]">
              <div className="w-full h-full rounded-full bg-void flex items-center justify-center text-neon-cyan text-sm font-bold border border-neon-cyan/20">
                {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-neon-cyan transition-colors">
                {user?.display_name || 'User'}
              </p>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {role}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-zinc-500 hover:text-neon-pink hover:bg-neon-pink/5 border border-transparent hover:border-neon-pink/20 transition-all group"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider">Log out</span>
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, to, color, glow }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative group overflow-hidden",
          isActive
            ? `bg-white/5 border border-white/10 ${glow}`
            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-current", color)} />
          )}
          <Icon 
            size={20} 
            className={cn(
              "transition-all", 
              isActive ? color : "text-zinc-600 group-hover:text-zinc-400"
            )} 
            strokeWidth={isActive ? 2.5 : 2} 
          />
          <span className={cn(
            "tracking-tight transition-colors",
            isActive ? "text-white" : "group-hover:text-zinc-200"
          )}>
            {label}
          </span>
          {!isActive && (
            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
          )}
        </>
      )}
    </NavLink>
  );
}
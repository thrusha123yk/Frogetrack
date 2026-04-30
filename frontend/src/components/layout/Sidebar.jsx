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
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/attendance', label: 'Mark Attendance', icon: CheckSquare },
    { to: '/history', label: 'Student History', icon: History },
    { to: '/materials', label: 'Materials', icon: BookOpen },
  ];

  const dataLinks = [
    { to: '/upload', label: 'Upload CSV', icon: Upload },
  ];

  const studentLinks = [
    { to: '/me/attendance', label: 'My Attendance', icon: UserCheck },
    { to: '/me/upcoming', label: 'Upcoming', icon: Calendar },
    { to: '/me/materials', label: 'Materials', icon: BookOpen },
  ];

  return (
    <div className="w-[260px] h-screen bg-zinc-950 border-r border-zinc-800/50 flex flex-col fixed left-0 top-0 z-50">

      {/* Brand */}
      <div className="h-16 flex items-center px-6 gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
          <Sparkles size={18} className="text-zinc-950" />
        </div>
        <span className="font-semibold text-[17px] text-zinc-100">
          ForgeTrack
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-8">

        {role === 'mentor' && (
          <>
            <div className="space-y-1">
              <p className="text-[11px] text-zinc-500 px-3 py-2 uppercase">
                General
              </p>
              {mentorLinks.map(link => (
                <NavItem key={link.to} {...link} />
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-zinc-500 px-3 py-2 uppercase">
                Management
              </p>
              {dataLinks.map(link => (
                <NavItem key={link.to} {...link} />
              ))}
            </div>
          </>
        )}

        {role === 'student' && (
          <div className="space-y-1">
            <p className="text-[11px] text-zinc-500 px-3 py-2 uppercase">
              My Portal
            </p>
            {studentLinks.map(link => (
              <NavItem key={link.to} {...link} />
            ))}
          </div>
        )}

      </div>

      {/* User Section */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-zinc-900/50 mb-3">
          <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-bold">
            {user?.display_name ? user.display_name.charAt(0) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-100 truncate">
              {user?.display_name || 'User'}
            </p>
            <p className="text-xs text-zinc-500 capitalize">
              {role}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} />
            <span>Log out</span>
          </div>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ✅ FIXED NavItem (NO CRASH) */
function NavItem({ icon: Icon, label, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
          isActive
            ? "bg-zinc-900 text-white"
            : "text-zinc-400 hover:text-white hover:bg-zinc-900"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
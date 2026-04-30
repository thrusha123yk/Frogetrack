import React from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, User, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Map path to title
  const getPageTitle = (path) => {
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/attendance') return 'Mark Attendance';
    if (path === '/history') return 'Student History';
    if (path === '/materials') return 'Learning Materials';
    if (path === '/upload') return 'Data Upload';
    if (path.startsWith('/me')) return 'My Portal';
    return 'ForgeTrack';
  };

  // Breadcrumbs logic
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      <Sidebar />
      
      <div className="flex-1 ml-[260px] flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-6">
            {/* Back Button */}
            {location.pathname !== '/dashboard' && (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all hover:bg-zinc-800"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 className="text-sm font-semibold text-zinc-100">{getPageTitle(location.pathname)}</h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-all">
              <Search size={18} />
            </button>
            <button className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-all relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full border border-zinc-950"></span>
            </button>
            <div className="h-8 w-[1px] bg-zinc-800 mx-2"></div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-zinc-300 hidden sm:block">{user?.display_name}</p>
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                <User size={16} className="text-zinc-500" />
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumbs Sub-header */}
        <div className="px-10 py-3 border-b border-zinc-800/30 bg-zinc-950/40">
          <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            <Link to="/dashboard" className="hover:text-accent transition-colors flex items-center gap-1.5">
              <Home size={12} /> Home
            </Link>
            {pathnames.map((name, index) => {
              const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              return (
                <React.Fragment key={name}>
                  <ChevronRight size={10} className="text-zinc-700" />
                  {isLast ? (
                    <span className="text-zinc-300">{name.replace(/-/g, ' ')}</span>
                  ) : (
                    <Link to={routeTo} className="hover:text-accent transition-colors">
                      {name.replace(/-/g, ' ')}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-zinc-800/50 text-center">
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">
            ForgeTrack &copy; 2026 &bull; Production Grade Attendance System
          </p>
        </footer>
      </div>
    </div>
  );
}

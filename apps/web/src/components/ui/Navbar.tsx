import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, GraduationCap, Sparkles, User, LogIn, LogOut } from 'lucide-react';
import { Button } from './Button';
import { useAuthStore } from '../../store/authStore';

export const Navbar: React.FC<{ onToggleSidebar?: () => void; showSidebarToggle?: boolean }> = ({
  onToggleSidebar,
  showSidebarToggle = true,
}) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">AI Teacher</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/create-lesson"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 hover:opacity-95 transition-opacity"
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Lesson
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-2 pl-3 border-l border-slate-800 text-slate-300 hover:text-white"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                {user.name ? user.name.charAt(0) : 'S'}
              </div>
              <span className="hidden sm:inline text-xs font-semibold">{user.name || 'Student'}</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Log out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

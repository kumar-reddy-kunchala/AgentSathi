import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';
import { ExecutorProfileModal } from './ExecutorProfileModal';

interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: { id: string; label: string }[];
  accentColor?: 'teal' | 'purple' | 'indigo' | 'amber';
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  tabs,
  accentColor = 'teal',
}) => {
  const { role, user, executor, admin, logout, navigate, currentPath } = useAuth();

  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isExecutorProfileOpen, setIsExecutorProfileOpen] = useState(false);

  const getRoleBadge = () => {
    if (role === 'USER') {
      return (
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsUserProfileOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl hover:bg-stone-100 transition cursor-pointer border border-stone-200/80 bg-stone-50/80 text-left"
            title="View & Edit User Profile"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="font-bold text-stone-900 text-xs leading-tight">
                {user?.name || 'Kumar Reddy'}
              </div>
              <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>User Profile</span>
              </div>
            </div>
          </button>
        </div>
      );
    }
    if (role === 'EXECUTOR') {
      return (
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsExecutorProfileOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl hover:bg-stone-100 transition cursor-pointer border border-indigo-200/80 bg-indigo-50/50 text-left"
            title="View & Edit Executor Profile"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
              {executor?.name ? executor.name[0].toUpperCase() : 'E'}
            </div>
            <div>
              <div className="font-bold text-stone-900 text-xs leading-tight">
                {executor?.name || 'Verified Provider'}
              </div>
              <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
                <span>Executor Profile</span>
              </div>
            </div>
          </button>
        </div>
      );
    }
    if (role === 'ADMIN') {
      return (
        <div className="text-right">
          <div className="font-bold text-stone-900 text-sm leading-tight">
            Platform Administrator
          </div>
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-end gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>
            <span>ADMIN</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <header className="bg-white border-b border-stone-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => navigate(role === 'USER' ? '/user/dashboard' : role === 'ADMIN' ? '/admin/dashboard' : role === 'EXECUTOR' ? '/executor/dashboard' : '/')}
        >
          <div className="w-10 h-10 rounded-2xl bg-[#0070F3] text-white flex items-center justify-center shadow-xs">
            <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-stone-900 block leading-none font-sans">
              SERVICEAGENT
            </span>
            <span className="text-[10px] text-teal-600 font-extrabold tracking-widest uppercase block mt-1">
              SATHI AI COORDINATED
            </span>
          </div>
        </div>

        {/* Center Tabs if authenticated */}
        {tabs && tabs.length > 0 && onTabChange && (
          <nav className="hidden md:flex items-center gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? accentColor === 'purple'
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : accentColor === 'indigo'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : accentColor === 'amber'
                        ? 'bg-amber-50 text-amber-800 font-semibold'
                        : 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Action / Role Area */}
        <div className="flex items-center gap-4">
          {role ? (
            <>
              {getRoleBadge()}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 text-sm font-medium pl-2 hover:bg-stone-50 py-1.5 px-2.5 rounded-lg transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 sm:gap-5 text-sm">
              <button
                onClick={() => navigate('/user/login')}
                className={`font-medium transition ${
                  currentPath === '/user/login'
                    ? 'text-teal-700 font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                User Sign In
              </button>
              <button
                onClick={() => navigate('/executor/login')}
                className={`font-medium transition ${
                  currentPath === '/executor/login'
                    ? 'text-indigo-700 font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Executor Portal
              </button>
              <button
                onClick={() => navigate('/admin/login')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  currentPath === '/admin/login'
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                Admin
              </button>
            </div>
          )}
        </div>
      </div>

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
      />
      <ExecutorProfileModal
        isOpen={isExecutorProfileOpen}
        onClose={() => setIsExecutorProfileOpen(false)}
      />
    </header>
  );
};

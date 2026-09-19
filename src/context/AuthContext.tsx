// Authentication & Navigation Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ExecutorProfile, AdminProfile, Role } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  currentPath: string;
  navigate: (path: string) => void;
  user: UserProfile | null;
  executor: ExecutorProfile | null;
  admin: AdminProfile | null;
  role: Role | null;
  loginAsUser: (email?: string) => Promise<void>;
  loginAsExecutor: (email?: string) => Promise<void>;
  loginAsAdmin: (email?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshExecutor: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateExecutorProfile: (data: Partial<ExecutorProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [executor, setExecutor] = useState<ExecutorProfile | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync browser popstate (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Restore stored session on mount or initialize default state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedRole = localStorage.getItem('serviceagent_role') as Role | null;
        if (storedRole === 'USER') {
          const res = await api.login('ramesh.sharma@example.com', 'USER');
          if (res.user) {
            setUser(res.user);
            setRole('USER');
          }
        } else if (storedRole === 'EXECUTOR') {
          const res = await api.login('suresh.k@executors.net', 'EXECUTOR');
          if (res.executor) {
            setExecutor(res.executor);
            setRole('EXECUTOR');
          }
        } else if (storedRole === 'ADMIN') {
          const res = await api.login('admin@serviceagent.org', 'ADMIN');
          if (res.admin) {
            setAdmin(res.admin);
            setRole('ADMIN');
          }
        }
      } catch (e) {
        console.error('Session restoration failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const loginAsUser = async (email = 'ramesh.sharma@example.com') => {
    setIsLoading(true);
    try {
      const res = await api.login(email, 'USER');
      if (res.user) {
        setUser(res.user);
        setRole('USER');
        localStorage.setItem('serviceagent_role', 'USER');
        navigate('/user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsExecutor = async (email = 'suresh.k@executors.net') => {
    setIsLoading(true);
    try {
      const res = await api.login(email, 'EXECUTOR');
      if (res.executor) {
        setExecutor(res.executor);
        setRole('EXECUTOR');
        localStorage.setItem('serviceagent_role', 'EXECUTOR');
        navigate('/executor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsAdmin = async (email = 'admin@serviceagent.org') => {
    setIsLoading(true);
    try {
      const res = await api.login(email, 'ADMIN');
      if (res.admin) {
        setAdmin(res.admin);
        setRole('ADMIN');
        localStorage.setItem('serviceagent_role', 'ADMIN');
        navigate('/admin');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshExecutor = async () => {
    if (executor?.id) {
      try {
        const updated = await api.getExecutor(executor.id);
        setExecutor(updated);
      } catch (e) {
        console.error('Failed to refresh executor profile:', e);
      }
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user?.id) return;
    const res = await api.updateUserProfile(user.id, data);
    if (res.user) {
      setUser(res.user);
    }
  };

  const updateExecutorProfile = async (data: Partial<ExecutorProfile>) => {
    if (!executor?.id) return;
    const res = await api.updateExecutorProfile(executor.id, data);
    if (res.executor) {
      setExecutor(res.executor);
    }
  };

  const logout = () => {
    setUser(null);
    setExecutor(null);
    setAdmin(null);
    setRole(null);
    localStorage.removeItem('serviceagent_role');
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        currentPath,
        navigate,
        user,
        executor,
        admin,
        role,
        loginAsUser,
        loginAsExecutor,
        loginAsAdmin,
        logout,
        isLoading,
        refreshExecutor,
        updateUserProfile,
        updateExecutorProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

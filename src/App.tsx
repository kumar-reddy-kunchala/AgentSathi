// ServiceAgent Root Application & Router
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingView } from './views/LandingView';
import { UserLoginView } from './views/user/UserLoginView';
import { UserRegisterView } from './views/user/UserRegisterView';
import { UserDashboardView } from './views/user/UserDashboardView';
import { ExecutorLoginView } from './views/executor/ExecutorLoginView';
import { ExecutorRegisterView } from './views/executor/ExecutorRegisterView';
import { ExecutorDashboardView } from './views/executor/ExecutorDashboardView';
import { AdminLoginView } from './views/admin/AdminLoginView';
import { AdminDashboardView } from './views/admin/AdminDashboardView';

const RouteRenderer: React.FC = () => {
  const { currentPath, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Loading ServiceAgent...
          </div>
        </div>
      </div>
    );
  }

  // 1. User Application Routes
  if (currentPath === '/user/login') return <UserLoginView />;
  if (currentPath === '/user/register') return <UserRegisterView />;
  if (currentPath.startsWith('/user')) {
    if (role !== 'USER') {
      return <UserLoginView />;
    }
    return <UserDashboardView />;
  }

  // 2. Executor Application Routes
  if (currentPath === '/executor/login') return <ExecutorLoginView />;
  if (currentPath === '/executor/register') return <ExecutorRegisterView />;
  if (currentPath.startsWith('/executor')) {
    if (role !== 'EXECUTOR') {
      return <ExecutorLoginView />;
    }
    return <ExecutorDashboardView />;
  }

  // 3. Admin Application Routes
  if (currentPath === '/admin/login') return <AdminLoginView />;
  if (currentPath.startsWith('/admin')) {
    if (role !== 'ADMIN') {
      return <AdminLoginView />;
    }
    return <AdminDashboardView />;
  }

  // Default: Public Landing Page
  return <LandingView />;
};

export default function App() {
  return (
    <AuthProvider>
      <RouteRenderer />
    </AuthProvider>
  );
}

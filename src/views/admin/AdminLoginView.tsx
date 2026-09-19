// Admin Login: /admin/login
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { Shield, LogIn, Sparkles } from 'lucide-react';

export const AdminLoginView: React.FC = () => {
  const { loginAsAdmin } = useAuth();
  const [email, setEmail] = useState('admin@serviceagent.local');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await loginAsAdmin(email);
    } catch (err: any) {
      setError(err.message || 'Admin authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoAdmin = () => {
    setEmail('admin@serviceagent.local');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white border border-stone-200/90 rounded-[28px] p-6 sm:p-8 shadow-xs">
          {/* Top Icon */}
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
            <Shield className="w-7 h-7 stroke-[2.2]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-center text-stone-900 tracking-tight">
            Platform Admin Login
          </h1>
          <p className="text-xs sm:text-sm text-center text-stone-500 mt-1.5 mb-6">
            Operations, KYC Verification, and Algorithmic Dispatch Governance
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* One-Tap Demo Admin Credentials Box */}
          <div
            onClick={handleSelectDemoAdmin}
            className="p-4 bg-purple-50/50 border border-purple-200/90 rounded-2xl mb-5 cursor-pointer hover:bg-purple-100/50 transition"
          >
            <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>One-Tap Demo Admin Credentials</span>
            </div>
            <div className="text-xs font-mono text-purple-800 font-semibold">
              admin@serviceagent.local / admin123
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@serviceagent.local"
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              id="admin-sign-in-btn"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Signing In...' : 'Sign In to Admin Operations'}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

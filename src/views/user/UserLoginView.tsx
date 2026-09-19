// User Login: /user/login
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { HeartHandshake, LogIn, Sparkles } from 'lucide-react';

export const UserLoginView: React.FC = () => {
  const { navigate, loginAsUser } = useAuth();
  const [email, setEmail] = useState('user@serviceagent.local');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await loginAsUser(email);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoUser = () => {
    setEmail('user@serviceagent.local');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white border border-stone-200/90 rounded-[28px] p-6 sm:p-8 shadow-xs">
          {/* Top Icon */}
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
            <HeartHandshake className="w-7 h-7 stroke-[2.2]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-center text-stone-900 tracking-tight">
            User Sign In
          </h1>
          <p className="text-xs sm:text-sm text-center text-stone-500 mt-1.5 mb-6">
            Sign in to coordinate everyday assistance with Sathi AI
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* One-Tap Demo User Box */}
          <div className="p-4 bg-teal-50/50 border border-teal-200/90 rounded-2xl mb-5">
            <div className="text-xs font-bold text-teal-800 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>One-Tap Demo User</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-stone-900">Kumar Reddy</div>
                <div className="text-xs text-stone-500">user@serviceagent.local</div>
              </div>
              <button
                type="button"
                onClick={handleSelectDemoUser}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 px-3 py-1 bg-white border border-teal-200 rounded-lg shadow-2xs transition"
              >
                Select
              </button>
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@serviceagent.local"
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
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
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              id="user-sign-in-btn"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Signing In...' : 'Sign In as User'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-500">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/user/register')}
              className="font-bold text-teal-700 hover:underline"
            >
              Register here
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// Executor Login: /executor/login
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { Briefcase, LogIn, Sparkles } from 'lucide-react';

export const ExecutorLoginView: React.FC = () => {
  const { navigate, loginAsExecutor } = useAuth();
  const [email, setEmail] = useState('executor_a@serviceagent.local');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await loginAsExecutor(email);
    } catch (err: any) {
      setError(err.message || 'Executor login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExecutor = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white border border-stone-200/90 rounded-[28px] p-6 sm:p-8 shadow-xs">
          {/* Top Icon */}
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
            <Briefcase className="w-7 h-7 stroke-[2.2]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-center text-stone-900 tracking-tight">
            Executor Portal Login
          </h1>
          <p className="text-xs sm:text-sm text-center text-stone-500 mt-1.5 mb-6">
            Access your verified task dispatch feed and payouts
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* One-Tap Verified Demo Executors Box */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-200/90 rounded-2xl mb-5 space-y-2.5 max-h-80 overflow-y-auto">
            <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 sticky top-0 bg-indigo-50/95 py-1 z-10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>One-Tap Verified Demo Executors</span>
            </div>

            <div className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs font-bold text-stone-900">Vinay (Pharmacy & Health Aide)</div>
                <div className="text-[11px] text-stone-500">vinay@executors.net • Vetapalem</div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectExecutor('vinay@executors.net')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg transition"
              >
                Select
              </button>
            </div>

            <div className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs font-bold text-stone-900">Kumar (Logistics & Transit Driver)</div>
                <div className="text-[11px] text-stone-500">kumar@executors.net • Bapatla</div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectExecutor('kumar@executors.net')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg transition"
              >
                Select
              </button>
            </div>

            <div className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs font-bold text-stone-900">Sai (Social Care & Mobility)</div>
                <div className="text-[11px] text-stone-500">sai@executors.net • Ponnur</div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectExecutor('sai@executors.net')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg transition"
              >
                Select
              </button>
            </div>

            <div className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs font-bold text-stone-900">Suresh Kumar (Senior Companion)</div>
                <div className="text-[11px] text-stone-500">suresh.k@executors.net • Chirala</div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectExecutor('suresh.k@executors.net')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg transition"
              >
                Select
              </button>
            </div>

            <div className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs font-bold text-stone-900">Anita Sharma (Transit & Grocery)</div>
                <div className="text-[11px] text-stone-500">anita@executors.net • Chirala</div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectExecutor('anita@executors.net')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg transition"
              >
                Select
              </button>
            </div>

            <div className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs font-bold text-stone-900">Praveen (Healthcare & Escort)</div>
                <div className="text-[11px] text-stone-500">praveen@executors.net • Chirala</div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectExecutor('praveen@executors.net')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg transition"
              >
                Select
              </button>
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Executor Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="executor_a@serviceagent.local"
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              id="executor-sign-in-btn"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Signing In...' : 'Sign In to Executor Portal'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-500">
            <span>Want to offer services? </span>
            <button
              type="button"
              onClick={() => navigate('/executor/register')}
              className="font-bold text-indigo-700 hover:underline"
            >
              Register as New Provider
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

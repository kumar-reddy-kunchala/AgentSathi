// Public Landing Page: /
import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Cpu,
  UserCheck,
  MapPin,
  Pill,
  ShoppingBag,
  Car,
  HeartHandshake,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const { navigate } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Main Navigation */}
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-2xl bg-[#0070F3] text-white flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-stone-900 block leading-tight">
                SERVICEAGENT
              </span>
              <span className="text-[11px] text-teal-800 font-medium tracking-wide uppercase">
                Autonomous Living Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-user-login-btn"
              onClick={() => navigate('/user/login')}
              className="px-4 py-2 text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
            >
              User Login
            </button>
            <button
              id="landing-executor-login-btn"
              onClick={() => navigate('/executor/login')}
              className="px-4 py-2 text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
            >
              Executor Portal
            </button>
            <button
              id="landing-admin-login-btn"
              onClick={() => navigate('/admin/login')}
              className="px-4 py-2 text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 hover:bg-teal-100 rounded-lg transition"
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Agentic AI Service Coordination for Independent Living
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-tight">
            Real-world help, <br className="hidden sm:inline" />
            <span className="text-teal-700">coordinated by AI.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Tell <strong className="text-stone-800 font-semibold">Sathi</strong> what you need. Sathi understands your request, selects verified local providers, and coordinates execution with deterministic dispatch safety.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              id="landing-hero-need-service-btn"
              onClick={() => navigate('/user/login')}
              className="w-full sm:w-auto px-8 py-4 bg-teal-700 text-white font-bold rounded-xl shadow-md hover:bg-teal-800 transition flex items-center justify-center gap-2 text-base"
            >
              I NEED A SERVICE
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              id="landing-hero-provide-service-btn"
              onClick={() => navigate('/executor/login')}
              className="w-full sm:w-auto px-8 py-4 bg-white border border-stone-300 text-stone-800 font-bold rounded-xl hover:bg-stone-50 transition flex items-center justify-center gap-2 text-base"
            >
              I WANT TO PROVIDE SERVICES
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-stone-500 font-medium">
            <span className="cursor-pointer hover:underline text-teal-700" onClick={() => navigate('/user/register')}>
              New User? Register here
            </span>
            <span>•</span>
            <span className="cursor-pointer hover:underline text-teal-700" onClick={() => navigate('/executor/register')}>
              Become an Executor
            </span>
            <span>•</span>
            <span className="cursor-pointer hover:underline text-stone-600" onClick={() => navigate('/admin/login')}>
              Admin Console
            </span>
          </div>
        </section>

        {/* How Sathi Works */}
        <section className="py-16 bg-white border-y border-stone-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
                How Sathi Coordinates Real-World Tasks
              </h2>
              <p className="mt-3 text-stone-600 text-base">
                An agentic architecture where AI listens and plans, while the backend deterministically enforces safety, availability, and dispatch verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">1. Voice or Text Intent</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Say <em>"Hey Sathi, I need someone to pick up my medicine from Apollo Pharmacy at 5 PM."</em> Sathi extracts requirements and clarifies missing details naturally.
                </p>
              </div>

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">2. Deterministic Matching</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  The LLM never invents candidates. Our backend engine checks KYC approval, current live availability, service radius, and weighted scores before offering the task.
                </p>
              </div>

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">3. Auto Reassignment</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  If an executor rejects or times out, or if the user cancels, the platform automatically excludes that executor and contacts the next eligible candidate seamlessly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Services */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
              Essential Daily Services Supported
            </h2>
            <p className="text-stone-600 text-sm mt-2">
              Empowering senior citizens, post-operative recovery, and independent living.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-5 bg-white rounded-xl border border-stone-200 text-center hover:border-teal-500 transition">
              <Pill className="w-8 h-8 text-teal-700 mx-auto mb-3" />
              <div className="font-bold text-sm text-stone-900">Medicine Pickup</div>
              <div className="text-xs text-stone-500 mt-1">Prescription delivery</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-stone-200 text-center hover:border-teal-500 transition">
              <ShoppingBag className="w-8 h-8 text-amber-700 mx-auto mb-3" />
              <div className="font-bold text-sm text-stone-900">Grocery Assistance</div>
              <div className="text-xs text-stone-500 mt-1">Daily fresh essentials</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-stone-200 text-center hover:border-teal-500 transition">
              <Car className="w-8 h-8 text-sky-700 mx-auto mb-3" />
              <div className="font-bold text-sm text-stone-900">Transportation</div>
              <div className="text-xs text-stone-500 mt-1">Assisted door-to-door</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-stone-200 text-center hover:border-teal-500 transition">
              <HeartHandshake className="w-8 h-8 text-rose-700 mx-auto mb-3" />
              <div className="font-bold text-sm text-stone-900">Companion Care</div>
              <div className="text-xs text-stone-500 mt-1">Visits, walks & support</div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-stone-200 text-center hover:border-teal-500 transition">
              <Calendar className="w-8 h-8 text-indigo-700 mx-auto mb-3" />
              <div className="font-bold text-sm text-stone-900">Doctor Visits</div>
              <div className="text-xs text-stone-500 mt-1">Clinic schedule & rides</div>
            </div>
          </div>
        </section>

        {/* Security & Verification Guarantee */}
        <section className="py-12 bg-stone-900 text-stone-100 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Lock className="w-4 h-4" />
                Zero Trust Architecture
              </div>
              <h3 className="text-2xl font-bold text-white">100% Verified Service Providers</h3>
              <p className="text-stone-400 text-sm mt-1 max-w-xl">
                Every provider undergoes Aadhaar/PAN government identity checks and live video verification before being added to our dispatch candidate pool.
              </p>
            </div>
            <button
              onClick={() => navigate('/user/login')}
              className="px-6 py-3 bg-teal-500 text-stone-950 font-bold rounded-lg hover:bg-teal-400 transition whitespace-nowrap text-sm"
            >
              Get Started with Sathi
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-500">
        <p>© 2026 ServiceAgent. Designed for Independent Living. Built with Sathi Agentic AI.</p>
      </footer>
    </div>
  );
};

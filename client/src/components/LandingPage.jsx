import React from 'react';
import { useAuth } from '../context/AuthContext';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const FEATURES = [
  {
    icon: '🍽️',
    title: 'Meal Library',
    desc: 'Browse 700+ pre-loaded meals from TheMealDB or add your own. Filter by category, tag, or search.',
  },
  {
    icon: '📅',
    title: 'Weekly Planner',
    desc: 'Drag meals into your week, attach sides to each dinner, and see the full plan at a glance.',
  },
  {
    icon: '🛒',
    title: 'Auto Grocery List',
    desc: 'Every ingredient from every planned meal is collected and combined automatically. Shop once.',
  },
  {
    icon: '🗂️',
    title: 'Plan History',
    desc: 'Save and name your favourite weeks. Reload any past plan in one click — perfect for meal rotation.',
  },
];

export default function LandingPage() {
  const { signIn, enterGuestMode } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🍲</span>
          <span className="text-xl font-bold tracking-tight">Simmer</span>
        </div>
        <button
          onClick={signIn}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/20"
        >
          <GoogleIcon />
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Free to use · No credit card required
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Dinner decided.<br />
          <span className="text-emerald-400">Groceries sorted.</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Simmer is your personal weekly meal planner. Build a library of meals,
          plan your week in seconds, and get an auto-generated grocery list —
          so you only need to go shopping once.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={signIn}
            className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100 active:scale-95"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
          <button
            onClick={enterGuestMode}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-medium text-white backdrop-blur transition hover:bg-white/10 active:scale-95"
          >
            Try it free →
            <span className="text-xs text-slate-400">(no sign-in needed)</span>
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Guest mode lets you browse & plan — sign in to save your plan and history.
        </p>
      </main>

      {/* Features */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 text-xs text-slate-600">
        Simmer · The Weekly Meal Planner
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UtensilsIcon, SunIcon, MoonIcon } from './Icons';

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
    desc: 'Browse 700+ pre-loaded meals or add your own. Filter by category, tag, or search.',
  },
  {
    icon: '📅',
    title: 'Weekly Planner',
    desc: 'Pick meals for each night, attach sides, and see your full week at a glance.',
  },
  {
    icon: '🛒',
    title: 'Auto Grocery List',
    desc: 'Every ingredient from every planned meal combined automatically. Shop once.',
  },
  {
    icon: '🗂️',
    title: 'Plan History',
    desc: 'Save and name favourite weeks. Reload any past plan in one click.',
  },
];

export default function LandingPage() {
  const { signIn, enterGuestMode } = useAuth();

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch { return 'dark'; }
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch {}
    // keep the document class in sync so the app picks it up on entry
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const dark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      dark
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white'
        : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900'
    }`}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
              <span className="text-emerald-600 dark:text-emerald-400">
                <UtensilsIcon size={22} />
              </span>
          <span className="text-xl font-bold tracking-tight">Simmer</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={signIn}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur transition ${
              dark
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                : 'border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
            }`}
          >
            <GoogleIcon />
            Sign in
          </button>
          <button
            onClick={toggleTheme}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
              dark
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                : 'border-slate-300 bg-white text-slate-600 shadow-sm hover:bg-slate-50'
            }`}
          >
            {dark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-4xl mx-auto w-full">
        <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm mb-8 ${
          dark
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-emerald-400/40 bg-emerald-50 text-emerald-700'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${dark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
          Free to use!
        </div>

        <div className="flex items-center justify-center gap-5 mb-6">
          <div className={`shrink-0 rounded-2xl p-3 ${dark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
            <UtensilsIcon size={48} />
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight text-left">
            Dinner decided,<br />
            <span className={dark ? 'text-emerald-400' : 'text-emerald-600'}>Groceries sorted.</span>
          </h1>
        </div>

        <p className={`text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
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
            className={`inline-flex items-center gap-2 rounded-xl border px-6 py-3.5 text-base font-medium transition active:scale-95 ${
              dark
                ? 'border-white/20 bg-white/5 text-white backdrop-blur hover:bg-white/10'
                : 'border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
            }`}
          >
            Try it free →
            <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-400'}`}>(no sign-in needed)</span>
          </button>
        </div>

        <p className={`mt-4 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Guest mode lets you browse &amp; plan — sign in to save your plan and history.
        </p>
      </main>

      {/* Features */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className={`rounded-2xl border p-5 ${
                dark
                  ? 'border-white/10 bg-white/5 backdrop-blur'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className={`font-semibold mb-1 ${dark ? 'text-white' : 'text-slate-800'}`}>{f.title}</h3>
              <p className={`text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`text-center pb-8 text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
        © 2026   Simmer: The Weekly Meal Planner
      </footer>
    </div>
  );
}

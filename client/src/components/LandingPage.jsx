import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UtensilsIcon, SunIcon, MoonIcon } from './Icons';

// ─── Google icon ──────────────────────────────────────────────────────────────
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

// ─── Stars helper ─────────────────────────────────────────────────────────────
function Stars({ n }) {
  return (
    <span className="text-[11px] leading-none">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? '#f59e0b' : '#334155' }}>★</span>
      ))}
    </span>
  );
}

// ─── App Mockup ───────────────────────────────────────────────────────────────
// Shows: Tonight hero card, week list, grocery strip — all matching current UI.

const MOCK_DAYS = [
  { short: 'MON', name: 'Chicken Tikka Masala', sides: 'Basmati rice',       stars: 5, color: '#7c3aed', tonight: false },
  { short: 'TUE', name: 'Beef Stir Fry',        sides: 'Egg fried rice',     stars: 4, color: '#2563eb', tonight: false },
  { short: 'WED', name: 'Pasta Carbonara',       sides: null,                 stars: 5, color: '#0891b2', tonight: true  },
  { short: 'THU', name: 'Salmon & Asparagus',    sides: 'New potatoes',       stars: 3, color: '#059669', tonight: false },
  { short: 'FRI', name: 'Homemade Burgers',      sides: 'Sweet potato fries', stars: 0, color: '#d97706', tonight: false },
];

const MOCK_GROCERY_CATS = [
  { label: 'Meat & Fish',  items: ['Chicken breast', 'Beef strips', 'Salmon fillet'] },
  { label: 'Produce',      items: ['Asparagus', 'Sweet potatoes', 'Garlic'] },
  { label: 'Pantry',       items: ['Tikka paste', 'Pasta', 'Coconut milk'] },
];

function AppMockup() {
  const [tab, setTab] = useState('plan'); // plan | grocery

  return (
    <div
      className="relative w-full max-w-[400px] mx-auto select-none"
      style={{ filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.55))' }}
    >
      {/* Window chrome */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/80" style={{ background: '#0f172a' }}>

        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-800" style={{ background: '#020617' }}>
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="flex-1 text-center text-[11px] font-semibold text-emerald-400 tracking-wide">What's Simmering?</span>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-800 overflow-x-hidden" style={{ background: '#0f172a' }}>
          {[['plan','Plan'],['grocery','Grocery'],['Spotlight'],['Mains']].map(([id, label = id], i) => (
            <button
              key={id}
              onClick={() => (id === 'plan' || id === 'grocery') && setTab(id)}
              className={`px-3 py-2 text-[10px] font-semibold border-b-2 whitespace-nowrap transition-colors ${
                tab === id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-600'
              }`}
            >{label}</button>
          ))}
        </div>

        {tab === 'plan' ? (
          <>
            {/* Week nav */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60">
              <span className="text-[10px] text-slate-500">‹</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-300">Week · Jun 9–15</span>
                <span className="rounded-full bg-emerald-900/60 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 border border-emerald-800/60">This week</span>
              </div>
              <span className="text-[10px] text-slate-500">›</span>
            </div>

            {/* Tonight hero card */}
            <div className="mx-3 mt-3 mb-2 rounded-xl border-l-4 border-cyan-500 bg-cyan-900/20 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400 mb-0.5">🌙 Tonight</p>
              <p className="text-[13px] font-bold text-cyan-100 leading-tight">Pasta Carbonara</p>
              <div className="flex items-center gap-2 mt-1">
                <Stars n={5} />
                <span className="text-[9px] text-cyan-400">· 4 servings</span>
              </div>
            </div>

            {/* Meal rows */}
            <div className="divide-y divide-slate-800/60 mx-0">
              {MOCK_DAYS.map(d => (
                <div key={d.short} className={`flex items-center gap-0 group ${d.tonight ? 'bg-cyan-900/10' : ''}`}>
                  <div className="w-1 self-stretch shrink-0" style={{ background: d.color }} />
                  <div className="w-11 shrink-0 flex flex-col items-center justify-center py-2 border-r border-slate-800/60" style={{ background: d.color + '15' }}>
                    <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: d.color }}>{d.short}</span>
                  </div>
                  <div className="flex-1 min-w-0 px-2.5 py-1.5">
                    <p className="text-[11px] font-semibold text-slate-200 truncate">{d.name}</p>
                    {d.sides && <p className="text-[9px] text-slate-500 truncate">with {d.sides}</p>}
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {d.stars > 0 ? <Stars n={d.stars} /> : <span className="text-[9px] text-slate-600 italic">Tap to rate</span>}
                    </div>
                  </div>
                  {d.tonight && (
                    <span className="shrink-0 mr-2 text-[9px] text-cyan-500 font-semibold">tonight</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Grocery header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60">
              <span className="text-[11px] font-bold text-slate-300">Grocery List</span>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-emerald-900/60 text-emerald-400 text-[9px] font-bold px-2 py-0.5 border border-emerald-800/60">🛒 Shop mode</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full w-[42%] rounded-full bg-emerald-500" />
                </div>
                <span className="text-[9px] text-slate-400 tabular-nums">8/19</span>
              </div>
            </div>

            {/* Category sections */}
            {MOCK_GROCERY_CATS.map((cat, ci) => (
              <div key={cat.label} className="mx-3 mb-2.5 rounded-lg border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 border-b border-slate-800">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{cat.label}</span>
                  <span className="text-[9px] text-emerald-500 font-semibold">✓ All</span>
                </div>
                {cat.items.map((item, ii) => (
                  <div key={item} className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800/60 last:border-0">
                    <div className={`h-3.5 w-3.5 rounded shrink-0 border ${ci === 0 && ii < 2 ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                      {ci === 0 && ii < 2 && <span className="flex items-center justify-center text-[8px] text-white leading-none mt-0.5">✓</span>}
                    </div>
                    <span className={`text-[10px] ${ci === 0 && ii < 2 ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* Bottom strip */}
        <div className="border-t border-slate-800 px-4 py-2 flex items-center justify-between" style={{ background: '#020617' }}>
          <span className="text-[9px] text-slate-600">📋 Copy · 🖨️ Print</span>
          <span className="text-[9px] text-emerald-500 font-semibold">19 items</span>
        </div>
      </div>

      {/* Floating tonight callout — desktop only, overlaps the mockup on phones */}
      <div
        className="hidden md:block absolute -right-4 top-28 rounded-xl border border-cyan-800/60 px-3 py-2 shadow-xl text-[11px] font-semibold text-cyan-300"
        style={{ background: '#0c1a2e' }}
      >
        🌙 Tonight's dinner, front & centre
      </div>

      {/* Floating templates callout — desktop only */}
      <div
        className="hidden md:block absolute -left-6 bottom-20 rounded-xl border border-violet-800/60 px-3 py-2 shadow-xl text-[11px] font-semibold text-violet-300"
        style={{ background: '#1e1b4b' }}
      >
        📂 Load a saved week as template
      </div>
    </div>
  );
}

// ─── Monthly View Mockup ──────────────────────────────────────────────────────
const MONTH_DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTH_COLORS = ['#7c3aed','#2563eb','#0891b2','#059669','#d97706','#ea580c','#e11d48'];
const MONTH_WEEKS  = [
  ['Chicken Tikka','Beef Stir Fry','Carbonara','Salmon',    'Burgers',   '',          'Lamb Curry'],
  ['Thai Curry',   'Fish Tacos',   '',          'Steak',     'Pad Thai',  'Pizza',     'Roast Chicken'],
  ['',             'Beef Ramen',   'Bolognese', '',          'Chicken Pie','Sushi',    ''],
  ['Dal Makhani',  '',             'Stir Fry',  'Pork Belly','',          'Beef Tacos','Salmon Bake'],
];

function MonthMockup({ dark }) {
  const card   = dark ? 'bg-slate-900/70 border-slate-800/80' : 'bg-white border-slate-200';
  const cellBg = dark ? '#0f172a' : '#f8fafc';
  return (
    <div className={`rounded-2xl border overflow-hidden ${card} select-none`} style={{ filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.3))' }}>
      {/* Header */}
      <div className={`grid grid-cols-7 gap-px overflow-hidden border-b ${dark ? 'border-slate-800' : 'border-slate-200'}`} style={{ background: dark ? '#1e293b' : '#f1f5f9' }}>
        {MONTH_DAYS.map((d, i) => (
          <div key={d} className="py-1.5 text-center" style={{ background: MONTH_COLORS[i] + (dark ? '33' : '22') }}>
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: MONTH_COLORS[i] }}>{d}</span>
          </div>
        ))}
      </div>
      {/* Weeks */}
      {MONTH_WEEKS.map((week, wi) => (
        <div key={wi}>
          {/* Week header */}
          <div className={`flex items-center justify-between px-2.5 py-1 border-b ${dark ? 'border-slate-800 bg-slate-800/40' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center gap-1">
              {wi === 0 && <span className="text-emerald-400 text-[9px]">✦</span>}
              <span className={`text-[9px] font-bold ${wi === 0 ? 'text-emerald-400' : (dark ? 'text-slate-500' : 'text-slate-400')}`}>
                {wi === 0 ? 'This week' : `Jun ${2 + wi * 7}`}
              </span>
            </div>
            <div className="flex gap-0.5">
              {week.map((m, di) => (
                <div key={di} className="h-1.5 w-1.5 rounded-full" style={{ background: m ? MONTH_COLORS[di] : (dark ? '#334155' : '#cbd5e1') }} />
              ))}
            </div>
          </div>
          {/* Day cells */}
          <div className={`grid grid-cols-7 gap-px ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
            {week.map((meal, di) => (
              <div
                key={di}
                className="min-h-[36px] flex flex-col items-start justify-start p-1"
                style={{ background: meal ? MONTH_COLORS[di] + (dark ? '22' : '15') : cellBg }}
              >
                {meal ? (
                  <span className="text-[8px] font-semibold leading-tight" style={{ color: MONTH_COLORS[di] }}>{meal}</span>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-0.5 mt-0.5">
                    <span className="text-[10px] font-light" style={{ color: dark ? '#334155' : '#cbd5e1' }}>+</span>
                    <span className="text-[7px]" style={{ color: dark ? '#334155' : '#cbd5e1' }}>No meal</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  // Planning
  { icon: '📅', title: 'Weekly Planner',       color: 'emerald', desc: 'Drag 7 nights, attach sides, scale servings. Tonight\'s meal gets its own hero card so the cook always knows what\'s up.' },
  { icon: '📆', title: 'Monthly Calendar',      color: 'emerald', desc: 'Colour-coded month view with per-day accents, completion dots, and drag-to-reorder within any week — past or future.' },
  { icon: '🍽️', title: '700+ Starter Meals',   color: 'emerald', desc: 'Pre-loaded library from TheMealDB plus your own private recipes. Browse, filter, tag, star, and import from any URL.' },
  { icon: '📂', title: 'Plan Templates',        color: 'emerald', desc: 'Save any week as a named template. Load it back in one click when you want to repeat a winning rotation.' },
  // Shopping
  { icon: '🛒', title: 'Smart Grocery List',   color: 'cyan',    desc: '1 cup + 2 cups = 3 cups. Quantities combine numerically. Progress bar, batch "✓ All" per aisle, print or copy to share.' },
  { icon: '🏠', title: 'Pantry Mode',           color: 'cyan',    desc: 'Mark staples you always have — olive oil, garlic, salt — and they vanish from your list automatically.' },
  { icon: '⚡', title: 'Works Offline',         color: 'cyan',    desc: 'Install as a home-screen app. Grocery list is cached locally so you can shop without signal in the supermarket.' },
  { icon: '🕐', title: 'Recent Meals Picker',   color: 'cyan',    desc: 'The dish picker shows your most recently used meals first — re-plan a favourite rotation in seconds.' },
  // Intelligence
  { icon: '⭐', title: 'Post-Cook Ratings',     color: 'amber',   desc: 'Rate each dish 1–5 stars after cooking. Ratings appear in weekly and monthly views so you remember what you loved.' },
  { icon: '🎲', title: 'Weighted Surprise Me',  color: 'amber',   desc: 'Dishes you rate highly surface more in randomisation. The more you rate, the smarter your meal suggestions get.' },
  // Social
  { icon: '🌍', title: 'Community Spotlight',   color: 'violet',  desc: 'Browse other families\' real weekly plans. Clone any into your week in one click. Share yours to inspire others.' },
  { icon: '📸', title: 'Share Card',            color: 'violet',  desc: 'Generate a beautiful PNG of your week — download or share straight to Instagram, WhatsApp and more.' },
];

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20'    },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20'  },
};

// ─── How it works ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: '1', icon: '🍽️', color: 'emerald',
    title: 'Pick your meals',
    desc: 'Browse 700+ dishes or add your own. Import a recipe from any URL. Rate after cooking — the app learns what you love.',
  },
  {
    n: '2', icon: '📅', color: 'cyan',
    title: 'Build your week',
    desc: 'Drag meals onto 7 nights, attach sides, scale servings. Hit Surprise Me to let your taste graph fill the gaps.',
  },
  {
    n: '3', icon: '🛒', color: 'violet',
    title: 'Shop once, done',
    desc: 'Every ingredient from every meal — quantities combined, pantry staples filtered out. Print it or copy to WhatsApp.',
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const { signIn, enterGuestMode } = useAuth();

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch { return 'dark'; }
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch {}
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const dark = theme === 'dark';
  const bg      = dark ? 'bg-slate-950 text-white'             : 'bg-slate-50 text-slate-900';
  const card    = dark ? 'bg-slate-900/70 border-slate-800/80' : 'bg-white border-slate-200';
  const muted   = dark ? 'text-slate-400'                      : 'text-slate-500';
  const subtle  = dark ? 'text-slate-600'                      : 'text-slate-400';
  const divider = dark ? 'border-slate-800'                    : 'border-slate-200';

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden ${bg} transition-colors duration-200`}>

      {/* Decorative orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-48 -left-32 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/3 -right-48 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/4 blur-3xl" />
      </div>

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <span className="text-emerald-500"><UtensilsIcon size={22} /></span>
          <span className="text-xl font-bold tracking-tight">What's Simmering?</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={signIn}
            className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              dark ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                   : 'border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
            }`}
          >
            <GoogleIcon /> Sign in
          </button>
          <button
            onClick={toggleTheme}
            title={dark ? 'Light mode' : 'Dark mode'}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
              dark ? 'border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white'
                   : 'border-slate-300 bg-white text-slate-500 shadow-sm hover:bg-slate-50'
            }`}
          >
            {dark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          </button>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-6 pt-8 pb-20 lg:pt-16 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Left: copy */}
          <div className="order-2 lg:order-1">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold mb-7 ${
              dark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                   : 'border-emerald-400/40 bg-emerald-50 text-emerald-700'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${dark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
              New · Monthly view, plan templates &amp; batch shopping
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.07] mb-6">
              Dinner decided.
              <br />
              <span className={dark ? 'text-emerald-400' : 'text-emerald-600'}>Groceries sorted.</span>
            </h1>

            <p className={`text-lg leading-relaxed mb-8 max-w-lg ${muted}`}>
              The weekly meal planner that learns your taste.
              Plan 7 nights, get a smart grocery list, and share your week with the world.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <button
                onClick={signIn}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg ring-1 ring-black/5 transition hover:bg-slate-100 active:scale-95"
              >
                <GoogleIcon /> Sign in with Google
              </button>
              <button
                onClick={enterGuestMode}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-semibold transition active:scale-95 ${
                  dark ? 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700'
                       : 'border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
                }`}
              >
                Try it free <span className="text-xs font-normal opacity-60">— no sign-in</span>
              </button>
            </div>

            <p className={`text-xs ${subtle}`}>
              Free forever · Guest mode available · Works offline
            </p>

            <div className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 ${divider}`}>
              {[
                { n: '700+', label: 'starter meals'  },
                { n: '16+',  label: 'smart features' },
                { n: '100%', label: 'free to use'    },
                { n: '0',    label: 'ads ever'        },
              ].map(s => (
                <div key={s.label}>
                  <span className={`text-xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>{s.n}</span>
                  <span className={`ml-1.5 text-sm ${muted}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: app mockup */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ══ FEATURE GRID ═════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-24">
        <div className="text-center mb-12">
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dark ? 'text-emerald-500' : 'text-emerald-600'}`}>
            Everything included
          </p>
          <h2 className={`text-3xl sm:text-4xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>
            One app, the whole kitchen
          </h2>
          <p className={`mt-3 text-base max-w-xl mx-auto ${muted}`}>
            From recipe import to share card — no subscriptions, no paywalls.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.map(f => {
            const c = COLOR_MAP[f.color];
            return (
              <div key={f.title} className={`rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${card}`}>
                <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl text-xl mb-4 ${c.bg} ${c.border} border`}>
                  {f.icon}
                </div>
                <h3 className={`font-bold text-sm mb-1.5 ${dark ? 'text-white' : 'text-slate-800'}`}>{f.title}</h3>
                <p className={`text-xs leading-relaxed ${muted}`}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ MONTHLY VIEW SPOTLIGHT ═══════════════════════════════════════════ */}
      <section className={`relative z-10 border-y ${divider} ${dark ? 'bg-slate-900/50' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">

          {/* Mockup */}
          <div>
            <MonthMockup dark={dark} />
          </div>

          {/* Copy */}
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold mb-6 ${
              dark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                   : 'border-emerald-400/40 bg-emerald-50 text-emerald-700'
            }`}>
              📆 Monthly View
            </div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>
              The whole month<br/>
              <span className={dark ? 'text-emerald-400' : 'text-emerald-600'}>at a glance</span>
            </h2>
            <p className={`text-base leading-relaxed mb-6 ${muted}`}>
              The monthly calendar view gives you the full picture — four weeks of dinners
              colour-coded by day, with progress dots showing how planned each week is.
              Drag meals within a week to reorder without leaving the overview.
            </p>
            <ul className={`space-y-2.5 text-sm ${muted}`}>
              {[
                'Colour-coded day columns matching the weekly view',
                'Per-week completion dots — see gaps at a glance',
                'Drag to reorder within any week row',
                'Star ratings and recipe links visible in each cell',
                'Click any week to jump straight into it',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className={`mt-0.5 shrink-0 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ COMMUNITY SPOTLIGHT ══════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">

        {/* Copy */}
        <div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold mb-6 ${
            dark ? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                 : 'border-violet-400/40 bg-violet-50 text-violet-700'
          }`}>
            🌍 Community
          </div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>
            See what the<br/>
            <span className={dark ? 'text-violet-400' : 'text-violet-600'}>community is cooking</span>
          </h2>
          <p className={`text-base leading-relaxed mb-6 ${muted}`}>
            Community Spotlight shows other people's real weekly plans —
            not curated recipes, actual dinners real families are eating.
            Clone any week into yours in one tap.
          </p>
          <ul className={`space-y-2.5 text-sm ${muted}`}>
            {[
              'Browse by most recent or most cloned',
              'Search by dish name across all shared weeks',
              'Publish your own week to inspire others',
              'Clone counter updates in real time',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Community card mockup */}
        <div className="space-y-3">
          {[
            { user: 'Sarah M.', initials: 'S', color: '#7c3aed', meals: ['Chicken Tikka','Beef Tacos','Pasta Bake','Salmon Curry'], clones: 47, label: '3 days ago' },
            { user: 'James K.', initials: 'J', color: '#059669', meals: ['Lamb Rogan Josh','Thai Green Curry','Beef Burgers','Fish & Chips'], clones: 31, label: '5 days ago' },
            { user: 'Priya L.', initials: 'P', color: '#d97706', meals: ['Palak Paneer','Dal Makhani','Biryani','Chana Masala'], clones: 62, label: '1 week ago' },
          ].map(p => (
            <div key={p.user} className={`rounded-xl border p-4 ${card}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: p.color }}>{p.initials}</div>
                  <div>
                    <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{p.user}</p>
                    <p className={`text-[10px] ${subtle}`}>{p.label}</p>
                  </div>
                </div>
                <span className={`text-xs ${muted}`}>🔄 {p.clones}</span>
              </div>
              <div className="space-y-1 mb-3">
                {p.meals.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase w-6 ${subtle}`}>{['Mon','Tue','Wed','Thu'][i]}</span>
                    <span className={`text-xs ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{m}</span>
                  </div>
                ))}
              </div>
              <button className="w-full rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-semibold py-1.5 hover:bg-violet-600/30 transition-colors">
                + Use this week
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ══ RATINGS & SURPRISE ME ════════════════════════════════════════════ */}
      <section className={`relative z-10 border-y ${divider} ${dark ? 'bg-slate-900/50' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">

          {/* Visual */}
          <div className={`rounded-2xl border p-6 ${card}`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-5 ${dark ? 'text-amber-500' : 'text-amber-600'}`}>
              Your taste profile
            </p>
            <div className="space-y-3">
              {[
                { label: 'Chicken Tikka Masala', stars: 5, w: '96%' },
                { label: 'Pasta Carbonara',       stars: 5, w: '96%' },
                { label: 'Beef Stir Fry',         stars: 4, w: '78%' },
                { label: 'Thai Green Curry',      stars: 4, w: '78%' },
                { label: 'Salmon & Asparagus',    stars: 3, w: '55%' },
                { label: 'Bean Chilli',           stars: 2, w: '28%' },
              ].map(d => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{d.label}</span>
                    <Stars n={d.stars} />
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: d.w }} />
                  </div>
                </div>
              ))}
            </div>
            <div className={`mt-5 rounded-xl border px-4 py-3 flex items-center gap-3 ${
              dark ? 'border-emerald-800/60 bg-emerald-950/40' : 'border-emerald-200 bg-emerald-50'
            }`}>
              <span className="text-xl">🎲</span>
              <div>
                <p className={`text-sm font-bold ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>Surprise Me suggests…</p>
                <p className={`text-xs ${dark ? 'text-emerald-500' : 'text-emerald-600'}`}>
                  Chicken Tikka · Carbonara · Thai Green Curry…
                </p>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold mb-6 ${
              dark ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                   : 'border-amber-400/40 bg-amber-50 text-amber-700'
            }`}>
              ⭐ Intelligence
            </div>
            <h2 className={`text-3xl sm:text-4xl font-extrabold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>
              A planner that learns<br />
              <span className={dark ? 'text-amber-400' : 'text-amber-600'}>your taste</span>
            </h2>
            <p className={`text-base leading-relaxed mb-6 ${muted}`}>
              After you cook, tap 1–5 stars on any meal row. What's Simmering? builds a personal taste graph
              and uses it to weight Surprise Me so favourites appear more often —
              without repeating the same week every time.
            </p>
            <ul className={`space-y-2.5 text-sm ${muted}`}>
              {[
                '5★ dishes are 25× more likely in Surprise Me',
                'Ratings visible on weekly list, grid, and monthly calendar',
                'Unrated dishes still surface so you discover new favourites',
                'Rating history syncs across devices when signed in',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dark ? 'text-emerald-500' : 'text-emerald-600'}`}>
            Simple by design
          </p>
          <h2 className={`text-3xl sm:text-4xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'}`}>
            How it works
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => {
            const c = COLOR_MAP[s.color];
            return (
              <div key={s.n} className="relative flex flex-col items-start">
                {i < STEPS.length - 1 && (
                  <div className={`hidden md:block absolute top-6 h-px border-t border-dashed ${divider}`} style={{ width: 'calc(100% - 3rem)', left: 'calc(100% - 1rem)' }} />
                )}
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl text-2xl mb-5 border ${c.bg} ${c.border}`}>{s.icon}</div>
                <div className={`text-xs font-black uppercase tracking-widest mb-2 ${c.text}`}>Step {s.n}</div>
                <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>{s.title}</h3>
                <p className={`text-sm leading-relaxed ${muted}`}>{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ PWA CALLOUT ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-16">
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold mb-5 ${
                dark ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                     : 'border-cyan-400/40 bg-cyan-50 text-cyan-700'
              }`}>
                ⚡ Progressive Web App
              </div>
              <h3 className={`text-2xl font-extrabold mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}>
                Add to your home screen.<br />Shop without signal.
              </h3>
              <p className={`text-sm leading-relaxed mb-5 ${muted}`}>
                Install What's Simmering? like a native app — no App Store required.
                Your grocery list is cached so you can shop even when you lose signal in the supermarket.
              </p>
              <ul className={`space-y-2 text-sm ${muted}`}>
                {['📲 Installs on iOS, Android & desktop Chrome','📶 Grocery list available offline','🔔 App update notifications built in','🔗 Home-screen shortcuts to Plan & Grocery'].map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={`flex flex-col items-center justify-center p-8 border-l ${divider} ${dark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
              <div className="text-7xl mb-5 select-none">📱</div>
              <p className={`text-center text-sm font-semibold mb-2 ${dark ? 'text-slate-200' : 'text-slate-800'}`}>Install in seconds</p>
              <p className={`text-center text-xs ${muted} max-w-[180px]`}>
                Tap the share button in your browser and choose "Add to Home Screen"
              </p>
              <div className={`mt-5 rounded-xl border px-4 py-2.5 text-xs font-semibold flex items-center gap-2 ${
                dark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-white text-slate-600 shadow-sm'
              }`}>
                ⬇ Available once you sign in
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold mb-6 ${
          dark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
               : 'border-emerald-400/40 bg-emerald-50 text-emerald-700'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${dark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
          Free · No credit card · No ads
        </div>
        <h2 className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-5 ${dark ? 'text-white' : 'text-slate-900'}`}>
          Stop wondering what's<br />
          <span className={dark ? 'text-emerald-400' : 'text-emerald-600'}>for dinner.</span>
        </h2>
        <p className={`text-lg mb-10 ${muted}`}>
          Join the community. Plan smarter. Cook better.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={signIn} className="inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-bold text-slate-900 shadow-xl ring-1 ring-black/5 transition hover:bg-slate-100 active:scale-95">
            <GoogleIcon /> Sign in with Google
          </button>
          <button onClick={enterGuestMode} className={`inline-flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-semibold transition active:scale-95 ${
            dark ? 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700'
                 : 'border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
          }`}>
            Try it free →
          </button>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className={`relative z-10 border-t ${divider} px-6 py-8`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-emerald-500"><UtensilsIcon size={16} /></span>
            <span className={dark ? 'text-slate-300' : 'text-slate-700'}>What's Simmering?</span>
          </div>
          <p className={`text-xs ${subtle}`}>Built with ❤️ · Free forever · No ads · No tracking</p>
          <div className="flex items-center gap-4">
            <button onClick={signIn}          className={`text-xs transition hover:underline ${muted}`}>Sign in</button>
            <button onClick={enterGuestMode}  className={`text-xs transition hover:underline ${muted}`}>Try as guest</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

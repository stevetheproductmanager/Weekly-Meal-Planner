import React, { useEffect, useRef, useState } from 'react';
import {
  UtensilsIcon, SunIcon, MoonIcon, ShoppingCartIcon, MenuIcon, XIcon,
  ChevronDownIcon, CalendarIcon, GlobeIcon, PantryIcon,
} from './Icons';

// ── Navigation structure ─────────────────────────────────────────────────────

export const KITCHEN_IDS = new Set(['mains', 'sides', 'misc', 'pantry']);

const BOTTOM_NAV = [
  { id: 'plan',        label: 'Plan',      icon: <CalendarIcon size={22} />     },
  { id: 'grocery',     label: 'Grocery',   icon: <ShoppingCartIcon size={22} /> },
  { id: 'kitchen',     label: 'Kitchen',   icon: <UtensilsIcon size={22} />,   isHub: true  },
  { id: 'marketplace', label: 'Spotlight', icon: <GlobeIcon size={22} />        },
];

// ── Top header: logo | desktop tabs | user controls + mobile dropdown ────────

export default function AppHeader({
  activeTab,
  onNavigate,
  user,
  isGuest,
  isAdmin,
  savedPlansCount = 0,
  pantryCount = 0,
  theme,
  onToggleTheme,
  onOpenHelp,
  pwaInstallable = false,
  onInstallApp,
  onSignIn,
  onSignOut,
}) {
  // Mobile hamburger dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  // Desktop user-avatar dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [userMenuOpen]);

  // Navigate + close any open menus
  const go = (id) => {
    onNavigate(id);
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          HEADER / TOP NAV
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="print:hidden shrink-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">

        {/* Single row: logo | tabs (desktop) | right controls */}
        <div className="flex items-stretch h-14 px-4 sm:px-6 gap-1">

          {/* Logo — full name on tablet/desktop, short name on phones */}
          <div className="flex items-center gap-2 pr-3 sm:pr-4 xl:pr-6 shrink-0">
            <span className="text-emerald-500"><UtensilsIcon size={19} /></span>
            <span className="font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
              <span className="hidden md:inline">What's Simmering?</span>
              <span className="md:hidden">Simmering</span>
            </span>
          </div>

          {/* Spacer — primary nav lives in the big icon strip below the header */}
          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Desktop: user avatar pill → dropdown */}
            <div className="hidden md:flex items-center">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button type="button" onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 pl-1 pr-2.5 py-1 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 transition-colors">
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full border border-slate-200 dark:border-slate-700" />
                      : <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">{user.name?.[0] ?? '?'}</span>
                    }
                    <span className="max-w-[110px] truncate">{user.name}</span>
                    <ChevronDownIcon size={11} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 z-50">
                      <div className="p-1">
                        {!isGuest && (
                          <button type="button" onClick={() => go('history')}
                            className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                            <span className="flex items-center gap-2.5">🗂️ History</span>
                            {savedPlansCount > 0 && (
                              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">{savedPlansCount}</span>
                            )}
                          </button>
                        )}
                        <button type="button" onClick={() => go('pantry')}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                          <span className="flex items-center gap-2.5"><PantryIcon size={14} /> Pantry</span>
                          {pantryCount > 0 && (
                            <span className="ml-auto rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">{pantryCount}</span>
                          )}
                        </button>
                        {isAdmin && (
                          <button type="button" onClick={() => go('admin')}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30 font-medium">
                            🛡️ User Management
                          </button>
                        )}
                        <button type="button" onClick={() => { onToggleTheme(); setUserMenuOpen(false); }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                          {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                        </button>
                        <button type="button" onClick={() => { onOpenHelp(); setUserMenuOpen(false); }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-xs font-semibold leading-none">?</span>
                          Help
                        </button>
                        {pwaInstallable && (
                          <button type="button" onClick={() => { onInstallApp(); setUserMenuOpen(false); }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                            ⬇ Install app
                          </button>
                        )}
                      </div>
                      <div className="border-t border-slate-100 p-1 dark:border-slate-800">
                        <button type="button" onClick={() => { onSignOut(); setUserMenuOpen(false); }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" onClick={onSignIn}
                  className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 transition-colors">
                  Sign in with Google
                </button>
              )}
            </div>

            {/* Mobile: hamburger */}
            <button type="button" onClick={() => setMenuOpen(v => !v)}
              className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition-colors"
              aria-label="Menu">
              {menuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown — secondary actions */}
      {menuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 z-20 relative shadow-md">
          {user && (
            <div className="px-3 pt-2 pb-1 space-y-0.5">
              {isAdmin && (
                <button type="button" onClick={() => go('admin')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === 'admin' ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60'}`}>
                  <span className="flex items-center gap-2">🛡️ User Management</span>
                </button>
              )}
              <button type="button" onClick={() => go('history')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'history' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60'}`}>
                <span className="flex items-center gap-2">🗂️ History</span>
                {savedPlansCount > 0 && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">{savedPlansCount}</span>
                )}
              </button>
              <button type="button" onClick={() => go('pantry')}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'pantry' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60'}`}>
                <span className="flex items-center gap-2"><PantryIcon size={14} /> Pantry</span>
                {pantryCount > 0 && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">{pantryCount}</span>
                )}
              </button>
            </div>
          )}
          <div className={`px-3 py-2 space-y-0.5 ${user ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}>
            <button type="button" onClick={() => { onToggleTheme(); setMenuOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/60">
              {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            {pwaInstallable && (
              <button type="button" onClick={() => { onInstallApp(); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/60">
                ⬇ Install app
              </button>
            )}
          </div>
          <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
            {user ? (
              <button type="button" onClick={() => { onSignOut(); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                Sign out
              </button>
            ) : (
              <button type="button" onClick={() => { onSignIn(); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Desktop icon nav — same 4 big tabs, as a strip under the header ──────────

export function DesktopIconNav({ activeTab, onNavigate, lastKitchenTab }) {
  return (
    <nav className="print:hidden hidden md:block shrink-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="flex h-[4.5rem] w-full">
        {BOTTOM_NAV.map((item) => {
          const isActive = item.isHub
            ? KITCHEN_IDS.has(activeTab)
            : activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.isHub) onNavigate(lastKitchenTab);
                else onNavigate(item.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 border-b-[3px] transition-all duration-150 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-transparent text-emerald-600/70 hover:bg-emerald-50/60 hover:text-emerald-600 dark:text-emerald-500/60 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400'
              }`}
            >
              <span className={`transition-transform duration-150 ${isActive ? 'scale-125' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Mobile bottom nav — 4 tabs ───────────────────────────────────────────────

export function MobileBottomNav({ activeTab, onNavigate, lastKitchenTab }) {
  return (
    <nav
      className="print:hidden md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-16">
        {BOTTOM_NAV.map((item) => {
          const isActive = item.isHub
            ? KITCHEN_IDS.has(activeTab)
            : activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.isHub) onNavigate(lastKitchenTab);
                else onNavigate(item.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-slate-50 dark:active:bg-slate-900 ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <span className={`transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

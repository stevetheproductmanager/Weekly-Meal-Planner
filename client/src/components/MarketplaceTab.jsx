import React, { useCallback, useEffect, useRef, useState } from 'react';
import { XIcon } from './Icons';

const API_BASE = '/api';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-2.5 w-16 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="h-3 w-7 rounded bg-slate-100 dark:bg-slate-800" />
            <div className={`h-3 rounded bg-slate-200 dark:bg-slate-700`} style={{ width: `${40 + (i * 11) % 40}%` }} />
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

// ─── Shared week card ──────────────────────────────────────────────────────────

function SharedWeekCard({ plan, isOwner, onClone, onUnshareRequest, onUnshareConfirm, onUnshareCancel, confirmingUnshare, cloning }) {
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">

      {/* Card header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          {plan.userAvatar
            ? <img src={plan.userAvatar} alt={plan.userName} className="h-7 w-7 rounded-full shrink-0 border border-slate-200 dark:border-slate-700" />
            : <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {plan.userName?.[0]?.toUpperCase() ?? '?'}
              </div>
          }
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {plan.userName || 'Anonymous'}
            </p>
            {plan.weekLabel && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{plan.weekLabel}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500" title="Times cloned">
            <span>🔄</span>
            <span>{plan.cloneCount || 0}</span>
          </span>
          {isOwner && (
            confirmingUnshare ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Remove?</span>
                <button
                  type="button"
                  onClick={onUnshareConfirm}
                  className="rounded-md bg-red-500 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-red-400 transition-colors"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={onUnshareCancel}
                  className="rounded-md border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onUnshareRequest}
                title="Remove from marketplace"
                className="h-6 w-6 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <XIcon size={10} />
              </button>
            )
          )}
        </div>
      </div>

      {/* Meal list */}
      <div className="px-4 py-3 space-y-1.5 flex-1">
        {Array.from({ length: 7 }, (_, i) => {
          const entry = plan.entries?.find(e => e.day === i) || plan.entries?.[i];
          return (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600 w-7 shrink-0">
                {DAYS[i]}
              </span>
              {entry ? (
                <span className="text-sm text-slate-800 dark:text-slate-200 truncate">
                  {entry.mainName}
                </span>
              ) : (
                <span className="text-xs text-slate-300 dark:text-slate-700 italic">—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {timeAgo(plan.createdAt)}
        </span>
        <button
          type="button"
          onClick={onClone}
          disabled={cloning}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
        >
          {cloning ? '⏳ Loading…' : '+ Use this week'}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MarketplaceTab({
  user,
  planWithDetails,
  currentWeekStart,
  weekLabel,
  onCloneWeek,
  onAddToast,
}) {
  const [plans,    setPlans]    = useState([]);
  const [myPlans,  setMyPlans]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sort,     setSort]     = useState('recent');   // 'recent' | 'popular'
  const [search,   setSearch]   = useState('');
  const [searchQ,  setSearchQ]  = useState('');         // debounced
  const [cloning,  setCloning]  = useState(null);
  const [sharing,  setSharing]  = useState(false);
  const [tab,      setTab]      = useState('browse');   // 'browse' | 'mine'
  const [unshareConfirmId, setUnshareConfirmId] = useState(null); // id of plan pending unshare confirm
  const debounceRef = useRef(null);

  // ── Debounce search input ──
  const handleSearchChange = (v) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQ(v), 350);
  };

  // ── Load plans ──
  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const qs  = `sort=${sort}${searchQ ? `&q=${encodeURIComponent(searchQ)}` : ''}`;
      const res = await fetch(`${API_BASE}/marketplace?${qs}`);
      if (res.ok) setPlans(await res.json());
    } finally {
      setLoading(false);
    }
  }, [sort, searchQ]);

  const loadMine = useCallback(async () => {
    if (!user) { setMyPlans([]); return; }
    try {
      const res = await fetch(`${API_BASE}/marketplace/mine`, { credentials: 'include' });
      if (res.ok) setMyPlans(await res.json());
    } catch {}
  }, [user]);

  useEffect(() => { loadPlans(); }, [loadPlans]);
  useEffect(() => { loadMine();  }, [loadMine]);

  // ── Clone a plan ──
  const handleClone = async (planId) => {
    setCloning(planId);
    try {
      const res = await fetch(`${API_BASE}/marketplace/${planId}/clone`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const { entries } = await res.json();
      onCloneWeek(entries);
      // Toast is fired by onCloneWeek (handleCloneSharedWeek in App.jsx) — don't double-fire here
      // bump count locally so UI reflects it without a refetch
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, cloneCount: (p.cloneCount || 0) + 1 } : p));
      setMyPlans(prev => prev.map(p => p.id === planId ? { ...p, cloneCount: (p.cloneCount || 0) + 1 } : p));
    } catch {
      onAddToast('Could not load this plan.', 'error');
    } finally {
      setCloning(null);
    }
  };

  // ── Unshare own plan — two-step: request confirm, then execute ──
  const handleUnshareRequest = (planId) => setUnshareConfirmId(planId);

  const handleUnshareConfirm = async () => {
    const planId = unshareConfirmId;
    setUnshareConfirmId(null);
    await fetch(`${API_BASE}/marketplace/${planId}`, { method: 'DELETE', credentials: 'include' });
    setMyPlans(prev => prev.filter(p => p.id !== planId));
    setPlans(prev => prev.filter(p => p.id !== planId));
    onAddToast('Plan removed from marketplace.', 'info');
  };

  // ── Share current week ──
  const handleShareWeek = async () => {
    if (!user)               { onAddToast('Sign in to share your week.', 'info'); return; }
    if (!planWithDetails?.length) { onAddToast('Add some meals to your plan first.', 'info'); return; }
    setSharing(true);
    try {
      const res = await fetch(`${API_BASE}/marketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          weekStart: currentWeekStart,
          weekLabel,
          entries: planWithDetails
            .map((e, i) => ({ e, i }))
            .filter(({ e }) => e.type !== 'out')
            .map(({ e, i }) => ({
              day:     i,
              mainId:  e.mainId,
              sideIds: e.sideIds || [],
            })),
        }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      if (saved.wasUpdated) {
        // Replace the existing entry in both lists
        const replace = prev => prev.map(p => p.id === saved.id ? saved : p);
        setMyPlans(replace);
        setPlans(replace);
        onAddToast('Community Spotlight updated! 🌍', 'success');
      } else {
        setMyPlans(prev => [saved, ...prev]);
        setPlans(prev => [saved, ...prev]);
        onAddToast('Your week is live on Community Spotlight! 🎉', 'success');
      }
      setTab('mine');
    } catch {
      onAddToast('Could not share your week.', 'error');
    } finally {
      setSharing(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🌍 Community Spotlight
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Browse the community's weekly dinner plans and clone them into yours.
          </p>
        </div>

        {user && planWithDetails?.length > 0 && (
          <button
            type="button"
            onClick={handleShareWeek}
            disabled={sharing}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            {sharing ? '⏳ Sharing…' : '📤 Share my week'}
          </button>
        )}
      </div>

      {/* ── Browse / Mine tabs ── */}
      {user && myPlans.length > 0 && (
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/60">
          {[
            { id: 'browse', label: 'Browse all' },
            { id: 'mine',   label: `My plans (${myPlans.length})` },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                tab === t.id
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'browse' && (
        <>
          {/* ── Controls ── */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/60">
              {[{ id: 'recent', label: '🕐 Recent' }, { id: 'popular', label: '🔥 Popular' }].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                    sort === s.id
                      ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="search"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by dish name…"
              className="flex-1 min-w-[160px] max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
            />
          </div>

          {/* ── Grid ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <span className="text-5xl">🍽️</span>
              <div>
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  {searchQ ? `No plans match "${searchQ}"` : 'No shared plans yet'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {searchQ ? 'Try a different search.' : 'Be the first to share your week!'}
                </p>
              </div>
              {!searchQ && user && planWithDetails?.length > 0 && (
                <button
                  type="button"
                  onClick={handleShareWeek}
                  disabled={sharing}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
                >
                  📤 Share my week
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <SharedWeekCard
                  key={plan.id}
                  plan={plan}
                  isOwner={user && plan.userId === user._id}
                  onClone={() => handleClone(plan.id)}
                  onUnshareRequest={() => handleUnshareRequest(plan.id)}
                  onUnshareConfirm={handleUnshareConfirm}
                  onUnshareCancel={() => setUnshareConfirmId(null)}
                  confirmingUnshare={unshareConfirmId === plan.id}
                  cloning={cloning === plan.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'mine' && (
        <>
          {myPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <span className="text-4xl">📤</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                You haven't shared any weeks yet.
              </p>
              {planWithDetails?.length > 0 && (
                <button type="button" onClick={handleShareWeek} disabled={sharing}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors">
                  📤 Share my current week
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPlans.map(plan => (
                <SharedWeekCard
                  key={plan.id}
                  plan={plan}
                  isOwner
                  onClone={() => handleClone(plan.id)}
                  onUnshareRequest={() => handleUnshareRequest(plan.id)}
                  onUnshareConfirm={handleUnshareConfirm}
                  onUnshareCancel={() => setUnshareConfirmId(null)}
                  confirmingUnshare={unshareConfirmId === plan.id}
                  cloning={cloning === plan.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function StatPill({ label, value, color = 'slate' }) {
  const colors = {
    slate:   'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    violet:  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    amber:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  };
  return (
    <div className={`flex flex-col items-center rounded-xl px-5 py-3 ${colors[color]}`}>
      <span className="text-2xl font-bold tabular-nums">{value ?? '—'}</span>
      <span className="text-xs font-medium mt-0.5 opacity-75">{label}</span>
    </div>
  );
}

export default function AdminPage({ currentUser }) {
  const [users,   setUsers]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [deleting, setDeleting] = useState(null);   // userId being deleted
  const [confirm,  setConfirm]  = useState(null);   // user object pending delete confirm
  const [search,   setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users`, { credentials: 'include' }),
        fetch(`${API_BASE}/admin/stats`, { credentials: 'include' }),
      ]);
      if (!usersRes.ok) throw new Error('Failed to load users');
      setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (user) => {
    setDeleting(user.id);
    setConfirm(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Delete failed');
      }
      setUsers(prev => prev.filter(u => u.id !== user.id));
      if (stats) setStats(s => ({ ...s, userCount: s.userCount - 1 }));
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = search.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            🛡️ Admin — User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Signed in as <span className="font-medium text-slate-700 dark:text-slate-300">{currentUser?.email}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {loading ? '⏳ Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          <StatPill label="Total users"   value={stats.userCount}       color="emerald" />
          <StatPill label="Active plans"  value={stats.planCount}       color="violet"  />
          <StatPill label="Custom dishes" value={stats.dishCount}       color="amber"   />
          <StatPill label="Shared weeks"  value={stats.sharedWeekCount} color="slate"   />
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/60 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ── Search ─────────────────────────────────────────────────────── */}
      {users.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
      )}

      {/* ── User table ─────────────────────────────────────────────────── */}
      {loading && !users.length ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500">Loading users…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500">No users found</div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">User</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Joined</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Plans</th>
                <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saved</th>
                <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dishes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(user => {
                const isSelf    = user.email === currentUser?.email;
                const isDeleting = deleting === user.id;
                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${isSelf ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-8 w-8 rounded-full shrink-0 object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold shrink-0">
                            {user.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{user.name}</span>
                            {isSelf && (
                              <span className="shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">you</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="hidden sm:table-cell px-4 py-3 text-slate-500 dark:text-slate-400">
                      {fmt(user.createdAt)}
                    </td>

                    {/* Plans */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${user.planCount > 0 ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' : 'text-slate-400'}`}>
                        {user.planCount}
                      </span>
                    </td>

                    {/* Saved plans */}
                    <td className="hidden md:table-cell px-4 py-3 text-center text-slate-500 dark:text-slate-400 text-xs">
                      {user.savedPlanCount}
                    </td>

                    {/* Custom dishes */}
                    <td className="hidden md:table-cell px-4 py-3 text-center text-slate-500 dark:text-slate-400 text-xs">
                      {user.dishCount}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {isSelf ? (
                        <span className="text-xs text-slate-300 dark:text-slate-600 italic">your account</span>
                      ) : (
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setConfirm(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 transition-colors dark:border-red-800/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          {isDeleting ? '…' : '🗑 Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length < users.length && (
            <div className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
              Showing {filtered.length} of {users.length} users
            </div>
          )}
        </div>
      )}

      {/* ── Delete confirm modal ────────────────────────────────────────── */}
      {confirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              {confirm.avatar ? (
                <img src={confirm.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                  {confirm.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{confirm.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{confirm.email}</p>
              </div>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 dark:border-red-800/40 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300 space-y-1">
              <p className="font-semibold">This will permanently delete:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
                <li>Google account link</li>
                <li>All meal plans ({confirm.planCount} weeks)</li>
                <li>Saved plans ({confirm.savedPlanCount})</li>
                <li>Custom dishes ({confirm.dishCount})</li>
                <li>Pantry, misc items, ratings, saved dishes</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirm)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 active:scale-95 transition-all"
              >
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

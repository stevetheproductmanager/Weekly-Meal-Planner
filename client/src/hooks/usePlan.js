import { useCallback, useEffect, useRef, useState } from 'react';
import { getThisMonday, addWeeks } from '../utils/week';

const API_BASE = '/api';

/**
 * Owns the core plan state machine:
 *  - planEntries for the displayed week (+ load / persist, guest localStorage mode)
 *  - week navigation (currentWeekStart, prev/next/today, read-only past weeks)
 *  - monthly view data (4-week window) + reorder within any visible week
 *  - "previous week has meals" check (drives the Copy-last-week button)
 *
 * Composite actions (add meal, attach side, copy week, randomize…) stay in App —
 * they combine plan primitives with dishes/toasts/dialog state. They use the
 * exposed { planEntries, setPlanEntries, persistPlan } to do their work.
 *
 * @param {object}  opts
 * @param {object}  opts.user     authenticated user (null for guests)
 * @param {boolean} opts.isGuest
 * @param {Array}   opts.mains    dish library — used to validate loaded entries
 * @param {Array}   opts.sides
 */
export default function usePlan({ user, isGuest, mains, sides }) {
  const [planEntries, setPlanEntries] = useState([]); // {id, mainId, sideIds[]}
  const [currentWeekStart, setCurrentWeekStart] = useState(getThisMonday);
  const [monthPlansData, setMonthPlansData] = useState({});
  const [prevWeekHasMeals, setPrevWeekHasMeals] = useState(false);

  // ---- Load plan entries for a given week ----
  // mainsData / sidesData are optional — when omitted uses current state
  const loadPlanEntries = useCallback(async (weekStart, mainsData, sidesData) => {
    const mainsArr = mainsData ?? mains;
    const sidesArr = sidesData ?? sides;
    if (!user) {
      // Guest — always reads from localStorage (no week concept for guests)
      try {
        const stored = localStorage.getItem('simmer_guest_plan');
        const raw = stored ? JSON.parse(stored) : [];
        const valid = raw
          .map((e) => ({ ...e, sideIds: (e.sideIds || []).filter((sid) => sidesArr.some((s) => s.id === sid)) }))
          .filter((e) => e.type === 'out' || mainsArr.some((m) => m.id === e.mainId));
        setPlanEntries(valid);
      } catch { setPlanEntries([]); }
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/plan?week=${weekStart}`, { credentials: 'include' });
      const data = res.ok ? await res.json() : { entries: [] };
      const valid = (data.entries || [])
        .map((e) => ({ ...e, sideIds: (e.sideIds || []).filter((sid) => sidesArr.some((s) => s.id === sid)) }))
        .filter((e) => e.type === 'out' || mainsArr.some((m) => m.id === e.mainId));
      setPlanEntries(valid);
    } catch (err) { console.error(err); }
  }, [user, mains, sides]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMonthPlans = useCallback(async (start) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/plans/month?start=${start}`, { credentials: 'include' });
      if (res.ok) setMonthPlansData(await res.json());
    } catch (err) { console.error(err); }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistPlan = async (entries) => {
    if (!user) {
      // Guest — persist to localStorage only
      try { localStorage.setItem('simmer_guest_plan', JSON.stringify(entries)); } catch {}
      return;
    }
    try {
      await fetch(`${API_BASE}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entries, weekStart: currentWeekStart }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Re-fetch plan when week changes (after initial load) ----
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (!user) return; // guests have no week concept
    loadPlanEntries(currentWeekStart);
    fetchMonthPlans(currentWeekStart);
  }, [currentWeekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Check whether previous week has meals (drives "Copy last week" visibility) ----
  useEffect(() => {
    if (!user) { setPrevWeekHasMeals(false); return; }
    const prevWeekIso = addWeeks(currentWeekStart, -1);
    let cancelled = false;
    fetch(`${API_BASE}/plan?week=${prevWeekIso}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { entries: [] })
      .then(data => {
        if (cancelled) return;
        const has = (data.entries || []).some(e => e.type === 'out' || e.mainId);
        setPrevWeekHasMeals(has);
      })
      .catch(() => { if (!cancelled) setPrevWeekHasMeals(false); });
    return () => { cancelled = true; };
  }, [currentWeekStart, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Reorder within the displayed week ----
  const reorderPlan = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const newEntries = [...planEntries];
    const [moved] = newEntries.splice(fromIndex, 1);
    newEntries.splice(toIndex, 0, moved);
    setPlanEntries(newEntries);
    persistPlan(newEntries);
  };

  // Reorder a day slot within any week visible in the monthly view.
  // For the currently-loaded week we use in-memory state; for other weeks
  // we patch monthPlansData and persist directly to the API.
  const reorderMonthEntry = async (weekIso, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    if (weekIso === currentWeekStart) {
      reorderPlan(fromIdx, toIdx);
      return;
    }
    const weekEntries = [...(monthPlansData[weekIso] || [])];
    const [moved] = weekEntries.splice(fromIdx, 1);
    weekEntries.splice(toIdx, 0, moved);
    setMonthPlansData(prev => ({ ...prev, [weekIso]: weekEntries }));
    try {
      await fetch(`${API_BASE}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ weekStart: weekIso, entries: weekEntries }),
      });
    } catch (err) { console.error('Failed to persist monthly reorder:', err); }
  };

  // ---- Week navigation ----
  const todayWeekStart = getThisMonday();
  const isPastWeek = currentWeekStart < todayWeekStart;
  // Guests have a single localStorage plan with no week concept — never lock them out
  const isReadOnlyWeek = isPastWeek && !isGuest;
  const goToPrevWeek    = () => setCurrentWeekStart(addWeeks(currentWeekStart, -1));
  const goToNextWeek    = () => setCurrentWeekStart(addWeeks(currentWeekStart, +1));
  const goToCurrentWeek = () => setCurrentWeekStart(todayWeekStart);
  const navigateToWeek  = (weekIso) => setCurrentWeekStart(weekIso);

  return {
    // core state + primitives (composite App handlers build on these)
    planEntries, setPlanEntries, persistPlan, loadPlanEntries,
    // week navigation
    currentWeekStart, setCurrentWeekStart,
    isPastWeek, isReadOnlyWeek,
    goToPrevWeek, goToNextWeek, goToCurrentWeek, navigateToWeek,
    prevWeekHasMeals,
    // monthly view
    monthPlansData, fetchMonthPlans,
    reorderPlan, reorderMonthEntry,
  };
}

import { useCallback, useState } from 'react';

const API_BASE = '/api';

/**
 * Owns the dish library (mains + sides) and all dish-level server actions:
 * rate, save/unsave, submit to community, create, update, delete.
 *
 * Plan cleanup after a delete (removing the dish from this week's entries)
 * stays in App — that's plan domain.
 *
 * @param {object}   opts
 * @param {object}   opts.user      authenticated user (null for guests)
 * @param {Function} opts.addToast  toast helper from App
 */
export default function useDishes({ user, addToast }) {
  const [mains, setMains] = useState([]);
  const [sides, setSides] = useState([]);

  // ---- Rate a dish 1–5 stars ----
  const rateDish = useCallback(async (dishId, rating) => {
    if (!dishId) return;
    if (!user) { addToast('Sign in to rate dishes.', 'info'); return; }
    const isMain = mains.some(m => m.id === dishId);
    const path = isMain ? 'mains' : 'sides';
    try {
      const res = await fetch(`${API_BASE}/${path}/${dishId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) throw new Error();
      const { myRating } = await res.json();
      const update = prev => prev.map(d => d.id === dishId ? { ...d, myRating } : d);
      if (isMain) setMains(update);
      else setSides(update);
      const dishName = (isMain ? mains : sides).find(d => d.id === dishId)?.name ?? 'dish';
      addToast(`Rated "${dishName}" ${rating} ★`, 'success');
    } catch { addToast('Could not save rating.', 'error'); }
  }, [user, mains, sides]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Save / unsave a dish ----
  const toggleSaveDish = useCallback(async (kind, dishId) => {
    if (!user) { addToast('Sign in to save dishes.', 'info'); return; }
    const path = kind === 'main' ? 'mains' : 'sides';
    try {
      const res = await fetch(`${API_BASE}/${path}/${dishId}/save`, {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const { savedByMe } = await res.json();
      const delta = savedByMe ? 1 : -1;
      const update = prev => prev.map(d => d.id === dishId ? { ...d, savedByMe, saveCount: (d.saveCount || 0) + delta } : d);
      if (kind === 'main') setMains(update);
      else setSides(update);
    } catch { addToast('Could not update save.', 'error'); }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Submit dish to community ----
  const submitToCommunity = useCallback(async (kind, dishId) => {
    const path = kind === 'main' ? 'mains' : 'sides';
    try {
      const res = await fetch(`${API_BASE}/${path}/${dishId}/submit-community`, {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      const update = prev => prev.map(d => d.id === dishId ? { ...d, ...updated } : d);
      if (kind === 'main') setMains(update);
      else setSides(update);
      addToast('Dish shared with the community! 🎉', 'success');
    } catch { addToast('Could not submit dish.', 'error'); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- CRUD: mains & sides ----
  const createDish = async ({ kind, dish }) => {
    const path = kind === 'main' ? 'mains' : 'sides';
    try {
      const res = await fetch(`${API_BASE}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dish),
      });
      if (!res.ok) throw new Error('Failed to create dish');
      const saved = await res.json();
      if (kind === 'main') setMains((prev) => [...prev, saved]);
      else setSides((prev) => [...prev, saved]);
      addToast(`"${saved.name}" added to your library.`, 'success');
    } catch (err) {
      console.error(err);
      addToast('There was a problem saving the dish.', 'error');
    }
  };

  const updateDish = async ({ kind, dish }) => {
    const path = kind === 'main' ? 'mains' : 'sides';
    try {
      const res = await fetch(`${API_BASE}/${path}/${dish.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dish),
      });
      if (!res.ok) throw new Error('Failed to update dish');
      const saved = await res.json();
      if (kind === 'main') {
        setMains((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
      } else {
        setSides((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      }
      addToast(`"${saved.name}" updated.`, 'success');
    } catch (err) {
      console.error(err);
      addToast('There was a problem updating the dish.', 'error');
    }
  };

  // Deletes on the server and removes from the library.
  // Returns true on success so the caller can clean up plan entries.
  const deleteDish = async (kind, dish) => {
    const path = kind === 'main' ? 'mains' : 'sides';
    try {
      const res = await fetch(`${API_BASE}/${path}/${dish.id}`, {
        method: 'DELETE',
      });
      if (res.status !== 204 && res.status !== 200) {
        throw new Error('Failed to delete');
      }
      if (kind === 'main') setMains((prev) => prev.filter((m) => m.id !== dish.id));
      else setSides((prev) => prev.filter((s) => s.id !== dish.id));
      addToast(`"${dish.name}" deleted.`, 'info');
      return true;
    } catch (err) {
      console.error(err);
      addToast('There was a problem deleting the dish.', 'error');
      return false;
    }
  };

  return {
    mains, setMains,
    sides, setSides,
    rateDish, toggleSaveDish, submitToCommunity,
    createDish, updateDish, deleteDish,
  };
}

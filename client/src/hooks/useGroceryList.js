import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = '/api';

export const makeGroceryKey = (item) =>
  `${(item.name || '').toLowerCase()}||${(item.unit || '').toLowerCase()}||${(item.category || '').toLowerCase()}`;

/**
 * Owns the entire grocery-list domain:
 *  - meal-based grocery items (debounced server build + offline cache)
 *  - hidden ("dismissed") items                — per-week localStorage
 *  - shop mode + checked-off items            — per-week localStorage
 *  - one-off custom items typed into the list — per-week localStorage
 *  - this week's selected misc items          — per-week localStorage
 *  - the combined `allGroceryItems` the UI renders
 *
 * @param {object}   opts
 * @param {string}   opts.weekStart    ISO Monday of the displayed week
 * @param {Array}    opts.planEntries  current plan entries (drives the server build)
 * @param {Function} opts.addToast     toast helper from App
 */
export default function useGroceryList({ weekStart, planEntries, addToast }) {

  // ---- Meal-based items (built by the server from the plan) ----
  const [groceryItems, setGroceryItems] = useState([]);

  // ---- Hidden (dismissed) items ----
  const [hiddenGroceryKeys, setHiddenGroceryKeys] = useState(() => {
    try {
      const stored = localStorage.getItem(`simmer_hidden_grocery_${weekStart}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // ---- Shopping mode ----
  const [shoppingMode, setShoppingMode] = useState(false);
  const [checkedGroceryKeys, setCheckedGroceryKeys] = useState(() => {
    try {
      const stored = localStorage.getItem(`simmer_checked_grocery_${weekStart}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // ---- This week's selected misc items (per browser/week) ----
  const [miscGroceryItems, setMiscGroceryItems] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`simmer_misc_grocery_${weekStart}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // ---- Custom one-off grocery list items (week-scoped, localStorage only) ----
  const [customListItems, setCustomListItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`simmer_custom_list_${weekStart}`) || '[]'); }
    catch { return []; }
  });

  // ---- Build grocery list whenever plan changes ----
  // Debounced (400 ms) + AbortController so rapid servings changes don't queue
  // stale responses that overwrite the latest grocery data.
  const groceryTimerRef = useRef(null);
  const groceryAbortRef = useRef(null);

  useEffect(() => {
    if (!planEntries.length) {
      setGroceryItems([]);
      return;
    }
    const GROCERY_CACHE_KEY = `simmer_offline_grocery_${weekStart}`;

    const controller = new AbortController();
    groceryAbortRef.current = controller;

    groceryTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/grocery-list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            entries: planEntries.map((e) => ({
              mainId:   e.mainId,
              sideIds:  e.sideIds || [],
              servings: e.servings || 4,
            })),
          }),
        });
        if (!res.ok) throw new Error('Failed to build grocery list');
        const data = await res.json();
        setGroceryItems(data.items || []);
        // Cache for offline use
        try { localStorage.setItem(GROCERY_CACHE_KEY, JSON.stringify(data.items || [])); } catch {}
      } catch (err) {
        if (err.name === 'AbortError') return; // cancelled by a newer request — ignore
        console.error(err);
        // Fall back to cached list when offline
        try {
          const cached = localStorage.getItem(GROCERY_CACHE_KEY);
          if (cached) setGroceryItems(JSON.parse(cached));
        } catch {}
      }
    }, 400);

    return () => {
      clearTimeout(groceryTimerRef.current);
      controller.abort();
    };
  }, [planEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Per-week reload + persist for each localStorage-backed slice ----

  // Misc items
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`simmer_misc_grocery_${weekStart}`);
      setMiscGroceryItems(stored ? JSON.parse(stored) : []);
    } catch { setMiscGroceryItems([]); }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`simmer_misc_grocery_${weekStart}`, JSON.stringify(miscGroceryItems));
    }
  }, [miscGroceryItems, weekStart]);

  // Hidden keys
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`simmer_hidden_grocery_${weekStart}`);
      setHiddenGroceryKeys(stored ? JSON.parse(stored) : []);
    } catch { setHiddenGroceryKeys([]); }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem(`simmer_hidden_grocery_${weekStart}`, JSON.stringify(hiddenGroceryKeys));
  }, [hiddenGroceryKeys, weekStart]);

  // Checked keys
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`simmer_checked_grocery_${weekStart}`);
      setCheckedGroceryKeys(stored ? JSON.parse(stored) : []);
    } catch { setCheckedGroceryKeys([]); }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem(`simmer_checked_grocery_${weekStart}`, JSON.stringify(checkedGroceryKeys));
  }, [checkedGroceryKeys, weekStart]);

  // Custom items
  useEffect(() => {
    try { setCustomListItems(JSON.parse(localStorage.getItem(`simmer_custom_list_${weekStart}`) || '[]')); }
    catch { setCustomListItems([]); }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem(`simmer_custom_list_${weekStart}`, JSON.stringify(customListItems));
  }, [customListItems, weekStart]);

  // ---- Custom item handlers ----
  const addCustomListItem = (name) => {
    const t = name.trim();
    if (!t) return;
    // Prevent adding the same item twice in the same week
    setCustomListItems((prev) => {
      if (prev.some((i) => i.name.toLowerCase() === t.toLowerCase())) return prev;
      return [...prev, { id: `custom_${Date.now()}`, name: t }];
    });
  };

  const removeCustomListItem = (id) => {
    const removed = customListItems.find(i => i.id === id);
    setCustomListItems((prev) => prev.filter((i) => i.id !== id));
    if (removed) addToast(`"${removed.name}" removed.`, 'info', {
      label: 'Undo',
      onClick: () => setCustomListItems(prev => [...prev, removed]),
    });
  };

  // ---- Shop-mode handlers ----
  const toggleCheckedGrocery = useCallback((key) => {
    setCheckedGroceryKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  // Batch-check: adds all supplied keys to the checked set (skips already-checked ones)
  const batchCheckGrocery = useCallback((keys) => {
    setCheckedGroceryKeys(prev => {
      const set = new Set(prev);
      keys.forEach(k => set.add(k));
      return Array.from(set);
    });
  }, []);

  const clearCheckedGrocery = () => {
    setCheckedGroceryKeys([]);
  };

  // Exit shopping mode and clear all checks in one action (used by completion banner)
  const exitShopMode = () => {
    setShoppingMode(false);
    setCheckedGroceryKeys([]);
  };

  // ---- Dismiss / reset ----
  const dismissGroceryItem = (item) => {
    const key = makeGroceryKey(item);
    setHiddenGroceryKeys((prev) => prev.includes(key) ? prev : [...prev, key]);
    addToast(`"${item.name}" hidden from list.`, 'info', {
      label: 'Undo',
      onClick: () => setHiddenGroceryKeys(prev => prev.filter(k => k !== key)),
    });
  };

  const resetGroceryList = () => {
    setHiddenGroceryKeys([]);
  };

  // ---- Misc-item grocery handlers ----
  // (misc INVENTORY lives in App — these only manage this week's selections)

  // Plain add — duplicate checks / toasts are the caller's responsibility
  const addMiscGroceryItem = (name, inventoryId) => {
    setMiscGroceryItems((prev) => [
      ...prev,
      { id: 'misc_' + Date.now().toString(36), name, inventoryId },
    ]);
  };

  // Remove from this week's list, with undo toast
  const removeMiscGroceryItem = (miscId) => {
    const removed = miscGroceryItems.find(i => i.id === miscId);
    setMiscGroceryItems((prev) => prev.filter((item) => item.id !== miscId));
    if (removed) addToast(`"${removed.name}" removed.`, 'info', {
      label: 'Undo',
      onClick: () => setMiscGroceryItems(prev => [...prev, removed]),
    });
  };

  // Remove all selections pointing at a deleted inventory item
  const removeMiscGroceryByInventoryId = (inventoryId) => {
    setMiscGroceryItems((prev) =>
      prev.filter((item) => item.inventoryId !== inventoryId)
    );
  };

  // ---- Derived: the combined list the UI renders ----

  // Meal-based grocery items (from API), filtered by hidden keys
  const visibleGroceryItems = groceryItems.filter(
    (item) => !hiddenGroceryKeys.includes(makeGroceryKey(item))
  );

  // Attach a source flag so GroceryList knows how to remove them
  const mealGroceryItems = visibleGroceryItems.map(item => ({
    ...item,
    source: 'meal',
  }));

  // Misc items appear in the same table, but with Dishes column = "MISC ITEM"
  const miscGroceryItemsWithMeta = miscGroceryItems.map(item => ({
    id: item.id,
    name: item.name,
    fromMeals: ['MISC ITEM'],
    source: 'misc',
  }));

  // One-off custom items typed directly into the grocery list
  const customGroceryItemsWithMeta = customListItems.map(item => ({
    id: item.id,
    name: item.name,
    fromMeals: ['Added manually'],
    source: 'custom',
    category: '',
  }));

  const allGroceryItems = [...mealGroceryItems, ...miscGroceryItemsWithMeta, ...customGroceryItemsWithMeta];

  // ---- Copy the full list as plain text (great for WhatsApp / Messages) ----
  // planWithDetails is passed at call time because it's derived later in App.
  const copyGroceryList = (planWithDetails = []) => {
    if (!allGroceryItems.length) return;
    const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekMeals = planWithDetails.length
      ? planWithDetails.map((e, i) =>
          `${DAYS_SHORT[i]}: ${e.type === 'out' ? 'Out' : e.main?.name ?? '—'}`
        ).join(' · ')
      : null;

    const sections = {};
    allGroceryItems.forEach(item => {
      const cat =
        item.source === 'misc'   ? 'Other items' :
        item.source === 'custom' ? 'Added manually' :
        (item.category || 'Other');
      if (!sections[cat]) sections[cat] = [];
      const qty = [item.quantityText, item.unit].filter(Boolean).join(' ');
      sections[cat].push(qty ? `${item.name} (${qty})` : item.name);
    });

    const lines = ['🛒 Grocery list'];
    if (weekMeals) lines.push(`${weekMeals}`, '');
    Object.entries(sections)
      .sort(([a], [b]) => {
        const isOther = s => s === 'Other' || s === 'Other items' || s === 'Added manually';
        if (isOther(a) && !isOther(b)) return 1;
        if (!isOther(a) && isOther(b)) return -1;
        return a.localeCompare(b);
      })
      .forEach(([cat, catItems]) => {
        lines.push(cat);
        catItems.forEach(item => lines.push(`• ${item}`));
        lines.push('');
      });

    navigator.clipboard.writeText(lines.join('\n').trimEnd()).then(() => {
      addToast('Grocery list copied to clipboard! 📋', 'success');
    }).catch(() => {
      addToast('Could not copy — please try again.', 'error');
    });
  };

  return {
    // data
    allGroceryItems,
    miscGroceryItems,
    // shop mode
    shoppingMode, setShoppingMode,
    checkedGroceryKeys,
    toggleCheckedGrocery, batchCheckGrocery, clearCheckedGrocery, exitShopMode,
    // dismiss / reset
    dismissGroceryItem, resetGroceryList,
    // custom items
    addCustomListItem, removeCustomListItem,
    // misc selections
    addMiscGroceryItem, removeMiscGroceryItem, removeMiscGroceryByInventoryId,
    // share
    copyGroceryList,
  };
}

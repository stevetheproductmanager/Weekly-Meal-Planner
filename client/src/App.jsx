import React, { useCallback, useEffect, useState } from 'react';
import InventoryTab from './components/InventoryTab';
import PlanTab from './components/PlanTab';
import PlanHistoryTab from './components/PlanHistoryTab';
import GroceryList from './components/grocery/GroceryList';
import DishDialog from './components/dialogs/DishDialog';
import ConfirmDialog from './components/dialogs/ConfirmDialog';
import MiscItemDialog from './components/dialogs/MiscItemDialog';
import SavePlanDialog from './components/dialogs/SavePlanDialog';
import MiscItemsTab from './components/MiscItemsTab';
import { ToastContainer } from './components/Toast';
import { UtensilsIcon, SunIcon, MoonIcon, ShoppingCartIcon, MenuIcon, XIcon } from './components/Icons';
import './index.css';

const API_BASE = '/api';

const makeGroceryKey = (item) =>
  `${(item.name || '').toLowerCase()}||${(item.unit || '').toLowerCase()}||${(item.category || '').toLowerCase()}`;

function App() {
  const [mains, setMains] = useState([]);
  const [sides, setSides] = useState([]);
  const [planEntries, setPlanEntries] = useState([]); // {id, mainId, sideIds[]}
  const [groceryItems, setGroceryItems] = useState([]);
  const [hiddenGroceryKeys, setHiddenGroceryKeys] = useState(() => {
    try {
      const stored = localStorage.getItem('hiddenGroceryKeys');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('plan');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'

  const [dishDialog, setDishDialog] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    kind: 'main',
    dish: null,
  });




// Misc item dialog state
const [miscDialogOpen, setMiscDialogOpen] = useState(false);
const [miscDialogItem, setMiscDialogItem] = useState(null); // null = add, object = edit


  
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    kind: null,
    dish: null,
    planWarning: null,
  });

  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [savedPlans, setSavedPlans] = useState([]);
  const [savePlanDialogOpen, setSavePlanDialogOpen] = useState(false);
  const [reloadConfirmPlan, setReloadConfirmPlan] = useState(null);

  // ---- Toasts ----
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---- Shopping mode ----
  const [shoppingMode, setShoppingMode] = useState(false);
  const [checkedGroceryKeys, setCheckedGroceryKeys] = useState(() => {
    try {
      const stored = localStorage.getItem('checkedGroceryKeys');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // ---- Mobile menu ----
  const [menuOpen, setMenuOpen] = useState(false);

  // ---- Theme state ----
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ---- Initial data load ----
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [mainsRes, sidesRes, planRes, savedPlansRes] = await Promise.all([
          fetch(`${API_BASE}/mains`),
          fetch(`${API_BASE}/sides`),
          fetch(`${API_BASE}/plan`),
          fetch(`${API_BASE}/saved-plans`),
        ]);

        if (!mainsRes.ok || !sidesRes.ok || !planRes.ok) {
          throw new Error('Failed to fetch initial data');
        }

        const mainsData = await mainsRes.json();
        const sidesData = await sidesRes.json();
        const planData = await planRes.json();
        if (savedPlansRes.ok) {
          setSavedPlans(await savedPlansRes.json());
        }

        const rawEntries = planData.entries || [];

        const validEntries = rawEntries
          .map((entry) => ({
            ...entry,
            sideIds: (entry.sideIds || []).filter((sideId) =>
              sidesData.some((s) => s.id === sideId),
            ),
          }))
          .filter((entry) => mainsData.some((m) => m.id === entry.mainId));

        setMains(mainsData);
        setSides(sidesData);
        setPlanEntries(validEntries);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Could not load data from the server. Make sure the API is running.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ---- Build grocery list whenever plan changes ----
  useEffect(() => {
    if (!planEntries.length) {
      setGroceryItems([]);
      return;
    }
    const fetchGrocery = async () => {
      try {
        const res = await fetch(`${API_BASE}/grocery-list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entries: planEntries.map((e) => ({
              mainId: e.mainId,
              sideIds: e.sideIds || [],
            })),
          }),
        });
        if (!res.ok) {
          throw new Error('Failed to build grocery list');
        }
        const data = await res.json();
        setGroceryItems(data.items || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGrocery();
  }, [planEntries]);


  
// Shared inventory (server-backed)
const [miscInventory, setMiscInventory] = useState([]);

// This week's selected misc items (per browser/week)
const [miscGroceryItems, setMiscGroceryItems] = useState(() => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('miscGroceryItems');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
});

useEffect(() => {
  const loadMiscInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/misc-items`);
      if (!res.ok) throw new Error('Failed to load misc items');
      const data = await res.json();

      // �"' Handle both forms: [] OR { items: [] } just in case
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.items)
        ? data.items
        : [];

      setMiscInventory(items);
    } catch (err) {
      console.error('Error loading misc inventory', err);
    }
  };

  loadMiscInventory();
}, []);

// Persist this week's misc selections locally
useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('miscGroceryItems', JSON.stringify(miscGroceryItems));
  }
}, [miscGroceryItems]);

useEffect(() => {
  localStorage.setItem('hiddenGroceryKeys', JSON.stringify(hiddenGroceryKeys));
}, [hiddenGroceryKeys]);

useEffect(() => {
  localStorage.setItem('checkedGroceryKeys', JSON.stringify(checkedGroceryKeys));
}, [checkedGroceryKeys]);

const handleToggleCheckedGrocery = useCallback((key) => {
  setCheckedGroceryKeys((prev) =>
    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
  );
}, []);

const handleClearCheckedGrocery = () => {
  setCheckedGroceryKeys([]);
};

  


const handleAddMiscItem = async (name) => {
  const trimmed = name.trim();
  if (!trimmed) return;

  try {
    const res = await fetch(`${API_BASE}/misc-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });

    if (!res.ok) {
      throw new Error('Failed to create misc item');
    }

    const saved = await res.json();

    // Update shared inventory
    setMiscInventory((prev) => {
      // avoid duplicates if server returned an existing one
      if (prev.some((i) => i.id === saved.id)) return prev;
      return [...prev, saved];
    });

    // Add to THIS week's grocery list
    setMiscGroceryItems((prev) => [
      ...prev,
      {
        id: 'misc_' + Date.now().toString(36),
        name: saved.name,
        inventoryId: saved.id,
      },
    ]);
  } catch (err) {
    console.error(err);
    addToast('There was a problem adding the item.', 'error');
  }
};

// Open misc dialog; if item is provided, it's edit mode; otherwise add mode
const openMiscDialog = (item = null) => {
  setMiscDialogItem(item);
  setMiscDialogOpen(true);
};

const closeMiscDialog = () => {
  setMiscDialogItem(null);
  setMiscDialogOpen(false);
};



const handleRemoveMiscGroceryItem = (miscId) => {
  setMiscGroceryItems((prev) => prev.filter((item) => item.id !== miscId));
};

const handleAddMiscFromInventory = (inventoryId) => {
  const invItem = miscInventory.find((i) => i.id === inventoryId);
  if (!invItem) return;

  setMiscGroceryItems((prev) => [
    ...prev,
    {
      id: 'misc_' + Date.now().toString(36),
      name: invItem.name,
      inventoryId,
    },
  ]);
  addToast(`"${invItem.name}" added to grocery list.`, 'success');
};

const handleDeleteMiscInventoryItem = async (inventoryId) => {
  try {
    const res = await fetch(`${API_BASE}/misc-items/${inventoryId}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
      throw new Error('Failed to delete misc item');
    }

    const deleted = miscInventory.find((item) => item.id === inventoryId);
    setMiscInventory((prev) => prev.filter((item) => item.id !== inventoryId));
    setMiscGroceryItems((prev) =>
      prev.filter((item) => item.inventoryId !== inventoryId)
    );
    if (deleted) addToast(`"${deleted.name}" deleted.`, 'info');
  } catch (err) {
    console.error(err);
    addToast('There was a problem deleting the item.', 'error');
  }
};




  // ---- Saved plan handlers ----
  const handleSavePlan = async (name) => {
    const entriesToSave = planWithDetails.map((e) => ({
      mainId: e.mainId,
      mainName: e.main.name,
      sideIds: e.sideIds || [],
      sides: e.sides.map((s) => ({ id: s.id, name: s.name })),
    }));
    try {
      const res = await fetch(`${API_BASE}/saved-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, entries: entriesToSave }),
      });
      if (!res.ok) throw new Error('Failed to save plan');
      const saved = await res.json();
      setSavedPlans((prev) => [saved, ...prev]);
      addToast(`"${name}" saved to history.`, 'success');
    } catch (err) {
      console.error(err);
      addToast('There was a problem saving the plan.', 'error');
    }
    setSavePlanDialogOpen(false);
  };

  const handleDeleteSavedPlan = async (planId) => {
    try {
      const res = await fetch(`${API_BASE}/saved-plans/${planId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete plan');
      setSavedPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      console.error(err);
      addToast('There was a problem deleting the plan.', 'error');
    }
  };

  const handleReloadPlan = (savedPlan) => {
    setReloadConfirmPlan(savedPlan);
  };

  const handleReloadConfirmed = () => {
    const savedPlan = reloadConfirmPlan;
    const newEntries = savedPlan.entries
      .map((e) => ({
        id: 'entry_ui_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2),
        mainId: e.mainId,
        sideIds: (e.sideIds || []).filter((sideId) => sides.some((s) => s.id === sideId)),
      }))
      .filter((e) => mains.some((m) => m.id === e.mainId));
    setPlanEntries(newEntries);
    persistPlan(newEntries);
    setReloadConfirmPlan(null);
    setActiveTab('plan');
  };

  const persistPlan = async (entries) => {
    try {
      await fetch(`${API_BASE}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Plan actions ----
  const handleAddMainToPlan = (mainId) => {
    const existingForMain = planEntries.find((e) => e.mainId === mainId);
    if (existingForMain) {
      return;
    }

    const activeEntries = planEntries.filter((entry) =>
      mains.some((m) => m.id === entry.mainId),
    );

    if (activeEntries.length >= 7) {
      setLimitDialogOpen(true);
      return;
    }

    const newEntry = {
      id: 'entry_ui_' + Date.now().toString(36),
      mainId,
      sideIds: [],
    };
    const updated = [...planEntries, newEntry];
    setPlanEntries(updated);
    persistPlan(updated);
    const main = mains.find((m) => m.id === mainId);
    if (main) addToast(`"${main.name}" added to this week's plan.`, 'success');
  };

  const handleRemoveEntryFromPlan = (entryId) => {
    const updated = planEntries.filter((e) => e.id !== entryId);
    setPlanEntries(updated);
    persistPlan(updated);
  };

  const updateEntry = (entryId, newFields) => {
    const updated = planEntries.map((e) =>
      e.id === entryId ? { ...e, ...newFields } : e,
    );
    setPlanEntries(updated);
    persistPlan(updated);
  };

  const handleAttachSide = (entryId, sideId) => {
    const entry = planEntries.find((e) => e.id === entryId);
    if (!entry) return;
    if ((entry.sideIds || []).includes(sideId)) return;
    const newSideIds = [...(entry.sideIds || []), sideId];
    updateEntry(entryId, { sideIds: newSideIds });
    const side = sides.find((s) => s.id === sideId);
    const main = mains.find((m) => m.id === entry.mainId);
    if (side && main) addToast(`"${side.name}" added to ${main.name}.`, 'success');
  };

  const handleRemoveSide = (entryId, sideId) => {
    const entry = planEntries.find((e) => e.id === entryId);
    if (!entry) return;
    const newSideIds = (entry.sideIds || []).filter((id) => id !== sideId);
    updateEntry(entryId, { sideIds: newSideIds });
  };

  // ---- Grocery actions ----
  const handleDismissGroceryItem = (item) => {
    const key = makeGroceryKey(item);
    setHiddenGroceryKeys((prev) =>
      prev.includes(key) ? prev : [...prev, key],
    );
  };

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

const allGroceryItems = [...mealGroceryItems, ...miscGroceryItemsWithMeta];


  const handleResetGroceryList = () => {
    setHiddenGroceryKeys([]);
  };

  // ---- CRUD: mains & sides ----
  const handleCreateDish = async ({ kind, dish }) => {
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

  const handleUpdateDish = async ({ kind, dish }) => {
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

  const handleDeleteDishConfirmed = async () => {
    const { kind, dish } = deleteDialog;
    if (!kind || !dish) return;
    const path = kind === 'main' ? 'mains' : 'sides';

    try {
      const res = await fetch(`${API_BASE}/${path}/${dish.id}`, {
        method: 'DELETE',
      });
      if (res.status !== 204 && res.status !== 200) {
        throw new Error('Failed to delete');
      }
      if (kind === 'main') {
        setMains((prev) => prev.filter((m) => m.id !== dish.id));
        const updated = planEntries.filter((e) => e.mainId !== dish.id);
        setPlanEntries(updated);
        persistPlan(updated);
      } else {
        setSides((prev) => prev.filter((s) => s.id !== dish.id));
        const updated = planEntries.map((e) => ({
          ...e,
          sideIds: (e.sideIds || []).filter((id) => id !== dish.id),
        }));
        setPlanEntries(updated);
        persistPlan(updated);
      }
      addToast(`"${dish.name}" deleted.`, 'info');
    } catch (err) {
      console.error(err);
      addToast('There was a problem deleting the dish.', 'error');
    } finally {
      setDeleteDialog({ open: false, kind: null, dish: null, planWarning: null });
    }
  };

const handleRenameMiscItem = async (id, newName) => {
  try {
    const res = await fetch(`${API_BASE}/misc-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) throw new Error('Failed to rename misc item');
    const updated = await res.json();

    setMiscInventory((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    addToast(`"${updated.name}" updated.`, 'success');
  } catch (err) {
    console.error(err);
    addToast('There was a problem renaming the item.', 'error');
  }
};


  const planWithDetails = planEntries
    .map((entry) => ({
      ...entry,
      main: mains.find((m) => m.id === entry.mainId),
      sides: (entry.sideIds || [])
        .map((id) => sides.find((s) => s.id === id))
        .filter(Boolean),
    }))
    .filter((entry) => entry.main);

  // ---- Dialog helpers ----
  const openCreateDishDialog = (kind = 'main') => {
    setDishDialog({
      open: true,
      mode: 'create',
      kind,
      dish: {
        id: undefined,
        name: '',
        category: '',
        tags: [],
        ingredients: [],
        notes: '',
      },
    });
  };

  const openEditDishDialog = (kind, dish) => {
    setDishDialog({
      open: true,
      mode: 'edit',
      kind,
      dish,
    });
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const openDeleteDishDialog = (kind, dish) => {
    let planWarning = null;
    if (kind === 'main') {
      const idx = planEntries.findIndex((e) => e.mainId === dish.id);
      if (idx >= 0) {
        planWarning = `"${dish.name}" is currently planned for ${DAYS[idx] || `Night ${idx + 1}`}. Deleting it will remove it from your plan.`;
      }
    } else {
      const count = planEntries.filter((e) => (e.sideIds || []).includes(dish.id)).length;
      if (count > 0) {
        planWarning = `"${dish.name}" is attached to ${count} dinner${count > 1 ? 's' : ''} in your plan. Deleting it will remove it from those dinners.`;
      }
    }
    setDeleteDialog({ open: true, kind, dish, planWarning });
  };

  const handleDishDialogSave = async (payload) => {
    if (dishDialog.mode === 'create') {
      await handleCreateDish(payload);
    } else {
      await handleUpdateDish(payload);
    }
    setDishDialog({ open: false, mode: 'create', kind: 'main', dish: null });
  };

  const handleDishDialogClose = () => {
    setDishDialog({ open: false, mode: 'create', kind: 'main', dish: null });
  };

  const TABS = [
    { id: 'plan',      label: 'Weekly Plan',   short: 'Plan'    },
    { id: 'grocery',   label: 'Grocery List',  short: 'Grocery' },
    { id: 'mains',     label: 'Mains',         short: 'Mains'   },
    { id: 'sides',     label: 'Sides',         short: 'Sides'   },
    { id: 'misc',      label: 'Other Items',   short: 'Other'   },
    { id: 'history',   label: 'History',       short: 'History' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-emerald-200/70 bg-gradient-to-br from-white via-slate-50 to-emerald-50/80 shadow-sm dark:border-emerald-900/40 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30">
        {/* Decorative orb */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/6" />

        {/* Top bar */}
        <div className="relative w-full px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-slate-50">
              <span className="text-emerald-600 dark:text-emerald-400">
                <UtensilsIcon size={22} />
              </span>
              Weekly Meal Planner
            </h1>
            <p className="hidden sm:block mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Build your week, grow your cookbook, skip the guesswork.
            </p>
          </div>

          {/* Desktop: theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
          >
            {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
            aria-label="Menu"
          >
            {menuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <nav className="px-3 py-2 space-y-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'history' && savedPlans.length > 0 && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                      {savedPlans.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { toggleTheme(); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/60"
              >
                {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
              <p className="px-3 py-1.5 text-xs text-slate-400 dark:text-slate-500">
                {planWithDetails.length} / 7 dinners planned
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Main content shell */}
      <div className="flex-1 w-full px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-5">
        {/* Desktop tabs */}
        <nav className="hidden sm:flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center -mb-px overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150
                  ${activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                {tab.label}
                {tab.id === 'history' && savedPlans.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                    {savedPlans.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="shrink-0 pl-4 pb-3 text-xs font-medium text-slate-400 dark:text-slate-500">
            {planWithDetails.length} / 7 dinners
          </span>
        </nav>


        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-100">
            {error}
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
            Loading…
          </div>
        ) : (
          <main className="flex-1 flex flex-col gap-4">
            {(activeTab === 'mains' || activeTab === 'sides') ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {activeTab === 'mains' ? 'Mains' : 'Sides'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeTab === 'mains'
                        ? 'Your main dishes. Add them to this week\'s plan.'
                        : 'Side dishes you can attach to any dinner.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-full bg-slate-100 p-1 dark:bg-slate-900">
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded-full ${
                          viewMode === 'cards'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        }`}
                        onClick={() => setViewMode('cards')}
                      >
                        Cards
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded-full ${
                          viewMode === 'list'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        }`}
                        onClick={() => setViewMode('list')}
                      >
                        List
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreateDishDialog(activeTab === 'mains' ? 'main' : 'side')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:from-emerald-400 hover:to-emerald-500 hover:shadow active:translate-y-px active:shadow-none"
                    >
                      <span className="text-base leading-none">＋</span>
                      Add {activeTab === 'mains' ? 'main' : 'side'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                  <InventoryTab
                    kind={activeTab === 'mains' ? 'main' : 'side'}
                    dishes={activeTab === 'mains' ? mains : sides}
                    planEntries={planEntries}
                    planWithDetails={planWithDetails}
                    viewMode={viewMode}
                    onAddMainToPlan={handleAddMainToPlan}
                    onAttachSide={handleAttachSide}
                    onEditDish={openEditDishDialog}
                    onDeleteDish={openDeleteDishDialog}
                  />
                </div>
              </section>
               ) : activeTab === 'misc' ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <MiscItemsTab
                  items={miscInventory}
                  activeGroceryInventoryIds={new Set(miscGroceryItems.map((i) => i.inventoryId))}
                  onAddToGrocery={handleAddMiscFromInventory}
                  onDeleteItem={handleDeleteMiscInventoryItem}
                  onOpenMiscDialog={openMiscDialog}
                />
              </section>
            ) : activeTab === 'history' ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Plan History</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Saved weekly dinner plans. Reload any to make it your current plan.
                  </p>
                </div>
                <PlanHistoryTab
                  savedPlans={savedPlans}
                  onReload={handleReloadPlan}
                  onDelete={handleDeleteSavedPlan}
                />
              </section>
            ) : activeTab === 'grocery' ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h2 className="text-lg font-semibold">Grocery List</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Shopping mode toggle */}
                    <button
                      type="button"
                      onClick={() => setShoppingMode((v) => !v)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                        shoppingMode
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
                      }`}
                    >
                      <ShoppingCartIcon size={13} />
                      {shoppingMode ? 'Exit shop' : 'Shop'}
                    </button>
                    {shoppingMode && checkedGroceryKeys.length > 0 && (
                      <button
                        type="button"
                        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-red-700 dark:hover:text-red-400"
                        onClick={handleClearCheckedGrocery}
                      >
                        Clear checked ({checkedGroceryKeys.length})
                      </button>
                    )}
                    {!shoppingMode && (
                      <>
                        <button
                          type="button"
                          className="inline-flex items-center rounded-lg border border-emerald-400 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-950 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                          onClick={() => setMiscDialogOpen(true)}
                        >
                          + Add item
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
                          onClick={handleResetGroceryList}
                        >
                          Reset hidden
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <GroceryList
                  items={allGroceryItems}
                  onRemoveItem={handleDismissGroceryItem}
                  onRemoveMiscItem={handleRemoveMiscGroceryItem}
                  shoppingMode={shoppingMode}
                  checkedKeys={checkedGroceryKeys}
                  onToggleChecked={handleToggleCheckedGrocery}
                />
              </section>
            ) : (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <PlanTab
                  entries={planWithDetails}
                  allMains={mains}
                  allSides={sides}
                  onAddMainToPlan={handleAddMainToPlan}
                  onRemoveEntry={handleRemoveEntryFromPlan}
                  onAttachSide={handleAttachSide}
                  onRemoveSide={handleRemoveSide}
                  onSavePlan={() => setSavePlanDialogOpen(true)}
                />
              </section>
            )}
          </main>
        )}
      </div>

      {/* Dialogs */}
      {dishDialog.open && (
        <DishDialog
          mode={dishDialog.mode}
          initialKind={dishDialog.kind}
          dish={dishDialog.dish}
          onCancel={handleDishDialogClose}
          onSave={handleDishDialogSave}
        />
      )}

      {deleteDialog.open && (
        <ConfirmDialog
          title="Delete dish"
          message={`Are you sure you want to delete "${deleteDialog.dish?.name}"?`}
          warning={deleteDialog.planWarning}
          onCancel={() => setDeleteDialog({ open: false, kind: null, dish: null, planWarning: null })}
          onConfirm={handleDeleteDishConfirmed}
        />
      )}

      {limitDialogOpen && (
        <ConfirmDialog
          title="Weekly dinner limit"
          message="You already have 7 dinners planned for this week. Remove one if you'd like to add another."
          onCancel={() => setLimitDialogOpen(false)}
          onConfirm={() => setLimitDialogOpen(false)}
          cancelLabel="Close"
          confirmLabel="OK"
          confirmVariant="secondary"
        />
      )}

{savePlanDialogOpen && (
  <SavePlanDialog
    defaultName={`Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
    onCancel={() => setSavePlanDialogOpen(false)}
    onSave={handleSavePlan}
  />
)}

{reloadConfirmPlan && (
  <ConfirmDialog
    title="Reload plan"
    message={`Replace your current week's dinners with "${reloadConfirmPlan.name}"? Any dishes that no longer exist in your inventory will be skipped.`}
    onCancel={() => setReloadConfirmPlan(null)}
    onConfirm={handleReloadConfirmed}
    confirmLabel="Reload"
  />
)}

{miscDialogOpen && (
  <MiscItemDialog
    mode={miscDialogItem ? 'edit' : 'create'}
    initialName={miscDialogItem?.name || ''}
    onCancel={closeMiscDialog}
    onSave={async (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      if (miscDialogItem) {
        // edit
        await handleRenameMiscItem(miscDialogItem.id, trimmed);
      } else {
        // add
        await handleAddMiscItem(trimmed);
      }
      closeMiscDialog();
    }}
  />
)}


      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;

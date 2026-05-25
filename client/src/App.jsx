import React, { useCallback, useEffect, useRef, useState } from 'react';
import InventoryTab from './components/InventoryTab';
import PlanTab from './components/PlanTab';
import PlanHistoryTab from './components/PlanHistoryTab';
import GroceryList from './components/grocery/GroceryList';
import DishDialog from './components/dialogs/DishDialog';
import ConfirmDialog from './components/dialogs/ConfirmDialog';
import MiscItemDialog from './components/dialogs/MiscItemDialog';
import SavePlanDialog from './components/dialogs/SavePlanDialog';
import HelpDialog from './components/dialogs/HelpDialog';
import ReplaceMealDialog from './components/dialogs/ReplaceMealDialog';
import MiscItemsTab from './components/MiscItemsTab';
import LandingPage from './components/LandingPage';
import { ToastContainer } from './components/Toast';
import { UtensilsIcon, SunIcon, MoonIcon, ShoppingCartIcon, MenuIcon, XIcon, ChevronDownIcon, CalendarIcon, BowlIcon, PackageIcon } from './components/Icons';
import { useAuth } from './context/AuthContext';
import './index.css';

const API_BASE = '/api';

const makeGroceryKey = (item) =>
  `${(item.name || '').toLowerCase()}||${(item.unit || '').toLowerCase()}||${(item.category || '').toLowerCase()}`;

function App() {
  const { user, loading: authLoading, guestMode, signIn, signOut } = useAuth();
  // isGuest = browsing without a signed-in account
  const isGuest = !user;
  // isAdmin = signed-in user is the designated admin
  const isAdmin = user?.isAdmin === true;

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

  const [replaceMealDialog, setReplaceMealDialog] = useState({ open: false, incomingMainId: null });
  const [helpOpen, setHelpOpen] = useState(false);
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

  // ---- User context menu (desktop) ----
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

  // ---- Initial data load (runs once auth state is known) ----
  useEffect(() => {
    if (authLoading) return; // wait for auth to resolve first
    if (!user && !guestMode) { setLoading(false); return; } // landing page, no data needed

    const loadData = async () => {
      try {
        setLoading(true);
        // Mains + sides are public (shared library visible to all)
        const [mainsRes, sidesRes] = await Promise.all([
          fetch(`${API_BASE}/mains`),
          fetch(`${API_BASE}/sides`),
        ]);
        if (!mainsRes.ok || !sidesRes.ok) throw new Error('Failed to fetch dishes');

        const mainsData = await mainsRes.json();
        const sidesData = await sidesRes.json();
        setMains(mainsData);
        setSides(sidesData);

        if (user) {
          // Authenticated — load plan + history from API
          const [planRes, savedPlansRes] = await Promise.all([
            fetch(`${API_BASE}/plan`, { credentials: 'include' }),
            fetch(`${API_BASE}/saved-plans`, { credentials: 'include' }),
          ]);
          const planData = planRes.ok ? await planRes.json() : { entries: [] };
          if (savedPlansRes.ok) setSavedPlans(await savedPlansRes.json());

          const validEntries = (planData.entries || [])
            .map((entry) => ({
              ...entry,
              sideIds: (entry.sideIds || []).filter((sid) => sidesData.some((s) => s.id === sid)),
            }))
            .filter((entry) => mainsData.some((m) => m.id === entry.mainId));
          setPlanEntries(validEntries);
        } else {
          // Guest — restore plan from localStorage
          try {
            const stored = localStorage.getItem('simmer_guest_plan');
            const guestEntries = stored ? JSON.parse(stored) : [];
            const validEntries = guestEntries
              .map((entry) => ({
                ...entry,
                sideIds: (entry.sideIds || []).filter((sid) => sidesData.some((s) => s.id === sid)),
              }))
              .filter((entry) => mainsData.some((m) => m.id === entry.mainId));
            setPlanEntries(validEntries);
          } catch { setPlanEntries([]); }
        }

        setError('');
      } catch (err) {
        console.error(err);
        setError('Could not load data from the server. Make sure the API is running.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, user, guestMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const res = await fetch(`${API_BASE}/misc-items`, { credentials: 'include' });
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
}, [user]);

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
      setReplaceMealDialog({ open: true, incomingMainId: mainId });
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

  const handleReplaceMeal = (entryId) => {
    const { incomingMainId } = replaceMealDialog;
    const removedMain = mains.find((m) => m.id === planEntries.find((e) => e.id === entryId)?.mainId);
    const incomingMain = mains.find((m) => m.id === incomingMainId);
    const newEntry = { id: 'entry_ui_' + Date.now().toString(36), mainId: incomingMainId, sideIds: [] };
    const updated = planEntries.map((e) => e.id === entryId ? newEntry : e);
    setPlanEntries(updated);
    persistPlan(updated);
    setReplaceMealDialog({ open: false, incomingMainId: null });
    if (incomingMain) addToast(`"${incomingMain.name}" replaced "${removedMain?.name ?? 'meal'}".`, 'success');
  };

  const handleRemoveEntryFromPlan = (entryId) => {
    const entry = planEntries.find((e) => e.id === entryId);
    const main  = mains.find((m) => m.id === entry?.mainId);
    const updated = planEntries.filter((e) => e.id !== entryId);
    setPlanEntries(updated);
    persistPlan(updated);
    if (main) addToast(`"${main.name}" removed from this week's plan.`, 'info');
  };

  const updateEntry = (entryId, newFields) => {
    const updated = planEntries.map((e) =>
      e.id === entryId ? { ...e, ...newFields } : e,
    );
    setPlanEntries(updated);
    persistPlan(updated);
  };

  const handleReorderPlan = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const newEntries = [...planEntries];
    const [moved] = newEntries.splice(fromIndex, 1);
    newEntries.splice(toIndex, 0, moved);
    setPlanEntries(newEntries);
    persistPlan(newEntries);
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
    const side = sides.find((s) => s.id === sideId);
    const newSideIds = (entry.sideIds || []).filter((id) => id !== sideId);
    updateEntry(entryId, { sideIds: newSideIds });
    if (side) addToast(`"${side.name}" removed from the plan.`, 'info');
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

  const ALL_TABS = [
    { id: 'plan',    label: 'Weekly Plan',  short: 'Plan',    icon: <CalendarIcon size={20} />,     authRequired: false, inTabBar: true  },
    { id: 'grocery', label: 'Grocery List', short: 'Grocery', icon: <ShoppingCartIcon size={20} />, authRequired: false, inTabBar: true  },
    { id: 'mains',   label: 'Mains',        short: 'Mains',   icon: <UtensilsIcon size={20} />,     authRequired: false, inTabBar: true  },
    { id: 'sides',   label: 'Sides',        short: 'Sides',   icon: <BowlIcon size={20} />,         authRequired: false, inTabBar: true  },
    { id: 'misc',    label: 'Other Items',  short: 'Other',   icon: <PackageIcon size={20} />,      authRequired: false, inTabBar: true  },
    { id: 'history', label: 'History',      short: 'History', icon: null,                           authRequired: true,  inTabBar: false },
  ];
  // TABS = shown in tab bar (desktop) and mobile hamburger menu
  const TABS = ALL_TABS.filter((t) => t.inTabBar && (!t.authRequired || !isGuest));
  // All accessible tabs including those only reachable via context menu
  const ALL_ACCESSIBLE_TABS = ALL_TABS.filter((t) => !t.authRequired || !isGuest);

  // --- Auth gate ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <span className="animate-pulse text-sm">Loading…</span>
      </div>
    );
  }

  if (!user && !guestMode) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50 overflow-x-hidden w-full">

      {/* Guest banner */}
      {isGuest && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300">
          <span className="min-w-0">👋 You&apos;re browsing as a guest — your plan is saved locally. Sign in to unlock history, other items, and cloud sync.</span>
          <button
            onClick={signIn}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Sign in
          </button>
        </div>
      )}

      {/* Header */}
      <header className="relative border-b border-emerald-200/70 bg-emerald-50 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30">
        {/* Decorative orb */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/6" />

        {/* Top bar */}
        <div className="relative w-full px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-slate-50">
              <span className="text-emerald-600 dark:text-emerald-400">
                <UtensilsIcon size={22} />
              </span>
              <span className="sm:hidden">Simmer</span>
              <span className="hidden sm:inline">Simmer: The Weekly Meal Planner</span>
            </h1>
            <p className="hidden sm:block mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Dinner decided, groceries sorted.
            </p>
          </div>

          {/* Desktop: user context menu / guest controls */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              /* ── Signed-in: avatar + name → dropdown ── */
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 pl-1 pr-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
                >
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full border border-slate-200 dark:border-slate-700" />
                    : <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">{user.name?.[0] ?? '?'}</span>
                  }
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <ChevronDownIcon size={12} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 z-50">
                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('history'); setUserMenuOpen(false); }}
                        className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <span className="flex items-center gap-2.5">
                          <span>🗂️</span>
                          History
                        </span>
                        {savedPlans.length > 0 && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                            {savedPlans.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => { toggleTheme(); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setHelpOpen(true); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-xs font-semibold leading-none">?</span>
                        Help
                      </button>
                    </div>
                    <div className="border-t border-slate-100 p-1 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Guest: sign in + theme + help ── */
              <>
                <button
                  type="button"
                  onClick={signIn}
                  className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                >
                  Sign in with Google
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
                  title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                >
                  {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  title="Help"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-sm font-semibold text-slate-500 shadow-sm transition-all hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
                >
                  ?
                </button>
              </>
            )}
          </div>

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

        {/* Mobile dropdown menu — secondary actions only (tabs are in the bottom nav) */}
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            {/* History — signed-in users only */}
            {user && (
              <div className="px-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('history'); setMenuOpen(false); }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2"><span>🗂️</span> History</span>
                  {savedPlans.length > 0 && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                      {savedPlans.length}
                    </span>
                  )}
                </button>
              </div>
            )}
            <div className={`px-3 py-2 space-y-0.5 ${user ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}>
              <button
                type="button"
                onClick={() => { toggleTheme(); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/60"
              >
                {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
              <button
                type="button"
                onClick={() => { setHelpOpen(true); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/60"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-xs font-semibold leading-none">?</span>
                Help
              </button>
              <p className="px-3 py-1.5 text-xs text-slate-400 dark:text-slate-500">
                {planWithDetails.length} / 7 dinners planned
              </p>
            </div>
            <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
              {user ? (
                <button
                  type="button"
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { signIn(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main content shell */}
      <div className="flex-1 w-full px-4 sm:px-6 pt-4 sm:pt-5 pb-24 sm:pb-5 flex flex-col gap-5">
        {/* Desktop tabs */}
        <nav className="hidden sm:flex items-center justify-between gap-4">
          <div className="flex items-center gap-0.5 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/60">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150
                  ${activeTab === tab.id
                    ? 'bg-white text-emerald-600 ring-1 ring-slate-300 shadow-md dark:bg-slate-700 dark:text-emerald-400 dark:ring-slate-600 dark:shadow-slate-900/60'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200'
                  }`}
              >
                <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500">
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
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
                    {!isGuest && (
                      <button
                        type="button"
                        onClick={() => openCreateDishDialog(activeTab === 'mains' ? 'main' : 'side')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:from-emerald-400 hover:to-emerald-500 hover:shadow active:translate-y-px active:shadow-none"
                      >
                        <span className="text-base leading-none">＋</span>
                        Add {activeTab === 'mains' ? 'main' : 'side'}
                      </button>
                    )}
                  </div>
                </div>
                <InventoryTab
                  kind={activeTab === 'mains' ? 'main' : 'side'}
                  dishes={activeTab === 'mains' ? mains : sides}
                  planEntries={planEntries}
                  planWithDetails={planWithDetails}
                  viewMode={viewMode}
                  canEditDish={isGuest ? null : (dish) => dish.canEdit === true}
                  onAddMainToPlan={handleAddMainToPlan}
                  onAttachSide={handleAttachSide}
                  onEditDish={openEditDishDialog}
                  onDeleteDish={openDeleteDishDialog}
                />
              </section>
               ) : activeTab === 'misc' ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <MiscItemsTab
                  items={miscInventory}
                  activeGroceryInventoryIds={new Set(miscGroceryItems.map((i) => i.inventoryId))}
                  canEditItem={isGuest ? () => false : (item) => item.canEdit === true}
                  onAddToGrocery={handleAddMiscFromInventory}
                  onDeleteItem={isGuest ? null : handleDeleteMiscInventoryItem}
                  onOpenMiscDialog={isGuest ? null : openMiscDialog}
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
                  <div>
                    <h2 className="text-lg font-semibold">Grocery List</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ingredients from this week's plan, ready to shop.
                    </p>
                  </div>
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
              <section className="-mx-4 sm:mx-0 sm:rounded-2xl border-y sm:border border-slate-200/80 bg-white px-4 py-4 sm:p-5 shadow-none sm:shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <PlanTab
                  entries={planWithDetails}
                  allMains={mains}
                  allSides={sides}
                  onAddMainToPlan={handleAddMainToPlan}
                  onRemoveEntry={handleRemoveEntryFromPlan}
                  onAttachSide={handleAttachSide}
                  onRemoveSide={handleRemoveSide}
                  onSavePlan={!isGuest ? () => setSavePlanDialogOpen(true) : null}
                  onReorderEntries={handleReorderPlan}
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

      {replaceMealDialog.open && (
        <ReplaceMealDialog
          incomingDish={mains.find((m) => m.id === replaceMealDialog.incomingMainId)}
          currentEntries={planWithDetails}
          onReplace={handleReplaceMeal}
          onClose={() => setReplaceMealDialog({ open: false, incomingMainId: null })}
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


      {/* Mobile bottom navigation bar */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex h-16">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-slate-50 dark:active:bg-slate-900 ${
                activeTab === tab.id
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <span className={`transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-medium">{tab.short}</span>
            </button>
          ))}
        </div>
      </nav>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

export default App;

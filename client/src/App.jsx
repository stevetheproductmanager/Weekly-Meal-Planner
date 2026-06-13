import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import PantryTab from './components/PantryTab';
import MarketplaceTab from './components/MarketplaceTab';
import LandingPage from './components/LandingPage';
import OnboardingWizard, { scoreDishByPrefs } from './components/OnboardingWizard';
import AdminPage from './components/AdminPage';
import AppHeader, { MobileBottomNav, DesktopIconNav, KITCHEN_IDS } from './components/AppHeader';
import { ToastContainer } from './components/Toast';
import { UtensilsIcon, BowlIcon, PackageIcon, PantryIcon, ShoppingCartIcon } from './components/Icons';
import { useAuth } from './context/AuthContext';
import useGroceryList from './hooks/useGroceryList';
import usePlan from './hooks/usePlan';
import useDishes from './hooks/useDishes';
import { getThisMonday, addWeeks, formatWeekRange } from './utils/week';
import { trackPageView } from './analytics';
import './index.css';

const API_BASE = '/api';

function App() {
  const { user, loading: authLoading, guestMode, signIn, signOut } = useAuth();
  // isGuest = browsing without a signed-in account
  const isGuest = !user;
  // isAdmin = signed-in user is the designated admin
  const isAdmin = user?.isAdmin === true;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('plan');
  const [lastKitchenTab, setLastKitchenTab] = useState('mains');
  // ---- First-run onboarding ----
  // Initial state uses the legacy key so guests (no user object) still suppress onboarding
  // across page reloads after they've skipped or completed the flow.
  // Once the user object is available, we switch EXCLUSIVELY to the user-scoped key —
  // deliberately NOT migrating from the legacy key. This means a deleted + re-registered
  // account (new _id, same browser, old legacy key) correctly gets onboarding again.
  const [isOnboarded, setIsOnboarded] = useState(
    () => !!localStorage.getItem('simmer_onboarded')
  );
  useEffect(() => {
    if (!user) return;
    const userKey = `simmer_onboarded_${user.id}`;
    // Only the user-scoped key is trusted for signed-in users.
    // Never migrate from the legacy key here — that's what was causing
    // deleted + re-registered accounts to skip onboarding.
    setIsOnboarded(!!localStorage.getItem(userKey));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // ---- User taste preferences (set during onboarding, used by Surprise Me) ----
  const [userPrefs, setUserPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem('simmer_prefs');
      return raw ? JSON.parse(raw) : { cuisines: [], proteins: [], styles: [] };
    } catch { return { cuisines: [], proteins: [], styles: [] }; }
  });
  // Once user object is available, load user-scoped prefs key
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`simmer_prefs_${user.id}`);
      if (raw) setUserPrefs(JSON.parse(raw));
    } catch {}
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Recently-used meal IDs (for picker "Recent" tab) ----
  const [recentMealIds, setRecentMealIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('simmer_recent_meals') || '[]'); }
    catch { return []; }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Mobile defaults to the compact list — cards are a desktop luxury
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 'list' : 'cards'
  ); // 'cards' | 'list'

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
  const [copyWeekPending, setCopyWeekPending] = useState(null); // entries waiting for overwrite confirm
  const [cloneWeekPending, setCloneWeekPending] = useState(null); // shared-week entries waiting for overwrite confirm

  // ---- Toasts ----
  const [toasts, setToasts] = useState([]);
  /**
   * @param {string} message
   * @param {'info'|'success'|'error'} [type]
   * @param {{ label: string, onClick: () => void }} [action]  optional undo/action button
   */
  const addToast = useCallback((message, type = 'info', action) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const duration = action ? 5500 : 4000; // longer when there's an undo button
    setToasts((prev) => [...prev, { id, message, type, action, duration }]);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---- Dish library domain (mains/sides + server actions live in hooks/useDishes) ----
  const {
    mains, setMains,
    sides, setSides,
    rateDish:          handleRateDish,
    toggleSaveDish:    handleToggleSaveDish,
    submitToCommunity: handleSubmitToCommunity,
    createDish:        handleCreateDish,
    updateDish:        handleUpdateDish,
    deleteDish,
  } = useDishes({ user, addToast });

  // ---- Plan domain (state + week nav live in hooks/usePlan) ----
  const {
    planEntries, setPlanEntries, persistPlan, loadPlanEntries,
    currentWeekStart, setCurrentWeekStart,
    isReadOnlyWeek,
    goToPrevWeek:    handlePrevWeek,
    goToNextWeek:    handleNextWeek,
    goToCurrentWeek: handleGoToCurrentWeek,
    navigateToWeek:  handleNavigateToWeek,
    prevWeekHasMeals,
    monthPlansData, fetchMonthPlans,
    reorderPlan:       handleReorderPlan,
    reorderMonthEntry: handleReorderMonthEntry,
  } = usePlan({ user, isGuest, mains, sides });

  // ---- Grocery list domain (state + handlers live in hooks/useGroceryList) ----
  const {
    allGroceryItems,
    miscGroceryItems,
    shoppingMode, setShoppingMode,
    checkedGroceryKeys,
    toggleCheckedGrocery:    handleToggleCheckedGrocery,
    batchCheckGrocery:       handleBatchCheckGrocery,
    clearCheckedGrocery:     handleClearCheckedGrocery,
    exitShopMode:            handleExitShopMode,
    dismissGroceryItem:      handleDismissGroceryItem,
    resetGroceryList:        handleResetGroceryList,
    addCustomListItem:       handleAddCustomListItem,
    removeCustomListItem:    handleRemoveCustomListItem,
    addMiscGroceryItem,
    removeMiscGroceryItem:   handleRemoveMiscGroceryItem,
    removeMiscGroceryByInventoryId,
    copyGroceryList,
  } = useGroceryList({ weekStart: currentWeekStart, planEntries, addToast });

  // planWithDetails is derived further down — passed at call time
  const handleCopyGroceryList = () => copyGroceryList(planWithDetails);

  // Mobile-only overflow menu for grocery secondary actions
  const [groceryMenuOpen, setGroceryMenuOpen] = useState(false);
  const groceryMenuRef = useRef(null);
  useEffect(() => {
    if (!groceryMenuOpen) return;
    const handler = (e) => {
      if (groceryMenuRef.current && !groceryMenuRef.current.contains(e.target)) {
        setGroceryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [groceryMenuOpen]);

  // ---- Online/offline detection ----
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const go  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  go);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', go); window.removeEventListener('offline', off); };
  }, []);

  // ---- PWA: install prompt + SW update toast ----
  const [pwaInstallable, setPwaInstallable] = useState(false);
  useEffect(() => {
    const onInstallable = () => setPwaInstallable(true);
    const onUpdate      = () => addToast('App updated — refresh for the latest version.', 'info');
    window.addEventListener('pwa-installable',    onInstallable);
    window.addEventListener('sw-update-available', onUpdate);
    // prompt may already have fired before this effect ran
    if (window.__pwaInstallPrompt) setPwaInstallable(true);
    return () => {
      window.removeEventListener('pwa-installable',    onInstallable);
      window.removeEventListener('sw-update-available', onUpdate);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInstallApp = async () => {
    const prompt = window.__pwaInstallPrompt;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') { setPwaInstallable(false); window.__pwaInstallPrompt = null; }
  };

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
          const [savedPlansRes] = await Promise.all([
            fetch(`${API_BASE}/saved-plans`, { credentials: 'include' }),
          ]);
          if (savedPlansRes.ok) setSavedPlans(await savedPlansRes.json());
          await loadPlanEntries(currentWeekStart, mainsData, sidesData);
        } else {
          await loadPlanEntries(currentWeekStart, mainsData, sidesData);
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

  // ---- Analytics: track every page/tab as an SPA page view ----
  useEffect(() => {
    if (authLoading) return;
    if (!user && !guestMode) { trackPageView('landing'); return; }
    trackPageView(activeTab);
  }, [authLoading, user, guestMode, activeTab]);

  // Onboarding wizard is an overlay, not a tab — track it separately
  useEffect(() => {
    if (!isOnboarded && !loading && mains.length > 0 && planEntries.length === 0) {
      trackPageView('onboarding');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnboarded, loading]);

  // ---- Fetch month plans when plan tab activates ----
  useEffect(() => {
    if (activeTab === 'plan' && user) fetchMonthPlans(currentWeekStart);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

// Shared inventory (server-backed)
const [miscInventory, setMiscInventory] = useState([]);

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

// ---- Pantry items ----
const [pantryItems, setPantryItems] = useState([]);

useEffect(() => {
  const loadPantry = async () => {
    if (!user) {
      // Guest — read from localStorage
      try {
        const stored = localStorage.getItem('simmer_pantry');
        setPantryItems(stored ? JSON.parse(stored) : []);
      } catch { setPantryItems([]); }
      return;
    }

    try {
      // Grab any pantry items the user built up as a guest
      let guestItems = [];
      try {
        const stored = localStorage.getItem('simmer_pantry');
        guestItems = stored ? JSON.parse(stored) : [];
      } catch {}

      // Fetch existing DB pantry for this account
      const dbRes = await fetch(`${API_BASE}/pantry`, { credentials: 'include' });
      const dbItems = dbRes.ok ? await dbRes.json() : [];

      if (guestItems.length > 0) {
        // POST all guest names — server upserts so no duplicates are created
        const mergeRes = await fetch(`${API_BASE}/pantry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ names: guestItems.map(i => i.name) }),
        });

        if (mergeRes.ok) {
          const upserted = await mergeRes.json();
          // Only count items that were genuinely new (not already in the DB)
          const existingIds = new Set(dbItems.map(i => i.id));
          const newItems = upserted.filter(i => !existingIds.has(i.id));
          const combined = [...dbItems, ...newItems].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          setPantryItems(combined);
          if (newItems.length > 0) {
            addToast(
              `${newItems.length} pantry item${newItems.length > 1 ? 's' : ''} carried over from your guest session.`,
              'success',
            );
          }
        } else {
          setPantryItems(dbItems);
        }

        // Clear the guest copy regardless — it now lives in the DB
        localStorage.removeItem('simmer_pantry');
      } else {
        setPantryItems(dbItems);
      }
    } catch (err) { console.error(err); }
  };
  loadPantry();
}, [user]); // eslint-disable-line react-hooks/exhaustive-deps

const handleAddToPantry = async (name) => {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (!user) {
    const id = 'pantry_' + Date.now().toString(36);
    const updated = [...pantryItems, { id, name: trimmed }];
    setPantryItems(updated);
    try { localStorage.setItem('simmer_pantry', JSON.stringify(updated)); } catch {}
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/pantry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const saved = Array.isArray(data) ? data[0] : data;
    if (saved) setPantryItems(prev => [...prev, saved]);
  } catch { addToast('Could not add to pantry.', 'error'); }
};

const handleRemoveFromPantry = async (id) => {
  if (!user) {
    const updated = pantryItems.filter(i => (i._id || i.id) !== id);
    setPantryItems(updated);
    try { localStorage.setItem('simmer_pantry', JSON.stringify(updated)); } catch {}
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/pantry/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok && res.status !== 204) throw new Error();
    setPantryItems(prev => prev.filter(i => (i._id || i.id) !== id));
  } catch { addToast('Could not remove from pantry.', 'error'); }
};

// Add several meals at once (used by first-run onboarding)
const handleBulkAddToPlan = (ids) => {
  const additions = [];
  ids.forEach(mainId => {
    if (planEntries.find(e => e.mainId === mainId)) return;
    if (planEntries.length + additions.length >= 7) return;
    additions.push({
      id: 'entry_ui_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      mainId,
      sideIds: [],
      servings: 4,
    });
  });
  if (!additions.length) return;
  const updated = [...planEntries, ...additions];
  setPlanEntries(updated);
  persistPlan(updated);
  // Update recent-meal tracking
  const newIds = additions.map(e => e.mainId);
  setRecentMealIds(prev => {
    const next = [...newIds, ...prev.filter(id => !newIds.includes(id))].slice(0, 20);
    localStorage.setItem('simmer_recent_meals', JSON.stringify(next));
    return next;
  });
};

// Called when the user completes (or skips) the onboarding wizard.
// prefs = { cuisines, proteins, styles }  selectedIds = mainIds to add to plan
const handleOnboardingComplete = (prefs, selectedIds) => {
  // Persist onboarding flag
  if (user?.id) localStorage.setItem(`simmer_onboarded_${user.id}`, '1');
  localStorage.setItem('simmer_onboarded', '1');
  setIsOnboarded(true);
  // Persist preferences
  const prefsKey = user?.id ? `simmer_prefs_${user.id}` : 'simmer_prefs';
  try { localStorage.setItem(prefsKey, JSON.stringify(prefs)); } catch {}
  localStorage.setItem('simmer_prefs', JSON.stringify(prefs)); // guest fallback
  setUserPrefs(prefs);
  // Add any starter meals the user picked
  if (selectedIds.length > 0) {
    handleBulkAddToPlan(selectedIds);
    addToast(
      `${selectedIds.length} meal${selectedIds.length !== 1 ? 's' : ''} added! Your grocery list is ready.`,
      'success',
      { label: 'View list', onClick: () => setActiveTab('grocery') }
    );
  }
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
    addMiscGroceryItem(saved.name, saved.id);
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



const handleAddMiscFromInventory = (inventoryId) => {
  const invItem = miscInventory.find((i) => i.id === inventoryId);
  if (!invItem) return;
  // Prevent adding the same item twice in the same week
  if (miscGroceryItems.some((i) => i.inventoryId === inventoryId)) return;

  addMiscGroceryItem(invItem.name, inventoryId);
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
    removeMiscGroceryByInventoryId(inventoryId);
    if (deleted) addToast(`"${deleted.name}" deleted.`, 'info');
  } catch (err) {
    console.error(err);
    addToast('There was a problem deleting the item.', 'error');
  }
};




  // ---- Saved plan handlers ----
  const handleSavePlan = async (name) => {
    // "Eating out" entries have no main — filter them out before saving
    const entriesToSave = planWithDetails
      .filter((e) => e.type !== 'out')
      .map((e) => ({
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

  // ---- Plan actions ----
  const handleAddMainToPlan = (mainId) => {
    const existingForMain = planEntries.find((e) => e.mainId === mainId);
    if (existingForMain) {
      return;
    }

    // Count all slots (meals + "out" days) — the week holds exactly 7 nights
    if (planEntries.length >= 7) {
      setReplaceMealDialog({ open: true, incomingMainId: mainId });
      return;
    }

    const newEntry = {
      id: 'entry_ui_' + Date.now().toString(36),
      mainId,
      sideIds: [],
      servings: 4,
    };
    const updated = [...planEntries, newEntry];
    setPlanEntries(updated);
    persistPlan(updated);
    // Track in recently-used list (for picker "Recent" tab)
    setRecentMealIds(prev => {
      const next = [mainId, ...prev.filter(id => id !== mainId)].slice(0, 20);
      localStorage.setItem('simmer_recent_meals', JSON.stringify(next));
      return next;
    });
    const main = mains.find((m) => m.id === mainId);
    if (main) addToast(`"${main.name}" added to this week's plan.`, 'success');
  };

  const handleReplaceMeal = (entryId) => {
    const { incomingMainId } = replaceMealDialog;
    const removedMain = mains.find((m) => m.id === planEntries.find((e) => e.id === entryId)?.mainId);
    const incomingMain = mains.find((m) => m.id === incomingMainId);
    const newEntry = { id: 'entry_ui_' + Date.now().toString(36), mainId: incomingMainId, sideIds: [], servings: 4 };
    const updated = planEntries.map((e) => e.id === entryId ? newEntry : e);
    setPlanEntries(updated);
    persistPlan(updated);
    setReplaceMealDialog({ open: false, incomingMainId: null });
    if (incomingMain) addToast(`"${incomingMain.name}" replaced "${removedMain?.name ?? 'meal'}".`, 'success');
  };

  const handleRemoveEntryFromPlan = (entryId) => {
    const entry    = planEntries.find((e) => e.id === entryId);
    const main     = mains.find((m) => m.id === entry?.mainId);
    const snapshot = [...planEntries];          // capture before removal for undo
    const updated  = planEntries.filter((e) => e.id !== entryId);
    setPlanEntries(updated);
    persistPlan(updated);

    const label = entry?.type === 'out'
      ? (entry.label || 'Eating out')
      : (main?.name ?? 'Dinner');

    addToast(`"${label}" removed from plan.`, 'info', {
      label: 'Undo',
      onClick: () => {
        setPlanEntries(snapshot);
        persistPlan(snapshot);
      },
    });
  };

  const updateEntry = (entryId, newFields) => {
    const updated = planEntries.map((e) =>
      e.id === entryId ? { ...e, ...newFields } : e,
    );
    setPlanEntries(updated);
    persistPlan(updated);
  };

  // ---- Plan note per entry ----
  const handleUpdatePlanNote = (entryId, note) => updateEntry(entryId, { note });

  // ---- "Eating out" day slot ----
  const handleAddOutDay = (label = 'Eating out') => {
    if (planEntries.length >= 7) return;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const updated = [...planEntries, { id, type: 'out', label }];
    setPlanEntries(updated);
    persistPlan(updated);
  };

  // ---- Copy previous week as template ----
  const handleCopyPreviousWeek = async () => {
    const prevWeekIso = addWeeks(currentWeekStart, -1);
    try {
      const res = await fetch(`${API_BASE}/plan?week=${prevWeekIso}`, { credentials: 'include' });
      if (!res.ok) { addToast("Couldn't load last week's plan.", 'error'); return; }
      const data = await res.json();
      const prevEntries = (data.entries || [])
        .filter((e) => e.type === 'out' || mains.some((m) => m.id === e.mainId));
      if (!prevEntries.length) { addToast("Last week had no meals planned.", 'info'); return; }
      const newEntries = prevEntries.map((e) => ({
        ...e,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      }));
      if (planEntries.length > 0) {
        // Prompt with the in-app dialog instead of window.confirm
        setCopyWeekPending(newEntries);
        return;
      }
      setPlanEntries(newEntries);
      persistPlan(newEntries);
      addToast('Last week copied as a template! 📋', 'success');
    } catch { addToast("Couldn't load last week's plan.", 'error'); }
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
    const snapshot = planEntries.map(e => ({ ...e, sideIds: [...(e.sideIds || [])] }));
    const newSideIds = (entry.sideIds || []).filter((id) => id !== sideId);
    updateEntry(entryId, { sideIds: newSideIds });
    if (side) addToast(`"${side.name}" removed.`, 'info', {
      label: 'Undo',
      onClick: () => { setPlanEntries(snapshot); persistPlan(snapshot); },
    });
  };

  const handleUpdateServings = useCallback((entryId, servings) => {
    updateEntry(entryId, { servings });
  }, [planEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Random week generator (weighted by star rating + taste preferences) ----
  const handleRandomizeWeek = useCallback(() => {
    const usedIds = new Set(planEntries.map(e => e.mainId));
    const available = mains.filter(m => !usedIds.has(m.id));
    const slotsNeeded = 7 - planEntries.length;
    if (!available.length || slotsNeeded <= 0) return;

    // Weighted sampling without replacement (Efraimidis-Spirakis algorithm).
    // key = U^(1/w) — higher weight → higher expected key → floats to top.
    // Base weight: square the rating (5★ = 25, unrated = 9).
    // Preference boost: multiply by (1 + prefScore) where prefScore is 0–6
    // based on matching cuisine/protein/style — up to 7× lift for a perfect match.
    const rated = available.map(m => {
      const ratingW = m.myRating ? m.myRating * m.myRating : 9;
      const prefBoost = 1 + scoreDishByPrefs(m, userPrefs);
      return { ...m, _w: ratingW * prefBoost };
    });
    const keyed = rated.map(m => ({
      m,
      key: Math.pow(Math.random(), 1 / m._w),
    }));
    keyed.sort((a, b) => b.key - a.key);
    const picks = keyed.slice(0, slotsNeeded).map(k => k.m);

    const newEntries = picks.map(m => ({
      id: 'entry_ui_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
      mainId: m.id,
      sideIds: [],
      servings: 4,
    }));
    const updated = [...planEntries, ...newEntries];
    setPlanEntries(updated);
    persistPlan(updated);
    addToast(`Added ${picks.length} meal${picks.length > 1 ? 's' : ''} to your week!`, 'success');
  }, [planEntries, mains, userPrefs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- "Last cooked" map: mainId → most-recent savedAt across saved plans ----
  const lastCookedMap = useMemo(() => {
    const map = {};
    savedPlans.forEach((plan) => {
      const planDate = plan.savedAt || plan.createdAt;
      if (!planDate) return;
      (plan.entries || []).forEach((e) => {
        if (!e.mainId) return;
        if (!map[e.mainId] || new Date(planDate) > new Date(map[e.mainId])) {
          map[e.mainId] = planDate;
        }
      });
    });
    return map;
  }, [savedPlans]);

  // ---- Derived plan details (needed by marketplace handlers below) ----
  const planWithDetails = planEntries
    .map((entry) => ({
      ...entry,
      main: mains.find((m) => m.id === entry.mainId),
      sides: (entry.sideIds || [])
        .map((id) => sides.find((s) => s.id === id))
        .filter(Boolean),
    }))
    .filter((entry) => entry.type === 'out' || entry.main);

  // ---- Marketplace ----
  const handleShareWeekToMarketplace = useCallback(async () => {
    if (!user || !planWithDetails.length) return null;
    const mon = new Date(currentWeekStart + 'T00:00:00Z');
    const sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
    const fmt = { month: 'short', day: 'numeric', timeZone: 'UTC' };
    const label = `${mon.toLocaleDateString('en-US', fmt)} – ${sun.toLocaleDateString('en-US', { ...fmt, year: 'numeric' })}`;
    try {
      const res = await fetch(`${API_BASE}/marketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          weekStart: currentWeekStart,
          weekLabel: label,
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
      const data = await res.json();
      addToast(data.wasUpdated ? 'Community Spotlight updated! 🌍' : 'Your week is live on Community Spotlight! 🌍', 'success');
      return data;
    } catch { addToast('Could not share your week.', 'error'); return null; }
  }, [user, planWithDetails, currentWeekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloneSharedWeek = useCallback((sharedEntries) => {
    const newEntries = (sharedEntries || [])
      .filter(e => mains.some(m => m.id === e.mainId))
      .slice(0, 7)
      .map(e => ({
        id:      'entry_ui_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
        mainId:  e.mainId,
        sideIds: (e.sideIds || []).filter(sid => sides.some(s => s.id === sid)),
        servings: 4,
      }));
    if (!newEntries.length) { addToast('No matching dishes found in your library.', 'error'); return; }
    if (planEntries.length > 0) {
      setCloneWeekPending(newEntries);
      return;
    }
    setPlanEntries(newEntries);
    persistPlan(newEntries);
    setActiveTab('plan');
    addToast(`Loaded ${newEntries.length} meal${newEntries.length !== 1 ? 's' : ''} into your week!`, 'success');
  }, [mains, sides, planEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Delete dish (server + library via hook, then prune it from this week's plan) ----
  const handleDeleteDishConfirmed = async () => {
    const { kind, dish } = deleteDialog;
    if (!kind || !dish) return;

    const ok = await deleteDish(kind, dish);
    if (ok) {
      const updated = kind === 'main'
        ? planEntries.filter((e) => e.mainId !== dish.id)
        : planEntries.map((e) => ({
            ...e,
            sideIds: (e.sideIds || []).filter((id) => id !== dish.id),
          }));
      setPlanEntries(updated);
      persistPlan(updated);
    }
    setDeleteDialog({ open: false, kind: null, dish: null, planWarning: null });
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

  // ── Navigation ────────────────────────────────────────────────────────────
  // (nav structure + KITCHEN_IDS live in components/AppHeader.jsx)

  // Helper: navigate to a tab and track kitchen sub-tab
  const navigateTo = (id) => {
    setActiveTab(id);
    if (KITCHEN_IDS.has(id)) setLastKitchenTab(id);
  };

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
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">

      {/* Guest banner */}
      {isGuest && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-300">
          <span className="min-w-0">
            👋 Browsing as guest<span className="hidden sm:inline"> — plan saved locally. Sign in to unlock history, other items, and cloud sync</span>.
          </span>
          <button onClick={signIn} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
            Sign in
          </button>
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-200">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
          Offline — showing cached data. Changes will sync when you reconnect.
        </div>
      )}

      <AppHeader
        activeTab={activeTab}
        onNavigate={navigateTo}
        user={user}
        isGuest={isGuest}
        isAdmin={isAdmin}
        savedPlansCount={savedPlans.length}
        pantryCount={pantryItems.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenHelp={() => setHelpOpen(true)}
        pwaInstallable={pwaInstallable}
        onInstallApp={handleInstallApp}
        onSignIn={signIn}
        onSignOut={signOut}
      />

      {/* Desktop: big icon nav strip under the header */}
      <DesktopIconNav
        activeTab={activeTab}
        onNavigate={navigateTo}
        lastKitchenTab={lastKitchenTab}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-24 md:pb-6 flex flex-col gap-4">


        {/* Kitchen sub-tab strip — shown whenever a kitchen tab is active */}
        {KITCHEN_IDS.has(activeTab) && (
          <div className="flex max-w-xl gap-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/50 p-1">
            {[
              { id: 'mains',   label: 'Mains',       icon: <UtensilsIcon size={14} /> },
              { id: 'sides',   label: 'Sides',        icon: <BowlIcon size={14} />     },
              { id: 'misc',    label: 'Other',        icon: <PackageIcon size={14} />  },
              { id: 'pantry',  label: 'Pantry',       icon: <PantryIcon size={14} />   },
            ].filter((sub) => !isGuest || sub.id === 'mains' || sub.id === 'sides').map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => navigateTo(sub.id)}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg px-1.5 sm:px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  activeTab === sub.id
                    ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span className="shrink-0">{sub.icon}</span>
                <span>{sub.label}</span>
              </button>
            ))}
          </div>
        )}

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
                  monthPlansData={monthPlansData}
                  viewMode={viewMode}
                  canEditDish={isGuest ? null : (dish) => dish.canEdit === true}
                  onAddMainToPlan={handleAddMainToPlan}
                  onAttachSide={handleAttachSide}
                  onEditDish={openEditDishDialog}
                  onDeleteDish={openDeleteDishDialog}
                  onSaveDish={handleToggleSaveDish}
                  onSubmitCommunity={isGuest ? null : handleSubmitToCommunity}
                  onAddNew={isGuest ? null : () => openCreateDishDialog(activeTab === 'mains' ? 'main' : 'side')}
                  lastCookedMap={lastCookedMap}
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
            ) : activeTab === 'pantry' ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500"><PantryIcon size={18} /></span>
                    Pantry
                  </h2>
                </div>
                <PantryTab
                  items={pantryItems}
                  onAdd={handleAddToPantry}
                  onRemove={handleRemoveFromPantry}
                />
              </section>
            ) : activeTab === 'marketplace' ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <MarketplaceTab
                  user={user}
                  planWithDetails={planWithDetails}
                  currentWeekStart={currentWeekStart}
                  weekLabel={formatWeekRange(currentWeekStart)}
                  onCloneWeek={handleCloneSharedWeek}
                  onAddToast={addToast}
                />
              </section>
            ) : activeTab === 'admin' && isAdmin ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <AdminPage currentUser={user} />
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
                    {/* Shopping mode toggle — always visible, it's the core action */}
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

                    {/* Mobile: secondary actions collapse into one ⋯ menu */}
                    <div className="relative sm:hidden" ref={groceryMenuRef}>
                      <button type="button" onClick={() => setGroceryMenuOpen(v => !v)} aria-label="More actions"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-base font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                        ⋯
                      </button>
                      {groceryMenuOpen && (
                        <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden p-1">
                          {shoppingMode && checkedGroceryKeys.length > 0 && (
                            <button type="button" onClick={() => { setGroceryMenuOpen(false); handleClearCheckedGrocery(); }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                              ✕ Clear checked ({checkedGroceryKeys.length})
                            </button>
                          )}
                          {allGroceryItems.length > 0 && (
                            <button type="button" onClick={() => { setGroceryMenuOpen(false); handleCopyGroceryList(); }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                              📋 Copy list
                            </button>
                          )}
                          {!shoppingMode && !isGuest && (
                            <button type="button" onClick={() => { setGroceryMenuOpen(false); setMiscDialogOpen(true); }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                              ＋ Add item
                            </button>
                          )}
                          {!shoppingMode && (
                            <button type="button" onClick={() => { setGroceryMenuOpen(false); handleResetGroceryList(); }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                              ↺ Reset hidden
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {shoppingMode && checkedGroceryKeys.length > 0 && (
                      <button
                        type="button"
                        className="hidden sm:inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-red-700 dark:hover:text-red-400"
                        onClick={handleClearCheckedGrocery}
                      >
                        Clear checked ({checkedGroceryKeys.length})
                      </button>
                    )}
                    {allGroceryItems.length > 0 && (
                      <>
                        <button
                          type="button"
                          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-violet-700 dark:hover:text-violet-400"
                          onClick={handleCopyGroceryList}
                          title="Copy list as text for sharing"
                        >
                          📋 Copy list
                        </button>
                        <button
                          type="button"
                          className="print:hidden hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-colors dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200"
                          onClick={() => window.print()}
                          title="Print grocery list"
                        >
                          🖨️ Print
                        </button>
                      </>
                    )}
                    {!shoppingMode && (
                      <>
                        <button
                          type="button"
                          className="hidden sm:inline-flex items-center rounded-lg border border-emerald-400 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-950 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                          onClick={() => setMiscDialogOpen(true)}
                        >
                          + Add item
                        </button>
                        <button
                          type="button"
                          className="hidden sm:inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
                          onClick={handleResetGroceryList}
                        >
                          Reset hidden
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* ── Week meal-context strip — desktop only ── */}
                {planWithDetails.length > 0 && (
                  <div className="mb-4 hidden sm:flex flex-wrap gap-1.5">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].slice(0, planWithDetails.length).map((day, i) => {
                      const entry = planWithDetails[i];
                      return (
                        <span
                          key={entry.id}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] dark:border-slate-700/60 dark:bg-slate-800/60"
                        >
                          <span className="text-slate-400 dark:text-slate-500 font-medium">{day}</span>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[96px]">
                            {entry.type === 'out' ? '🚫 Out' : (entry.main?.name ?? '—')}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
                <GroceryList
                  items={allGroceryItems}
                  onRemoveItem={handleDismissGroceryItem}
                  onRemoveMiscItem={handleRemoveMiscGroceryItem}
                  onAddCustomItem={handleAddCustomListItem}
                  onRemoveCustomItem={handleRemoveCustomListItem}
                  shoppingMode={shoppingMode}
                  checkedKeys={checkedGroceryKeys}
                  onToggleChecked={handleToggleCheckedGrocery}
                  onBatchCheck={handleBatchCheckGrocery}
                  onExitShopMode={handleExitShopMode}
                  pantryItems={pantryItems}
                  onAddToPantry={isGuest ? null : handleAddToPantry}
                  onRemoveFromPantry={isGuest ? null : handleRemoveFromPantry}
                  onNavigateToPantry={isGuest ? null : () => navigateTo('pantry')}
                  planHasMeals={planEntries.length > 0}
                />
              </section>
            ) : (
              <section className="-mx-4 sm:mx-0 sm:rounded-2xl border-y sm:border border-slate-200/80 bg-white px-4 py-4 sm:p-5 shadow-none sm:shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                <PlanTab
                  entries={planWithDetails}
                  allMains={mains}
                  allSides={sides}
                  weekStart={currentWeekStart}
                  isReadOnlyWeek={isReadOnlyWeek}
                  isGuest={isGuest}
                  onPrevWeek={isGuest ? null : handlePrevWeek}
                  onNextWeek={isGuest ? null : handleNextWeek}
                  onGoToCurrentWeek={isGuest ? null : handleGoToCurrentWeek}
                  onAddMainToPlan={isReadOnlyWeek ? null : handleAddMainToPlan}
                  onRemoveEntry={isReadOnlyWeek ? null : handleRemoveEntryFromPlan}
                  onAttachSide={isReadOnlyWeek ? null : handleAttachSide}
                  onRemoveSide={isReadOnlyWeek ? null : handleRemoveSide}
                  onSavePlan={isReadOnlyWeek || isGuest ? null : () => setSavePlanDialogOpen(true)}
                  onReorderEntries={isReadOnlyWeek ? null : handleReorderPlan}
                  onRandomizeWeek={isReadOnlyWeek ? null : handleRandomizeWeek}
                  onUpdateServings={isReadOnlyWeek ? null : handleUpdateServings}
                  onRateDish={isGuest ? null : handleRateDish}
                  onShareToMarketplace={isGuest || isReadOnlyWeek ? null : handleShareWeekToMarketplace}
                  onAddOutDay={isReadOnlyWeek ? null : handleAddOutDay}
                  onCopyPreviousWeek={isGuest || isReadOnlyWeek || !prevWeekHasMeals ? null : handleCopyPreviousWeek}
                  onUpdatePlanNote={isReadOnlyWeek ? null : handleUpdatePlanNote}
                  monthPlansData={monthPlansData}
                  onNavigateToWeek={(weekIso) => { handleNavigateToWeek(weekIso); fetchMonthPlans(weekIso); }}
                  onReorderMonthEntry={handleReorderMonthEntry}
                  recentMealIds={recentMealIds}
                  savedPlans={isGuest ? [] : savedPlans}
                  onLoadTemplate={isGuest ? null : handleReloadPlan}
                />
              </section>
            )}
          </main>
        )}
      </div>

      {/* ── Onboarding wizard ── shown to new users with an empty plan ── */}
      {!isOnboarded && !loading && mains.length > 0 && planEntries.length === 0 && (
        <OnboardingWizard
          allMains={mains}
          onComplete={handleOnboardingComplete}
        />
      )}

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
    defaultName={`Week of ${formatWeekRange(currentWeekStart)}`}
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

{copyWeekPending && (
  <ConfirmDialog
    title="Copy last week"
    message="Replace your current plan with last week's meals?"
    confirmLabel="Replace"
    confirmVariant="secondary"
    onCancel={() => setCopyWeekPending(null)}
    onConfirm={() => {
      setPlanEntries(copyWeekPending);
      persistPlan(copyWeekPending);
      setCopyWeekPending(null);
      addToast('Last week copied as a template! 📋', 'success');
    }}
  />
)}

{cloneWeekPending && (
  <ConfirmDialog
    title="Load community week"
    message="Replace your current plan with this community week's meals?"
    confirmLabel="Replace"
    confirmVariant="secondary"
    onCancel={() => setCloneWeekPending(null)}
    onConfirm={() => {
      setPlanEntries(cloneWeekPending);
      persistPlan(cloneWeekPending);
      setCloneWeekPending(null);
      setActiveTab('plan');
      addToast(`Loaded ${cloneWeekPending.length} meal${cloneWeekPending.length !== 1 ? 's' : ''} into your week!`, 'success');
    }}
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


      <MobileBottomNav
        activeTab={activeTab}
        onNavigate={navigateTo}
        lastKitchenTab={lastKitchenTab}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}

    </div>
  );
}

export default App;

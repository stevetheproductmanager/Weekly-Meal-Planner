import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from '../Icons';

// ---------------------------------------------------------------------------
// Help content — one entry per section
// ---------------------------------------------------------------------------
const SECTIONS = [
  {
    id: 'overview',
    title: '✦ Overview',
    intro:
      'Simmer answers the age-old question: "what\'s for dinner tonight?" — and makes sure you only go grocery shopping once. Build a library of meals, plan your week, and let Simmer build your grocery list automatically.',
    items: [
      {
        heading: 'The basic workflow',
        body: '1. Add your favourite meals to the Mains and Sides inventory.\n2. Open the Weekly Plan tab and pick up to 7 dinners.\n3. Attach sides to any dinner you like.\n4. Head to the Grocery List — every ingredient is already there.\n5. Shop once, eat well all week.',
      },
      {
        heading: 'Sign in for full access',
        body: 'Sign in with Google to unlock cloud sync, plan history, and the Other Items tab. Your data is stored securely in the cloud and available on any device.',
      },
      {
        heading: 'Guest mode',
        body: 'Don\'t want to sign in? Click "Try it free" on the landing page to browse the meal library and build a plan without an account. Your guest plan is saved in your browser. Sign in any time to sync to the cloud.',
      },
      {
        heading: 'Dark & light mode',
        body: 'Use the theme toggle in the top-right user menu (signed in) or the icon button in the header (guest) to switch themes. Your preference is remembered.',
      },
      {
        heading: 'Pre-loaded meal library',
        body: 'Over 700 main dishes and 95 sides are pre-loaded from TheMealDB, complete with ingredients and recipe links. You can also add your own custom meals at any time.',
      },
    ],
  },
  {
    id: 'plan',
    title: '📅 Weekly Plan',
    intro:
      'Your dinner calendar for the week. Plan up to 7 meals, attach sides, and see everything at a glance.',
    items: [
      {
        heading: 'Adding a dinner',
        body: 'Click the "+ Add dinner" button (or the dashed row at the bottom of the list) to open the meal picker. Search or scroll through your Mains library and tap a meal to add it. On mobile the picker slides up from the bottom; on desktop it opens as a centred dialog.',
      },
      {
        heading: 'List view vs Grid view (desktop)',
        body: 'On desktop, use the List / Grid toggle above the plan to switch views. List view (default) shows one dinner per row with a side selector and drag handles. Grid view shows all 7 days as cards side by side.',
      },
      {
        heading: 'Drag to reorder (desktop list view)',
        body: 'Grab the ⠿ grip handle on the left of any row and drag it up or down to change which day that dinner falls on. An emerald line shows exactly where it will land. The reorder is saved automatically.',
      },
      {
        heading: 'Attaching sides',
        body: 'Use the side dish dropdown on each plan entry to select a side and confirm with the green ✓ button. The dropdown is sorted A→Z and truncates long names to keep the layout tidy. You can also attach sides from the Sides tab using the link icon on any side card.',
      },
      {
        heading: 'Removing a dinner or side',
        body: 'Click the × button on a dinner row to remove it from the plan, or the × on a side chip to detach just that side. A toast notification confirms what was removed.',
      },
      {
        heading: 'Recipe links',
        body: 'If a meal has a recipe URL set, a green book icon appears to the left of the meal name. Click it to open the recipe in a new tab.',
      },
      {
        heading: 'Saving your plan',
        body: 'Click "Save plan" (top-right of the Weekly Plan tab) to archive the current week. Give it a name and it\'s stored in History. Requires sign-in.',
      },
    ],
  },
  {
    id: 'grocery',
    title: '🛒 Grocery List',
    intro:
      'Auto-generated from every planned meal and any Other Items you\'ve added. Updated instantly whenever you change your plan.',
    items: [
      {
        heading: 'How the list is built',
        body: 'Every ingredient from every main and side in your Weekly Plan is collected and combined. If the same ingredient appears in multiple meals (e.g. garlic), the quantities are summed automatically.',
      },
      {
        heading: 'Group by Category vs by Meal',
        body: 'Use the toggle to switch between grouping ingredients by food category (Produce, Dairy, Meat, etc.) or by the meal they belong to. "By meal" is handy for batch cooking.',
      },
      {
        heading: 'Search',
        body: 'Type in the search bar to quickly find a specific ingredient. The list filters in real time.',
      },
      {
        heading: 'Shopping Mode',
        body: 'Tap "Shopping Mode" to enter an interactive checklist. Tap any item to check it off — it fades out so you can see what\'s left. Your checked items are remembered if you close the browser mid-shop.',
      },
      {
        heading: 'Removing items',
        body: 'In normal mode, click the × button on any item to hide it for this session. To permanently remove it, either remove the meal from the plan or edit its ingredient list.',
      },
      {
        heading: 'Other Items on the list',
        body: 'Items added from the Other Items tab appear at the bottom of the grocery list. Remove them here or manage them on the Other Items tab.',
      },
    ],
  },
  {
    id: 'mains',
    title: '🍽️ Mains',
    intro:
      'Your library of main dishes — everything from quick weeknight pasta to slow-cooked curries. Over 700 meals pre-loaded and ready to use.',
    items: [
      {
        heading: 'Browsing & searching',
        body: 'Use the search bar to filter by name. Use the tag dropdown to filter by cuisine or meal type. Use the sort dropdown to order by A→Z, Z→A, newest first, or by category.',
      },
      {
        heading: 'Cards vs list view',
        body: 'Switch between a card grid (good for browsing) and a compact list (good for scanning large numbers quickly) using the toggle in the top-right of the tab.',
      },
      {
        heading: 'Per-page count',
        body: 'Use the "per page" dropdown to control how many meals are shown at once (24, 48, 96, or Show all). Keeping it at 48 gives the fastest load time.',
      },
      {
        heading: 'Adding a meal to the week',
        body: 'Click the calendar icon on any card or list row to add that meal to this week\'s plan instantly. The icon turns green when the meal is already in the plan.',
      },
      {
        heading: 'Adding your own meal',
        body: 'Click "+ Add main" to open the dish editor. Fill in the name, category, tags, ingredients (name, quantity, unit for each), and an optional recipe URL. Custom meals are private to your account.',
      },
      {
        heading: 'Editing & deleting',
        body: 'Click the pencil icon to edit a meal, or the trash icon to delete it. You can only edit or delete meals you created — the pre-loaded shared library cannot be modified.',
      },
      {
        heading: 'Recipe links',
        body: 'If a meal has a recipe URL, a green book icon appears to the left of the meal name in the Weekly Plan. Click it to open the recipe in a new tab.',
      },
    ],
  },
  {
    id: 'sides',
    title: '🥗 Sides',
    intro:
      'Your library of side dishes — salads, vegetables, bread, rice, and anything else that completes a meal. Works like Mains but sides are attached to specific dinners.',
    items: [
      {
        heading: 'Attaching a side to a dinner',
        body: 'From the Weekly Plan, use the side dropdown on any dinner row and click ✓ to attach it. Alternatively, click the link icon on any side card in the Sides tab to open the "Attach to dinner" dialog.',
      },
      {
        heading: '"In plan" badge',
        body: 'A green "In plan" badge appears on any side already attached to at least one dinner this week, so you can see at a glance what\'s already planned.',
      },
      {
        heading: 'Ingredients flow to grocery list',
        body: 'Once a side is attached to a dinner in your plan, all of its ingredients automatically appear on the Grocery List.',
      },
      {
        heading: 'Adding & editing sides',
        body: 'Works the same as Mains — use "+ Add side", the pencil icon to edit, and the trash icon to delete. You can only edit or delete sides you created.',
      },
    ],
  },
  {
    id: 'misc',
    title: '🧺 Other Items',
    intro:
      'A reusable inventory of non-meal grocery items — household staples, snacks, drinks, cleaning supplies, and more. Requires sign-in.',
    items: [
      {
        heading: 'Pre-loaded items',
        body: 'Over 40 common household items (toilet paper, dish soap, coffee, shampoo, etc.) are pre-loaded and available to all signed-in users. These shared items cannot be edited or deleted.',
      },
      {
        heading: 'Adding your own items',
        body: 'Click "+ Add item" and type the item name. Your custom items are saved permanently to your account and reappear every week — you only need to add them once.',
      },
      {
        heading: 'Adding to the grocery list',
        body: 'Click the "+ Item" button on any card or list row to add it to this week\'s grocery list. The button changes style and an "In list" badge appears to confirm it\'s been added.',
      },
      {
        heading: 'Editing & deleting custom items',
        body: 'Use the pencil icon to rename your own items, or the trash icon to permanently remove them. Edit and delete are only available on items you created, not the pre-loaded ones.',
      },
      {
        heading: 'Search & sort',
        body: 'Use the search bar to find items by name, and the sort dropdown (A→Z, Z→A, Newest first) to order the list.',
      },
    ],
  },
  {
    id: 'history',
    title: '🗂️ History',
    intro:
      'A record of your previously saved weekly plans. Requires sign-in — your history is synced to the cloud.',
    items: [
      {
        heading: 'Saving a plan',
        body: 'From the Weekly Plan tab, click "Save plan", give it a name (e.g. "Week of Jan 13" or "Pasta week"), and confirm. The snapshot is stored in History immediately.',
      },
      {
        heading: 'Reloading a saved plan',
        body: 'Click "Load" on any saved plan to restore it as your current weekly plan. You\'ll be asked to confirm — your current plan will be replaced. Great for repeating a week you enjoyed.',
      },
      {
        heading: 'Deleting a saved plan',
        body: 'Click the trash icon next to a saved plan to permanently remove it from history.',
      },
      {
        heading: 'Tip: save before clearing',
        body: 'Get into the habit of saving your plan at the end of each week before clearing it. Over time, History becomes a personal recipe rotation you can draw from.',
      },
    ],
  },
  {
    id: 'account',
    title: '👤 Account & Settings',
    intro:
      'Manage your account, theme, and sign-out from the user menu in the top-right corner.',
    items: [
      {
        heading: 'User menu (signed in)',
        body: 'Click your avatar or name in the top-right to open the user menu. From here you can toggle Dark/Light mode, open this Help guide, or Sign out.',
      },
      {
        heading: 'Signing out',
        body: 'Open the user menu (top-right) and click "Sign out". Your cloud data is safe — everything will be there when you sign back in.',
      },
      {
        heading: 'Switching from guest to signed-in',
        body: 'Click "Sign in with Google" in the amber guest banner at the top of the page. After signing in, the shared meal library and your cloud plan are loaded. Your guest plan is not automatically transferred.',
      },
      {
        heading: 'What requires sign-in',
        body: 'Saving plans, viewing History, and the Other Items tab all require a signed-in account. Guest mode gives full read access to the meal library and lets you build and use a local plan.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function highlight(text, term) {
  if (!term) return text;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase()
      ? <mark key={i} className="bg-emerald-200 text-emerald-900 dark:bg-emerald-700 dark:text-emerald-50 rounded px-0.5">{part}</mark>
      : part
  );
}

function matchesSearch(text, term) {
  return text.toLowerCase().includes(term.toLowerCase());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function HelpDialog({ onClose }) {
  const [search, setSearch] = useState('');
  const overlayRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Auto-focus search on open
    setTimeout(() => searchRef.current?.focus(), 50);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const term = search.trim();

  const visibleSections = SECTIONS.map((section) => {
    if (!term) return { ...section, visibleItems: section.items };

    const titleMatch = matchesSearch(section.title, term) || matchesSearch(section.intro, term);
    const matchingItems = section.items.filter(
      (item) => matchesSearch(item.heading, term) || matchesSearch(item.body, term)
    );

    if (!titleMatch && matchingItems.length === 0) return null;
    return { ...section, visibleItems: titleMatch ? section.items : matchingItems };
  }).filter(Boolean);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-[5vh] overflow-y-auto"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/60 flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Help & Guide</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">How to get the most out of Simmer</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help topics…"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XIcon size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-7">
          {visibleSections.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
              No help topics match &ldquo;{search}&rdquo;.
            </p>
          )}

          {visibleSections.map((section) => (
            <section key={section.id}>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-1">
                {highlight(section.title, term)}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                {highlight(section.intro, term)}
              </p>

              <div className="space-y-3">
                {section.visibleItems.map((item) => (
                  <div
                    key={item.heading}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                      {highlight(item.heading, term)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                      {highlight(item.body, term)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <p className="text-xs text-center text-slate-400 dark:text-slate-600">
            Press <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono dark:border-slate-700 dark:bg-slate-800">Esc</kbd> or click outside to close
          </p>
        </div>

      </div>
    </div>
  );
}

export default HelpDialog;

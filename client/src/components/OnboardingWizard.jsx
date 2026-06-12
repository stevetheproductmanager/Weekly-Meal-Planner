import React, { useState, useMemo } from 'react';

// ─── Preference definitions ───────────────────────────────────────────────────

const CUISINES = [
  { id: 'Italian',        label: 'Italian',        emoji: '🇮🇹' },
  { id: 'Mexican',        label: 'Mexican',        emoji: '🌮' },
  { id: 'Indian',         label: 'Indian',         emoji: '🍛' },
  { id: 'Chinese',        label: 'Chinese',        emoji: '🥢' },
  { id: 'Japanese',       label: 'Japanese',       emoji: '🍱' },
  { id: 'Thai',           label: 'Thai',           emoji: '🌶️' },
  { id: 'Greek',          label: 'Greek',          emoji: '🫒' },
  { id: 'French',         label: 'French',         emoji: '🥖' },
  { id: 'BBQ',            label: 'BBQ',            emoji: '🔥' },
  { id: 'Mediterranean',  label: 'Mediterranean',  emoji: '🫐' },
  { id: 'American',       label: 'American',       emoji: '🍔' },
  { id: 'Korean',         label: 'Korean',         emoji: '🥘' },
  { id: 'Vietnamese',     label: 'Vietnamese',     emoji: '🍜' },
  { id: 'British',        label: 'British',        emoji: '☕' },
];

const PROTEINS = [
  { id: 'Chicken',     label: 'Chicken',      emoji: '🍗' },
  { id: 'Beef',        label: 'Beef',         emoji: '🥩' },
  { id: 'Pork',        label: 'Pork',         emoji: '🐷' },
  { id: 'Lamb',        label: 'Lamb',         emoji: '🍖' },
  { id: 'Seafood',     label: 'Seafood',      emoji: '🦐' },
  { id: 'Fish',        label: 'Fish',         emoji: '🐟' },
  { id: 'Vegetarian',  label: 'Vegetarian',   emoji: '🥗' },
  { id: 'Vegan',       label: 'Vegan',        emoji: '🌱' },
  { id: 'Pasta',       label: 'Pasta',        emoji: '🍝' },
  { id: 'Eggs',        label: 'Eggs',         emoji: '🥚' },
];

const STYLES = [
  { id: 'Quick',        label: 'Quick & Easy',    emoji: '⚡' },
  { id: 'Slow cooked',  label: 'Slow cooked',     emoji: '🫕' },
  { id: 'Grilling',     label: 'Grilling',        emoji: '🔥' },
  { id: 'One-pot',      label: 'One pot',         emoji: '🍲' },
  { id: 'Comfort food', label: 'Comfort food',    emoji: '🧸' },
  { id: 'Healthy',      label: 'Healthy',         emoji: '🥦' },
  { id: 'Family',       label: 'Family meals',    emoji: '👨‍👩‍👧' },
  { id: 'Meal prep',    label: 'Meal prep',       emoji: '📦' },
  { id: 'Date night',   label: 'Date night',      emoji: '🕯️' },
  { id: 'Budget',       label: 'Budget-friendly', emoji: '💰' },
];

const STEPS = [
  {
    key: 'cuisines',
    title: 'What cuisines do you love?',
    subtitle: "Pick as many as you like — we'll weight suggestions towards your taste.",
    options: CUISINES,
  },
  {
    key: 'proteins',
    title: 'What do you like to eat?',
    subtitle: "We'll skip dishes with ingredients you don't use.",
    options: PROTEINS,
  },
  {
    key: 'styles',
    title: 'How do you like to cook?',
    subtitle: 'Your kitchen vibe helps us find the right dishes.',
    options: STYLES,
  },
];

// ─── Scoring helper (also exported for use in App.jsx) ───────────────────────

const CUISINE_KEYWORDS = {
  Italian:       ['pasta', 'risotto', 'pizza', 'carbonara', 'bolognese', 'gnocchi', 'lasagn', 'penne', 'tiramisu', 'arancini', 'fettuccine', 'tagliatelle', 'arrabiata'],
  Mexican:       ['taco', 'burrito', 'enchilada', 'quesadilla', 'fajita', 'carnitas', 'tamale', 'chipotle', 'salsa'],
  Indian:        ['tikka', 'curry', 'masala', 'korma', 'biryani', 'dal', 'naan', 'paneer', 'vindaloo', 'saag', 'rogan', 'tandoor', 'chana', 'aloo', 'makhani'],
  Chinese:       ['stir fry', 'stir-fry', 'dumpling', 'fried rice', 'kung pao', 'sweet and sour', 'chow mein', 'wonton', 'peking', 'dim sum', 'szechuan', 'hoisin'],
  Japanese:      ['sushi', 'ramen', 'teriyaki', 'tempura', 'miso', 'soba', 'udon', 'katsu', 'yakitori', 'tonkatsu', 'gyoza', 'edamame'],
  Thai:          ['thai', 'pad thai', 'green curry', 'massaman', 'satay', 'tom yum', 'pad see ew'],
  Greek:         ['greek', 'souvlaki', 'gyro', 'moussaka', 'tzatziki', 'spanakopita', 'kleftiko', 'baklava'],
  French:        ['coq au vin', 'bourguignon', 'ratatouille', 'gratin', 'cassoulet', 'french', 'dauphinois', 'crepe', 'bouillabaisse'],
  BBQ:           ['bbq', 'barbecue', 'smoked', 'ribs', 'brisket', 'pulled pork', 'burnt ends'],
  Mediterranean: ['mediterranean', 'kebab', 'falafel', 'shawarma', 'hummus', 'tahini', 'pita'],
  American:      ['burger', 'hot dog', 'mac and cheese', 'fried chicken', 'cheeseburger', 'meatloaf', 'pot roast'],
  Korean:        ['korean', 'bulgogi', 'bibimbap', 'kimchi', 'gochujang', 'japchae'],
  Vietnamese:    ['vietnamese', 'pho', 'banh mi', 'spring roll', 'bun bo', 'vermicelli'],
  British:       ['pie', 'shepherd', 'cottage pie', 'roast', 'bangers', 'fish and chips', 'yorkshire', 'pasty', 'toad in the hole'],
};

const PROTEIN_CATEGORIES = {
  Chicken:    ['Chicken'],
  Beef:       ['Beef'],
  Pork:       ['Pork'],
  Lamb:       ['Lamb'],
  Seafood:    ['Seafood'],
  Fish:       ['Seafood'],
  Vegetarian: ['Vegetarian', 'Vegan'],
  Vegan:      ['Vegan'],
  Pasta:      ['Pasta'],
  Eggs:       ['Breakfast'],
};

const STYLE_KEYWORDS = {
  Quick:          ['quick', 'easy', 'fast', '15 minute', '20 minute', '30 minute', 'simple'],
  'Slow cooked':  ['slow', 'brais', 'stew', 'casserole', 'low and slow'],
  Grilling:       ['grill', 'grilled', 'char', 'flame'],
  'One-pot':      ['one pot', 'one-pot', 'skillet', 'stew', 'casserole', 'traybake', 'tray bake'],
  'Comfort food': ['comfort', 'hearty', 'classic', 'traditional', 'homemade', 'mash', 'gravy'],
  Healthy:        ['salad', 'grilled', 'steamed', 'light', 'lean', 'fresh'],
  Family:         ['family', 'kid', 'crowd', 'batch'],
  'Meal prep':    ['batch', 'prep', 'make ahead', 'freeze', 'leftover'],
  'Date night':   ['special', 'fancy', 'impress', 'dinner party', 'elegant'],
  Budget:         ['budget', 'cheap', 'affordable', 'economy', 'beans', 'lentil'],
};

export function scoreDishByPrefs(dish, prefs) {
  if (!prefs) return 0;
  let score = 0;
  const nameLower = (dish.name || '').toLowerCase();
  const tagsLower = (dish.tags || []).join(' ').toLowerCase();

  // Protein/category match — strongest signal
  for (const p of (prefs.proteins || [])) {
    const cats = PROTEIN_CATEGORIES[p] || [];
    if (cats.some(c => dish.category === c)) { score += 3; break; }
  }

  // Cuisine keyword match on dish name
  for (const cuisine of (prefs.cuisines || [])) {
    const kws = CUISINE_KEYWORDS[cuisine] || [];
    if (kws.some(kw => nameLower.includes(kw))) { score += 2; break; }
  }

  // Style keyword match on name + tags
  for (const style of (prefs.styles || [])) {
    const kws = STYLE_KEYWORDS[style] || [];
    if (kws.some(kw => nameLower.includes(kw) || tagsLower.includes(kw))) { score += 1; break; }
  }

  return score;
}

// ─── Pick starter suggestions based on prefs ─────────────────────────────────

function pickSuggestions(mains, prefs, count = 16) {
  const scored = mains.map(m => ({ m, s: scoreDishByPrefs(m, prefs) }));
  // Sort by score desc, then name asc for determinism
  scored.sort((a, b) => b.s - a.s || a.m.name.localeCompare(b.m.name));
  // Take top N with preference-score > 0 if possible, else fallback to A-Z
  const matching = scored.filter(x => x.s > 0).slice(0, count);
  if (matching.length >= 8) return matching.map(x => x.m);
  // Not enough matches — pad with A-Z sorted dishes not already in list
  const matchIds = new Set(matching.map(x => x.m.id));
  const rest = mains.filter(m => !matchIds.has(m.id)).slice(0, count - matching.length);
  return [...matching.map(x => x.m), ...rest];
}

// ─── Reusable option chip ─────────────────────────────────────────────────────

function OptionChip({ option, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(option.id)}
      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all duration-150 active:scale-[0.96] ${
        selected
          ? 'border-emerald-500 bg-emerald-50 shadow-sm dark:border-emerald-400 dark:bg-emerald-950/40'
          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500'
      }`}
    >
      {selected && (
        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold select-none">
          ✓
        </span>
      )}
      <span className="text-2xl select-none leading-none">{option.emoji}</span>
      <span className={`text-[11px] font-semibold leading-tight ${
        selected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
      }`}>
        {option.label}
      </span>
    </button>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ total, current }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-200 ${
            i < current
              ? 'h-2 w-2 bg-emerald-500'
              : i === current
                ? 'h-2 w-5 bg-emerald-500'
                : 'h-2 w-2 bg-slate-200 dark:bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingWizard({ allMains = [], onComplete }) {
  const TOTAL_STEPS = 4; // 3 pref steps + 1 starter meal step

  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({
    cuisines: new Set(),
    proteins: new Set(),
    styles:   new Set(),
  });
  const [pickedMeals, setPickedMeals] = useState(new Set());

  const currentPrefs = {
    cuisines: Array.from(selections.cuisines),
    proteins: Array.from(selections.proteins),
    styles:   Array.from(selections.styles),
  };

  const suggestions = useMemo(
    () => pickSuggestions(allMains, currentPrefs, 16),
    // Recompute only when reaching the meal-pick step (step 3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allMains, step === 3]
  );

  const toggle = (key, id) => {
    setSelections(prev => {
      const next = new Set(prev[key]);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { ...prev, [key]: next };
    });
  };

  const toggleMeal = (id) => {
    setPickedMeals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleFinish = () => {
    onComplete(currentPrefs, Array.from(pickedMeals));
  };

  const handleSkipAll = () => {
    onComplete({ cuisines: [], proteins: [], styles: [] }, []);
  };

  const stepDef = STEPS[step]; // undefined when step === 3 (meal pick)

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl select-none">🍳</span>
          <span className="font-extrabold tracking-tight text-slate-900 dark:text-slate-50 text-lg">
            What's Simmering?
          </span>
        </div>
        <button
          type="button"
          onClick={handleSkipAll}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          Skip setup →
        </button>
      </div>

      {/* ── Progress ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-5 pb-1">
        <StepDots total={TOTAL_STEPS} current={step} />
      </div>

      {/* ── Content (scrollable) ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {step < 3 ? (
          /* ── Preference selection steps 0–2 ── */
          <div className="px-4 pt-5 pb-36 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-snug mb-1">
              {stepDef.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {stepDef.subtitle}
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {stepDef.options.map(option => (
                <OptionChip
                  key={option.id}
                  option={option}
                  selected={selections[stepDef.key].has(option.id)}
                  onToggle={(id) => toggle(stepDef.key, id)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* ── Step 3: Starter meal picker ── */
          <div className="px-4 pt-5 pb-36 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-snug mb-1">
              {currentPrefs.cuisines.length + currentPrefs.proteins.length + currentPrefs.styles.length > 0
                ? 'Meals we think you\'ll love'
                : 'Pick a few meals to start'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {pickedMeals.size > 0
                ? `${pickedMeals.size} selected — tap Start to add them to this week.`
                : 'Tap any to add to your first week, or skip to explore yourself.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {suggestions.map(m => {
                const isSelected = pickedMeals.has(m.id);
                const score = scoreDishByPrefs(m, currentPrefs);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMeal(m.id)}
                    className={`relative rounded-xl border-2 p-3.5 text-left transition-all duration-150 active:scale-[0.97] ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm dark:border-emerald-400 dark:bg-emerald-950/40'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold select-none">
                        ✓
                      </span>
                    )}
                    {score > 0 && !isSelected && (
                      <span className="absolute top-2 right-2 flex items-center gap-0.5">
                        {score >= 3 && <span className="text-[8px] text-emerald-500 font-bold">★</span>}
                        {score >= 5 && <span className="text-[8px] text-emerald-500 font-bold">★</span>}
                      </span>
                    )}
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                      {m.name}
                    </p>
                    {m.category && (
                      <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {m.category}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky bottom nav ───────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm px-4 py-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">

          {/* Back */}
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              ← Back
            </button>
          )}

          {/* Selection count / hint */}
          <div className="flex-1 min-w-0">
            {step < 3 ? (
              selections[STEPS[step].key].size > 0 ? (
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {selections[STEPS[step].key].size} selected
                </p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">Tap to select, or skip this step</p>
              )
            ) : (
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {pickedMeals.size > 0 ? `${pickedMeals.size} meal${pickedMeals.size !== 1 ? 's' : ''} picked` : 'No meals picked yet'}
              </p>
            )}
          </div>

          {/* Primary action */}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex-none rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-bold text-white shadow-sm active:scale-95 transition-all"
            >
              {selections[STEPS[step].key].size > 0 ? 'Next →' : 'Skip →'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex-none rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-bold text-white shadow-sm active:scale-95 transition-all"
            >
              {pickedMeals.size > 0 ? 'Start my week →' : 'Get started →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

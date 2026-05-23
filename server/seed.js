/**
 * seed.js — one-time import from TheMealDB into meals.json
 *
 * Usage:
 *   cd server
 *   node seed.js
 *
 * Fetches every meal in TheMealDB, transforms ingredients into the app's
 * { name, quantity, unit } format, and appends to server/data/meals.json.
 * Skips meals whose name already exists (case-insensitive) to avoid duplicates.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEALS_FILE = path.join(__dirname, 'data', 'meals.json');
const BASE = 'https://www.themealdb.com/api/json/v1/1';

// Small delay between requests to be kind to the free API
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function generateId() {
  return 'main_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 10000).toString(36);
}

/**
 * Parse a TheMealDB measure string like "2 cups", "1 tsp", "3/4 cup", "handful"
 * into { quantity, unit }.
 */
function parseMeasure(raw) {
  if (!raw || !raw.trim()) return { quantity: '', unit: '' };
  const str = raw.trim();

  // Match an optional leading number/fraction, then optional unit
  const match = str.match(/^([\d\s/.,½⅓⅔¼¾⅛⅜⅝⅞]+)?\s*(.*)$/);
  if (!match) return { quantity: '', unit: str };

  let quantity = (match[1] || '').trim();
  let unit = (match[2] || '').trim();

  // Replace common vulgar fractions
  quantity = quantity
    .replace(/½/g, '1/2')
    .replace(/⅓/g, '1/3')
    .replace(/⅔/g, '2/3')
    .replace(/¼/g, '1/4')
    .replace(/¾/g, '3/4')
    .replace(/⅛/g, '1/8')
    .replace(/⅜/g, '3/8')
    .replace(/⅝/g, '5/8')
    .replace(/⅞/g, '7/8')
    .trim();

  // If there's no quantity at all, treat the whole string as unit
  if (!quantity && unit) return { quantity: '', unit: unit };
  if (quantity && !unit) return { quantity, unit: '' };
  return { quantity, unit };
}

/**
 * Transform a raw TheMealDB meal object into the app's dish shape.
 */
function transformMeal(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] || '').trim();
    if (!name) continue;
    const { quantity, unit } = parseMeasure(meal[`strMeasure${i}`] || '');
    ingredients.push({ name, quantity, unit });
  }

  return {
    id: generateId(),
    name: meal.strMeal,
    category: meal.strCategory || '',
    tags: meal.strTags
      ? meal.strTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [],
    ingredients,
    notes: '',
    recipeUrl: meal.strSource || meal.strYoutube || '',
  };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  console.log('📖 Reading existing meals…');
  let existing = [];
  try {
    const raw = await fs.readFile(MEALS_FILE, 'utf-8');
    existing = JSON.parse(raw);
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }

  const existingNames = new Set(existing.map((m) => m.name.toLowerCase()));
  console.log(`   Found ${existing.length} existing meals.`);

  console.log('\n🌐 Fetching categories from TheMealDB…');
  const { categories } = await fetchJson(`${BASE}/categories.php`);
  console.log(`   ${categories.length} categories found.`);

  const allMealStubs = [];

  for (const cat of categories) {
    process.stdout.write(`   Listing meals in "${cat.strCategory}"… `);
    const data = await fetchJson(`${BASE}/filter.php?c=${encodeURIComponent(cat.strCategory)}`);
    const meals = data.meals || [];
    console.log(`${meals.length} meals`);
    allMealStubs.push(...meals.map((m) => ({ id: m.idMeal, category: cat.strCategory })));
    await delay(150);
  }

  console.log(`\n🔍 Fetching details for ${allMealStubs.length} meals…`);

  const newMeals = [];
  let skipped = 0;
  let fetched = 0;

  for (const stub of allMealStubs) {
    const data = await fetchJson(`${BASE}/lookup.php?i=${stub.id}`);
    const meal = data.meals?.[0];
    if (!meal) { skipped++; continue; }

    if (existingNames.has(meal.strMeal.toLowerCase())) {
      skipped++;
      process.stdout.write('s');
    } else {
      const transformed = transformMeal(meal);
      newMeals.push(transformed);
      existingNames.add(meal.strMeal.toLowerCase());
      fetched++;
      process.stdout.write('.');
    }

    if ((fetched + skipped) % 50 === 0) process.stdout.write('\n   ');
    await delay(120);
  }

  console.log(`\n\n✅ Fetched ${fetched} new meals, skipped ${skipped} duplicates.`);

  if (newMeals.length === 0) {
    console.log('Nothing new to add — meals.json is unchanged.');
    return;
  }

  const updated = [...existing, ...newMeals];
  await fs.writeFile(MEALS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`💾 Saved ${updated.length} total meals to data/meals.json`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});

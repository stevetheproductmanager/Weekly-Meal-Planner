/**
 * seed-sides.js — one-time import of side dishes from TheMealDB into sides.json
 *
 * Usage:
 *   cd server
 *   node seed-sides.js
 *
 * Pulls from the "Side" category in TheMealDB, transforms ingredients into the
 * app's { name, quantity, unit } format, and appends to server/data/sides.json.
 * Skips sides whose name already exists (case-insensitive).
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIDES_FILE = path.join(__dirname, 'data', 'sides.json');
const BASE = 'https://www.themealdb.com/api/json/v1/1';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function generateId() {
  return 'side_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 10000).toString(36);
}

function parseMeasure(raw) {
  if (!raw || !raw.trim()) return { quantity: '', unit: '' };
  const str = raw.trim();
  const match = str.match(/^([\d\s/.,½⅓⅔¼¾⅛⅜⅝⅞]+)?\s*(.*)$/);
  if (!match) return { quantity: '', unit: str };

  let quantity = (match[1] || '').trim()
    .replace(/½/g, '1/2').replace(/⅓/g, '1/3').replace(/⅔/g, '2/3')
    .replace(/¼/g, '1/4').replace(/¾/g, '3/4').replace(/⅛/g, '1/8')
    .replace(/⅜/g, '3/8').replace(/⅝/g, '5/8').replace(/⅞/g, '7/8')
    .trim();
  const unit = (match[2] || '').trim();

  if (!quantity && unit) return { quantity: '', unit };
  if (quantity && !unit) return { quantity, unit: '' };
  return { quantity, unit };
}

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
    category: meal.strCategory || 'Side',
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
  console.log('📖 Reading existing sides…');
  let existing = [];
  try {
    const raw = await fs.readFile(SIDES_FILE, 'utf-8');
    existing = JSON.parse(raw);
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }

  const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));
  console.log(`   Found ${existing.length} existing sides.`);

  console.log('\n🌐 Fetching "Side" category from TheMealDB…');
  const data = await fetchJson(`${BASE}/filter.php?c=Side`);
  const stubs = data.meals || [];
  console.log(`   ${stubs.length} sides found.`);

  console.log('\n🔍 Fetching full details…');

  const newSides = [];
  let skipped = 0;

  for (const stub of stubs) {
    await delay(120);
    const detail = await fetchJson(`${BASE}/lookup.php?i=${stub.idMeal}`);
    const meal = detail.meals?.[0];
    if (!meal) { skipped++; continue; }

    if (existingNames.has(meal.strMeal.toLowerCase())) {
      skipped++;
      process.stdout.write('s');
    } else {
      newSides.push(transformMeal(meal));
      existingNames.add(meal.strMeal.toLowerCase());
      process.stdout.write('.');
    }
  }

  console.log(`\n\n✅ Fetched ${newSides.length} new sides, skipped ${skipped} duplicates.`);

  if (newSides.length === 0) {
    console.log('Nothing new to add — sides.json is unchanged.');
    return;
  }

  const updated = [...existing, ...newSides];
  await fs.writeFile(SIDES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`💾 Saved ${updated.length} total sides to data/sides.json`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});

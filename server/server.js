import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const dataDir = path.join(__dirname, 'data');
const mainsFile = path.join(dataDir, 'meals.json'); // treat old meals as "mains"
const sidesFile = path.join(dataDir, 'sides.json');
const planFile = path.join(dataDir, 'plan.json');
const miscFile = path.join(dataDir, 'miscitem.json'); // shared misc items inventory
const savedPlansFile = path.join(dataDir, 'saved-plans.json');

// In-memory cache for the large list files so we don't read 800 KB+ from disk on every request
const memCache = new Map();

app.use(cors());
app.use(express.json());

async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(mainsFile);
  } catch {
    await fs.writeFile(mainsFile, '[]', 'utf-8');
  }

  try {
    await fs.access(sidesFile);
  } catch {
    await fs.writeFile(sidesFile, '[]', 'utf-8');
  }

  try {
    await fs.access(planFile);
  } catch {
    const initialPlan = { entries: [], createdAt: new Date().toISOString() };
    await fs.writeFile(planFile, JSON.stringify(initialPlan, null, 2), 'utf-8');
  }

  // initialize miscitem.json as an empty array if it doesn't exist
  try {
    await fs.access(miscFile);
  } catch {
    await fs.writeFile(miscFile, '[]', 'utf-8');
  }

  try {
    await fs.access(savedPlansFile);
  } catch {
    await fs.writeFile(savedPlansFile, '[]', 'utf-8');
  }
}

async function readJson(filePath) {
  // Serve from memory cache when available (avoids re-reading large files on every request)
  if (memCache.has(filePath)) return memCache.get(filePath);
  const data = await fs.readFile(filePath, 'utf-8');
  if (!data) return null;
  const parsed = JSON.parse(data);
  memCache.set(filePath, parsed);
  return parsed;
}

async function writeJson(filePath, data) {
  // Keep cache in sync so the next read is instant
  memCache.set(filePath, data);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(prefix) {
  return (
    prefix +
    '_' +
    Date.now().toString(36) +
    '_' +
    Math.floor(Math.random() * 10000).toString(36)
  );
}

// --- Helpers for misc items ---

async function getMiscItems() {
  const data = (await readJson(miscFile)) ?? [];
  // Support both shapes: [] or { items: [] } just in case
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

async function saveMiscItems(items) {
  // Store as a plain array for consistency with mains/sides
  await writeJson(miscFile, items);
}

// --- Helpers for plan migration (from old shape) ---

async function normalizePlanShape() {
  const plan = (await readJson(planFile)) || {};
  if (Array.isArray(plan.entries)) {
    return plan;
  }
  // Old shape: { meals: [mealId, ...] }
  if (Array.isArray(plan.meals)) {
    const entries = plan.meals.map(mealId => ({
      id: generateId('entry'),
      mainId: mealId,
      sideIds: []
    }));
    const normalized = {
      entries,
      migratedFromMeals: true,
      updatedAt: new Date().toISOString()
    };
    await writeJson(planFile, normalized);
    return normalized;
  }
  const empty = { entries: [], createdAt: new Date().toISOString() };
  await writeJson(planFile, empty);
  return empty;
}

// --- CRUD for mains & sides (same shape, different files) ---

function createCrudRoutes({ basePath, file, idPrefix }) {
  app.get(`/api/${basePath}`, async (req, res) => {
    try {
      const items = (await readJson(file)) || [];
      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to load ${basePath}` });
    }
  });

  app.post(`/api/${basePath}`, async (req, res) => {
    try {
      const { name, category, tags, ingredients, notes, recipeUrl } = req.body || {};
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Name is required' });
      }
      const items = (await readJson(file)) || [];
      const newItem = {
        id: generateId(idPrefix),
        name: name.trim(),
        category: category || '',
        tags: Array.isArray(tags) ? tags : [],
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        notes: notes || '',
        recipeUrl: recipeUrl || '',
      };
      items.push(newItem);
      await writeJson(file, items);
      res.status(201).json(newItem);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to create in ${basePath}` });
    }
  });

  app.put(`/api/${basePath}/:id`, async (req, res) => {
    try {
      const id = req.params.id;
      const items = (await readJson(file)) || [];
      const index = items.findIndex(m => m.id === id);
      if (index === -1) {
        return res.status(404).json({ message: 'Item not found' });
      }
      const existing = items[index];
      const { name, category, tags, ingredients, notes, recipeUrl } = req.body || {};
      const updated = {
        ...existing,
        name: name !== undefined ? name : existing.name,
        category: category !== undefined ? category : existing.category,
        tags: tags !== undefined ? tags : existing.tags,
        ingredients: ingredients !== undefined ? ingredients : existing.ingredients,
        notes: notes !== undefined ? notes : existing.notes,
        recipeUrl: recipeUrl !== undefined ? recipeUrl : (existing.recipeUrl || ''),
      };
      items[index] = updated;
      await writeJson(file, items);
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to update in ${basePath}` });
    }
  });

  app.delete(`/api/${basePath}/:id`, async (req, res) => {
    try {
      const id = req.params.id;
      const items = (await readJson(file)) || [];
      const filtered = items.filter(m => m.id !== id);
      if (filtered.length === items.length) {
        return res.status(404).json({ message: 'Item not found' });
      }
      await writeJson(file, filtered);

      // Also remove from current plan if present (for mains & sides accordingly)
      const plan = await normalizePlanShape();
      const updatedEntries = (plan.entries || [])
        .map(entry => ({
          ...entry,
          mainId: basePath === 'mains' && entry.mainId === id ? null : entry.mainId,
          sideIds:
            basePath === 'sides'
              ? (entry.sideIds || []).filter(sid => sid !== id)
              : (entry.sideIds || [])
        }))
        .filter(entry => entry.mainId); // drop entries without a main

      if (updatedEntries.length !== (plan.entries || []).length) {
        const updatedPlan = {
          ...plan,
          entries: updatedEntries,
          updatedAt: new Date().toISOString()
        };
        await writeJson(planFile, updatedPlan);
      }

      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to delete from ${basePath}` });
    }
  });
}

createCrudRoutes({ basePath: 'mains', file: mainsFile, idPrefix: 'main' });
createCrudRoutes({ basePath: 'sides', file: sidesFile, idPrefix: 'side' });

// --- Misc items inventory routes (shared "other items") ---

app.get('/api/misc-items', async (req, res) => {
  try {
    const items = await getMiscItems();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load misc items' });
  }
});

app.post('/api/misc-items', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Name is required' });
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const items = await getMiscItems();

    // prevent exact duplicate names (case-insensitive)
    const existing = items.find(
      item => item.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      return res.status(200).json(existing);
    }

    const newItem = {
      id: generateId('misc'),
      name: trimmed,
      createdAt: new Date().toISOString()
    };

    const next = [...items, newItem];
    await saveMiscItems(next);

    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create misc item' });
  }
});

app.delete('/api/misc-items/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const items = await getMiscItems();
    const filtered = items.filter(item => item.id !== id);

    if (filtered.length === items.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await saveMiscItems(filtered);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete misc item' });
  }
});

// --- Plan routes ---

app.get('/api/plan', async (req, res) => {
  try {
    const plan = await normalizePlanShape();
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load plan' });
  }
});

app.put('/api/plan', async (req, res) => {
  try {
    const { entries } = req.body || {};
    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: 'entries must be an array' });
    }
    const normalized = entries
      .map(entry => ({
        id: entry.id || generateId('entry'),
        mainId: entry.mainId,
        sideIds: Array.isArray(entry.sideIds) ? entry.sideIds : []
      }))
      .filter(entry => entry.mainId);
    const plan = {
      entries: normalized,
      updatedAt: new Date().toISOString()
    };
    await writeJson(planFile, plan);
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save plan' });
  }
});

// --- Grocery list from mains & sides in plan ---

app.post('/api/grocery-list', async (req, res) => {
  try {
    let entries = req.body?.entries;

    if (!Array.isArray(entries)) {
      const plan = await normalizePlanShape();
      entries = plan.entries || [];
    }

    const [mains, sides] = await Promise.all([
      readJson(mainsFile).then(v => v || []),
      readJson(sidesFile).then(v => v || [])
    ]);

    const mainMap = new Map(mains.map(m => [m.id, m]));
    const sideMap = new Map(sides.map(s => [s.id, s]));

    const itemsMap = new Map();

    for (const entry of entries) {
      const main = mainMap.get(entry.mainId);
      const sideObjs = (entry.sideIds || [])
        .map(id => sideMap.get(id))
        .filter(Boolean);

      const allDishes = [
        ...(main ? [{ dish: main, labelSuffix: '' }] : []),
        ...sideObjs.map(side => ({ dish: side, labelSuffix: ' (side)' }))
      ];

      for (const { dish, labelSuffix } of allDishes) {
        const dishName = dish.name + labelSuffix;
        for (const ing of dish.ingredients || []) {
          const name = (ing.name || '').trim();
          if (!name) continue;
          const unit = (ing.unit || '').trim();
          const key = name.toLowerCase() + '||' + unit.toLowerCase();

          const existing = itemsMap.get(key);
          const quantity = ing.quantity || '';
          const category = ing.category || '';

          if (!existing) {
            itemsMap.set(key, {
              name,
              unit,
              category,
              quantityText: quantity,
              fromMeals: [dishName]
            });
          } else {
            const newQuantityText = [existing.quantityText, quantity]
              .filter(Boolean)
              .join(' + ');
            existing.quantityText = newQuantityText;
            existing.fromMeals.push(dishName);
          }
        }
      }
    }

    const items = Array.from(itemsMap.values()).sort((a, b) => {
      const catA = (a.category || '').toLowerCase();
      const catB = (b.category || '').toLowerCase();
      if (catA < catB) return -1;
      if (catA > catB) return 1;
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to build grocery list' });
  }
});

app.put('/api/misc-items/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Name is required' });
    }

    const items = await getMiscItems();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const updated = {
      ...items[index],
      name: name.trim(),
    };

    items[index] = updated;
    await saveMiscItems(items);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update misc item' });
  }
});


// --- Saved weekly plan snapshots ---

app.get('/api/saved-plans', async (req, res) => {
  try {
    const plans = (await readJson(savedPlansFile)) || [];
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load saved plans' });
  }
});

app.post('/api/saved-plans', async (req, res) => {
  try {
    const { name, entries } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'Plan must have at least one entry' });
    }
    const plans = (await readJson(savedPlansFile)) || [];
    const newPlan = {
      id: generateId('plan'),
      name: name.trim(),
      savedAt: new Date().toISOString(),
      entries,
    };
    plans.unshift(newPlan);
    await writeJson(savedPlansFile, plans);
    res.status(201).json(newPlan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save plan' });
  }
});

app.delete('/api/saved-plans/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const plans = (await readJson(savedPlansFile)) || [];
    const filtered = plans.filter(p => p.id !== id);
    if (filtered.length === plans.length) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    await writeJson(savedPlansFile, filtered);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete plan' });
  }
});

// --- Startup ---

ensureDataFiles()
  .then(async () => {
    // Pre-warm the in-memory cache for the large list files so the first
    // request is served from RAM rather than triggering a cold disk read.
    await Promise.all([
      readJson(mainsFile).catch(() => null),
      readJson(sidesFile).catch(() => null),
    ]);
    console.log('✅ Data cache warmed (mains + sides loaded into memory)');

    app.listen(PORT, () => {
      console.log(`Meal planner API listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize data files', err);
    process.exit(1);
  });

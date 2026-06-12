import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import './passport.js';
import passport from 'passport';
import authRouter from './routes/auth.js';

import User from './models/User.js';
import Dish from './models/Dish.js';
import DishSave from './models/DishSave.js';
import DishRating from './models/DishRating.js';
import Plan from './models/Plan.js';
import SavedPlan from './models/SavedPlan.js';
import MiscItem from './models/MiscItem.js';
import PantryItem from './models/PantryItem.js';
import SharedWeek from './models/SharedWeek.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

// Trust Heroku's reverse proxy so req.protocol is 'https' and OAuth callback URLs are correct
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'simmer-dev-secret',
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Sign in required' });
}

/** Returns true if the signed-in user is the designated admin. */
function isAdminUser(req) {
  const adminEmail = process.env.ADMIN_EMAIL;
  return !!(adminEmail && req.isAuthenticated() && req.user?.email === adminEmail);
}

/**
 * Server-authoritative edit permission.
 * ownerIdField: the raw ObjectId from the lean document (ownerId or userId).
 * Returns true only if the requester is admin, or owns the item.
 */
function canEditItem(ownerIdField, req) {
  if (!req.isAuthenticated()) return false;
  if (isAdminUser(req)) return true;
  if (!ownerIdField) return false;
  return ownerIdField.equals(req.user._id);
}

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 10000).toString(36)}`;
}

// ---------------------------------------------------------------------------
// Auth routes (/auth/google, /auth/google/callback, /auth/logout)
// ---------------------------------------------------------------------------

app.use('/auth', authRouter);

// Current user — used by the client on every load
app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    const { _id, name, email, avatar } = req.user;
    res.json({ user: { id: _id, name, email, avatar, isAdmin: isAdminUser(req) } });
  } else {
    res.json({ user: null });
  }
});

// ---------------------------------------------------------------------------
// Dishes — mains & sides (shared factory)
// ---------------------------------------------------------------------------

function createDishRoutes(type) {
  const base = type === 'main' ? 'mains' : 'sides';

  // GET — public: admin sees all; everyone else sees library (isShared:true) + all community
  //        dishes (ownerId set, regardless of isShared — catches legacy isShared:false records)
  app.get(`/api/${base}`, async (req, res) => {
    try {
      let query;
      if (isAdminUser(req)) {
        query = { type };
      } else {
        query = { type, $or: [{ isShared: true }, { ownerId: { $ne: null } }] };
      }
      const dishes = await Dish.find(query).lean();
      // Annotate savedByMe + myRating for authenticated users
      const savedIds  = new Set();
      const ratingMap = new Map();
      if (req.isAuthenticated()) {
        const [saves, ratings] = await Promise.all([
          DishSave.find({ userId: req.user._id }).lean(),
          DishRating.find({ userId: req.user._id }).lean(),
        ]);
        saves.forEach(s => savedIds.add(s.dishId));
        ratings.forEach(r => ratingMap.set(r.dishId, r.rating));
      }
      res.json(dishes.map(d => ({
        ...normaliseId(d),
        canEdit:   canEditItem(d.ownerId, req),
        savedByMe: savedIds.has(d._id.toString()),
        myRating:  ratingMap.get(d._id.toString()) || null,
      })));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to load ${base}` });
    }
  });

  // POST — auth required
  app.post(`/api/${base}`, requireAuth, async (req, res) => {
    try {
      const { name, category, tags, ingredients, notes, recipeUrl } = req.body || {};
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Name is required' });
      }
      const dish = await Dish.create({
        type,
        name: name.trim(),
        category: category || '',
        tags: Array.isArray(tags) ? tags : [],
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        notes: notes || '',
        recipeUrl: recipeUrl || '',
        isShared: true,   // community dishes are visible to all users
        ownerId: req.user._id,
      });
      const obj = dish.toObject();
      res.status(201).json({ ...normaliseId(obj), canEdit: canEditItem(obj.ownerId, req) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to create ${base}` });
    }
  });

  // PUT — auth required; admin can edit any dish, others must own it
  app.put(`/api/${base}/:id`, requireAuth, async (req, res) => {
    try {
      const dish = await Dish.findById(req.params.id);
      if (!dish) return res.status(404).json({ message: 'Not found' });
      if (!isAdminUser(req) && (!dish.ownerId || !dish.ownerId.equals(req.user._id))) {
        return res.status(403).json({ message: 'Cannot edit a shared dish' });
      }
      const { name, category, tags, ingredients, notes, recipeUrl } = req.body || {};
      if (name !== undefined) dish.name = name;
      if (category !== undefined) dish.category = category;
      if (tags !== undefined) dish.tags = tags;
      if (ingredients !== undefined) dish.ingredients = ingredients;
      if (notes !== undefined) dish.notes = notes;
      if (recipeUrl !== undefined) dish.recipeUrl = recipeUrl;
      await dish.save();
      const saved = dish.toObject();
      res.json({ ...normaliseId(saved), canEdit: canEditItem(saved.ownerId, req) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to update ${base}` });
    }
  });

  // POST /api/:base/:id/save — toggle save for the authenticated user
  app.post(`/api/${base}/:id/save`, requireAuth, async (req, res) => {
    try {
      const dishId = req.params.id;
      const userId = req.user._id;
      const existing = await DishSave.findOne({ userId, dishId });
      if (existing) {
        // Unsave
        await existing.deleteOne();
        await Dish.findByIdAndUpdate(dishId, { $inc: { saveCount: -1 } });
        return res.json({ savedByMe: false });
      } else {
        // Save
        await DishSave.create({ userId, dishId });
        await Dish.findByIdAndUpdate(dishId, { $inc: { saveCount: 1 } });
        return res.json({ savedByMe: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to toggle save' });
    }
  });

  // POST /api/:base/:id/rate — upsert the authenticated user's personal 1–5 star rating
  app.post(`/api/${base}/:id/rate`, requireAuth, async (req, res) => {
    try {
      const rating = parseInt(req.body?.rating);
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'rating must be 1–5' });
      }
      await DishRating.findOneAndUpdate(
        { userId: req.user._id, dishId: req.params.id },
        { rating, ratedAt: new Date() },
        { upsert: true },
      );
      res.json({ myRating: rating });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to save rating' });
    }
  });

  // POST /api/:base/:id/submit-community — owner submits their private dish to community
  app.post(`/api/${base}/:id/submit-community`, requireAuth, async (req, res) => {
    try {
      const dish = await Dish.findById(req.params.id);
      if (!dish) return res.status(404).json({ message: 'Not found' });
      // Only the owner (or admin) can submit
      if (!isAdminUser(req) && (!dish.ownerId || !dish.ownerId.equals(req.user._id))) {
        return res.status(403).json({ message: 'Not your dish' });
      }
      dish.isShared = true;
      await dish.save();
      const obj = dish.toObject();
      res.json({ ...normaliseId(obj), canEdit: canEditItem(obj.ownerId, req), savedByMe: false });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to submit dish' });
    }
  });

  // DELETE — auth required; admin can delete any dish, others must own it
  app.delete(`/api/${base}/:id`, requireAuth, async (req, res) => {
    try {
      const dish = await Dish.findById(req.params.id);
      if (!dish) return res.status(404).json({ message: 'Not found' });
      if (!isAdminUser(req) && (!dish.ownerId || !dish.ownerId.equals(req.user._id))) {
        return res.status(403).json({ message: 'Cannot delete a shared dish' });
      }
      await dish.deleteOne();

      // Remove from ALL of the user's weekly plans
      if (type === 'main') {
        await Plan.updateMany(
          { userId: req.user._id, 'entries.mainId': req.params.id },
          { $pull: { entries: { mainId: req.params.id } }, $set: { updatedAt: new Date() } }
        );
      } else {
        await Plan.updateMany(
          { userId: req.user._id },
          { $pull: { 'entries.$[].sideIds': req.params.id }, $set: { updatedAt: new Date() } }
        );
      }

      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to delete from ${base}` });
    }
  });
}

createDishRoutes('main');
createDishRoutes('side');

// ---------------------------------------------------------------------------
// Recipe import from URL (scrapes JSON-LD schema.org/Recipe)
// ---------------------------------------------------------------------------

app.post('/api/dishes/import-url', async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'url is required' });
  }
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Simmer/1.0; +https://simmer.app)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const blocked = response.status === 403 || response.status === 429;
      const msg = blocked
        ? `${response.status}: This site blocks automated imports (AllRecipes, BBC Good Food, and other large sites do this). Try a food blog URL instead — or use the "Paste ingredients" option below.`
        : `Site returned ${response.status}. Try a different URL or use the "Paste ingredients" option below.`;
      return res.status(422).json({ message: msg, blocked });
    }
    const html = await response.text();

    // Extract JSON-LD blocks
    const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let recipe = null;

    const isRecipeType = (type) => {
      const types = Array.isArray(type) ? type : [type];
      return types.some(t => t === 'Recipe' || (typeof t === 'string' && t.endsWith('/Recipe')));
    };

    while ((match = scriptRe.exec(html)) !== null && !recipe) {
      try {
        const data = JSON.parse(match[1]);
        const candidates = Array.isArray(data) ? data : [data];
        for (const item of candidates) {
          if (isRecipeType(item['@type'])) { recipe = item; break; }
          // Nested in @graph
          if (Array.isArray(item['@graph'])) {
            const g = item['@graph'].find(n => isRecipeType(n['@type']));
            if (g) { recipe = g; break; }
          }
        }
      } catch { /* skip invalid JSON blocks */ }
    }

    if (!recipe) {
      return res.status(422).json({
        message: 'No structured recipe data found on that page. The site may not support automatic import — try adding the dish manually.',
      });
    }

    const rawIngredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [];
    const ingredients = rawIngredients
      .map(s => parseIngredientString(String(s || '')))
      .filter(i => i.name);

    // recipeYield can be a string like "4 servings", a number, or an array
    let yieldServings = 4;
    if (recipe.recipeYield) {
      const yStr = Array.isArray(recipe.recipeYield) ? recipe.recipeYield[0] : recipe.recipeYield;
      const yNum = parseInt(String(yStr));
      if (!isNaN(yNum) && yNum > 0) yieldServings = yNum;
    }

    res.json({
      name:        recipe.name        || '',
      notes:       recipe.description || '',
      recipeUrl:   url,
      servings:    yieldServings,
      ingredients,
    });
  } catch (err) {
    console.error('import-url error:', err.message);
    if (err.name === 'TimeoutError') {
      return res.status(408).json({ message: 'Request timed out. The site is too slow or blocked the request.' });
    }
    res.status(500).json({ message: 'Could not fetch that URL. The site may block scraping — try adding the dish manually.' });
  }
});

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

// Returns the UTC Monday of the week containing dateInput
function getMonday(dateInput) {
  const d = new Date(dateInput || Date.now());
  const day = d.getUTCDay(); // 0 = Sunday
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

app.get('/api/plan', requireAuth, async (req, res) => {
  try {
    const weekMonday = getMonday(req.query.week);
    // Try exact week first
    let plan = await Plan.findOne({ userId: req.user._id, weekStart: weekMonday }).lean();
    // Legacy fallback: plan with no weekStart treated as current-ish plan
    if (!plan) {
      plan = await Plan.findOne({ userId: req.user._id, weekStart: null }).lean();
    }
    res.json(plan ? { entries: plan.entries } : { entries: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load plan' });
  }
});

app.put('/api/plan', requireAuth, async (req, res) => {
  try {
    const { entries, weekStart: weekStartStr } = req.body || {};
    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: 'entries must be an array' });
    }
    const weekMonday = getMonday(weekStartStr);
    const normalised = entries
      .map(e => {
        if (e.type === 'out') {
          return {
            id:      e.id || generateId('entry'),
            type:    'out',
            label:   e.label || 'Eating out',
            mainId:  null,
            sideIds: [],
            servings: 4,
          };
        }
        return {
          id:       e.id || generateId('entry'),
          mainId:   e.mainId,
          sideIds:  Array.isArray(e.sideIds) ? e.sideIds : [],
          servings: (typeof e.servings === 'number' && e.servings > 0) ? Math.round(e.servings) : 4,
          note:     typeof e.note === 'string' ? e.note : '',
        };
      })
      .filter(e => e.type === 'out' || e.mainId);

    const update = { $set: { entries: normalised, weekStart: weekMonday, updatedAt: new Date() } };

    // 1. Update by exact weekStart
    let plan = await Plan.findOneAndUpdate(
      { userId: req.user._id, weekStart: weekMonday },
      update,
      { new: true }
    );
    // 2. Claim legacy null plan (first save after deploy)
    if (!plan) {
      plan = await Plan.findOneAndUpdate(
        { userId: req.user._id, weekStart: null },
        update,
        { new: true }
      );
    }
    // 3. Create fresh week plan
    if (!plan) {
      plan = await Plan.create({
        userId: req.user._id,
        weekStart: weekMonday,
        entries: normalised,
        updatedAt: new Date(),
      });
    }
    res.json({ entries: plan.entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save plan' });
  }
});

// ---------------------------------------------------------------------------
// Grocery list — no auth required (works for guests with in-body entries)
// ---------------------------------------------------------------------------

app.post('/api/grocery-list', async (req, res) => {
  try {
    let entries = req.body?.entries;

    // If authenticated and no body entries, load from their saved plan
    if (!Array.isArray(entries) && req.isAuthenticated()) {
      const plan = await Plan.findOne({ userId: req.user._id }).lean();
      entries = plan?.entries || [];
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.json({ items: [] });
    }

    // Gather all dish IDs referenced
    const mainIds = entries.map(e => e.mainId).filter(Boolean);
    const sideIds = entries.flatMap(e => e.sideIds || []).filter(Boolean);
    const allIds  = [...new Set([...mainIds, ...sideIds])];

    // Fetch matching dishes (shared or user-owned)
    const dishQuery = { _id: { $in: allIds } };
    const dishes    = await Dish.find(dishQuery).lean();
    const dishMap   = new Map(dishes.map(d => [d._id.toString(), d]));

    const itemsMap = new Map();

    for (const entry of entries) {
      const main = dishMap.get(entry.mainId);
      const sideObjs = (entry.sideIds || [])
        .map(id => dishMap.get(id))
        .filter(Boolean);

      // servings defaults to 4; scale factor relative to that baseline
      const servingsMultiplier = ((entry.servings || 4) / 4);

      const allDishes = [
        ...(main ? [{ dish: main, labelSuffix: '' }] : []),
        ...sideObjs.map(s => ({ dish: s, labelSuffix: ' (side)' })),
      ];

      for (const { dish, labelSuffix } of allDishes) {
        const dishName = dish.name + labelSuffix;
        for (const ing of dish.ingredients || []) {
          const name = (ing.name || '').trim();
          if (!name) continue;
          const unit = (ing.unit || '').trim();
          const key  = name.toLowerCase() + '||' + unit.toLowerCase();

          const existing  = itemsMap.get(key);
          const rawQty    = ing.quantity || '';
          const quantity  = servingsMultiplier !== 1 ? scaleQuantity(rawQty, servingsMultiplier) : rawQty;
          const category  = ing.category || '';

          if (!existing) {
            itemsMap.set(key, { name, unit, category, quantityText: quantity, fromMeals: [dishName] });
          } else {
            existing.quantityText = addQuantityText(existing.quantityText, quantity);
            existing.fromMeals.push(dishName);
          }
        }
      }
    }

    const items = Array.from(itemsMap.values()).sort((a, b) => {
      const ca = (a.category || '').toLowerCase();
      const cb = (b.category || '').toLowerCase();
      if (ca < cb) return -1;
      if (ca > cb) return 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to build grocery list' });
  }
});

// ---------------------------------------------------------------------------
// Multi-week plans (month view) — auth required
// ---------------------------------------------------------------------------

app.get('/api/plans/month', requireAuth, async (req, res) => {
  try {
    const startMonday = getMonday(req.query.start);
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(startMonday);
      d.setUTCDate(d.getUTCDate() + i * 7);
      weeks.push(d);
    }
    const plans = await Plan.find({
      userId: req.user._id,
      weekStart: { $in: weeks },
    }).lean();
    const byWeek = {};
    plans.forEach(p => {
      byWeek[p.weekStart.toISOString().slice(0, 10)] = p.entries || [];
    });
    // Return all 4 weeks (empty array if no plan yet)
    const result = {};
    weeks.forEach(w => {
      const key = w.toISOString().slice(0, 10);
      result[key] = byWeek[key] || [];
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load month plans' });
  }
});

// ---------------------------------------------------------------------------
// Pantry — user's "always have it" ingredient list
// ---------------------------------------------------------------------------

app.get('/api/pantry', async (req, res) => {
  if (!req.isAuthenticated()) return res.json([]);
  try {
    const items = await PantryItem.find({ userId: req.user._id }).sort({ name: 1 }).lean();
    res.json(items.map(normaliseId));
  } catch (err) {
    res.status(500).json({ message: 'Failed to load pantry' });
  }
});

// POST body: { name } or { names: ['salt','pepper',...] }
app.post('/api/pantry', requireAuth, async (req, res) => {
  try {
    const rawNames = req.body?.names ?? (req.body?.name ? [req.body.name] : []);
    const names = rawNames.map(n => String(n).trim()).filter(Boolean);
    if (!names.length) return res.status(400).json({ message: 'name(s) required' });

    const results = [];
    for (const name of names) {
      const item = await PantryItem.findOneAndUpdate(
        { userId: req.user._id, name },
        { userId: req.user._id, name },
        { upsert: true, new: true },
      );
      results.push(normaliseId(item.toObject()));
    }
    res.status(201).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update pantry' });
  }
});

app.delete('/api/pantry/:id', requireAuth, async (req, res) => {
  try {
    await PantryItem.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove pantry item' });
  }
});

// ---------------------------------------------------------------------------
// Marketplace — public shared weeks
// ---------------------------------------------------------------------------

// GET /api/marketplace?sort=recent|popular&q=...   browse (public)
app.get('/api/marketplace', async (req, res) => {
  try {
    const sort  = req.query.sort === 'popular' ? { cloneCount: -1, createdAt: -1 } : { createdAt: -1 };
    const q     = req.query.q?.trim();
    const filter = q ? { 'entries.mainName': { $regex: q, $options: 'i' } } : {};
    const weeks = await SharedWeek.find(filter).sort(sort).limit(60).lean();
    res.json(weeks.map(normaliseId));
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to load marketplace' }); }
});

// GET /api/marketplace/mine   user's own shared weeks
app.get('/api/marketplace/mine', requireAuth, async (req, res) => {
  try {
    const weeks = await SharedWeek.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(weeks.map(normaliseId));
  } catch (err) { res.status(500).json({ message: 'Failed to load your shares' }); }
});

// POST /api/marketplace   share current week
app.post('/api/marketplace', requireAuth, async (req, res) => {
  const { weekLabel, weekStart, entries } = req.body || {};
  if (!Array.isArray(entries) || !entries.length)
    return res.status(400).json({ message: 'entries required' });

  try {
    // Denormalise dish names from DB so cards survive future dish deletions
    const mainIds = [...new Set(entries.map(e => e.mainId).filter(Boolean))];
    const sideIds = [...new Set(entries.flatMap(e => e.sideIds || []).filter(Boolean))];
    const [mainsData, sidesData] = await Promise.all([
      Dish.find({ _id: { $in: mainIds } }).lean(),
      Dish.find({ _id: { $in: sideIds } }).lean(),
    ]);
    const mainMap = new Map(mainsData.map(d => [d._id.toString(), d.name]));
    const sideMap = new Map(sidesData.map(d => [d._id.toString(), d.name]));

    const denorm = entries
      .filter(e => mainMap.has(e.mainId))
      .map((e, i) => ({
        day:       i,
        mainId:    e.mainId,
        mainName:  mainMap.get(e.mainId),
        sideIds:   e.sideIds || [],
        sideNames: (e.sideIds || []).map(id => sideMap.get(id)).filter(Boolean),
      }));

    if (!denorm.length) return res.status(400).json({ message: 'No valid dishes found' });

    const weekMonday = weekStart ? new Date(weekStart) : null;

    // Upsert: if this user already shared this exact week, update it instead of
    // creating a duplicate.  Fall back to a plain insert when weekStart is absent.
    let doc;
    let wasUpdated = false;
    if (weekMonday) {
      const existing = await SharedWeek.findOne({ userId: req.user._id, weekStart: weekMonday }).lean();
      wasUpdated = !!existing;
      doc = await SharedWeek.findOneAndUpdate(
        { userId: req.user._id, weekStart: weekMonday },
        { $set: {
            userName:   req.user.name   || 'Anonymous',
            userAvatar: req.user.avatar || '',
            weekLabel:  weekLabel || '',
            entries:    denorm,
          },
          $setOnInsert: { cloneCount: 0, createdAt: new Date() },
        },
        { upsert: true, new: true },
      );
    } else {
      doc = await SharedWeek.create({
        userId:     req.user._id,
        userName:   req.user.name   || 'Anonymous',
        userAvatar: req.user.avatar || '',
        weekStart:  null,
        weekLabel:  weekLabel || '',
        entries:    denorm,
      });
    }

    const status = wasUpdated ? 200 : 201;
    res.status(status).json({ ...normaliseId(doc.toObject()), wasUpdated });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Failed to share week' }); }
});

// DELETE /api/marketplace/:id   unshare
app.delete('/api/marketplace/:id', requireAuth, async (req, res) => {
  try {
    await SharedWeek.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.status(204).send();
  } catch (err) { res.status(500).json({ message: 'Failed to remove' }); }
});

// POST /api/marketplace/:id/clone   increment count + return entries
app.post('/api/marketplace/:id/clone', async (req, res) => {
  try {
    const week = await SharedWeek.findByIdAndUpdate(
      req.params.id,
      { $inc: { cloneCount: 1 } },
      { new: true },
    ).lean();
    if (!week) return res.status(404).json({ message: 'Not found' });
    res.json({ entries: week.entries });
  } catch (err) { res.status(500).json({ message: 'Failed to clone' }); }
});

// ---------------------------------------------------------------------------
// Misc Items — auth required, scoped to user
// ---------------------------------------------------------------------------

app.get('/api/misc-items', async (req, res) => {
  try {
    let query;
    if (isAdminUser(req)) {
      query = {};
    } else {
      query = { $or: [{ isShared: true }, { userId: { $ne: null } }] };
    }
    const items = await MiscItem.find(query).sort({ name: 1 }).lean();
    res.json(items.map(d => ({ ...normaliseId(d), canEdit: canEditItem(d.userId, req) })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to load misc items' });
  }
});

app.post('/api/misc-items', requireAuth, async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    const trimmed = name.trim();

    // Case-insensitive duplicate check across shared + user's own items
    const existing = await MiscItem.findOne({
      $or: [{ isShared: true }, { userId: req.user._id }],
      name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
    });
    if (existing) {
      const e = existing.toObject();
      return res.status(200).json({ ...normaliseId(e), canEdit: canEditItem(e.userId, req) });
    }

    const item = await MiscItem.create({ userId: req.user._id, name: trimmed, isShared: true });
    const created = item.toObject();
    res.status(201).json({ ...normaliseId(created), canEdit: canEditItem(created.userId, req) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create misc item' });
  }
});

app.put('/api/misc-items/:id', requireAuth, async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

    const admin = isAdminUser(req);
    // Admin: can edit any item, name only (keeps isShared/userId intact)
    // Regular user: can only edit items they own (userId matches)
    const filter = admin
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };

    const item = await MiscItem.findOneAndUpdate(filter, { name: name.trim() }, { new: true });
    if (!item) return res.status(admin ? 404 : 403).json({ message: admin ? 'Not found' : 'Cannot edit this item' });
    const updated = item.toObject();
    res.json({ ...normaliseId(updated), canEdit: canEditItem(updated.userId, req) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update misc item' });
  }
});

app.delete('/api/misc-items/:id', requireAuth, async (req, res) => {
  try {
    const admin = isAdminUser(req);
    // Admin: can delete any item; regular user: can only delete items they own
    const filter = admin
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };

    const result = await MiscItem.deleteOne(filter);
    if (result.deletedCount === 0) return res.status(admin ? 404 : 403).json({ message: admin ? 'Not found' : 'Cannot delete this item' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete misc item' });
  }
});

// ---------------------------------------------------------------------------
// Saved Plans — auth required, scoped to user
// ---------------------------------------------------------------------------

app.get('/api/saved-plans', requireAuth, async (req, res) => {
  try {
    const plans = await SavedPlan.find({ userId: req.user._id }).sort({ savedAt: -1 }).lean();
    res.json(plans.map(normaliseId));
  } catch (err) {
    res.status(500).json({ message: 'Failed to load saved plans' });
  }
});

app.post('/api/saved-plans', requireAuth, async (req, res) => {
  try {
    const { name, entries } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'Plan must have at least one entry' });
    }
    const plan = await SavedPlan.create({
      userId: req.user._id,
      name: name.trim(),
      entries,
    });
    res.status(201).json(normaliseId(plan.toObject()));
  } catch (err) {
    res.status(500).json({ message: 'Failed to save plan' });
  }
});

app.delete('/api/saved-plans/:id', requireAuth, async (req, res) => {
  try {
    const result = await SavedPlan.deleteOne({ _id: req.params.id, userId: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete plan' });
  }
});

// ---------------------------------------------------------------------------
// Admin — user management  (admin-only, gated by ADMIN_EMAIL env var)
// ---------------------------------------------------------------------------

function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Sign in required' });
  if (!isAdminUser(req))      return res.status(403).json({ message: 'Admin access required' });
  next();
}

// GET /api/admin/users — list all users with summary stats
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().lean().sort({ createdAt: -1 });

    // Enrich with counts in parallel
    const enriched = await Promise.all(users.map(async (u) => {
      const [planCount, savedPlanCount, dishCount] = await Promise.all([
        Plan.countDocuments({ userId: u._id }),
        SavedPlan.countDocuments({ userId: u._id }),
        Dish.countDocuments({ ownerId: u._id, isShared: false }),
      ]);
      return {
        id:            u._id,
        name:          u.name,
        email:         u.email,
        avatar:        u.avatar,
        createdAt:     u.createdAt,
        planCount,
        savedPlanCount,
        dishCount,
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id — delete user + all their data
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Delete all user data in parallel
    await Promise.all([
      User.deleteOne({ _id: id }),
      Plan.deleteMany({ userId: id }),
      SavedPlan.deleteMany({ userId: id }),
      MiscItem.deleteMany({ userId: id }),
      PantryItem.deleteMany({ userId: id }),
      Dish.deleteMany({ ownerId: id, isShared: false }),
      DishRating.deleteMany({ userId: id }),
      DishSave.deleteMany({ userId: id }),
      SharedWeek.deleteMany({ userId: id }),
    ]);

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/stats — high-level numbers
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [userCount, planCount, dishCount, sharedWeekCount] = await Promise.all([
      User.countDocuments(),
      Plan.countDocuments(),
      Dish.countDocuments({ isShared: false }),
      SharedWeek.countDocuments(),
    ]);
    res.json({ userCount, planCount, dishCount, sharedWeekCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Production — serve built React app
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  // Any non-API route serves index.html (React handles routing)
  app.get(/^(?!\/api|\/auth).*$/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a quantity string (e.g. "1", "1/2", "1 1/2", "0.75") to a float.
 * Returns null when the string cannot be interpreted as a number.
 */
function parseQty(str) {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;
  // Mixed number: "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  // Simple fraction: "3/4"
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  // Decimal or integer
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Format a float back to a clean quantity string.
 * Tries to express common fractions (1/4, 1/3, 1/2, 2/3, 3/4) when near.
 */
function formatQty(n) {
  if (n % 1 === 0) return String(Math.round(n));
  const whole = Math.floor(n);
  const rem   = n - whole;
  const fracs = [[0.25,'1/4'],[0.333,'1/3'],[0.5,'1/2'],[0.667,'2/3'],[0.75,'3/4']];
  for (const [val, str] of fracs) {
    if (Math.abs(rem - val) < 0.04) {
      return whole > 0 ? `${whole} ${str}` : str;
    }
  }
  return parseFloat(n.toFixed(2)).toString();
}

/**
 * Scale a quantity string by a multiplier. Falls back to original string if
 * the quantity cannot be parsed numerically.
 */
function scaleQuantity(qtyStr, factor) {
  if (!qtyStr || factor === 1) return qtyStr;
  const n = parseQty(qtyStr);
  return n !== null ? formatQty(n * factor) : qtyStr;
}

/**
 * Combine two quantity strings with real addition.
 * e.g. addQuantityText("1/2", "1") → "1 1/2"
 * Falls back to "a + b" when either value is non-numeric.
 */
function addQuantityText(a, b) {
  const na = parseQty(a);
  const nb = parseQty(b);
  if (na !== null && nb !== null) return formatQty(na + nb);
  return [a, b].filter(Boolean).join(' + ');
}

/**
 * Parse a free-text ingredient string (from recipe JSON-LD) into
 * { name, quantity, unit }.
 * Handles common formats: "2 cups flour", "1 1/2 tsp salt", "3 large eggs"
 */
function parseIngredientString(str) {
  const s = String(str).trim();
  const UNITS = [
    'teaspoons?','tablespoons?','cups?','fluid ounces?','fl\\.? oz\\.?','pints?','quarts?','gallons?',
    'ounces?','oz\\.?','pounds?','lbs?\\.?','lb\\.?','grams?','g\\.?','kilograms?','kg\\.?',
    'milliliters?','ml\\.?','liters?','l\\.?',
    'cloves?','slices?','pieces?','cans?','bags?','bunches?','handful','handfuls','pinch','pinches',
    'sprigs?','stalks?','heads?','tsp\\.?','tbsp\\.?',
  ];
  const qtyRe = '(\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d*\\.\\d+|\\d+)';
  const unitRe = `(${UNITS.join('|')})`;
  const fullRe   = new RegExp(`^${qtyRe}\\s+${unitRe}[s]?[.\\s,]*(.+)$`, 'i');
  const qtyOnly  = new RegExp(`^${qtyRe}[.\\s,]*(.+)$`, 'i');

  let m = s.match(fullRe);
  if (m) return { quantity: m[1].trim(), unit: m[2].trim(), name: m[3].trim() };
  m = s.match(qtyOnly);
  if (m) return { quantity: m[1].trim(), unit: '', name: m[2].trim() };
  return { quantity: '', unit: '', name: s };
}

function normaliseId(doc) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  const out = { id: _id.toString(), ...rest };
  // Explicitly convert ObjectId reference fields to plain strings so the client
  // can do reliable === comparisons against user.id (also a plain string).
  if (out.ownerId != null) out.ownerId = out.ownerId.toString();
  if (out.userId  != null) out.userId  = out.userId.toString();
  return out;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    // One-time migration: drop the old single-field unique index on userId so
    // multiple plans per user (one per week) can coexist.
    try { await Plan.collection.dropIndex('userId_1'); console.log('ℹ️  Dropped legacy Plan.userId_1 index'); } catch {}
    app.listen(PORT, () => console.log(`🚀 Simmer API on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

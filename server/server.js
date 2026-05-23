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

import Dish from './models/Dish.js';
import Plan from './models/Plan.js';
import SavedPlan from './models/SavedPlan.js';
import MiscItem from './models/MiscItem.js';

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
// Auth helper
// ---------------------------------------------------------------------------

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Sign in required' });
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
    res.json({ user: { id: _id, name, email, avatar } });
  } else {
    res.json({ user: null });
  }
});

// ---------------------------------------------------------------------------
// Dishes — mains & sides (shared factory)
// ---------------------------------------------------------------------------

function createDishRoutes(type) {
  const base = type === 'main' ? 'mains' : 'sides';

  // GET — public: shared library + caller's own custom dishes
  app.get(`/api/${base}`, async (req, res) => {
    try {
      const query = { type, $or: [{ isShared: true }] };
      if (req.isAuthenticated()) query.$or.push({ ownerId: req.user._id });
      const dishes = await Dish.find(query).lean();
      // Normalise _id → id for the client
      res.json(dishes.map(normaliseId));
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
        isShared: false,
        ownerId: req.user._id,
      });
      res.status(201).json(normaliseId(dish.toObject()));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to create ${base}` });
    }
  });

  // PUT — auth required, must own dish
  app.put(`/api/${base}/:id`, requireAuth, async (req, res) => {
    try {
      const dish = await Dish.findById(req.params.id);
      if (!dish) return res.status(404).json({ message: 'Not found' });
      if (!dish.ownerId || !dish.ownerId.equals(req.user._id)) {
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
      res.json(normaliseId(dish.toObject()));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: `Failed to update ${base}` });
    }
  });

  // DELETE — auth required, must own dish
  app.delete(`/api/${base}/:id`, requireAuth, async (req, res) => {
    try {
      const dish = await Dish.findById(req.params.id);
      if (!dish) return res.status(404).json({ message: 'Not found' });
      if (!dish.ownerId || !dish.ownerId.equals(req.user._id)) {
        return res.status(403).json({ message: 'Cannot delete a shared dish' });
      }
      await dish.deleteOne();

      // Remove from user's plan too
      const plan = await Plan.findOne({ userId: req.user._id });
      if (plan) {
        if (type === 'main') {
          plan.entries = plan.entries.filter(e => e.mainId !== req.params.id);
        } else {
          plan.entries = plan.entries.map(e => ({
            ...e.toObject(),
            sideIds: e.sideIds.filter(s => s !== req.params.id),
          }));
        }
        plan.updatedAt = new Date();
        await plan.save();
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
// Plan
// ---------------------------------------------------------------------------

app.get('/api/plan', requireAuth, async (req, res) => {
  try {
    const plan = await Plan.findOne({ userId: req.user._id }).lean();
    res.json(plan || { entries: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load plan' });
  }
});

app.put('/api/plan', requireAuth, async (req, res) => {
  try {
    const { entries } = req.body || {};
    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: 'entries must be an array' });
    }
    const normalised = entries
      .map(e => ({
        id:      e.id || generateId('entry'),
        mainId:  e.mainId,
        sideIds: Array.isArray(e.sideIds) ? e.sideIds : [],
      }))
      .filter(e => e.mainId);

    const plan = await Plan.findOneAndUpdate(
      { userId: req.user._id },
      { entries: normalised, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(plan.toObject());
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
          const quantity  = ing.quantity || '';
          const category  = ing.category || '';

          if (!existing) {
            itemsMap.set(key, { name, unit, category, quantityText: quantity, fromMeals: [dishName] });
          } else {
            existing.quantityText = [existing.quantityText, quantity].filter(Boolean).join(' + ');
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
// Misc Items — auth required, scoped to user
// ---------------------------------------------------------------------------

app.get('/api/misc-items', requireAuth, async (req, res) => {
  try {
    // Return shared/default items + user's own custom items, sorted by name
    const items = await MiscItem.find({
      $or: [{ isShared: true }, { userId: req.user._id }],
    }).sort({ name: 1 }).lean();
    res.json(items.map(normaliseId));
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
    if (existing) return res.status(200).json(normaliseId(existing.toObject()));

    const item = await MiscItem.create({ userId: req.user._id, name: trimmed, isShared: false });
    res.status(201).json(normaliseId(item.toObject()));
  } catch (err) {
    res.status(500).json({ message: 'Failed to create misc item' });
  }
});

app.put('/api/misc-items/:id', requireAuth, async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    // Only allow editing user-owned items, not shared ones
    const item = await MiscItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isShared: false },
      { name: name.trim() },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Not found or not editable' });
    res.json(normaliseId(item.toObject()));
  } catch (err) {
    res.status(500).json({ message: 'Failed to update misc item' });
  }
});

app.delete('/api/misc-items/:id', requireAuth, async (req, res) => {
  try {
    // Only allow deleting user-owned items, not shared ones
    const result = await MiscItem.deleteOne({ _id: req.params.id, userId: req.user._id, isShared: false });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Not found or not deletable' });
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

function normaliseId(doc) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Simmer API on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

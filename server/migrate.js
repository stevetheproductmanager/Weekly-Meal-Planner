/**
 * migrate.js — one-time import of local JSON data into MongoDB
 *
 * Usage:
 *   cd server
 *   node migrate.js
 *
 * What it does:
 *   - Imports meals.json → Dish (type:'main', isShared:true)
 *   - Imports sides.json → Dish (type:'side', isShared:true)
 *   - Skips dishes whose name already exists in MongoDB (case-insensitive)
 *
 * Safe to run multiple times — existing records are never overwritten.
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Dish from './models/Dish.js';
import MiscItem from './models/MiscItem.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function importDishes(filePath, type) {
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch {
    console.log(`  ⚠️  ${filePath} not found — skipping.`);
    return { inserted: 0, skipped: 0 };
  }

  const dishes = JSON.parse(raw);
  if (!Array.isArray(dishes)) {
    console.log(`  ⚠️  ${filePath} is not an array — skipping.`);
    return { inserted: 0, skipped: 0 };
  }

  let inserted = 0;
  let skipped  = 0;

  for (const d of dishes) {
    if (!d.name) { skipped++; continue; }

    const exists = await Dish.exists({
      type,
      name: { $regex: new RegExp(`^${d.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isShared: true,
    });

    if (exists) {
      skipped++;
      process.stdout.write('s');
      continue;
    }

    await Dish.create({
      type,
      name:        d.name,
      category:    d.category || '',
      tags:        Array.isArray(d.tags) ? d.tags : [],
      ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
      notes:       d.notes || '',
      recipeUrl:   d.recipeUrl || '',
      isShared:    true,
      ownerId:     null,
    });

    inserted++;
    process.stdout.write('.');
    if ((inserted + skipped) % 50 === 0) process.stdout.write('\n  ');
  }

  return { inserted, skipped };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  // --- Mains ---
  console.log('🍽️  Importing mains (meals.json)…');
  const mainsFile = path.join(__dirname, 'data', 'meals.json');
  const mains = await importDishes(mainsFile, 'main');
  console.log(`\n   ✅ ${mains.inserted} inserted, ${mains.skipped} skipped\n`);

  // --- Sides ---
  console.log('🥗  Importing sides (sides.json)…');
  const sidesFile = path.join(__dirname, 'data', 'sides.json');
  const sides = await importDishes(sidesFile, 'side');
  console.log(`\n   ✅ ${sides.inserted} inserted, ${sides.skipped} skipped\n`);

  // --- Misc items ---
  console.log('🛒  Importing misc items (miscitem.json)…');
  const miscFile = path.join(__dirname, 'data', 'miscitem.json');
  let miscRaw;
  try {
    miscRaw = await fs.readFile(miscFile, 'utf-8');
  } catch {
    console.log('  ⚠️  miscitem.json not found — skipping.\n');
    miscRaw = null;
  }

  let miscInserted = 0, miscSkipped = 0;
  if (miscRaw) {
    const miscItems = JSON.parse(miscRaw);
    for (const item of miscItems) {
      if (!item.name) { miscSkipped++; continue; }
      const exists = await MiscItem.exists({
        isShared: true,
        name: { $regex: new RegExp(`^${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (exists) {
        miscSkipped++;
        process.stdout.write('s');
        continue;
      }
      await MiscItem.create({
        userId: null,
        name: item.name,
        isShared: true,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      });
      miscInserted++;
      process.stdout.write('.');
    }
    console.log(`\n   ✅ ${miscInserted} inserted, ${miscSkipped} skipped\n`);
  }

  console.log(`🎉  Migration complete! ${mains.inserted + sides.inserted} dishes + ${miscInserted} misc items imported.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});

import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name:     { type: String, default: '' },
  quantity: { type: String, default: '' },
  unit:     { type: String, default: '' },
  category: { type: String, default: '' },
}, { _id: false });

const dishSchema = new mongoose.Schema({
  // 'main' or 'side'
  type:       { type: String, enum: ['main', 'side'], required: true },
  name:       { type: String, required: true, trim: true },
  category:   { type: String, default: '' },
  tags:       { type: [String], default: [] },
  ingredients:{ type: [ingredientSchema], default: [] },
  notes:      { type: String, default: '' },
  recipeUrl:  { type: String, default: '' },
  // true  = TheMealDB shared library (visible to all users, not editable)
  // false = user-created private meal
  isShared:   { type: Boolean, default: false, index: true },
  // null for shared dishes, userId for custom
  ownerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  createdAt:  { type: Date, default: Date.now },
});

// Compound index for fast "shared + mine" queries
dishSchema.index({ type: 1, isShared: 1, ownerId: 1 });

export default mongoose.model('Dish', dishSchema);

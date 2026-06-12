import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  id:       { type: String, required: true },
  type:     { type: String, default: null },   // 'out' for eating-out slots
  label:    { type: String, default: null },   // display label for 'out' slots
  mainId:   { type: String, default: null },   // null for 'out' entries
  sideIds:  { type: [String], default: [] },
  servings: { type: Number, default: 4 },
  note:     { type: String, default: '' },     // per-entry cook note
}, { _id: false });

const planSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStart: { type: Date, default: null },
  entries:   { type: [entrySchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

// Unique per user per week (weekStart: null = legacy single plan)
planSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export default mongoose.model('Plan', planSchema);

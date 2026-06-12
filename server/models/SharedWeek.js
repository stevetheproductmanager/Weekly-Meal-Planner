import mongoose from 'mongoose';

// A denormalised snapshot of a user's week — names are baked in so the
// card still renders even if the original dishes are later deleted.
const entrySchema = new mongoose.Schema({
  day:       { type: Number, required: true },   // 0 = Monday … 6 = Sunday
  mainId:    { type: String, required: true },
  mainName:  { type: String, required: true },
  sideIds:   { type: [String], default: [] },
  sideNames: { type: [String], default: [] },
}, { _id: false });

const sharedWeekSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String, default: 'Anonymous' },
  userAvatar:{ type: String, default: '' },
  weekStart: { type: Date, default: null },
  weekLabel: { type: String, default: '' },   // e.g. "Jun 9 – Jun 15, 2025"
  entries:   { type: [entrySchema], default: [] },
  cloneCount:{ type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

sharedWeekSchema.index({ createdAt: -1 });
sharedWeekSchema.index({ cloneCount: -1 });
sharedWeekSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('SharedWeek', sharedWeekSchema);

import mongoose from 'mongoose';

const miscItemSchema = new mongoose.Schema({
  // null for shared/default items, userId for user-created items
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  name:      { type: String, required: true, trim: true },
  // true = default shared item visible to all users
  isShared:  { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate names per user; shared items have userId=null
miscItemSchema.index({ userId: 1, name: 1 });

export default mongoose.model('MiscItem', miscItemSchema);

import mongoose from 'mongoose';

const miscItemSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:      { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate names per user (case handled in route via regex)
miscItemSchema.index({ userId: 1, name: 1 });

export default mongoose.model('MiscItem', miscItemSchema);

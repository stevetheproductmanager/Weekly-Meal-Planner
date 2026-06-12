import mongoose from 'mongoose';

const pantrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:   { type: String, required: true },
}, { timestamps: false });

// One entry per name per user (case-preserved, matched case-insensitively in code)
pantrySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('PantryItem', pantrySchema);

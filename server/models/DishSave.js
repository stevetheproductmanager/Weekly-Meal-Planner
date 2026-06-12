import mongoose from 'mongoose';

const dishSaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dishId: { type: String, required: true },
  savedAt: { type: Date, default: Date.now },
});

dishSaveSchema.index({ userId: 1, dishId: 1 }, { unique: true });

export default mongoose.model('DishSave', dishSaveSchema);

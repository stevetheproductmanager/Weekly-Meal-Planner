import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dishId:  { type: String, required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  note:    { type: String, default: '' },
  ratedAt: { type: Date, default: Date.now },
});

// One rating per user per dish — upserted on every rate action
ratingSchema.index({ userId: 1, dishId: 1 }, { unique: true });

export default mongoose.model('DishRating', ratingSchema);

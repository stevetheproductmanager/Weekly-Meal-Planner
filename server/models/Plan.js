import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  id:      { type: String, required: true },
  mainId:  { type: String, required: true },
  sideIds: { type: [String], default: [] },
}, { _id: false });

const planSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  entries:   { type: [entrySchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Plan', planSchema);

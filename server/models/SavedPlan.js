import mongoose from 'mongoose';

const savedEntrySchema = new mongoose.Schema({
  mainId:   { type: String, default: '' },
  mainName: { type: String, default: '' },
  sideIds:  { type: [String], default: [] },
  sides: [{
    id:   { type: String },
    name: { type: String },
  }],
}, { _id: false });

const savedPlanSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:    { type: String, required: true, trim: true },
  savedAt: { type: Date, default: Date.now },
  entries: { type: [savedEntrySchema], default: [] },
});

export default mongoose.model('SavedPlan', savedPlanSchema);

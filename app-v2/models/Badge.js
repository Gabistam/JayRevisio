import mongoose from 'mongoose';

const BadgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  badge_id:     { type: String, required: true },
  debloque_le:  { type: Date, default: Date.now },
});

BadgeSchema.index({ userId: 1, badge_id: 1 }, { unique: true });

export default mongoose.models.Badge || mongoose.model('Badge', BadgeSchema);

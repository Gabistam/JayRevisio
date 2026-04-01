import mongoose from 'mongoose';

const ProfilSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  xp:              { type: Number, default: 0 },
  niveau:          { type: Number, default: 1 },
  streak_jours:    { type: Number, default: 0 },
  derniere_session:{ type: String, default: null }, /* date ISO YYYY-MM-DD */
  brevet_date:     { type: String, default: '2026-04-08' },
  updatedAt:       { type: Date,   default: Date.now },
});

ProfilSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

export default mongoose.models.Profil || mongoose.model('Profil', ProfilSchema);

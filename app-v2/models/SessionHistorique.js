import mongoose from 'mongoose';

const SessionHistoriqueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  matiere:      { type: String, required: true },
  chapitre:     { type: String, default: 'general' },
  score_bonnes: { type: Number, default: 0 },
  nb_questions: { type: Number, default: 0 },
  xp_gagne:     { type: Number, default: 0 },
  duree_s:      { type: Number, default: 0 },
  defi_gagne:   { type: Boolean, default: false },
  date:         { type: String, required: true }, /* YYYY-MM-DD */
  createdAt:    { type: Date, default: Date.now },
});

SessionHistoriqueSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.SessionHistorique ||
  mongoose.model('SessionHistorique', SessionHistoriqueSchema);

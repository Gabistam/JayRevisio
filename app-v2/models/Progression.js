import mongoose from 'mongoose';

const ChapitreSchema = new mongoose.Schema({
  score:          { type: Number, default: 0 },
  questions_vues: { type: Number, default: 0 },
}, { _id: false });

const ProgressionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  matiere: {
    type: String,
    required: true,
    enum: ['maths', 'histoire-geo', 'physique-chimie', 'svt'],
  },
  score_global:      { type: Number, default: 0 },
  questions_vues:    { type: [Number], default: [] },
  questions_ratees:  { type: [Number], default: [] },
  chapitres:         { type: Map, of: ChapitreSchema, default: {} },
  updatedAt:         { type: Date, default: Date.now },
});

/* Index unique par userId + matiere */
ProgressionSchema.index({ userId: 1, matiere: 1 }, { unique: true });

ProgressionSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

export default mongoose.models.Progression || mongoose.model('Progression', ProgressionSchema);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Nom trop long'],
  },
  email: {
    type: String,
    required: [true, "L'email est requis"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, '6 caractères minimum'],
    select: false, /* jamais retourné par défaut dans les requêtes */
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/* Hash du mot de passe avant sauvegarde */
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/* Méthode pour vérifier le mot de passe */
UserSchema.methods.verifierMotDePasse = async function (mdpCandidat) {
  return bcrypt.compare(mdpCandidat, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);

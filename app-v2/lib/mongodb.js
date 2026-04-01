/* ================================================
   lib/mongodb.js
   Connexion Mongoose avec cache pour éviter de
   re-connecter à chaque Serverless Function call.
   ================================================ */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI manquant dans .env.local');
}

/* Cache global pour réutiliser la connexion entre les appels */
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

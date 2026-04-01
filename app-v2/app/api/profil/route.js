import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Profil from '@/models/Profil';

/* GET /api/profil — lire le profil de l'utilisateur connecté */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await connectDB();
  const profil = await Profil.findOne({ userId: session.user.id });
  if (!profil) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  return NextResponse.json(profil);
}

/* PUT /api/profil — mettre à jour le profil */
export async function PUT(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  const CHAMPS_AUTORISES = ['xp', 'niveau', 'streak_jours', 'derniere_session', 'brevet_date'];

  /* Filtrer uniquement les champs autorisés */
  const update = {};
  for (const cle of CHAMPS_AUTORISES) {
    if (body[cle] !== undefined) update[cle] = body[cle];
  }

  await connectDB();
  const profil = await Profil.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { ...update, updatedAt: Date.now() } },
    { new: true, upsert: true }
  );

  return NextResponse.json(profil);
}

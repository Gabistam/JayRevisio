import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import SessionHistorique from '@/models/SessionHistorique';

/* GET /api/historique — dernières sessions (?limit=20) */
export async function GET(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  await connectDB();

  const sessions = await SessionHistorique
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json(sessions);
}

/* POST /api/historique — enregistrer une nouvelle session */
export async function POST(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  const { matiere, chapitre, score_bonnes, nb_questions, xp_gagne, duree_s, defi_gagne, date } = body;

  if (!matiere || !date) {
    return NextResponse.json({ error: 'matiere et date sont requis' }, { status: 400 });
  }

  await connectDB();

  const nouvelleSession = await SessionHistorique.create({
    userId:      session.user.id,
    matiere,
    chapitre:    chapitre    || 'general',
    score_bonnes: score_bonnes ?? 0,
    nb_questions: nb_questions ?? 0,
    xp_gagne:    xp_gagne    ?? 0,
    duree_s:     duree_s     ?? 0,
    defi_gagne:  defi_gagne  ?? false,
    date,
  });

  return NextResponse.json(nouvelleSession, { status: 201 });
}

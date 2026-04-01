import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Progression from '@/models/Progression';

const MATIERES = ['maths', 'histoire-geo', 'physique-chimie', 'svt'];

/* GET /api/progression — toutes les matières ou ?matiere=maths */
export async function GET(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const matiere = searchParams.get('matiere');

  await connectDB();

  if (matiere) {
    if (!MATIERES.includes(matiere)) {
      return NextResponse.json({ error: 'Matière invalide' }, { status: 400 });
    }
    const prog = await Progression.findOne({ userId: session.user.id, matiere });
    return NextResponse.json(prog || {});
  }

  /* Toutes les matières */
  const progs = await Progression.find({ userId: session.user.id });
  const result = {};
  for (const p of progs) result[p.matiere] = p;
  return NextResponse.json(result);
}

/* PUT /api/progression — mettre à jour une matière */
export async function PUT(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  const { matiere, score_global, questions_vues, questions_ratees, chapitres } = body;

  if (!matiere || !MATIERES.includes(matiere)) {
    return NextResponse.json({ error: 'Matière invalide' }, { status: 400 });
  }

  await connectDB();

  const update = { updatedAt: Date.now() };
  if (score_global !== undefined)    update.score_global    = score_global;
  if (questions_vues !== undefined)  update.questions_vues  = questions_vues;
  if (questions_ratees !== undefined) update.questions_ratees = questions_ratees;
  if (chapitres !== undefined)       update.chapitres       = chapitres;

  const prog = await Progression.findOneAndUpdate(
    { userId: session.user.id, matiere },
    { $set: update },
    { new: true, upsert: true }
  );

  return NextResponse.json(prog);
}

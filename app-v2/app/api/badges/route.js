import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Badge from '@/models/Badge';

/* GET /api/badges — liste des badges débloqués */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await connectDB();

  const badges = await Badge
    .find({ userId: session.user.id })
    .sort({ debloque_le: -1 })
    .lean();

  return NextResponse.json(badges.map(b => b.badge_id));
}

/* POST /api/badges — débloquer un badge */
export async function POST(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { badge_id } = await request.json();
  if (!badge_id) return NextResponse.json({ error: 'badge_id requis' }, { status: 400 });

  await connectDB();

  /* upsert : ne crée pas de doublon si déjà débloqué */
  await Badge.findOneAndUpdate(
    { userId: session.user.id, badge_id },
    { $setOnInsert: { userId: session.user.id, badge_id, debloque_le: new Date() } },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true, badge_id });
}

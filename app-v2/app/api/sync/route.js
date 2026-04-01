import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Profil from '@/models/Profil';
import Progression from '@/models/Progression';
import Badge from '@/models/Badge';
import SessionHistorique from '@/models/SessionHistorique';

/*
  POST /api/sync
  Body : l'intégralité du localStorage study_jay
  {
    profil: { xp, niveau, streak_jours, derniere_session, brevet_date },
    progression: { maths: {...}, 'histoire-geo': {...}, ... },
    badges: ['premier_pas', 'vegeta_mode', ...],
    historique: [{ matiere, chapitre, score_bonnes, ... }]
  }

  Stratégie : MongoDB est la source de vérité.
  On merge en prenant le max pour XP/niveau/streak
  et en faisant une union pour les questions vues/ratées.
*/
export async function POST(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  const { profil, progression, badges, historique } = body;

  await connectDB();

  const userId = session.user.id;
  const ops = [];

  /* ---- 1. PROFIL ---- */
  if (profil) {
    ops.push(
      Profil.findOneAndUpdate(
        { userId },
        {
          $max: { xp: profil.xp || 0, niveau: profil.niveau || 1, streak_jours: profil.streak_jours || 0 },
          $set: {
            derniere_session: profil.derniere_session || null,
            brevet_date:      profil.brevet_date || '2026-04-08',
            updatedAt:        Date.now(),
          },
        },
        { upsert: true, new: true }
      )
    );
  }

  /* ---- 2. PROGRESSION ---- */
  if (progression && typeof progression === 'object') {
    for (const [matiere, prog] of Object.entries(progression)) {
      if (!prog) continue;

      /* Récupérer la progression existante en BDD */
      const existante = await Progression.findOne({ userId, matiere });

      /* Union des questions vues/ratées */
      const vuesSet   = new Set([...(existante?.questions_vues  || []), ...(prog.questions_vues  || [])]);
      const rateesSet = new Set([...(existante?.questions_ratees || []), ...(prog.questions_ratees || [])]);

      /* Merge des chapitres : prendre le meilleur score */
      const chapitresMerges = { ...(existante?.chapitres?.toJSON?.() || existante?.chapitres || {}) };
      for (const [chap, stats] of Object.entries(prog.chapitres || {})) {
        if (!chapitresMerges[chap] || stats.score > chapitresMerges[chap].score) {
          chapitresMerges[chap] = stats;
        }
      }

      /* Score global = moyenne des chapitres */
      const entrees = Object.values(chapitresMerges).filter(c => c.questions_vues > 0);
      const scoreGlobal = entrees.length
        ? Math.round(entrees.reduce((s, c) => s + c.score, 0) / entrees.length)
        : 0;

      ops.push(
        Progression.findOneAndUpdate(
          { userId, matiere },
          {
            $set: {
              score_global:      scoreGlobal,
              questions_vues:    [...vuesSet],
              questions_ratees:  [...rateesSet],
              chapitres:         chapitresMerges,
              updatedAt:         Date.now(),
            },
          },
          { upsert: true, new: true }
        )
      );
    }
  }

  /* ---- 3. BADGES ---- */
  if (Array.isArray(badges)) {
    for (const badge_id of badges) {
      ops.push(
        Badge.findOneAndUpdate(
          { userId, badge_id },
          { $setOnInsert: { userId, badge_id, debloque_le: new Date() } },
          { upsert: true }
        )
      );
    }
  }

  /* ---- 4. HISTORIQUE ---- */
  if (Array.isArray(historique) && historique.length > 0) {
    /* Récupérer les dates déjà en BDD pour éviter les doublons */
    const existantes = await SessionHistorique.find({ userId }).select('date matiere chapitre').lean();
    const cleExistante = new Set(existantes.map(s => `${s.date}_${s.matiere}_${s.chapitre}`));

    const nouvelles = historique.filter(s => {
      const cle = `${s.date}_${s.matiere}_${s.chapitre || 'general'}`;
      return !cleExistante.has(cle);
    });

    if (nouvelles.length > 0) {
      ops.push(
        SessionHistorique.insertMany(
          nouvelles.map(s => ({ ...s, userId, chapitre: s.chapitre || 'general' })),
          { ordered: false }
        )
      );
    }
  }

  /* Exécuter toutes les opérations en parallèle */
  await Promise.all(ops);

  return NextResponse.json({ ok: true, synced: true });
}

/*
  GET /api/sync
  Retourne toutes les données BDD dans le format localStorage
  pour hydrater le client après connexion.
*/
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await connectDB();

  const userId = session.user.id;

  const [profil, progressions, badges, historique] = await Promise.all([
    Profil.findOne({ userId }).lean(),
    Progression.find({ userId }).lean(),
    Badge.find({ userId }).lean(),
    SessionHistorique.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  /* Reformater la progression en objet { maths: {...}, ... } */
  const progressionObj = {};
  for (const p of progressions) {
    progressionObj[p.matiere] = {
      score_global:     p.score_global,
      questions_vues:   p.questions_vues,
      questions_ratees: p.questions_ratees,
      chapitres:        p.chapitres instanceof Map
        ? Object.fromEntries(p.chapitres)
        : (p.chapitres || {}),
    };
  }

  return NextResponse.json({
    profil: profil ? {
      xp:               profil.xp,
      niveau:           profil.niveau,
      streak_jours:     profil.streak_jours,
      derniere_session: profil.derniere_session,
      brevet_date:      profil.brevet_date,
    } : null,
    progression: progressionObj,
    badges:      badges.map(b => b.badge_id),
    historique:  historique.map(s => ({
      matiere:      s.matiere,
      chapitre:     s.chapitre,
      score_bonnes: s.score_bonnes,
      nb_questions: s.nb_questions,
      xp_gagne:     s.xp_gagne,
      duree_s:      s.duree_s,
      defi_gagne:   s.defi_gagne,
      date:         s.date,
    })),
  });
}

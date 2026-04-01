/* ================================================
   lib/gamification.js — Study Jay v2
   Port de js/gamification.js (logique pure, sans DOM)
   ================================================ */

export const NIVEAUX = [
  { niveau: 1, nom: 'Recrue',        emoji: '🪖', xp_requis: 0    },
  { niveau: 2, nom: 'Soldat',        emoji: '⚔️', xp_requis: 200  },
  { niveau: 3, nom: 'Guerrier',      emoji: '🔥', xp_requis: 500  },
  { niveau: 4, nom: 'Elite',         emoji: '💥', xp_requis: 1000 },
  { niveau: 5, nom: 'Ninja',         emoji: '🏆', xp_requis: 2000 },
  { niveau: 6, nom: 'Légendaire',    emoji: '⚡', xp_requis: 4000 },
  { niveau: 7, nom: 'Ultra Instinct',emoji: '👑', xp_requis: 7000 },
];

export const BADGES_CONFIG = [
  { id: 'vegeta_mode',   nom: 'Vegeta Mode',    emoji: '👑', description: '10 bonnes réponses d\'affilée',  condition: s => s.combo_max >= 10 },
  { id: 'gear5',         nom: 'Gear 5',          emoji: '⚙️', description: '1ère session SVT complète',     condition: s => s.sessions_svt >= 1 },
  { id: 'spider_sense',  nom: 'Spider-Sense',    emoji: '🕷️', description: '0 erreur sur une session',     condition: s => s.session_parfaite === true },
  { id: 'sniper_mbappe', nom: 'Sniper Mbappé',   emoji: '⚽', description: '5 défis chrono gagnés',        condition: s => s.defis_chrono_gagnes >= 5 },
  { id: 'wemby_iq',      nom: 'Wemby IQ',        emoji: '🏀', description: '100 questions en histoire',    condition: s => s.questions_histoire >= 100 },
  { id: 'premier_pas',   nom: 'Premier Pas',     emoji: '👟', description: 'Première question répondue',   condition: s => s.total_questions >= 1 },
  { id: 'centurion',     nom: 'Centurion',       emoji: '💯', description: '100 questions répondues',      condition: s => s.total_questions >= 100 },
  { id: 'semaine',       nom: 'Semaine de feu',  emoji: '🗓️', description: '7 jours de streak',           condition: s => s.streak_jours >= 7 },
];

export function calculerNiveau(xp) {
  let niveau = 1;
  for (const n of NIVEAUX) {
    if (xp >= n.xp_requis) niveau = n.niveau;
  }
  return niveau;
}

export function getNiveauConfig(niveau) {
  return NIVEAUX[niveau - 1] || NIVEAUX[0];
}

export function getPalierSuivant(xp) {
  for (const n of NIVEAUX) {
    if (xp < n.xp_requis) return n;
  }
  return null;
}

export function getPctProgression(xp) {
  const niveauActuel  = calculerNiveau(xp);
  const configActuel  = NIVEAUX[niveauActuel - 1];
  const configSuivant = NIVEAUX[niveauActuel];
  if (!configSuivant) return 100;
  const xpDepuis  = xp - configActuel.xp_requis;
  const xpPour    = configSuivant.xp_requis - configActuel.xp_requis;
  return Math.round((xpDepuis / xpPour) * 100);
}

export function xpAvecBonus(xpBase, tempsS, tempsMaxS) {
  const ratio = clampVal(1 - tempsS / tempsMaxS, 0, 1);
  return Math.round(xpBase * (1 + ratio * 0.5));
}

function clampVal(v, min, max) { return Math.min(max, Math.max(min, v)); }

export function verifierBadges(statsSession, profil, historique, badgesDebloques) {
  const questionsHistoire = historique
    .filter(s => s.matiere === 'histoire-geo')
    .reduce((sum, s) => sum + (s.nb_questions || 0), 0);
  const sessionsSvt    = historique.filter(s => s.matiere === 'svt').length;
  const defisChrono    = historique.filter(s => s.defi_gagne === true).length;
  const totalQuestions = historique.reduce((sum, s) => sum + (s.nb_questions || 0), 0);

  const stats = {
    combo_max:           statsSession.combo_max ?? 0,
    sessions_svt:        sessionsSvt,
    session_parfaite:    statsSession.parfaite ?? false,
    defis_chrono_gagnes: defisChrono,
    questions_histoire:  questionsHistoire,
    total_questions:     totalQuestions,
    streak_jours:        profil.streak_jours,
  };

  return BADGES_CONFIG.filter(b =>
    !badgesDebloques.includes(b.id) && b.condition(stats)
  ).map(b => b.id);
}

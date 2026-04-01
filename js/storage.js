/* ================================================
   storage.js — Study Jay
   Toute la logique localStorage : lecture, écriture,
   initialisation et migration des données
   ================================================ */

'use strict';

/* ------------------------------------------------
   CLÉ RACINE dans localStorage
   ------------------------------------------------ */
const STORAGE_KEY = 'study_jay';

/* ------------------------------------------------
   STRUCTURE PAR DÉFAUT
   Reflète exactement le schéma défini dans le brief
   ------------------------------------------------ */
const STRUCTURE_DEFAUT = {
  profil: {
    xp: 0,
    niveau: 1,
    brevet_date: '2026-06-19',
    streak_jours: 0,
    derniere_session: null,   /* date ISO YYYY-MM-DD de la dernière session */
  },
  progression: {
    maths: {
      score_global: 0,
      questions_vues: [],
      questions_ratees: [],
      chapitres: {},
    },
    'histoire-geo': {
      score_global: 0,
      questions_vues: [],
      questions_ratees: [],
      chapitres: {},
    },
    'physique-chimie': {
      score_global: 0,
      questions_vues: [],
      questions_ratees: [],
      chapitres: {},
    },
    svt: {
      score_global: 0,
      questions_vues: [],
      questions_ratees: [],
      chapitres: {},
    },
  },
  badges: [],   /* tableau d'identifiants de badges débloqués */
  historique: [],   /* tableau de sessions passées */
};

/* ------------------------------------------------
   STORAGE — objet principal
   ------------------------------------------------ */
const Storage = {

  /* Cache en mémoire pour éviter des JSON.parse répétés */
  _cache: null,

  /* ---- INITIALISATION ---- */

  /**
   * Initialise le storage :
   * - Charge les données existantes
   * - Crée la structure par défaut si première visite
   * - Vérifie la cohérence (migration si besoin)
   */
  init() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      /* Première visite — on crée les données */
      this._cache = this._cloner(STRUCTURE_DEFAUT);
      this._sauvegarder();
      console.log('[Storage] Initialisation des données par défaut.');
    } else {
      try {
        this._cache = JSON.parse(raw);
        this._migrer();
      } catch (e) {
        console.error('[Storage] Données corrompues, réinitialisation.', e);
        this._cache = this._cloner(STRUCTURE_DEFAUT);
        this._sauvegarder();
      }
    }

    /* Vérifier/mettre à jour le streak au lancement */
    this._mettreAJourStreak();
  },

  /**
   * Migration : s'assure que toutes les clés requises existent
   * (utile si l'app évolue et ajoute de nouveaux champs)
   */
  _migrer() {
    let modifie = false;

    /* Vérifier chaque clé de premier niveau */
    for (const cle of Object.keys(STRUCTURE_DEFAUT)) {
      if (this._cache[cle] === undefined) {
        this._cache[cle] = this._cloner(STRUCTURE_DEFAUT[cle]);
        modifie = true;
      }
    }

    /* Vérifier les sous-clés du profil */
    for (const cle of Object.keys(STRUCTURE_DEFAUT.profil)) {
      if (this._cache.profil[cle] === undefined) {
        this._cache.profil[cle] = STRUCTURE_DEFAUT.profil[cle];
        modifie = true;
      }
    }

    /* Vérifier les matières dans progression */
    for (const matiere of Object.keys(STRUCTURE_DEFAUT.progression)) {
      if (!this._cache.progression[matiere]) {
        this._cache.progression[matiere] = this._cloner(STRUCTURE_DEFAUT.progression[matiere]);
        modifie = true;
      }
    }

    if (modifie) {
      this._sauvegarder();
      console.log('[Storage] Migration effectuée.');
    }
  },

  /* ---- STREAK ---- */

  /**
   * Calcule et met à jour le streak de jours consécutifs.
   * Appelé à chaque ouverture de l'app.
   */
  _mettreAJourStreak() {
    const profil = this._cache.profil;
    const auj = Utils.dateAujourdhui();

    if (!profil.derniere_session) {
      /* Jamais joué */
      profil.streak_jours = 0;
      this._sauvegarder();
      return;
    }

    const dernier = profil.derniere_session;
    const diffJours = this._diffJours(dernier, auj);

    if (diffJours === 0) {
      /* Déjà joué aujourd'hui — streak inchangé */
    } else if (diffJours === 1) {
      /* Joué hier — streak continue (sera incrémenté à la prochaine session) */
    } else {
      /* Plus d'un jour sans jouer — streak cassé */
      profil.streak_jours = 0;
      this._sauvegarder();
    }
  },

  /**
   * Enregistre qu'une session a eu lieu aujourd'hui et incrémente le streak.
   */
  enregistrerSession() {
    const profil = this._cache.profil;
    const auj = Utils.dateAujourdhui();

    if (profil.derniere_session === auj) return; /* Déjà compté aujourd'hui */

    const diffJours = profil.derniere_session
      ? this._diffJours(profil.derniere_session, auj)
      : null;

    if (diffJours === 1 || diffJours === null) {
      /* Hier ou première fois → on incrémente */
      profil.streak_jours = (profil.streak_jours || 0) + 1;
    } else if (diffJours === 0) {
      /* Même jour, ne rien faire */
    } else {
      /* Trou > 1 jour → on repart à 1 */
      profil.streak_jours = 1;
    }

    profil.derniere_session = auj;
    this._sauvegarder();
  },

  /* ---- PROFIL ---- */

  getProfil() {
    return this._cache.profil;
  },

  saveProfil(profil) {
    this._cache.profil = { ...this._cache.profil, ...profil };
    this._sauvegarder();
  },

  /* ---- PROGRESSION ---- */

  getProgression(matiere) {
    return this._cache.progression[matiere] || null;
  },

  /**
   * Met à jour les stats d'une matière après une session de quiz.
   * @param {string} matiere
   * @param {string} chapitre
   * @param {number} nbBonnes
   * @param {number} nbTotal
   * @param {number[]} idsVues      - IDs des questions vues
   * @param {number[]} idsRatees    - IDs des questions ratées
   */
  mettreAJourProgression(matiere, chapitre, nbBonnes, nbTotal, idsVues, idsRatees) {
    const prog = this._cache.progression[matiere];
    if (!prog) return;

    /* Fusionner les questions vues (sans doublons) */
    const vuesSet = new Set([...prog.questions_vues, ...idsVues]);
    prog.questions_vues = [...vuesSet];

    /* Mettre à jour les questions ratées :
       - Ajouter les nouvelles ratées
       - Retirer celles qui ont été réussies cette fois */
    const rateesSet = new Set(prog.questions_ratees);
    for (const id of idsRatees) rateesSet.add(id);
    for (const id of idsVues) {
      if (!idsRatees.includes(id)) rateesSet.delete(id);
    }
    prog.questions_ratees = [...rateesSet];

    /* Score du chapitre */
    if (!prog.chapitres[chapitre]) {
      prog.chapitres[chapitre] = { score: 0, questions_vues: 0 };
    }
    const chap = prog.chapitres[chapitre];
    /* Moyenne pondérée : (ancien_total + nouvelles_bonnes) / (ancien_total + nouvelles_totales) */
    const ancienTotal = chap.questions_vues || 0;
    const ancienBonnes = Math.round((chap.score / 100) * ancienTotal);
    const nouveauTotal = ancienTotal + nbTotal;
    const nouveauBonnes = ancienBonnes + nbBonnes;
    chap.score = nouveauTotal > 0 ? Math.round((nouveauBonnes / nouveauTotal) * 100) : 0;
    chap.questions_vues = nouveauTotal;

    /* Recalculer le score global de la matière */
    prog.score_global = this._calculerScoreGlobal(matiere);

    this._sauvegarder();
  },

  /**
   * Calcule le score global d'une matière à partir de tous ses chapitres.
   */
  _calculerScoreGlobal(matiere) {
    const chapitres = this._cache.progression[matiere]?.chapitres || {};
    const entrees = Object.values(chapitres).filter(c => c.questions_vues > 0);
    if (entrees.length === 0) return 0;
    const total = entrees.reduce((sum, c) => sum + c.score, 0);
    return Math.round(total / entrees.length);
  },

  /* ---- BADGES ---- */

  getBadges() {
    return this._cache.badges;
  },

  /**
   * Débloque un badge (par son id) si pas déjà acquis.
   * Retourne true si nouveau badge.
   */
  debloquerBadge(badgeId) {
    if (this._cache.badges.includes(badgeId)) return false;
    this._cache.badges.push(badgeId);
    this._sauvegarder();
    return true;
  },

  aBadge(badgeId) {
    return this._cache.badges.includes(badgeId);
  },

  /* ---- HISTORIQUE ---- */

  getHistorique() {
    return this._cache.historique;
  },

  /**
   * Ajoute une session à l'historique.
   * @param {object} session - { matiere, chapitre, score, xp_gagne, date, duree_s }
   */
  ajouterHistorique(session) {
    this._cache.historique.unshift({
      ...session,
      date: session.date || Utils.dateAujourdhui(),
    });
    /* Garder les 100 dernières sessions seulement */
    if (this._cache.historique.length > 100) {
      this._cache.historique = this._cache.historique.slice(0, 100);
    }
    this._sauvegarder();
  },

  /* ---- POINTS FAIBLES ---- */

  /**
   * Retourne les chapitres avec score < seuil (défaut 50%),
   * triés par score croissant.
   * @param {number} seuil - Seuil en % (défaut 50)
   * @returns {Array<{matiere, chapitre, score}>}
   */
  getPointsFaibles(seuil = 50) {
    const resultats = [];

    for (const [matiere, prog] of Object.entries(this._cache.progression)) {
      for (const [chapitre, stats] of Object.entries(prog.chapitres)) {
        if (stats.questions_vues > 0 && stats.score < seuil) {
          resultats.push({ matiere, chapitre, score: stats.score });
        }
      }
    }

    return resultats.sort((a, b) => a.score - b.score);
  },

  /* ---- RESET (debug) ---- */

  /**
   * Remet à zéro toutes les données (debug uniquement).
   */
  reset() {
    this._cache = this._cloner(STRUCTURE_DEFAUT);
    this._sauvegarder();
    console.log('[Storage] Données réinitialisées.');
  },

  /* ---- HELPERS PRIVÉS ---- */

  _sauvegarder() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cache));
    } catch (e) {
      console.error('[Storage] Impossible de sauvegarder (quota ?):', e);
    }
  },

  _cloner(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Différence en jours entre deux dates YYYY-MM-DD.
   * Résultat positif si date2 > date1.
   */
  _diffJours(date1Str, date2Str) {
    const d1 = new Date(date1Str + 'T00:00:00');
    const d2 = new Date(date2Str + 'T00:00:00');
    return Math.round((d2 - d1) / 86400000);
  },
};

window.Storage = Storage;

/* ================================================
   gamification.js — Study Jay
   Système XP, niveaux, badges, combos et toasts
   ================================================ */

'use strict';

/* ------------------------------------------------
   CONFIGURATION DES NIVEAUX
   ------------------------------------------------ */
const NIVEAUX = [
  { niveau: 1, nom: 'Recrue', emoji: '🪖', xp_requis: 0 },
  { niveau: 2, nom: 'Soldat', emoji: '⚔️', xp_requis: 200 },
  { niveau: 3, nom: 'Guerrier', emoji: '🔥', xp_requis: 500 },
  { niveau: 4, nom: 'Elite', emoji: '💥', xp_requis: 1000 },
  { niveau: 5, nom: 'Ninja', emoji: '🏆', xp_requis: 2000 },
  { niveau: 6, nom: 'Légendaire', emoji: '⚡', xp_requis: 4000 },
  { niveau: 7, nom: 'Ultra Instinct', emoji: '👑', xp_requis: 7000 },
];

/* ------------------------------------------------
   CONFIGURATION DES BADGES
   ------------------------------------------------ */
const BADGES_CONFIG = [
  {
    id: 'vegeta_mode',
    nom: 'Vegeta Mode',
    emoji: '👑',
    description: '10 bonnes réponses d\'affilée',
    condition: (stats) => stats.combo_max >= 10,
  },
  {
    id: 'gear5',
    nom: 'Gear 5',
    emoji: '⚙️',
    description: '1ère session SVT complète',
    condition: (stats) => stats.sessions_svt >= 1,
  },
  {
    id: 'spider_sense',
    nom: 'Spider-Sense',
    emoji: '🕷️',
    description: '0 erreur sur une session',
    condition: (stats) => stats.session_parfaite === true,
  },
  {
    id: 'sniper_mbappe',
    nom: 'Sniper Mbappé',
    emoji: '⚽',
    description: '5 défis chrono gagnés',
    condition: (stats) => stats.defis_chrono_gagnes >= 5,
  },
  {
    id: 'wemby_iq',
    nom: 'Wemby IQ',
    emoji: '🏀',
    description: '100 questions en histoire',
    condition: (stats) => stats.questions_histoire >= 100,
  },
  {
    id: 'premier_pas',
    nom: 'Premier Pas',
    emoji: '👟',
    description: 'Première question répondue',
    condition: (stats) => stats.total_questions >= 1,
  },
  {
    id: 'centurion',
    nom: 'Centurion',
    emoji: '💯',
    description: '100 questions répondues au total',
    condition: (stats) => stats.total_questions >= 100,
  },
  {
    id: 'semaine',
    nom: 'Semaine de feu',
    emoji: '🗓️',
    description: '7 jours de streak consécutifs',
    condition: (stats) => stats.streak_jours >= 7,
  },
];

/* ------------------------------------------------
   ÉTAT INTERNE DU SYSTÈME DE GAMIFICATION
   ------------------------------------------------ */
const _etat = {
  combo: 0,   /* combo de bonnes réponses consécutives */
  combo_max: 0,   /* record de combo dans la session */
  xp_session: 0,   /* XP accumulé dans la session courante */
};

/* ------------------------------------------------
   GAMIFICATION — objet principal
   ------------------------------------------------ */
const Gamification = {

  /* ---- INITIALISATION ---- */

  /**
   * À appeler au démarrage de l'app, après Storage.init().
   * Met à jour le header avec les données réelles du profil.
   */
  init() {
    this._mettreAJourHeader();
  },

  /* ---- XP ---- */

  /**
   * Ajoute de l'XP au profil et vérifie les montées de niveau.
   * @param {number} montant - XP à ajouter
   * @param {string} [raison] - Label affiché dans le toast (ex: "Bonne réponse")
   * @returns {{ xp_ajoute: number, niveau_avant: number, nouveau_niveau: boolean }}
   */
  ajouterXP(montant, raison = '') {
    const profil = Storage.getProfil();
    const niveauAvant = profil.niveau;

    profil.xp += montant;

    /* Recalculer le niveau */
    const nouvNiveau = this._calculerNiveau(profil.xp);
    const monteeNiveau = nouvNiveau > niveauAvant;
    profil.niveau = nouvNiveau;

    Storage.saveProfil(profil);

    /* Mettre à jour le header */
    this._mettreAJourHeader();

    /* Accumuler pour le résumé de session */
    _etat.xp_session += montant;

    /* Toast XP flottant */
    this._toastXP(montant, raison);

    /* Toast montée de niveau */
    if (monteeNiveau) {
      const config = NIVEAUX[nouvNiveau - 1];
      this._toast(
        `${config.emoji} Niveau ${nouvNiveau} — ${config.nom} !`,
        'xp',
        4000
      );
    }

    return { xp_ajoute: montant, niveau_avant: niveauAvant, nouveau_niveau: monteeNiveau };
  },

  /**
   * Calcule l'XP bonus selon la vitesse (pour le défi chrono).
   * @param {number} xp_base
   * @param {number} temps_s       - Temps utilisé en secondes
   * @param {number} temps_max_s   - Temps maximum autorisé
   */
  xpAvecBonus(xp_base, temps_s, temps_max_s) {
    const ratio = Utils.clamp(1 - temps_s / temps_max_s, 0, 1);
    /* Bonus jusqu'à +50% si très rapide */
    const multiplicateur = 1 + (ratio * 0.5);
    return Math.round(xp_base * multiplicateur);
  },

  /* ---- COMBO ---- */

  /**
   * Enregistre une bonne réponse et gère le combo.
   * @returns {{ combo: number, bonus_xp: number }}
   */
  bonneReponse() {
    _etat.combo++;
    if (_etat.combo > _etat.combo_max) _etat.combo_max = _etat.combo;

    let bonus = 0;
    if (_etat.combo > 0 && _etat.combo % 3 === 0) {
      /* Bonus combo tous les 3 consécutifs */
      bonus = 15;
      this._toast(`🔥 Combo x${_etat.combo} ! +${bonus} XP bonus`, 'xp');
      this.ajouterXP(bonus, '');
    }

    return { combo: _etat.combo, bonus_xp: bonus };
  },

  /**
   * Enregistre une mauvaise réponse — remet le combo à zéro.
   */
  mauvaiseReponse() {
    _etat.combo = 0;
  },

  getCombo() { return _etat.combo; },
  getComboMax() { return _etat.combo_max; },

  /**
   * Réinitialise l'état de session (à appeler en début de quiz).
   */
  reinitSession() {
    _etat.combo = 0;
    _etat.combo_max = 0;
    _etat.xp_session = 0;
  },

  getXPSession() { return _etat.xp_session; },

  /* ---- NIVEAUX ---- */

  /**
   * Retourne le numéro de niveau correspondant à un montant d'XP.
   */
  _calculerNiveau(xp) {
    let niveau = 1;
    for (const n of NIVEAUX) {
      if (xp >= n.xp_requis) niveau = n.niveau;
    }
    return niveau;
  },

  /**
   * Retourne la config du niveau actuel.
   */
  getNiveauConfig(niveau) {
    return NIVEAUX[niveau - 1] || NIVEAUX[0];
  },

  /**
   * Retourne le prochain palier de niveau (ou null si max).
   */
  getPalierSuivant(xp) {
    for (const n of NIVEAUX) {
      if (xp < n.xp_requis) return n;
    }
    return null; /* niveau max atteint */
  },

  /**
   * Retourne le % de progression vers le prochain niveau (0–100).
   */
  getPctProgression(xp) {
    const niveauActuel = this._calculerNiveau(xp);
    const configActuel = NIVEAUX[niveauActuel - 1];
    const configSuivant = NIVEAUX[niveauActuel]; /* peut être undefined si max */

    if (!configSuivant) return 100; /* niveau max */

    const xpDepuisPalier = xp - configActuel.xp_requis;
    const xpPourPalier = configSuivant.xp_requis - configActuel.xp_requis;
    return Math.round((xpDepuisPalier / xpPourPalier) * 100);
  },

  /* ---- BADGES ---- */

  /**
   * Vérifie tous les badges et débloque ceux qui remplissent leur condition.
   * À appeler après chaque session.
   * @param {object} statsSession - Statistiques de la session courante
   */
  verifierBadges(statsSession = {}) {
    /* Construire les stats globales pour la vérification */
    const profil = Storage.getProfil();
    const historique = Storage.getHistorique();
    const badges = Storage.getBadges();

    /* Compter les questions d'histoire */
    const questionsHistoire = historique
      .filter(s => s.matiere === 'histoire-geo')
      .reduce((sum, s) => sum + (s.nb_questions || 0), 0);

    /* Compter les sessions SVT */
    const sessionsSvt = historique.filter(s => s.matiere === 'svt').length;

    /* Compter les défis chrono gagnés */
    const defisChrono = historique.filter(s => s.defi_gagne === true).length;

    /* Total questions répondues */
    const totalQuestions = historique.reduce((sum, s) => sum + (s.nb_questions || 0), 0);

    const statsGlobales = {
      combo_max: statsSession.combo_max ?? _etat.combo_max,
      sessions_svt: sessionsSvt,
      session_parfaite: statsSession.parfaite ?? false,
      defis_chrono_gagnes: defisChrono,
      questions_histoire: questionsHistoire,
      total_questions: totalQuestions,
      streak_jours: profil.streak_jours,
    };

    const nouveauxBadges = [];

    for (const badge of BADGES_CONFIG) {
      if (!badges.includes(badge.id) && badge.condition(statsGlobales)) {
        const estNouveau = Storage.debloquerBadge(badge.id);
        if (estNouveau) {
          nouveauxBadges.push(badge);
          this._toast(`🏅 Badge débloqué : ${badge.emoji} ${badge.nom} !`, 'xp', 5000);
        }
      }
    }

    return nouveauxBadges;
  },

  /**
   * Retourne la liste complète des badges avec état (débloqué ou non).
   */
  getBadgesAvecEtat() {
    const debloques = Storage.getBadges();
    return BADGES_CONFIG.map(badge => ({
      ...badge,
      debloque: debloques.includes(badge.id),
    }));
  },

  /* ---- MISE À JOUR DU HEADER ---- */

  _mettreAJourHeader() {
    const profil = Storage.getProfil();
    if (!profil) return;

    const config = this.getNiveauConfig(profil.niveau);
    const palierSuiv = this.getPalierSuivant(profil.xp);
    const xpMax = palierSuiv ? palierSuiv.xp_requis : profil.xp;
    const xpBase = config.xp_requis;
    const pct = palierSuiv
      ? Math.round(((profil.xp - xpBase) / (xpMax - xpBase)) * 100)
      : 100;

    const elNiveau = document.getElementById('header-niveau');
    const elFill = document.getElementById('header-xp-fill');
    const elLabel = document.getElementById('header-xp-label');
    const elBar = document.querySelector('.player-xp-bar');

    if (elNiveau) elNiveau.textContent = `${config.emoji} ${config.nom}`;
    if (elFill) elFill.style.width = `${pct}%`;
    if (elLabel) elLabel.textContent = palierSuiv
      ? `${profil.xp} / ${xpMax} XP`
      : `${profil.xp} XP — MAX`;

    /* Accessibilité : mettre à jour le role progressbar */
    if (elBar) {
      elBar.setAttribute('aria-valuenow', profil.xp);
      elBar.setAttribute('aria-valuemax', xpMax);
      elBar.setAttribute('aria-label', `${profil.xp} XP sur ${xpMax}`);
    }
  },

  /* ---- TOASTS ---- */

  /**
   * Affiche un toast XP animé (+20 XP ↑).
   */
  _toastXP(montant, raison) {
    if (montant <= 0) return;
    const label = raison ? `${raison} — ` : '';
    this._toast(`${label}+${montant} XP ✨`, 'xp', 2000);
  },

  /**
   * Affiche un toast générique.
   * @param {string} message
   * @param {'xp'|'success'|'error'} type
   * @param {number} duree - ms avant disparition
   */
  _toast(message, type = 'xp', duree = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'status');

    container.appendChild(toast);

    /* Suppression automatique */
    setTimeout(() => {
      toast.style.animation = `toastOut 300ms ease forwards`;
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duree);
  },
};

/* Exposer aussi les constantes utiles */
Gamification.NIVEAUX = NIVEAUX;
Gamification.BADGES_CONFIG = BADGES_CONFIG;

window.Gamification = Gamification;

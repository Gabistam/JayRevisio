'use client';

/* ================================================
   lib/AppContext.jsx — Study Jay v2
   Contexte global : profil, progression, badges,
   historique. Hydraté depuis MongoDB au login,
   synced après chaque session.
   ================================================ */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { calculerNiveau, verifierBadges } from '@/lib/gamification';
import { dateAujourdhui } from '@/lib/utils';

const STRUCTURE_DEFAUT = {
  profil: {
    xp: 0, niveau: 1,
    brevet_date: '2026-04-08',
    streak_jours: 0,
    derniere_session: null,
  },
  progression: {
    'maths':           { score_global: 0, questions_vues: [], questions_ratees: [], chapitres: {} },
    'histoire-geo':    { score_global: 0, questions_vues: [], questions_ratees: [], chapitres: {} },
    'physique-chimie': { score_global: 0, questions_vues: [], questions_ratees: [], chapitres: {} },
    'svt':             { score_global: 0, questions_vues: [], questions_ratees: [], chapitres: {} },
  },
  badges: [],
  historique: [],
};

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const { data: session, status } = useSession();
  const [data, setData]       = useState(STRUCTURE_DEFAUT);
  const [toasts, setToasts]   = useState([]);
  const [syncing, setSyncing] = useState(false);

  /* ---- Hydratation depuis MongoDB au login ---- */
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/sync')
      .then(r => r.json())
      .then(remote => {
        if (remote.profil) {
          setData({
            profil:      remote.profil,
            progression: remote.progression || STRUCTURE_DEFAUT.progression,
            badges:      remote.badges      || [],
            historique:  remote.historique  || [],
          });
        }
      })
      .catch(err => console.error('[AppContext] hydratation:', err));
  }, [status]);

  /* ---- Toast ---- */
  const ajouterToast = useCallback((message, type = 'xp') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  /* ---- Ajouter XP ---- */
  const ajouterXP = useCallback((montant, raison = '') => {
    setData(prev => {
      const xpNouv   = prev.profil.xp + montant;
      const niveauNouv = calculerNiveau(xpNouv);
      const monteeNiv  = niveauNouv > prev.profil.niveau;
      if (monteeNiv) {
        ajouterToast(`⬆️ Niveau ${niveauNouv} atteint !`, 'xp');
      }
      if (montant > 0) ajouterToast(`${raison ? raison + ' — ' : ''}+${montant} XP ✨`, 'xp');
      return {
        ...prev,
        profil: { ...prev.profil, xp: xpNouv, niveau: niveauNouv },
      };
    });
  }, [ajouterToast]);

  /* ---- Enregistrer une session de quiz ---- */
  const enregistrerSession = useCallback(async (sessionData) => {
    const {
      matiere, chapitre, score_bonnes, nb_questions,
      xp_gagne, duree_s, defi_gagne,
      idsVues, idsRatees, combo_max, parfait,
    } = sessionData;

    const auj = dateAujourdhui();

    setData(prev => {
      /* Mise à jour progression */
      const prog = { ...(prev.progression[matiere] || STRUCTURE_DEFAUT.progression.maths) };
      const vuesSet   = new Set([...prog.questions_vues,  ...idsVues]);
      const rateesSet = new Set([...prog.questions_ratees, ...idsRatees]);
      for (const id of idsVues) {
        if (!idsRatees.includes(id)) rateesSet.delete(id);
      }

      const chapitres = { ...prog.chapitres };
      if (!chapitres[chapitre]) chapitres[chapitre] = { score: 0, questions_vues: 0 };
      const ch = chapitres[chapitre];
      const ancienTotal  = ch.questions_vues || 0;
      const ancienBonnes = Math.round((ch.score / 100) * ancienTotal);
      const nvTotal  = ancienTotal + nb_questions;
      const nvBonnes = ancienBonnes + score_bonnes;
      chapitres[chapitre] = {
        score: nvTotal > 0 ? Math.round((nvBonnes / nvTotal) * 100) : 0,
        questions_vues: nvTotal,
      };

      const entrees = Object.values(chapitres).filter(c => c.questions_vues > 0);
      const scoreGlobal = entrees.length
        ? Math.round(entrees.reduce((s, c) => s + c.score, 0) / entrees.length)
        : 0;

      /* Streak */
      const profil   = { ...prev.profil };
      const dernier  = profil.derniere_session;
      const diffJours = dernier
        ? Math.round((new Date(auj) - new Date(dernier)) / 86400000)
        : null;
      if (diffJours === null || diffJours > 1) profil.streak_jours = 1;
      else if (diffJours === 1) profil.streak_jours = (profil.streak_jours || 0) + 1;
      profil.derniere_session = auj;

      /* XP */
      profil.xp += xp_gagne;
      profil.niveau = calculerNiveau(profil.xp);

      /* Historique */
      const nouvelleSession = {
        matiere, chapitre, score_bonnes, nb_questions,
        xp_gagne, duree_s, defi_gagne, date: auj,
      };
      const historique = [nouvelleSession, ...prev.historique].slice(0, 100);

      /* Badges */
      const nvBadges = verifierBadges(
        { combo_max, parfaite: parfait },
        profil,
        historique,
        prev.badges
      );
      const badges = [...prev.badges, ...nvBadges];
      nvBadges.forEach(id => ajouterToast(`🏅 Badge débloqué : ${id} !`, 'xp'));

      return {
        profil,
        progression: {
          ...prev.progression,
          [matiere]: {
            ...prog,
            score_global: scoreGlobal,
            questions_vues:   [...vuesSet],
            questions_ratees: [...rateesSet],
            chapitres,
          },
        },
        badges,
        historique,
      };
    });

    /* Sync MongoDB en arrière-plan */
    setSyncing(true);
    try {
      await fetch('/api/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          profil:      data.profil,
          progression: data.progression,
          badges:      data.badges,
          historique:  data.historique,
        }),
      });
    } catch (e) {
      console.error('[AppContext] sync:', e);
    } finally {
      setSyncing(false);
    }
  }, [data, ajouterToast]);

  /* ---- Reset ---- */
  const reset = useCallback(async () => {
    setData(STRUCTURE_DEFAUT);
  }, []);

  return (
    <AppCtx.Provider value={{
      ...data,
      session,
      syncing,
      toasts,
      ajouterXP,
      enregistrerSession,
      ajouterToast,
      reset,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider');
  return ctx;
}

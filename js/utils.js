/* ================================================
   utils.js — Study Jay
   Helpers partagés (implémentés progressivement)
   ================================================ */

'use strict';

/* Stub Sprint 1 — sera complété aux Sprints suivants */
const Utils = {
  /** Formate une date en français : "12 mars 2026" */
  formaterDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  },

  /** Formate une date courte : "12/03/2026" */
  formaterDateCourte(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR');
  },

  /** Calcule le nombre de jours entre aujourd'hui et une date cible */
  joursAvant(dateStr) {
    const cible = new Date(dateStr + 'T00:00:00');
    const auj = new Date();
    const debut = new Date(auj.getFullYear(), auj.getMonth(), auj.getDate());
    const fin = new Date(cible.getFullYear(), cible.getMonth(), cible.getDate());
    return Math.max(Math.ceil((fin - debut) / 86400000), 0);
  },

  /** Clamp : valeur entre min et max */
  clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  },

  /** Mélange un tableau (Fisher-Yates) */
  melanger(tableau) {
    const arr = [...tableau];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  /** Renvoie la date du jour au format YYYY-MM-DD */
  dateAujourdhui() {
    return new Date().toISOString().slice(0, 10);
  },
};

window.Utils = Utils;

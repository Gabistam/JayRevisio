/* ================================================
   lib/utils.js — Study Jay v2
   Port de js/utils.js de la v1
   ================================================ */

export function dateAujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

export function joursAvant(dateStr) {
  const cible = new Date(dateStr + 'T00:00:00');
  const auj   = new Date();
  auj.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((cible - auj) / 86400000));
}

export function formaterDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function formaterDateCourte(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short',
  });
}

export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

export function melanger(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

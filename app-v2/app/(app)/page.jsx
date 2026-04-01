'use client';

import Link from 'next/link';
import { useApp } from '@/lib/AppContext';
import { BADGES_CONFIG } from '@/lib/gamification';
import { joursAvant, formaterDate, formaterDateCourte, dateAujourdhui } from '@/lib/utils';
import { useEffect, useState } from 'react';

const MATIERES = [
  { id: 'maths',           label: 'Maths',          icon: '📐', css: 'matiere-card--maths'    },
  { id: 'histoire-geo',    label: 'Histoire-Géo',   icon: '🗺️', css: 'matiere-card--histoire' },
  { id: 'physique-chimie', label: 'Physique-Chimie',icon: '⚗️', css: 'matiere-card--physique' },
  { id: 'svt',             label: 'SVT',             icon: '🌿', css: 'matiere-card--svt'      },
];

export default function DashboardPage() {
  const { profil, progression, badges, historique } = useApp();
  const [defi, setDefi] = useState(null);

  const dateBrevet = profil.brevet_date || '2026-04-08';
  const jours      = joursAvant(dateBrevet);

  /* Progression annuelle */
  const debut    = new Date('2025-09-01');
  const fin      = new Date(dateBrevet);
  const pctAnnee = Math.min(100, Math.round(((Date.now() - debut) / (fin - debut)) * 100));

  /* Points faibles */
  const pointsFaibles = [];
  for (const [matiere, prog] of Object.entries(progression)) {
    for (const [chapitre, stats] of Object.entries(prog.chapitres || {})) {
      if (stats.questions_vues > 0 && stats.score < 50) {
        pointsFaibles.push({ matiere, chapitre, score: stats.score });
      }
    }
  }
  pointsFaibles.sort((a, b) => a.score - b.score);

  /* Défi du jour */
  useEffect(() => {
    const MATIERES_DEFI = ['maths', 'histoire-geo', 'physique-chimie', 'svt'];
    const RANGES = {
      'maths':           { min: 1,   max: 100 },
      'histoire-geo':    { min: 201, max: 300 },
      'physique-chimie': { min: 301, max: 400 },
      'svt':             { min: 401, max: 500 },
    };
    const auj  = dateAujourdhui();
    const seed = auj.replace(/-/g, '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const mat  = MATIERES_DEFI[seed % 4];
    const range = RANGES[mat];
    const qid   = range.min + (seed % (range.max - range.min + 1));

    fetch(`/data/${mat}.json`)
      .then(r => r.json())
      .then(data => {
        const q = data.find(q => q.id === qid) || data[0];
        setDefi({ matiere: mat, question: q });
      })
      .catch(() => setDefi(null));
  }, []);

  const badgesAvecEtat = BADGES_CONFIG.map(b => ({
    ...b, debloque: badges.includes(b.id),
  }));

  return (
    <>
      {/* ---- BANNIÈRE BREVET ---- */}
      <div className="brevet-banner" role="region" aria-label="Compte à rebours Brevet">
        <div className="brevet-banner__left">
          <span className="brevet-banner__icon">🎓</span>
          <div className="brevet-banner__text">
            <span className="brevet-banner__titre">Brevet blanc dans</span>
            <span className="brevet-banner__jours">
              {jours === 0 ? "C'est aujourd'hui !" : `${jours} jour${jours > 1 ? 's' : ''}`}
            </span>
            <span className="brevet-banner__date">{formaterDate(dateBrevet)}</span>
          </div>
        </div>
        <div className="brevet-banner__progress">
          <span className="brevet-banner__progress-label">Progression annuelle</span>
          <div className="progress-bar" role="progressbar" aria-valuenow={pctAnnee} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar__fill" style={{ width: `${pctAnnee}%`, background: 'linear-gradient(90deg, #7C3AED, #a855f7)' }} />
          </div>
        </div>
      </div>

      {/* ---- STREAK ---- */}
      <div className="streak-banner" aria-label="Série de jours">
        <span className="streak-banner__icon">🔥</span>
        <p className="streak-banner__text">
          {profil.streak_jours === 0
            ? 'Lance ton premier quiz pour démarrer ta série ! 🚀'
            : <>Série en cours : <span className="streak-banner__count">{profil.streak_jours} jour{profil.streak_jours > 1 ? 's' : ''}</span> — Reviens demain !</>
          }
        </p>
      </div>

      {/* ---- MATIÈRES ---- */}
      <section aria-labelledby="titre-matieres">
        <h2 className="section-title" id="titre-matieres">
          <span className="title-icon">📖</span> Mes matières
        </h2>
        <div className="matieres-grid" role="list">
          {MATIERES.map(mat => {
            const prog        = progression[mat.id] || {};
            const score       = prog.score_global || 0;
            const dernSession = historique.find(s => s.matiere === mat.id);
            return (
              <Link
                key={mat.id}
                href={`/matiere/${mat.id}`}
                className={`matiere-card ${mat.css}`}
                role="listitem"
                aria-label={`${mat.label} — Score ${score}%`}
              >
                <div className="matiere-card__header">
                  <span className="matiere-card__icon">{mat.icon}</span>
                  <span className="matiere-card__nom">{mat.label}</span>
                </div>
                <div className="matiere-card__score">
                  <span className="matiere-card__score-pct">{score}%</span>
                  <span className="matiere-card__score-label">score global</span>
                </div>
                <div className="matiere-card__progress">
                  <div className="progress-bar" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar__fill" style={{ width: `${score}%` }} />
                  </div>
                </div>
                <p className="matiere-card__session">
                  {dernSession
                    ? <><strong>{formaterDateCourte(dernSession.date)}</strong> — {dernSession.score_bonnes}/{dernSession.nb_questions}</>
                    : <span>Aucune session</span>
                  }
                </p>
                <span className="matiere-card__btn" aria-hidden="true">Réviser →</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---- DÉFI DU JOUR ---- */}
      <section className="defi-du-jour" aria-labelledby="titre-defi">
        <div className="defi-du-jour__header">
          <h2 className="defi-du-jour__titre" id="titre-defi"><span>⚡</span> Défi du jour</h2>
          <span className="defi-du-jour__xp">+50 XP</span>
        </div>
        <p className="defi-du-jour__enonce">
          {defi ? defi.question.enonce : 'Chargement du défi...'}
        </p>
        <div className="defi-du-jour__actions">
          {defi && (
            <Link
              href={`/quiz?matiere=${defi.matiere}&defi=1&question_id=${defi.question.id}`}
              className="btn btn--primary"
            >
              ⚡ Relever le défi
            </Link>
          )}
        </div>
      </section>

      {/* ---- POINTS FAIBLES ---- */}
      <section className="points-faibles" aria-labelledby="titre-faibles">
        <h2 className="section-title" id="titre-faibles">
          <span className="title-icon">🎯</span> Points à retravailler
        </h2>
        {pointsFaibles.length === 0 ? (
          <div className="empty-state" id="faibles-empty">
            <span className="empty-state__icon">🏆</span>
            <p className="empty-state__text">Aucun point faible détecté.<br />Continue comme ça !</p>
          </div>
        ) : (
          <div className="faible-list" role="list">
            {pointsFaibles.slice(0, 5).map(item => (
              <div key={`${item.matiere}-${item.chapitre}`} className="faible-item" role="listitem">
                <span className={`faible-item__matiere-dot faible-item__matiere-dot--${item.matiere.replace('physique-chimie', 'physique')}`} />
                <div className="faible-item__info">
                  <p className="faible-item__chapitre">{item.chapitre.charAt(0).toUpperCase() + item.chapitre.slice(1).replace(/-/g, ' ')}</p>
                  <p className="faible-item__matiere-label">{item.matiere}</p>
                </div>
                <span className="faible-item__score">{item.score}%</span>
                <Link href={`/matiere/${item.matiere}`} className="faible-item__btn">Retravailler</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- BADGES ---- */}
      <section className="badges-section" aria-labelledby="titre-badges">
        <h2 className="section-title" id="titre-badges">
          <span className="title-icon">🏅</span> Badges
        </h2>
        <div className="badges-list" role="list">
          {badgesAvecEtat.map(b => (
            <div
              key={b.id}
              className={`badge-card${b.debloque ? '' : ' badge-card--locked'}`}
              role="listitem"
              aria-label={`${b.nom} — ${b.debloque ? 'débloqué' : 'verrouillé'}`}
            >
              <span className="badge-card__icon">{b.emoji}</span>
              <span className="badge-card__nom">{b.nom}</span>
              <span className="badge-card__desc">{b.description}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/AppContext';

const MATIERES_CONFIG = {
  'maths':           { label: 'Maths',           icon: '📐', couleur: 'var(--color-maths)'    },
  'histoire-geo':    { label: 'Histoire-Géo',    icon: '🗺️', couleur: 'var(--color-histoire)' },
  'physique-chimie': { label: 'Physique-Chimie', icon: '⚗️', couleur: 'var(--color-physique)' },
  'svt':             { label: 'SVT',              icon: '🌿', couleur: 'var(--color-svt)'      },
};

export default function MatierePage() {
  const { slug }   = useParams();
  const router     = useRouter();
  const { progression } = useApp();
  const [chapitres, setChapitres] = useState([]);
  const [ouvert, setOuvert]       = useState(null);
  const [erreurs, setErreurs]     = useState([]);

  const config = MATIERES_CONFIG[slug];

  /* Charger les questions pour extraire chapitres + erreurs */
  useEffect(() => {
    if (!slug) return;
    fetch(`/data/${slug}.json`)
      .then(r => r.json())
      .then(questions => {
        /* Chapitres uniques */
        const map = {};
        for (const q of questions) {
          if (!map[q.chapitre]) map[q.chapitre] = [];
          map[q.chapitre].push(q);
        }
        setChapitres(Object.entries(map).map(([nom, qs]) => ({ nom, questions: qs })));

        /* Questions ratées */
        const prog = progression[slug] || {};
        const rateesIds = new Set(prog.questions_ratees || []);
        const rateesQ   = questions.filter(q => rateesIds.has(q.id));
        setErreurs(rateesQ.slice(0, 10));
      })
      .catch(() => {});
  }, [slug, progression]);

  if (!config) {
    return <p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Matière introuvable.</p>;
  }

  const prog        = progression[slug] || {};
  const scoreGlobal = prog.score_global || 0;
  const nbVues      = (prog.questions_vues || []).length;
  const nbRatees    = (prog.questions_ratees || []).length;
  const chapProgMap = prog.chapitres || {};

  return (
    <>
      {/* ---- ACCENT BAR ---- */}
      <div className="matiere-accent-bar" style={{ background: config.couleur }} />

      {/* ---- HEADER ---- */}
      <div className="matiere-header" style={{ '--matiere-color': config.couleur }}>
        <div className="matiere-header__left">
          <span className="matiere-header__emoji">{config.icon}</span>
          <h1 className="matiere-header__nom">{config.label}</h1>
          <p className="matiere-header__sous-titre">{chapitres.length} chapitre{chapitres.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/" className="matiere-header__retour">← Retour</Link>
      </div>

      {/* ---- MODES ---- */}
      <section className="modes-section" aria-labelledby="titre-modes">
        <p className="modes-section__titre" id="titre-modes">Choisir un mode</p>
        <div className="modes-grid">
          <Link href={`/quiz?matiere=${slug}&mode=revision`} className="mode-card" style={{ '--matiere-color': config.couleur }}>
            <span className="mode-card__xp-badge">+10 XP</span>
            <span className="mode-card__icon">📖</span>
            <span className="mode-card__label">Révision</span>
            <span className="mode-card__desc">Toutes les questions, sans limite de temps</span>
          </Link>
          <Link href={`/quiz?matiere=${slug}&mode=entrainement`} className="mode-card" style={{ '--matiere-color': config.couleur }}>
            <span className="mode-card__xp-badge">+20 XP</span>
            <span className="mode-card__icon">🎯</span>
            <span className="mode-card__label">Entraînement</span>
            <span className="mode-card__desc">10 questions mixées, score calculé</span>
          </Link>
          <Link href={`/quiz?matiere=${slug}&mode=chrono`} className="mode-card mode-card--chrono">
            <span className="mode-card__xp-badge">+35 XP</span>
            <span className="mode-card__icon">⏱️</span>
            <span className="mode-card__label">Chrono</span>
            <span className="mode-card__desc">30 s par question — bonus vitesse</span>
          </Link>
        </div>
      </section>

      {/* ---- STATS ---- */}
      <section className="matiere-stats" aria-labelledby="titre-stats" style={{ '--matiere-color': config.couleur }}>
        <p className="matiere-stats__titre" id="titre-stats">Mes statistiques</p>
        <div className="stats-row">
          <div className="stat-block">
            <span className="stat-block__valeur">{scoreGlobal}%</span>
            <span className="stat-block__label">Score global</span>
          </div>
          <div className="stat-block">
            <span className="stat-block__valeur">{nbVues}</span>
            <span className="stat-block__label">Questions vues</span>
          </div>
          <div className="stat-block">
            <span className="stat-block__valeur">{nbRatees}</span>
            <span className="stat-block__label">À retravailler</span>
          </div>
        </div>
      </section>

      {/* ---- CHAPITRES ---- */}
      <section className="chapitres-section" aria-labelledby="titre-chapitres" style={{ '--matiere-color': config.couleur }}>
        <p className="chapitres-section__titre" id="titre-chapitres">Chapitres</p>
        <div className="chapitres-liste">
          {chapitres.map(ch => {
            const chProg  = chapProgMap[ch.nom] || { score: 0, questions_vues: 0 };
            const isOpen  = ouvert === ch.nom;
            return (
              <div
                key={ch.nom}
                className={`chapitre-item${isOpen ? ' open' : ''}`}
              >
                <div
                  className="chapitre-header"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => setOuvert(isOpen ? null : ch.nom)}
                  onKeyDown={e => e.key === 'Enter' && setOuvert(isOpen ? null : ch.nom)}
                >
                  <div className="chapitre-info">
                    <span className="chapitre-nom">
                      {ch.nom.charAt(0).toUpperCase() + ch.nom.slice(1).replace(/_/g, ' ')}
                    </span>
                    <div className="chapitre-score-bar-wrapper">
                      <div className="chapitre-score-bar" style={{ width: `${chProg.score}%` }} />
                    </div>
                  </div>
                  <span className="chapitre-score-label">{chProg.score}%</span>
                  <span className="chapitre-chevron">▼</span>
                </div>

                {isOpen && (
                  <div className="chapitre-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-5) var(--space-5)', borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="chapitre-stats-mini">
                      {ch.questions.length} question{ch.questions.length > 1 ? 's' : ''} •{' '}
                      {chProg.questions_vues} vue{chProg.questions_vues !== 1 ? 's' : ''}
                    </div>
                    <div className="chapitre-actions">
                      <Link
                        href={`/quiz?matiere=${slug}&chapitre=${ch.nom}&mode=revision`}
                        className="btn btn--secondary"
                      >
                        Réviser
                      </Link>
                      <Link
                        href={`/quiz?matiere=${slug}&chapitre=${ch.nom}&mode=entrainement`}
                        className="btn btn--primary"
                      >
                        S'entraîner
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- MES ERREURS ---- */}
      {erreurs.length > 0 && (
        <section className="erreurs-section" aria-labelledby="titre-erreurs">
          <p className="erreurs-section__titre" id="titre-erreurs">
            Mes erreurs
            <span className="erreurs-section__badge">{erreurs.length}</span>
          </p>
          <div className="erreurs-liste">
            {erreurs.map(q => (
              <div key={q.id} className="erreur-item">
                <div>
                  <p className="erreur-item__enonce">{q.enonce}</p>
                  <p className="erreur-item__chapitre">{q.chapitre.replace(/_/g, ' ')}</p>
                </div>
                <Link href={`/quiz?matiere=${slug}&mode=revision&question_id=${q.id}`} className="btn btn--secondary">
                  Revoir
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

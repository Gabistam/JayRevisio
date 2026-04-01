'use client';

import { useApp } from '@/lib/AppContext';
import { BADGES_CONFIG, getNiveauConfig, getPalierSuivant, getPctProgression, NIVEAUX } from '@/lib/gamification';
import { formaterDate, formaterDateCourte } from '@/lib/utils';

const MATIERE_LABELS = {
  'maths':           { label: 'Maths',           icon: '📐' },
  'histoire-geo':    { label: 'Histoire-Géo',    icon: '🗺️' },
  'physique-chimie': { label: 'Physique-Chimie', icon: '⚗️' },
  'svt':             { label: 'SVT',              icon: '🌿' },
};

export default function ProfilPage() {
  const { profil, progression, badges, historique, session, reset } = useApp();

  const config   = getNiveauConfig(profil.niveau);
  const palier   = getPalierSuivant(profil.xp);
  const pct      = getPctProgression(profil.xp);
  const xpMax    = palier ? palier.xp_requis : profil.xp;

  const badgesAvecEtat = BADGES_CONFIG.map(b => ({
    ...b, debloque: badges.includes(b.id),
  }));

  const totalQuestions = Object.values(progression).reduce((sum, p) => {
    return sum + (p.questions_vues || []).length;
  }, 0);

  const totalSessions = historique.length;

  return (
    <>
      {/* ---- HERO PROFIL ---- */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))',
        border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-6)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{config.emoji}</div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
          {session?.user?.name || session?.user?.email || 'Étudiant'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {config.nom} — Niveau {profil.niveau}
        </p>

        {/* Barre XP */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {profil.xp} XP
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {palier ? `${xpMax} XP pour ${palier.nom}` : 'Niveau max !'}
            </span>
          </div>
          <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar__fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7C3AED, #a855f7)' }} />
          </div>
        </div>
      </div>

      {/* ---- STATS GLOBALES ---- */}
      <section aria-labelledby="titre-stats" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="section-title" id="titre-stats">
          <span className="title-icon">📊</span> Statistiques
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
          {[
            { v: profil.xp, l: 'XP total' },
            { v: totalQuestions, l: 'Questions répondues' },
            { v: totalSessions, l: 'Sessions' },
            { v: profil.streak_jours, l: 'Série (jours)' },
            { v: badges.length, l: 'Badges' },
            { v: profil.derniere_session ? formaterDateCourte(profil.derniere_session) : '—', l: 'Dernière session' },
          ].map(({ v, l }) => (
            <div key={l} className="stat-block" style={{ '--matiere-color': 'var(--color-maths)' }}>
              <span className="stat-block__valeur" style={{ color: '#a78bfa' }}>{v}</span>
              <span className="stat-block__label">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---- PROGRESSION PAR MATIÈRE ---- */}
      <section aria-labelledby="titre-matieres-prog" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="section-title" id="titre-matieres-prog">
          <span className="title-icon">📖</span> Progression par matière
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {Object.entries(MATIERE_LABELS).map(([id, { label, icon }]) => {
            const prog  = progression[id] || {};
            const score = prog.score_global || 0;
            return (
              <div key={id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4) var(--space-5)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span>{icon}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{score}%</span>
                </div>
                <div className="progress-bar" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
                  <div className="progress-bar__fill" style={{ width: `${score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- NIVEAUX ---- */}
      <section aria-labelledby="titre-niveaux" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="section-title" id="titre-niveaux">
          <span className="title-icon">⬆️</span> Niveaux
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {NIVEAUX.map(n => {
            const atteint  = profil.xp >= n.xp_requis;
            const actuel   = n.niveau === profil.niveau;
            return (
              <div key={n.niveau} style={{
                background: actuel ? 'rgba(124,58,237,0.1)' : 'var(--bg-card)',
                border: `1px solid ${actuel ? 'rgba(124,58,237,0.4)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-5)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                opacity: atteint ? 1 : 0.4,
              }}>
                <span style={{ fontSize: '1.5rem' }}>{n.emoji}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    Niv. {n.niveau} — {n.nom}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  {n.xp_requis} XP
                </span>
                {atteint && <span style={{ color: 'var(--color-success)' }}>✓</span>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- BADGES ---- */}
      <section className="badges-section" aria-labelledby="titre-badges-profil" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="section-title" id="titre-badges-profil">
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

      {/* ---- HISTORIQUE ---- */}
      {historique.length > 0 && (
        <section aria-labelledby="titre-historique" style={{ marginBottom: 'var(--space-8)' }}>
          <h2 className="section-title" id="titre-historique">
            <span className="title-icon">🗓️</span> Historique des sessions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {historique.slice(0, 20).map((s, i) => {
              const mat = MATIERE_LABELS[s.matiere] || { label: s.matiere, icon: '📚' };
              return (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span>{mat.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                      {mat.label} — {s.chapitre.replace(/_/g, ' ')}
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      {formaterDateCourte(s.date)}
                    </p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                    {s.score_bonnes}/{s.nb_questions}
                  </span>
                  {s.xp_gagne > 0 && (
                    <span style={{ color: 'var(--color-xp)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                      +{s.xp_gagne} XP
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

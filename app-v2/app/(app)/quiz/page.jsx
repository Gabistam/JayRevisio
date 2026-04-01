'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useApp } from '@/lib/AppContext';
import { xpAvecBonus } from '@/lib/gamification';
import { melanger } from '@/lib/utils';

const CHRONO_MAX = 30;
const NB_QUESTIONS_ENTRAINEMENT = 10;

const MATIERE_LABELS = {
  'maths':           'Maths',
  'histoire-geo':    'Histoire-Géo',
  'physique-chimie': 'Physique-Chimie',
  'svt':             'SVT',
};

/* ------------------------------------------------
   Évaluation des réponses (tous types)
   ------------------------------------------------ */
function evaluerReponse(q, repUser) {
  switch (q.type) {
    case 'qcm': {
      const u = String(repUser).trim();
      const c = String(q.reponse).trim();
      if (u === c) return true;
      // SVT : reponse = "B" mais choix = "B. texte"
      if (/^[A-D]$/.test(c)) return u.startsWith(c + '.');
      if (/^[A-D]\./.test(u)) return c === u[0];
      return false;
    }
    case 'vrai_faux':
      return repUser === q.reponse;
    case 'calcul': {
      const n = parseFloat(String(repUser).replace(',', '.'));
      if (isNaN(n)) return false;
      return Math.abs(n - q.reponse) <= (q.tolerance ?? 0.01);
    }
    case 'reponse_courte':
      return String(repUser).trim().toLowerCase() === String(q.reponse).trim().toLowerCase();
    case 'texte_trous': {
      if (!Array.isArray(repUser)) return false;
      return repUser.every((v, i) =>
        String(v).trim().toLowerCase() === String(q.reponses[i]).trim().toLowerCase()
      );
    }
    case 'flashcard':
      return repUser === true;
    case 'association': {
      // repUser = { terme: definition } — doit correspondre à chaque paire
      if (!repUser || typeof repUser !== 'object') return false;
      return q.paires.every(p => repUser[p.terme] === p.definition);
    }
    case 'classification': {
      // repUser = { categorie: [items] }
      if (!repUser || typeof repUser !== 'object') return false;
      return Object.entries(q.correction).every(([cat, items]) => {
        const userItems = repUser[cat] || [];
        return items.length === userItems.length &&
          items.every(item => userItems.includes(item));
      });
    }
    case 'remise_ordre': {
      // repUser = tableau d'indices (ordre_correct)
      if (!Array.isArray(repUser)) return false;
      return JSON.stringify(repUser) === JSON.stringify(q.ordre_correct);
    }
    case 'frise_chrono': {
      // Même logique que remise_ordre
      if (!Array.isArray(repUser)) return false;
      return JSON.stringify(repUser) === JSON.stringify(q.ordre_correct);
    }
    default:
      return false;
  }
}

/* ------------------------------------------------
   Composant : Association (terme ↔ définition)
   ------------------------------------------------ */
function AssociationInput({ question, disabled, onValider }) {
  const definitions = melanger(question.paires.map(p => p.definition));
  const [selections, setSelections] = useState({});

  const handleSelect = (terme, def) => {
    if (disabled) return;
    setSelections(prev => ({ ...prev, [terme]: def }));
  };

  const pret = question.paires.every(p => selections[p.terme]);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {question.paires.map(p => (
          <div key={p.terme} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.75rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              minWidth: '130px',
              fontSize: 'var(--text-sm)',
            }}>
              {p.terme}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <select
              disabled={disabled}
              value={selections[p.terme] ?? ''}
              onChange={e => handleSelect(p.terme, e.target.value)}
              style={{
                flex: 1,
                background: 'var(--bg-input)',
                border: `2px solid ${
                  disabled
                    ? selections[p.terme] === p.definition
                      ? 'var(--color-success)'
                      : 'var(--color-error)'
                    : selections[p.terme] ? 'var(--color-maths)' : 'var(--border-default)'
                }`,
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '0.5rem 0.75rem',
                fontSize: 'var(--text-sm)',
              }}
            >
              <option value="">— choisir —</option>
              {definitions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        ))}
      </div>
      {!disabled && (
        <button
          className="btn btn--primary"
          disabled={!pret}
          onClick={() => onValider(selections)}
        >
          Valider
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------
   Composant : Classification (trier dans catégories)
   ------------------------------------------------ */
function ClassificationInput({ question, disabled, onValider }) {
  // Initialiser : tous les items dans une colonne "non classés"
  const [categorise, setCategorise] = useState(() =>
    Object.fromEntries(question.categories.map(c => [c, []]))
  );
  const [nonClasses, setNonClasses] = useState(() => melanger(question.items));

  const moveToCategory = (item, cat) => {
    if (disabled) return;
    setNonClasses(prev => prev.filter(i => i !== item));
    setCategorise(prev => ({ ...prev, [cat]: [...prev[cat], item] }));
  };

  const removeFromCategory = (item, cat) => {
    if (disabled) return;
    setCategorise(prev => ({ ...prev, [cat]: prev[cat].filter(i => i !== item) }));
    setNonClasses(prev => [...prev, item]);
  };

  const total = Object.values(categorise).reduce((s, arr) => s + arr.length, 0);
  const pret = total === question.items.length;

  return (
    <div>
      {/* Items non classés */}
      {nonClasses.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            À classer :
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {nonClasses.map(item => (
              <div key={item} style={{ position: 'relative' }}>
                <span style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.75rem',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}>
                  {item}
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', gap: '2px', marginLeft: '4px' }}>
                    {question.categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => moveToCategory(item, cat)}
                        style={{
                          background: 'var(--border-default)',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '1px 5px',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                        title={`Mettre dans ${cat}`}
                      >
                        {cat.slice(0, 3)}
                      </button>
                    ))}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catégories */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${question.categories.length}, 1fr)`, gap: '0.75rem', marginBottom: '1rem' }}>
        {question.categories.map(cat => (
          <div key={cat} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            minHeight: '100px',
          }}>
            <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
              {cat}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {categorise[cat].map(item => {
                const correct = disabled && question.correction[cat]?.includes(item);
                return (
                  <span
                    key={item}
                    onClick={() => removeFromCategory(item, cat)}
                    style={{
                      background: disabled
                        ? question.correction[cat]?.includes(item)
                          ? 'rgba(34,197,94,0.15)'
                          : 'rgba(239,68,68,0.15)'
                        : 'var(--bg-elevated)',
                      border: `1px solid ${disabled
                        ? question.correction[cat]?.includes(item)
                          ? 'var(--color-success)'
                          : 'var(--color-error)'
                        : 'var(--border-default)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.3rem 0.5rem',
                      fontSize: 'var(--text-xs)',
                      cursor: disabled ? 'default' : 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!disabled && (
        <button
          className="btn btn--primary"
          disabled={!pret}
          onClick={() => onValider(categorise)}
        >
          Valider
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------
   Composant : Remise en ordre / Frise chrono
   ------------------------------------------------ */
function RemiseOrdreInput({ question, disabled, onValider }) {
  const isFrise = question.type === 'frise_chrono';
  const labels  = isFrise ? question.evenements : question.items;
  const dates   = isFrise ? question.dates : null;

  const [ordre, setOrdre] = useState(() =>
    melanger(labels.map((_, i) => i))
  );

  const moveUp = (pos) => {
    if (pos === 0 || disabled) return;
    const o = [...ordre];
    [o[pos - 1], o[pos]] = [o[pos], o[pos - 1]];
    setOrdre(o);
  };

  const moveDown = (pos) => {
    if (pos === ordre.length - 1 || disabled) return;
    const o = [...ordre];
    [o[pos], o[pos + 1]] = [o[pos + 1], o[pos]];
    setOrdre(o);
  };

  return (
    <div>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        {isFrise ? 'Place les événements dans l\'ordre chronologique (du plus ancien au plus récent) :' : 'Remets dans le bon ordre avec ↑ ↓ :'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {ordre.map((itemIdx, pos) => {
          const correct = disabled && question.ordre_correct[pos] === itemIdx;
          return (
            <div key={itemIdx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: disabled
                ? correct ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'
                : 'var(--bg-elevated)',
              border: `1px solid ${disabled
                ? correct ? 'var(--color-success)' : 'var(--color-error)'
                : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.75rem',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                minWidth: '20px',
              }}>
                {pos + 1}.
              </span>
              <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                {labels[itemIdx]}
                {isFrise && disabled && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginLeft: '0.5rem' }}>
                    ({dates[itemIdx]})
                  </span>
                )}
              </span>
              {!disabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    onClick={() => moveUp(pos)}
                    disabled={pos === 0}
                    style={{ background: 'none', border: '1px solid var(--border-default)', borderRadius: '3px', cursor: pos === 0 ? 'default' : 'pointer', opacity: pos === 0 ? 0.3 : 1, padding: '0 4px', color: 'var(--text-secondary)', lineHeight: 1 }}
                  >▲</button>
                  <button
                    onClick={() => moveDown(pos)}
                    disabled={pos === ordre.length - 1}
                    style={{ background: 'none', border: '1px solid var(--border-default)', borderRadius: '3px', cursor: pos === ordre.length - 1 ? 'default' : 'pointer', opacity: pos === ordre.length - 1 ? 0.3 : 1, padding: '0 4px', color: 'var(--text-secondary)', lineHeight: 1 }}
                  >▼</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!disabled && (
        <button className="btn btn--primary" onClick={() => onValider(ordre)}>
          Valider l'ordre
        </button>
      )}
      {disabled && isFrise && (
        <div style={{ marginTop: '0.75rem' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Ordre correct :</p>
          {question.ordre_correct.map((itemIdx, pos) => (
            <p key={pos} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {pos + 1}. {labels[itemIdx]} — {dates[itemIdx]}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------
   Moteur principal
   ------------------------------------------------ */
function QuizEngine() {
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const { progression, enregistrerSession } = useApp();

  const matiere    = searchParams.get('matiere') || 'maths';
  const mode       = searchParams.get('mode') || 'revision';
  const chapitre   = searchParams.get('chapitre') || null;
  const questionId = searchParams.get('question_id') ? parseInt(searchParams.get('question_id')) : null;
  const isDefi     = searchParams.get('defi') === '1';

  const [questions, setQuestions]         = useState([]);
  const [idx, setIdx]                     = useState(0);
  const [reponse, setReponse]             = useState(null);
  const [trous, setTrous]                 = useState([]);
  const [flashRetourne, setFlashRetourne] = useState(false);
  const [feedback, setFeedback]           = useState(null);
  const [termine, setTermine]             = useState(false);
  const [resultats, setResultats]         = useState({ bonnes: 0, total: 0, xpGagne: 0 });
  const [chrono, setChrono]               = useState(CHRONO_MAX);
  const [comboMax, setComboMax]           = useState(0);
  const [combo, setCombo]                 = useState(0);
  const [debutSession, setDebutSession]   = useState(null);
  const [idsVues, setIdsVues]             = useState([]);
  const [idsRatees, setIdsRatees]         = useState([]);
  const chronoRef  = useRef(null);
  const validerRef = useRef(null);

  const isChrono = mode === 'chrono';

  /* ---- Charger les questions ---- */
  useEffect(() => {
    fetch(`/data/${matiere}.json`)
      .then(r => r.json())
      .then(data => {
        let pool = [...data];
        if (questionId) {
          const q = pool.find(q => q.id === questionId);
          setQuestions(q ? [q] : []);
          setDebutSession(Date.now());
          return;
        }
        if (chapitre) pool = pool.filter(q => q.chapitre === chapitre);
        if (mode === 'revision') {
          const prog    = progression[matiere] || {};
          const vues    = new Set(prog.questions_vues || []);
          const nonVues = pool.filter(q => !vues.has(q.id));
          pool = nonVues.length > 0 ? nonVues : melanger(pool);
        } else {
          pool = melanger(pool).slice(0, NB_QUESTIONS_ENTRAINEMENT);
        }
        setQuestions(pool);
        setDebutSession(Date.now());
      })
      .catch(() => setQuestions([]));
  }, [matiere, mode, chapitre, questionId]);

  /* ---- Chrono ---- */
  useEffect(() => {
    if (!isChrono || feedback || termine) return;
    if (questions.length === 0 || idx >= questions.length) return;
    setChrono(CHRONO_MAX);
    clearInterval(chronoRef.current);
    chronoRef.current = setInterval(() => {
      setChrono(prev => {
        if (prev <= 1) {
          clearInterval(chronoRef.current);
          if (validerRef.current) validerRef.current(null, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(chronoRef.current);
  }, [idx, questions.length, isChrono, feedback]);

  const question = questions[idx];

  /* ---- Valider ---- */
  const valider = useCallback((repOverride, timeout = false) => {
    if (!question || feedback) return;
    clearInterval(chronoRef.current);

    const rep = repOverride !== undefined ? repOverride : reponse;
    let correct = false;
    if (!timeout && rep !== null && rep !== undefined) {
      correct = evaluerReponse(question,
        question.type === 'texte_trous' ? trous : rep
      );
    }

    const xpBase = question.xp || 10;
    const xpQ    = correct
      ? (isChrono ? xpAvecBonus(xpBase, CHRONO_MAX - chrono, CHRONO_MAX) : xpBase)
      : 0;

    const nvCombo = correct ? combo + 1 : 0;
    setCombo(nvCombo);
    setComboMax(prev => Math.max(prev, nvCombo));
    setIdsVues(prev => [...prev, question.id]);
    if (!correct) setIdsRatees(prev => [...prev, question.id]);
    setResultats(prev => ({
      bonnes:  prev.bonnes  + (correct ? 1 : 0),
      total:   prev.total   + 1,
      xpGagne: prev.xpGagne + xpQ,
    }));
    setFeedback({ correct, explication: question.explication, xpQ });
  }, [question, feedback, reponse, trous, isChrono, chrono, combo]);

  validerRef.current = valider;

  /* ---- Suivante ---- */
  const suivante = useCallback(async () => {
    setFeedback(null);
    setReponse(null);
    setTrous([]);
    setFlashRetourne(false);

    if (idx >= questions.length - 1) {
      const dureeS = debutSession ? Math.round((Date.now() - debutSession) / 1000) : 0;
      await enregistrerSession({
        matiere,
        chapitre: chapitre || question?.chapitre || 'général',
        score_bonnes: resultats.bonnes,
        nb_questions: resultats.total,
        xp_gagne:     resultats.xpGagne,
        duree_s:      dureeS,
        defi_gagne:   isDefi && resultats.bonnes === resultats.total && resultats.total > 0,
        idsVues,
        idsRatees,
        combo_max: comboMax,
        parfait:   resultats.bonnes === resultats.total && resultats.total > 0,
      });
      setTermine(true);
    } else {
      setIdx(prev => prev + 1);
    }
  }, [idx, questions.length, resultats, debutSession, matiere, chapitre, question, isDefi, idsVues, idsRatees, comboMax, enregistrerSession]);

  /* ---- Clavier ---- */
  useEffect(() => {
    const h = (e) => { if (feedback && e.key === 'Enter') suivante(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [feedback, suivante]);

  /* ---- Écran de fin ---- */
  if (termine) {
    const { bonnes, total, xpGagne } = resultats;
    const pct    = total > 0 ? Math.round((bonnes / total) * 100) : 0;
    const parfait = bonnes === total && total > 0;
    return (
      <div id="quiz-zone">
        <div className="quiz-question" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {parfait ? '🏆' : pct >= 70 ? '✅' : '📚'}
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {parfait ? 'Parfait !' : pct >= 70 ? 'Bien joué !' : 'Continue à réviser !'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {bonnes}/{total} bonnes réponses — {pct}%
          </p>
          {xpGagne > 0 && (
            <div style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.5rem',
              display: 'inline-block',
              marginBottom: '1.5rem',
              color: 'var(--color-xp)',
              fontWeight: 700,
            }}>
              +{xpGagne} XP ✨
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn--secondary" onClick={() => router.push(`/matiere/${matiere}`)}>
              ← Retour à {MATIERE_LABELS[matiere] || matiere}
            </button>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>
              Rejouer 🔄
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div id="quiz-zone">
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Chargement…</p>
      </div>
    );
  }

  const pct = questions.length > 0 ? Math.round((idx / questions.length) * 100) : 0;
  const chronoPct = (chrono / CHRONO_MAX) * 100;
  const matCss = matiere === 'histoire-geo' ? 'histoire' : matiere === 'physique-chimie' ? 'physique' : matiere;

  return (
    <>
      {/* HEADER */}
      <div className={`quiz-header quiz-matiere--${matCss}`}>
        <button className="btn-retour" onClick={() => router.push(`/matiere/${matiere}`)}>← Retour</button>
        <div className="quiz-info">
          <span className="quiz-matiere-label">{MATIERE_LABELS[matiere]}</span>
          <span className="quiz-progression-badge">{idx + 1} / {questions.length}</span>
          <div className="quiz-xp-bar">
            <div className="quiz-xp-bar__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {combo >= 2 && (
          <span style={{ color: 'var(--color-xp)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
            🔥 ×{combo}
          </span>
        )}
      </div>

      {/* CHRONO */}
      {isChrono && (
        <div className="chrono-zone">
          <div className="chrono-bar-wrapper">
            <div className="chrono-bar" style={{
              width: `${chronoPct}%`,
              background: chrono <= 10 ? 'var(--color-error)' : 'var(--color-chrono-full)',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
          <span id="chrono-temps" style={{ color: chrono <= 10 ? 'var(--color-error)' : undefined }}>
            {chrono}s
          </span>
        </div>
      )}

      {/* QUESTION */}
      <div id="quiz-zone">
        <div className="quiz-question">
          <span className="question-type-badge">{question.type.replace(/_/g, ' ')}</span>

          {/* ---- FLASHCARD ---- */}
          {question.type === 'flashcard' && (
            <>
              <p className="flashcard-recto">{question.recto}</p>
              {flashRetourne && (
                <div className="flashcard-verso" style={{ whiteSpace: 'pre-line' }}>{question.verso}</div>
              )}
              {!flashRetourne && !feedback && (
                <button className="btn btn--secondary" style={{ marginTop: '1rem' }} onClick={() => setFlashRetourne(true)}>
                  Retourner la carte 🔄
                </button>
              )}
              {flashRetourne && !feedback && (
                <div className="flashcard-eval">
                  <button className="btn-savais" data-savais="true" onClick={() => valider(true)}>✅ Je savais</button>
                  <button className="btn-savais" data-savais="false" onClick={() => valider(false)}>❌ Je savais pas</button>
                </div>
              )}
            </>
          )}

          {/* ---- Tous les autres types ---- */}
          {question.type !== 'flashcard' && (
            <>
              <p className="question-enonce">{question.enonce}</p>

              {/* QCM */}
              {question.type === 'qcm' && (
                <div className="qcm-choix">
                  {question.choix.map((c, i) => (
                    <button
                      key={i}
                      className={`choix-btn${reponse === c ? ' selected' : ''}`}
                      style={feedback ? {
                        borderColor: evaluerReponse(question, c)
                          ? 'var(--color-success)'
                          : reponse === c ? 'var(--color-error)' : undefined,
                        background: evaluerReponse(question, c)
                          ? 'rgba(34,197,94,0.15)'
                          : reponse === c ? 'rgba(239,68,68,0.15)' : undefined,
                      } : undefined}
                      disabled={!!feedback}
                      onClick={() => { setReponse(c); if (!feedback) setTimeout(() => valider(c), 0); }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {/* VRAI / FAUX */}
              {question.type === 'vrai_faux' && (
                <div className="vf-btns">
                  <button className="btn-vf btn-vrai" disabled={!!feedback}
                    style={feedback ? { opacity: question.reponse === true ? 1 : 0.4 } : undefined}
                    onClick={() => valider(true)}>✅ Vrai</button>
                  <button className="btn-vf btn-faux" disabled={!!feedback}
                    style={feedback ? { opacity: question.reponse === false ? 1 : 0.4 } : undefined}
                    onClick={() => valider(false)}>❌ Faux</button>
                </div>
              )}

              {/* CALCUL / RÉPONSE COURTE */}
              {(question.type === 'calcul' || question.type === 'reponse_courte') && (
                <form className="input-reponse" onSubmit={e => { e.preventDefault(); valider(); }}>
                  <input
                    className="input-quiz"
                    type={question.type === 'calcul' ? 'number' : 'text'}
                    step="any"
                    placeholder={question.type === 'calcul' ? '0' : 'Ta réponse…'}
                    value={reponse ?? ''}
                    onChange={e => setReponse(e.target.value)}
                    disabled={!!feedback}
                    autoFocus={!feedback}
                  />
                  {question.unite && <span className="unite">{question.unite}</span>}
                  {!feedback && <button type="submit" className="btn btn--primary">Valider</button>}
                </form>
              )}

              {/* TEXTE À TROUS */}
              {question.type === 'texte_trous' && (
                <>
                  <div className="trous-inputs">
                    {question.reponses.map((_, i) => (
                      <input
                        key={i}
                        className="input-trou"
                        placeholder={`Trou ${i + 1}`}
                        value={trous[i] ?? ''}
                        onChange={e => { const t = [...trous]; t[i] = e.target.value; setTrous(t); }}
                        disabled={!!feedback}
                        autoFocus={i === 0 && !feedback}
                      />
                    ))}
                  </div>
                  {!feedback && (
                    <button
                      className="btn btn--primary"
                      onClick={() => valider()}
                      disabled={trous.filter(Boolean).length < question.reponses.length}
                    >
                      Valider
                    </button>
                  )}
                </>
              )}

              {/* ASSOCIATION */}
              {question.type === 'association' && (
                <AssociationInput
                  question={question}
                  disabled={!!feedback}
                  onValider={(sel) => { setReponse(sel); valider(sel); }}
                />
              )}

              {/* CLASSIFICATION */}
              {question.type === 'classification' && (
                <ClassificationInput
                  question={question}
                  disabled={!!feedback}
                  onValider={(cat) => { setReponse(cat); valider(cat); }}
                />
              )}

              {/* REMISE EN ORDRE / FRISE CHRONO */}
              {(question.type === 'remise_ordre' || question.type === 'frise_chrono') && (
                <RemiseOrdreInput
                  question={question}
                  disabled={!!feedback}
                  onValider={(ordre) => { setReponse(ordre); valider(ordre); }}
                />
              )}
            </>
          )}

          {/* ---- FEEDBACK ---- */}
          {feedback && (
            <div className={`feedback feedback--${feedback.correct ? 'correct' : 'incorrect'}`}>
              <p style={{ fontWeight: 700, marginBottom: feedback.explication ? '0.5rem' : 0 }}>
                {feedback.correct
                  ? `✅ Correct !${feedback.xpQ > 0 ? ` +${feedback.xpQ} XP` : ''}`
                  : '❌ Raté !'}
              </p>
              {!feedback.correct && !['flashcard', 'association', 'classification', 'remise_ordre', 'frise_chrono'].includes(question.type) && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Bonne réponse : <strong>
                    {question.type === 'texte_trous'
                      ? question.reponses.join(' / ')
                      : String(question.reponse)}
                  </strong>
                </p>
              )}
              {feedback.explication && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {feedback.explication}
                </p>
              )}
              <button
                className="btn btn--primary"
                style={{ marginTop: '1rem' }}
                onClick={suivante}
                autoFocus
              >
                {idx >= questions.length - 1 ? 'Voir les résultats →' : 'Question suivante →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div id="quiz-zone">
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Chargement…</p>
      </div>
    }>
      <QuizEngine />
    </Suspense>
  );
}

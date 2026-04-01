/* ================================================
   quiz-engine.js — Study Buddy
   Moteur de quiz complet Sprint 3 + Sprint 4
   Types : qcm, vrai_faux, texte_trous, calcul,
           reponse_courte, flashcard,
           association, remise_ordre, classification,
           frise_chrono (Sprint 4)
   ================================================ */

'use strict';

/* ------------------------------------------------
   ÉTAT INTERNE DE SESSION
   ------------------------------------------------ */
const _etat = {
  questionIndex: 0,
  questions:     [],
  bonnes:        [],    /* IDs des bonnes réponses */
  ratees:        [],    /* IDs des mauvaises réponses */
  combo:         0,
  combo_max:     0,
  xp:            0,
  debut_time:    null,
  config:        {},    /* copie du config passé à init() */
  chrono_timer:  null,  /* setInterval pour le défi chrono */
  chrono_restant: 0,
};

/* ------------------------------------------------
   QuizEngine — objet principal
   ------------------------------------------------ */
const QuizEngine = {

  /* ------------------------------------------------
     init(config)
     config : { matiere, chapitre, mode, questions }
     - questions peut être un tableau déjà chargé
       ou undefined (alors on le charge via fetch)
     ------------------------------------------------ */
  async init(config) {
    _etat.config        = config || {};
    _etat.questionIndex = 0;
    _etat.bonnes        = [];
    _etat.ratees        = [];
    _etat.combo         = 0;
    _etat.combo_max     = 0;
    _etat.xp            = 0;
    _etat.debut_time    = Date.now();

    /* Réinitialiser la session gamification */
    if (window.Gamification) Gamification.reinitSession();

    /* Si les questions sont déjà passées en config */
    if (config && Array.isArray(config.questions) && config.questions.length > 0) {
      _etat.questions = this._preparerQuestions(config.questions, config);
      return;
    }

    /* Sinon charger depuis le fichier JSON */
    const matiere = (config && config.matiere) ? config.matiere : 'maths';
    const fichier = `data/${matiere}.json`;

    try {
      const response = await fetch(fichier);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const toutes = await response.json();
      _etat.questions = this._preparerQuestions(toutes, config);
    } catch (err) {
      console.error('[QuizEngine] Impossible de charger les questions :', err);
      _etat.questions = [];
    }
  },

  /* ------------------------------------------------
     _preparerQuestions(toutes, config)
     Filtre par chapitre/mode, mélange, limite à 20
     ------------------------------------------------ */
  _preparerQuestions(toutes, config) {
    let liste = [...toutes];

    /* Filtre par chapitre */
    if (config && config.chapitre) {
      const chFiltres = Array.isArray(config.chapitre)
        ? config.chapitre
        : [config.chapitre];
      liste = liste.filter(q => chFiltres.includes(q.chapitre));
    }

    /* Mode entraînement : privilégier les questions ratées */
    if (config && config.mode === 'entrainement' && window.Storage) {
      const matiere   = config.matiere || 'maths';
      const prog      = Storage.getProgression(matiere);
      const idsRatees = prog ? prog.questions_ratees : [];

      if (idsRatees.length > 0) {
        const ratees = liste.filter(q => idsRatees.includes(q.id));
        const autres = Utils.melanger(liste.filter(q => !idsRatees.includes(q.id)));
        liste = [...Utils.melanger(ratees), ...autres];
      } else {
        liste = Utils.melanger(liste);
      }
    } else {
      liste = Utils.melanger(liste);
    }

    /* Limiter à 20 questions par session */
    return liste.slice(0, 20);
  },

  /* ------------------------------------------------
     demarrer()
     Affiche la première question
     ------------------------------------------------ */
  demarrer() {
    if (_etat.questions.length === 0) {
      this._afficherErreurChargement();
      return;
    }
    this._afficherQuestion(_etat.questionIndex);
  },

  /* ------------------------------------------------
     validerReponse(reponse)
     Valide la réponse courante, calcule l'XP
     ------------------------------------------------ */
  validerReponse(reponse) {
    if (_etat.questionIndex >= _etat.questions.length) return;

    const q       = _etat.questions[_etat.questionIndex];
    const correct = this._evaluerReponse(q, reponse);
    const xpBase  = q.xp || 10;

    /* XP avec bonus chrono si applicable */
    let xpGagne = xpBase;
    if (_etat.config.mode === 'chrono' && window.Gamification) {
      const tempsPris = 60 - _etat.chrono_restant;
      xpGagne = Gamification.xpAvecBonus(xpBase, tempsPris, 60);
    }

    /* Arrêter le chrono si actif */
    this._stopperChrono();

    if (correct) {
      _etat.bonnes.push(q.id);
      _etat.combo++;
      if (_etat.combo > _etat.combo_max) _etat.combo_max = _etat.combo;
      _etat.xp += xpGagne;
      if (window.Gamification) {
        Gamification.bonneReponse();
        Gamification.ajouterXP(xpGagne, 'Bonne réponse');
      }
    } else {
      _etat.ratees.push(q.id);
      _etat.combo = 0;
      if (window.Gamification) Gamification.mauvaiseReponse();
    }

    /* Mettre en évidence les choix corrects/incorrects */
    this._colorierChoix(q, reponse, correct);

    /* Afficher le feedback */
    this._afficherFeedback(q, reponse, correct, xpGagne);

    /* Mise à jour de la progression affichée */
    this._mettreAJourProgression();
  },

  /* ------------------------------------------------
     passerQuestion()
     Passe sans répondre
     ------------------------------------------------ */
  passerQuestion() {
    this._stopperChrono();
    const q = _etat.questions[_etat.questionIndex];
    if (q) _etat.ratees.push(q.id);
    this._questionSuivante();
  },

  /* ------------------------------------------------
     getStats()
     ------------------------------------------------ */
  getStats() {
    return {
      score_bonnes: _etat.bonnes.length,
      nb_questions: _etat.questions.length,
      xp_gagne:     _etat.xp,
      idsVues:      [..._etat.bonnes, ..._etat.ratees],
      idsRatees:    [..._etat.ratees],
      parfait:      _etat.ratees.length === 0 && _etat.questions.length > 0,
      combo_max:    _etat.combo_max,
    };
  },

  /* ================================================
     ÉVALUATION DES RÉPONSES
     ================================================ */
  _evaluerReponse(q, reponse) {
    switch (q.type) {

      case 'qcm':
        return String(reponse).trim() === String(q.reponse).trim();

      case 'vrai_faux':
        /* reponse est un booléen ou une string 'true'/'false' */
        return String(reponse) === String(q.reponse);

      case 'calcul': {
        const valeur    = parseFloat(String(reponse).replace(',', '.'));
        const attendu   = parseFloat(q.reponse);
        const tolerance = q.tolerance !== undefined ? q.tolerance : 0.01;
        if (isNaN(valeur)) return false;
        return Math.abs(valeur - attendu) <= tolerance;
      }

      case 'reponse_courte':
        return String(reponse).trim().toLowerCase() ===
               String(q.reponse).trim().toLowerCase();

      case 'texte_trous': {
        /* reponse est un tableau de strings */
        const attendus = q.reponses || [];
        if (!Array.isArray(reponse)) return false;
        return attendus.every((rep, i) =>
          String(reponse[i] || '').trim().toLowerCase() ===
          String(rep).trim().toLowerCase()
        );
      }

      case 'flashcard':
        /* Auto-évaluation : l'utilisateur dit s'il savait */
        return reponse === true || reponse === 'true';

      /* Types Sprint 4 */
      case 'association': {
        /* reponse : tableau de { terme_id, def_id } */
        const paires = q.paires || [];
        if (!Array.isArray(reponse)) return false;
        return paires.every((paire, i) => {
          const rep = reponse.find(r => r.terme_id === i);
          return rep && rep.def_id === i;
        });
      }

      case 'remise_ordre': {
        /* reponse : tableau d'indices origIndex dans l'ordre actuel */
        if (!Array.isArray(reponse)) return false;
        const correct = q.ordre_correct || [];
        return correct.every((val, idx) => reponse[idx] === val);
      }

      case 'classification': {
        /* reponse : objet { categorie: [items...] } */
        if (typeof reponse !== 'object' || !reponse) return false;
        const correction = q.correction || {};
        return Object.entries(correction).every(([cat, items]) => {
          const donne   = (reponse[cat] || []).slice().sort();
          const attendu = [...items].sort();
          return JSON.stringify(donne) === JSON.stringify(attendu);
        });
      }

      case 'frise_chrono': {
        /* reponse : tableau d'indices dans l'ordre déposé */
        if (!Array.isArray(reponse)) return false;
        const correct = q.ordre_correct || [];
        return JSON.stringify(reponse) === JSON.stringify(correct);
      }

      default:
        return false;
    }
  },

  /* ================================================
     RENDU HTML DES QUESTIONS
     ================================================ */
  _afficherQuestion(index) {
    const zone = document.getElementById('quiz-zone');
    if (!zone) return;

    if (index >= _etat.questions.length) {
      this._finSession();
      return;
    }

    const q = _etat.questions[index];

    /* Mettre à jour le header */
    this._mettreAJourProgression();

    /* Générer le HTML selon le type */
    let html = '';
    switch (q.type) {
      case 'qcm':            html = this._renduQCM(q);           break;
      case 'vrai_faux':      html = this._renduVraiFaux(q);      break;
      case 'calcul':         html = this._renduCalcul(q);        break;
      case 'reponse_courte': html = this._renduReponseCourte(q); break;
      case 'texte_trous':    html = this._renduTexteTrous(q);    break;
      case 'flashcard':      html = this._renduFlashcard(q);     break;
      case 'association':    html = this._renduAssociation(q);   break;
      case 'remise_ordre':   html = this._renduRemiseOrdre(q);   break;
      case 'classification': html = this._renduClassification(q);break;
      case 'frise_chrono':   html = this._renduFrise(q);         break;
      default:               html = this._renduQCM(q);           break;
    }

    zone.innerHTML = html;

    /* Attacher les listeners */
    this._attacherListeners(q);

    /* Démarrer le chrono si mode défi */
    if (_etat.config.mode === 'chrono') {
      this._demarrerChrono(60);
    }
  },

  /* ---- QCM ---- */
  _renduQCM(q) {
    const choixMelanges = q.choix ? Utils.melanger([...q.choix]) : [];
    const choixHTML = choixMelanges.map(c => `
      <button class="choix-btn" data-valeur="${this._escHtml(c)}" type="button">
        ${this._escHtml(c)}
      </button>
    `).join('');

    return `
      <div class="quiz-question">
        <span class="question-type-badge">QCM</span>
        <p class="question-enonce">${this._escHtml(q.enonce)}</p>
        <div class="qcm-choix" role="radiogroup" aria-label="Choix de réponse">
          ${choixHTML}
        </div>
        <button class="btn-passer" type="button" onclick="window.QuizEngine.passerQuestion()">Passer cette question</button>
      </div>
    `;
  },

  /* ---- VRAI / FAUX ---- */
  _renduVraiFaux(q) {
    return `
      <div class="quiz-question">
        <span class="question-type-badge">Vrai ou Faux</span>
        <p class="question-enonce">${this._escHtml(q.enonce)}</p>
        <div class="vf-btns">
          <button class="btn-vf btn-vrai" data-valeur="true" type="button">
            ✅ Vrai
          </button>
          <button class="btn-vf btn-faux" data-valeur="false" type="button">
            ❌ Faux
          </button>
        </div>
        <button class="btn-passer" type="button" onclick="window.QuizEngine.passerQuestion()">Passer cette question</button>
      </div>
    `;
  },

  /* ---- CALCUL ---- */
  _renduCalcul(q) {
    const uniteHTML = q.unite
      ? `<span class="unite">${this._escHtml(q.unite)}</span>`
      : '';
    return `
      <div class="quiz-question">
        <span class="question-type-badge">Calcul</span>
        <p class="question-enonce">${this._escHtml(q.enonce)}</p>
        <div class="input-reponse">
          <input
            type="text"
            id="input-reponse"
            class="input-quiz"
            placeholder="Ta réponse..."
            autocomplete="off"
            inputmode="decimal"
            aria-label="Saisir ta réponse"
          />
          ${uniteHTML}
        </div>
        <button class="btn btn--primary" id="btn-valider-input" type="button">Valider</button>
        <button class="btn-passer" type="button" onclick="window.QuizEngine.passerQuestion()">Passer cette question</button>
      </div>
    `;
  },

  /* ---- RÉPONSE COURTE ---- */
  _renduReponseCourte(q) {
    return `
      <div class="quiz-question">
        <span class="question-type-badge">Réponse courte</span>
        <p class="question-enonce">${this._escHtml(q.enonce)}</p>
        <div class="input-reponse">
          <input
            type="text"
            id="input-reponse"
            class="input-quiz"
            placeholder="Ta réponse..."
            autocomplete="off"
            aria-label="Saisir ta réponse"
          />
        </div>
        <button class="btn btn--primary" id="btn-valider-input" type="button">Valider</button>
        <button class="btn-passer" type="button" onclick="window.QuizEngine.passerQuestion()">Passer cette question</button>
      </div>
    `;
  },

  /* ---- TEXTE À TROUS ---- */
  _renduTexteTrous(q) {
    /* Remplacer chaque ___ par un input inline numéroté */
    let trouIndex = 0;
    const enonceHTML = this._escHtml(q.enonce).replace(/___/g, () => {
      const idx = trouIndex++;
      return `<input
        type="text"
        class="trou-inline"
        data-index="${idx}"
        placeholder="..."
        autocomplete="off"
        aria-label="Mot manquant ${idx + 1}"
      />`;
    });

    return `
      <div class="quiz-question">
        <span class="question-type-badge">Texte à trous</span>
        <p class="enonce-avec-trou">${enonceHTML}</p>
        <button class="btn btn--primary" id="btn-valider-trous" type="button">Valider</button>
        <button class="btn-passer" type="button" onclick="window.QuizEngine.passerQuestion()">Passer cette question</button>
      </div>
    `;
  },

  /* ---- FLASHCARD ---- */
  _renduFlashcard(q) {
    return `
      <div class="quiz-question">
        <span class="question-type-badge">Flashcard</span>
        <div class="flashcard" id="flashcard" role="button" tabindex="0" aria-label="Cliquer pour retourner la carte">
          <div class="flashcard-recto">${this._escHtml(q.recto || q.enonce || '')}</div>
          <div class="flashcard-verso hidden">${this._escHtml(q.verso || String(q.reponse || ''))}</div>
          <button id="btn-retourner" type="button">Retourner la carte 🔄</button>
          <div class="flashcard-eval hidden" id="flashcard-eval">
            <button class="btn-savais" data-savais="true" type="button">✅ Je savais</button>
            <button class="btn-savais" data-savais="false" type="button">❌ Je ne savais pas</button>
          </div>
        </div>
      </div>
    `;
  },

  /* ================================================
     RENDU HTML TYPES AVANCÉS (Sprint 4)
     ================================================ */

  /* ---- ASSOCIATION ---- */
  _renduAssociation(q) {
    const paires = q.paires || [];
    const indices = Utils.melanger(paires.map((_, i) => i));

    const termesHTML = indices.map(i => `
      <div class="assoc-terme" draggable="true" data-id="${i}" role="option" aria-grabbed="false">
        ${this._escHtml(paires[i].terme)}
      </div>
    `).join('');

    const defsHTML = paires.map((p, i) => `
      <div class="assoc-def-slot" data-def-id="${i}">
        <div class="assoc-def-texte">${this._escHtml(p.definition)}</div>
        <div
          class="assoc-drop-zone"
          data-def-id="${i}"
          role="listbox"
          aria-label="Zone pour ${this._escHtml(p.definition)}"
        >Déposer ici</div>
      </div>
    `).join('');

    return `
      <div class="quiz-question">
        <span class="question-type-badge">Association</span>
        <p class="question-enonce">${this._escHtml(q.enonce || 'Associe chaque terme à sa définition.')}</p>
        <div class="association-zone">
          <div>
            <p class="assoc-col-titre">Termes</p>
            <div class="assoc-termes" id="assoc-termes">${termesHTML}</div>
          </div>
          <div>
            <p class="assoc-col-titre">Définitions</p>
            <div class="assoc-definitions">${defsHTML}</div>
          </div>
        </div>
        <button class="btn btn--primary" id="btn-valider-assoc" type="button">Valider l'association</button>
        <button class="btn-passer" type="button" onclick="window.QuizEngine.passerQuestion()">Passer cette question</button>
      </div>
    `;
  },

  /* ---- REMISE EN ORDRE ---- */
  _renduRemiseOrdre(q) {
    const items = q.items || [];
    const itemsMelanges = Utils.melanger(items.map((label, i) => ({ label, origIndex: i })));

    const itemsHTML = itemsMelanges.map(item => `
      <div class="ordre-item" draggable="true" data-orig-index="${item.origIndex}" role="option">
        <span class="ordre-handle" aria-hidden="true">⠿</span>
        ${this._escHtml(item.label)}
      </div>
    `).join('');

    return `
      <div class="quiz-question">
        <span class="question-type-badge">Remise en ordre</span>
        <p class="question-enonce">${this._escHtml(q.enonce || 'Remets ces éléments dans le bon ordre.')}</p>
        <div class="ordre-liste" id="ordre-liste" role="listbox" aria-label="Éléments à ordonner">
          ${itemsHTML}
        </div>
        <button class="btn btn--primary" id="btn-valider-ordre" type="button">Valider l'ordre</button>
        <button class="btn-passer" type="button" onclick="window.QuizEngine.passerQuestion()">Passer cette question</button>
      </div>
    `;
  },

  /* ---- CLASSIFICATION ---- */
  _renduClassification(q) {
    const items      = q.items || [];
    const categories = q.categories || [];
    const itemsMelanges = Utils.melanger([...items]);

    const itemsHTML = itemsMelanges.map(item => `
      <div class="classif-item" draggable="true" data-item="${this._escHtml(item)}" role="option">
        ${this._escHtml(item)}
      </div>
    `).join('');

    const catsHTML = categories.map(cat => `
      <div class="classif-cat" data-cat="${this._escHtml(cat)}">
        <h4>${this._escHtml(cat)}</h4>
        <div
          class="classif-drop"
          data-cat="${this._escHtml(cat)}"
          role="listbox"
          aria-label="Catégorie ${this._escHtml(cat)}"
        >Déposer ici</div>
      </div>
    `).join('');

    return `
      <div class="quiz-question">
        <span class="question-type-badge">Classification</span>
        <p class="question-enonce">${this._escHtml(q.enonce || 'Classe ces éléments dans les bonnes catégories.')}</p>
        <div class="classif-zone">
          <div>
            <p class="assoc-col-titre">Éléments à classer</p>
            <div class="classif-items" id="classif-items">${itemsHTML}</div>
          </div>
          <div class="classif-categories">${catsHTML}</div>
        </div>
        <button class="btn btn--primary" id="btn-valider-classif" type="button">Valider la classification</button>
        <button class="btn-passer" type="button" onclick="window.QuizEngine.passerQuestion()">Passer cette question</button>
      </div>
    `;
  },

  /* ---- FRISE CHRONOLOGIQUE ---- */
  _renduFrise(q) {
    const evenements = q.evenements || [];
    const dates      = q.dates || [];
    const evtsMelanges = Utils.melanger(evenements.map((label, i) => ({ label, id: i })));

    const evtsHTML = evtsMelanges.map(evt => `
      <div class="frise-event" draggable="true" data-id="${evt.id}" role="option">
        ${this._escHtml(evt.label)}
      </div>
    `).join('');

    const slotsHTML = dates.map((date, i) => `
      <div class="frise-slot" data-position="${i}">
        <span class="frise-slot-date">${this._escHtml(date)}</span>
        <div
          class="frise-drop-zone"
          data-position="${i}"
          role="listbox"
          aria-label="Période ${this._escHtml(date)}"
        >Déposer ici</div>
      </div>
    `).join('');

    return `
      <div class="quiz-question">
        <span class="question-type-badge">Frise chronologique</span>
        <p class="question-enonce">${this._escHtml(q.enonce || 'Place ces événements sur la frise chronologique.')}</p>
        <div class="frise-zone">
          <div>
            <p class="assoc-col-titre">Événements à placer</p>
            <div class="frise-evenements" id="frise-events">${evtsHTML}</div>
          </div>
          <p class="assoc-col-titre">Frise (du plus ancien au plus récent)</p>
          <div class="frise-timeline-wrapper">
            <div class="frise-timeline">${slotsHTML}</div>
          </div>
        </div>
        <button class="btn btn--primary" id="btn-valider-frise" type="button">Valider la frise</button>
        <button class="btn-passer" type="button" onclick="window.QuizEngine.passerQuestion()">Passer cette question</button>
      </div>
    `;
  },

  /* ================================================
     ATTACHER LES LISTENERS SELON LE TYPE
     ================================================ */
  _attacherListeners(q) {
    switch (q.type) {

      case 'qcm': {
        const btns = document.querySelectorAll('.choix-btn');
        btns.forEach(btn => {
          btn.addEventListener('click', () => {
            btns.forEach(b => { b.disabled = true; });
            btn.classList.add('selected');
            this.validerReponse(btn.dataset.valeur);
          });
        });
        break;
      }

      case 'vrai_faux': {
        const btnsVF = document.querySelectorAll('.btn-vf');
        btnsVF.forEach(btn => {
          btn.addEventListener('click', () => {
            btnsVF.forEach(b => { b.disabled = true; });
            this.validerReponse(btn.dataset.valeur === 'true');
          });
        });
        break;
      }

      case 'calcul':
      case 'reponse_courte': {
        const input  = document.getElementById('input-reponse');
        const btnVal = document.getElementById('btn-valider-input');

        if (input && btnVal) {
          const valider = () => {
            if (input.disabled) return;
            input.disabled  = true;
            btnVal.disabled = true;
            this.validerReponse(input.value);
          };
          btnVal.addEventListener('click', valider);
          input.addEventListener('keydown', e => {
            if (e.key === 'Enter') valider();
          });
          setTimeout(() => input.focus(), 100);
        }
        break;
      }

      case 'texte_trous': {
        const btnVal = document.getElementById('btn-valider-trous');
        if (btnVal) {
          btnVal.addEventListener('click', () => {
            const inputs  = document.querySelectorAll('.trou-inline');
            const reponse = Array.from(inputs).map(inp => inp.value);
            inputs.forEach(inp => { inp.disabled = true; });
            btnVal.disabled = true;
            this.validerReponse(reponse);
          });
          const premier = document.querySelector('.trou-inline');
          if (premier) setTimeout(() => premier.focus(), 100);
        }
        break;
      }

      case 'flashcard': {
        const btnRetourner = document.getElementById('btn-retourner');
        const verso        = document.querySelector('.flashcard-verso');
        const evalDiv      = document.getElementById('flashcard-eval');

        if (btnRetourner && verso && evalDiv) {
          const retourner = () => {
            verso.classList.remove('hidden');
            evalDiv.classList.remove('hidden');
            btnRetourner.style.display = 'none';
          };

          btnRetourner.addEventListener('click', retourner);

          const flashcard = document.getElementById('flashcard');
          if (flashcard) {
            flashcard.addEventListener('click', e => {
              if (!e.target.closest('#flashcard-eval') && verso.classList.contains('hidden')) {
                retourner();
              }
            });
            flashcard.addEventListener('keydown', e => {
              if ((e.key === 'Enter' || e.key === ' ') && verso.classList.contains('hidden')) {
                e.preventDefault();
                retourner();
              }
            });
          }

          document.querySelectorAll('.btn-savais').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('.btn-savais').forEach(b => { b.disabled = true; });
              this.validerReponse(btn.dataset.savais === 'true');
            });
          });
        }
        break;
      }

      case 'association':
        this._attacherDragAssociation(q);
        break;

      case 'remise_ordre':
        this._attacherDragOrdre(q);
        break;

      case 'classification':
        this._attacherDragClassification(q);
        break;

      case 'frise_chrono':
        this._attacherDragFrise(q);
        break;
    }
  },

  /* ================================================
     DRAG & DROP — ASSOCIATION
     ================================================ */
  _attacherDragAssociation(q) {
    const termes    = document.querySelectorAll('.assoc-terme');
    const dropZones = document.querySelectorAll('.assoc-drop-zone');
    const btnVal    = document.getElementById('btn-valider-assoc');
    let draggedId   = null;

    termes.forEach(terme => {
      terme.addEventListener('dragstart', e => {
        draggedId = parseInt(terme.dataset.id);
        terme.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      terme.addEventListener('dragend', () => terme.classList.remove('dragging'));
    });

    dropZones.forEach(zone => {
      zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('dragover');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (draggedId === null) return;

        /* Libérer le slot précédent si ce terme était déjà placé */
        dropZones.forEach(z => {
          if (z !== zone && z.dataset.filledId === String(draggedId)) {
            z.textContent = 'Déposer ici';
            z.classList.remove('filled');
            delete z.dataset.filledId;
          }
        });

        const paires = q.paires || [];
        const terme  = paires[draggedId] ? paires[draggedId].terme : '';
        zone.textContent        = terme;
        zone.classList.add('filled');
        zone.dataset.filledId   = String(draggedId);

        /* Marquer le terme source comme placé */
        termes.forEach(t => {
          if (parseInt(t.dataset.id) === draggedId) t.classList.add('placed');
        });
        draggedId = null;
      });
    });

    if (btnVal) {
      btnVal.addEventListener('click', () => {
        const reponse = [];
        dropZones.forEach(zone => {
          if (zone.dataset.filledId !== undefined) {
            reponse.push({
              terme_id: parseInt(zone.dataset.filledId),
              def_id:   parseInt(zone.dataset.defId),
            });
          }
        });
        termes.forEach(t => t.setAttribute('draggable', 'false'));
        btnVal.disabled = true;
        this.validerReponse(reponse);
      });
    }
  },

  /* ================================================
     DRAG & DROP — REMISE EN ORDRE
     ================================================ */
  _attacherDragOrdre(q) {
    const liste   = document.getElementById('ordre-liste');
    const btnVal  = document.getElementById('btn-valider-ordre');
    let draggedEl = null;

    if (!liste) return;

    const getItems = () => Array.from(liste.querySelectorAll('.ordre-item'));

    liste.addEventListener('dragstart', e => {
      const item = e.target.closest('.ordre-item');
      if (!item) return;
      draggedEl = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    liste.addEventListener('dragend', () => {
      if (draggedEl) draggedEl.classList.remove('dragging');
      getItems().forEach(i => i.classList.remove('drag-over'));
      draggedEl = null;
    });

    liste.addEventListener('dragover', e => {
      e.preventDefault();
      const target = e.target.closest('.ordre-item');
      if (!target || target === draggedEl) return;

      getItems().forEach(i => i.classList.remove('drag-over'));
      target.classList.add('drag-over');

      const items       = getItems();
      const dragIndex   = items.indexOf(draggedEl);
      const targetIndex = items.indexOf(target);

      if (dragIndex < targetIndex) {
        liste.insertBefore(draggedEl, target.nextSibling);
      } else {
        liste.insertBefore(draggedEl, target);
      }
    });

    if (btnVal) {
      btnVal.addEventListener('click', () => {
        const reponse = getItems().map(item => parseInt(item.dataset.origIndex));
        getItems().forEach(i => i.setAttribute('draggable', 'false'));
        btnVal.disabled = true;
        this.validerReponse(reponse);
      });
    }
  },

  /* ================================================
     DRAG & DROP — CLASSIFICATION
     ================================================ */
  _attacherDragClassification(q) {
    const items     = document.querySelectorAll('.classif-item');
    const drops     = document.querySelectorAll('.classif-drop');
    const btnVal    = document.getElementById('btn-valider-classif');
    let draggedItem = null;
    let draggedNom  = null;

    items.forEach(item => {
      item.addEventListener('dragstart', e => {
        draggedItem = item;
        draggedNom  = item.dataset.item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
    });

    drops.forEach(drop => {
      drop.addEventListener('dragover', e => {
        e.preventDefault();
        drop.classList.add('dragover');
      });
      drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
      drop.addEventListener('drop', e => {
        e.preventDefault();
        drop.classList.remove('dragover');
        if (!draggedItem) return;

        const tag = document.createElement('div');
        tag.className    = 'classif-item';
        tag.dataset.item = draggedNom;
        tag.textContent  = draggedNom;
        tag.style.cursor = 'default';
        drop.appendChild(tag);

        draggedItem.style.display = 'none';
        draggedItem = null;
        draggedNom  = null;
      });
    });

    if (btnVal) {
      btnVal.addEventListener('click', () => {
        const reponse = {};
        drops.forEach(drop => {
          const cat    = drop.dataset.cat;
          const placed = Array.from(drop.querySelectorAll('.classif-item'))
                              .map(el => el.dataset.item);
          reponse[cat] = placed;
        });
        items.forEach(i => i.setAttribute('draggable', 'false'));
        btnVal.disabled = true;
        this.validerReponse(reponse);
      });
    }
  },

  /* ================================================
     DRAG & DROP — FRISE CHRONOLOGIQUE
     ================================================ */
  _attacherDragFrise(q) {
    const events  = document.querySelectorAll('.frise-event');
    const slots   = document.querySelectorAll('.frise-drop-zone');
    const btnVal  = document.getElementById('btn-valider-frise');
    let draggedId = null;

    events.forEach(evt => {
      evt.addEventListener('dragstart', e => {
        draggedId = parseInt(evt.dataset.id);
        evt.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      evt.addEventListener('dragend', () => evt.classList.remove('dragging'));
    });

    slots.forEach(slot => {
      slot.addEventListener('dragover', e => {
        e.preventDefault();
        slot.classList.add('dragover');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('dragover'));
      slot.addEventListener('drop', e => {
        e.preventDefault();
        slot.classList.remove('dragover');
        if (draggedId === null) return;

        /* Libérer l'ancien slot si ce même événement y était */
        slots.forEach(s => {
          if (s !== slot && s.dataset.filledId === String(draggedId)) {
            s.textContent = 'Déposer ici';
            s.classList.remove('filled');
            delete s.dataset.filledId;
          }
        });

        const evtLabel = (q.evenements || [])[draggedId] || '';
        slot.textContent      = evtLabel;
        slot.classList.add('filled');
        slot.dataset.filledId = String(draggedId);

        events.forEach(ev => {
          if (parseInt(ev.dataset.id) === draggedId) ev.style.display = 'none';
        });
        draggedId = null;
      });
    });

    if (btnVal) {
      btnVal.addEventListener('click', () => {
        const reponse = Array.from(slots).map(slot =>
          slot.dataset.filledId !== undefined ? parseInt(slot.dataset.filledId) : -1
        );
        events.forEach(e => e.setAttribute('draggable', 'false'));
        btnVal.disabled = true;
        this.validerReponse(reponse);
      });
    }
  },

  /* ================================================
     FEEDBACK APRÈS VALIDATION
     ================================================ */
  _afficherFeedback(q, reponse, correct, xpGagne) {
    const zone = document.getElementById('quiz-zone');
    if (!zone) return;

    let messageErreur = '';
    switch (q.type) {
      case 'calcul':
        messageErreur = `La bonne réponse est <strong>${q.reponse}${q.unite ? ' ' + q.unite : ''}</strong>.`;
        break;
      case 'qcm':
        messageErreur = `La bonne réponse est <strong>${this._escHtml(String(q.reponse))}</strong>.`;
        break;
      case 'vrai_faux':
        messageErreur = `La réponse est <strong>${q.reponse ? 'Vrai' : 'Faux'}</strong>.`;
        break;
      case 'texte_trous':
        messageErreur = `Réponses attendues : <strong>${(q.reponses || []).join(', ')}</strong>`;
        break;
      case 'reponse_courte':
        messageErreur = `La bonne réponse est <strong>${this._escHtml(String(q.reponse))}</strong>.`;
        break;
      case 'flashcard':
        messageErreur = 'Cette notion mérite une révision supplémentaire.';
        break;
      default:
        messageErreur = 'Consulte l\'explication ci-dessous.';
    }

    const feedbackEl = document.createElement('div');
    feedbackEl.className = `feedback feedback--${correct ? 'correct' : 'incorrect'}`;
    feedbackEl.setAttribute('role', 'alert');
    feedbackEl.innerHTML = `
      <p class="feedback-icone">${correct ? '✅' : '❌'}</p>
      <p class="feedback-texte">
        ${correct
          ? `Bonne réponse ! +${xpGagne} XP`
          : `Mauvaise réponse. ${messageErreur}`}
      </p>
      <p class="feedback-explication">${this._escHtml(q.explication || '')}</p>
      <button class="btn btn--primary" id="btn-suivant" type="button">
        Question suivante →
      </button>
    `;

    /* Retirer un feedback précédent si présent */
    const existant = zone.querySelector('.feedback');
    if (existant) existant.remove();

    zone.appendChild(feedbackEl);

    const btnSuivant = document.getElementById('btn-suivant');
    if (btnSuivant) {
      btnSuivant.addEventListener('click', () => this._questionSuivante());
      btnSuivant.focus();
    }

    setTimeout(() => {
      feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  },

  /* Coloration des boutons QCM/VF après réponse */
  _colorierChoix(q, reponse, correct) {
    if (q.type === 'qcm') {
      document.querySelectorAll('.choix-btn').forEach(btn => {
        if (btn.dataset.valeur === String(q.reponse)) {
          btn.style.borderColor = 'var(--color-success)';
          btn.style.background  = 'rgba(34, 197, 94, 0.1)';
        } else if (btn.dataset.valeur === String(reponse) && !correct) {
          btn.style.borderColor = 'var(--color-error)';
          btn.style.background  = 'rgba(239, 68, 68, 0.1)';
        }
      });
    }
    if (q.type === 'vrai_faux') {
      document.querySelectorAll('.btn-vf').forEach(btn => {
        const valBtn = btn.dataset.valeur === 'true';
        if (valBtn === q.reponse) {
          btn.style.background = 'rgba(34, 197, 94, 0.3)';
        } else if (String(btn.dataset.valeur) === String(reponse) && !correct) {
          btn.style.background = 'rgba(239, 68, 68, 0.3)';
        }
      });
    }
  },

  /* ================================================
     NAVIGATION ENTRE QUESTIONS
     ================================================ */
  _questionSuivante() {
    _etat.questionIndex++;
    if (_etat.questionIndex >= _etat.questions.length) {
      this._finSession();
    } else {
      this._afficherQuestion(_etat.questionIndex);
    }
  },

  _mettreAJourProgression() {
    const elProg = document.getElementById('quiz-progression');
    if (elProg) {
      elProg.textContent = `${_etat.questionIndex + 1} / ${_etat.questions.length}`;
    }

    /* Barre XP globale */
    const xpFill = document.getElementById('quiz-xp-fill');
    if (xpFill && window.Storage && window.Gamification) {
      const pct = Gamification.getPctProgression(Storage.getProfil().xp);
      xpFill.style.width = `${pct}%`;
      const barEl = xpFill.closest('.quiz-xp-bar');
      if (barEl) barEl.setAttribute('aria-valuenow', pct);
    }
  },

  /* ================================================
     FIN DE SESSION
     ================================================ */
  _finSession() {
    this._stopperChrono();

    const stats   = this.getStats();
    const config  = _etat.config;
    const matiere = config.matiere || 'maths';
    const chapitre = config.chapitre || 'general';
    const dureeS  = Math.round((Date.now() - _etat.debut_time) / 1000);

    /* Enregistrer dans Storage */
    if (window.Storage) {
      Storage.mettreAJourProgression(
        matiere,
        chapitre,
        stats.score_bonnes,
        stats.nb_questions,
        stats.idsVues,
        stats.idsRatees
      );

      Storage.ajouterHistorique({
        matiere,
        chapitre,
        score_bonnes: stats.score_bonnes,
        nb_questions: stats.nb_questions,
        xp_gagne:     stats.xp_gagne,
        duree_s:      dureeS,
        defi_gagne:   config.mode === 'chrono' && stats.parfait,
      });

      Storage.enregistrerSession();
    }

    /* Vérifier les badges */
    if (window.Gamification) {
      Gamification.verifierBadges({
        combo_max: stats.combo_max,
        parfaite:  stats.parfait,
      });
    }

    /* Afficher l'écran de résultats inline */
    const zone = document.getElementById('quiz-zone');
    if (!zone) return;

    const pct    = stats.nb_questions > 0
      ? Math.round((stats.score_bonnes / stats.nb_questions) * 100)
      : 0;
    const emoji  = pct === 100 ? '🏆' : pct >= 80 ? '🔥' : pct >= 50 ? '😊' : '😅';
    const msg    = pct === 100 ? 'Session parfaite !'
                 : pct >= 80  ? 'Excellent travail !'
                 : pct >= 50  ? 'Bonne session, continue !'
                               : 'Continue de t\'entraîner !';

    zone.innerHTML = `
      <div id="resultats" role="main">
        <p class="resultats-sous-titre" style="font-size:3rem;text-align:center;">${emoji}</p>
        <h2 class="resultats-titre" style="text-align:center;">Session terminée !</h2>
        <p class="resultats-sous-titre" style="text-align:center;">${msg}</p>

        <div class="resultats-score" aria-label="Score ${stats.score_bonnes} sur ${stats.nb_questions}">
          ${stats.score_bonnes} / ${stats.nb_questions}
        </div>

        <div class="resultats-stats-grid" role="list">
          <div class="stat-card" role="listitem">
            <span class="stat-card__valeur">${pct}%</span>
            <span class="stat-card__label">Score</span>
          </div>
          <div class="stat-card" role="listitem">
            <span class="stat-card__valeur">+${stats.xp_gagne}</span>
            <span class="stat-card__label">XP gagnés</span>
          </div>
          <div class="stat-card" role="listitem">
            <span class="stat-card__valeur">${stats.combo_max}</span>
            <span class="stat-card__label">Combo max</span>
          </div>
        </div>

        <div class="resultats-actions">
          <button
            class="btn btn--primary"
            onclick="window.QuizEngine.init(window.routerState.params).then(() => window.QuizEngine.demarrer())"
            aria-label="Rejouer"
          >🔄 Rejouer</button>
          <button
            class="btn btn--secondary"
            onclick="naviguer('matiere', { matiere: '${matiere}' })"
          >← Retour matière</button>
          <button
            class="btn btn--ghost"
            onclick="naviguer('dashboard')"
          >Accueil</button>
        </div>
      </div>
    `;
  },

  /* ================================================
     CHRONO (mode défi)
     ================================================ */
  _demarrerChrono(secondes) {
    const zone = document.getElementById('chrono-zone');
    if (!zone) return;
    zone.classList.remove('hidden');

    _etat.chrono_restant = secondes;
    this._mettreAJourChrono(secondes, secondes);

    _etat.chrono_timer = setInterval(() => {
      _etat.chrono_restant--;
      this._mettreAJourChrono(_etat.chrono_restant, secondes);

      if (_etat.chrono_restant <= 0) {
        this._stopperChrono();
        if (window.Gamification) Gamification.mauvaiseReponse();
        const q = _etat.questions[_etat.questionIndex];
        if (q) _etat.ratees.push(q.id);
        this._afficherFeedback(q, null, false, 0);
      }
    }, 1000);
  },

  _mettreAJourChrono(restant, total) {
    const bar   = document.getElementById('chrono-bar');
    const temps = document.getElementById('chrono-temps');
    const pct   = (restant / total) * 100;

    if (bar) {
      bar.style.width      = `${pct}%`;
      bar.style.background = restant > 30
        ? 'var(--color-chrono-ok)'
        : restant > 10
          ? 'var(--color-chrono-mid)'
          : 'var(--color-chrono-full)';
    }
    if (temps) temps.textContent = `${restant}s`;
  },

  _stopperChrono() {
    if (_etat.chrono_timer) {
      clearInterval(_etat.chrono_timer);
      _etat.chrono_timer = null;
    }
  },

  /* ================================================
     UTILITAIRES
     ================================================ */
  _afficherErreurChargement() {
    const zone = document.getElementById('quiz-zone');
    if (!zone) return;
    zone.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon">😵</span>
        <p class="empty-state__text">
          Impossible de charger les questions.<br />
          Vérifie que le fichier de données existe.
        </p>
        <button class="btn btn--secondary btn--sm" onclick="naviguer('dashboard')">
          Retour à l'accueil
        </button>
      </div>
    `;
  },

  /* Escaper le HTML pour éviter les injections XSS */
  _escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
};

/* ------------------------------------------------
   Exposer globalement
   ------------------------------------------------ */
window.QuizEngine = QuizEngine;

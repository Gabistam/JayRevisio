/* ================================================
   app.js — Study Jay
   Router SPA minimal + initialisation de l'application
   ================================================ */

'use strict';

/* ------------------------------------------------
   CONFIGURATION DES ROUTES
   Chaque route pointe vers un fichier HTML dans /pages/
   et un fichier CSS dans /css/
   ------------------------------------------------ */
const ROUTES = {
  dashboard: {
    page: 'pages/dashboard.html',
    css: 'css/dashboard.css',
    title: 'Accueil — Study Jay',
  },
  matiere: {
    page: 'pages/matiere.html',
    css: 'css/matiere.css',
    title: 'Matière — Study Jay',
  },
  quiz: {
    page: 'pages/quiz.html',
    css: 'css/quiz.css',
    title: 'Quiz — Study Jay',
  },
  resultats: {
    page: 'pages/resultats.html',
    css: 'css/quiz.css',  /* réutilise le CSS quiz */
    title: 'Résultats — Study Jay',
  },
  profil: {
    page: 'pages/profil.html',
    css: 'css/dashboard.css',
    title: 'Mon profil — Study Jay',
  },
};

/* ------------------------------------------------
   ÉTAT DU ROUTER
   ------------------------------------------------ */
const routerState = {
  vueActuelle: null,     /* identifiant de la vue courante */
  params: {},            /* paramètres de la route (ex: matiere=maths) */
  cssCharge: new Set(),  /* CSS déjà injectés pour éviter les doublons */
};

/* ------------------------------------------------
   UTILITAIRE : charger un fichier CSS dynamiquement
   ------------------------------------------------ */
function chargerCSS(href) {
  if (routerState.cssCharge.has(href)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => { routerState.cssCharge.add(href); resolve(); };
    link.onerror = () => reject(new Error(`Impossible de charger : ${href}`));
    document.head.appendChild(link);
  });
}

/* ------------------------------------------------
   UTILITAIRE : récupérer le HTML d'une vue
   ------------------------------------------------ */
async function chargerHTML(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors du chargement de ${url}`);
  }
  return response.text();
}

/* ------------------------------------------------
   NAVIGATION — parse le hash et route vers la bonne vue
   ------------------------------------------------ */
function parserHash(hash) {
  /* Format attendu : #vue ou #vue?param1=val1&param2=val2
     Exemples :
       #dashboard
       #maths         → vue=matiere, matiere=maths
       #histoire-geo  → vue=matiere, matiere=histoire-geo
       #quiz?matiere=maths&chapitre=pythagore&mode=entrainement
  */
  const cleanHash = hash.replace(/^#/, '') || 'dashboard';
  const [chemin, queryString] = cleanHash.split('?');

  /* Résolution des alias matières */
  const ALIAS_MATIERES = ['maths', 'histoire-geo', 'physique-chimie', 'svt'];
  let vue = chemin;
  const params = {};

  if (ALIAS_MATIERES.includes(chemin)) {
    vue = 'matiere';
    params.matiere = chemin;
  }

  /* Paramètres supplémentaires dans la query string */
  if (queryString) {
    const urlParams = new URLSearchParams(queryString);
    urlParams.forEach((val, cle) => { params[cle] = val; });
  }

  return { vue, params };
}

/* ------------------------------------------------
   AFFICHER UNE VUE
   ------------------------------------------------ */
async function afficherVue(vue, params = {}) {
  const config = ROUTES[vue];
  if (!config) {
    console.warn(`[Router] Vue inconnue : "${vue}", redirection vers dashboard`);
    naviguer('dashboard');
    return;
  }

  const main = document.getElementById('app-main');
  const loader = document.getElementById('view-loader');

  /* Afficher le spinner de chargement */
  loader.classList.add('is-loading');
  main.setAttribute('aria-busy', 'true');

  try {
    /* Charger CSS et HTML en parallèle */
    const [html] = await Promise.all([
      chargerHTML(config.page),
      chargerCSS(config.css),
    ]);

    /* Injecter le HTML avec animation d'entrée */
    main.style.opacity = '0';
    main.innerHTML = html;
    requestAnimationFrame(() => {
      main.style.transition = 'opacity 180ms ease';
      main.style.opacity = '1';
    });

    /* Mettre à jour le titre de la page */
    document.title = config.title;

    /* Mettre à jour la nav bas */
    mettreAJourNavBas(vue, params);

    /* Mettre à jour l'état du router */
    routerState.vueActuelle = vue;
    routerState.params = params;

    /* Appeler le hook d'initialisation de la vue si défini */
    if (typeof window.vueInit === 'function') {
      window.vueInit(vue, params);
    }

    /* Scroll en haut */
    window.scrollTo({ top: 0, behavior: 'instant' });

  } catch (err) {
    console.error('[Router] Erreur de chargement :', err);
    main.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon">😵</span>
        <p class="empty-state__text">
          Oops, impossible de charger cette page.<br />
          <button class="btn btn--secondary btn--sm mt-4" onclick="naviguer('dashboard')">
            Retour à l'accueil
          </button>
        </p>
      </div>
    `;
  } finally {
    loader.classList.remove('is-loading');
    main.removeAttribute('aria-busy');
  }
}

/* ------------------------------------------------
   METTRE À JOUR LA NAV BAS
   ------------------------------------------------ */
function mettreAJourNavBas(vue, params) {
  const items = document.querySelectorAll('.bottom-nav-item');
  items.forEach(item => {
    item.classList.remove('active');
    const itemView = item.dataset.view;
    const itemMatiere = item.dataset.matiere;

    if (vue === 'dashboard' && itemView === 'dashboard') {
      item.classList.add('active');
    } else if (vue === 'matiere' && itemMatiere === params.matiere) {
      item.classList.add('active');
    }
  });
}

/* ------------------------------------------------
   FONCTION DE NAVIGATION PUBLIQUE
   Utilisée depuis les pages HTML via onclick ou les scripts
   ------------------------------------------------ */
function naviguer(vue, params = {}) {
  /* Construire le hash */
  const MATIERES = ['maths', 'histoire-geo', 'physique-chimie', 'svt'];

  let hash;
  if (vue === 'matiere' && params.matiere) {
    hash = params.matiere; /* #maths, #svt, etc. */
  } else {
    hash = vue;
  }

  /* Ajouter les query params si nécessaire (quiz, etc.) */
  const queryParams = { ...params };
  if (vue === 'matiere') delete queryParams.matiere;

  const queryString = new URLSearchParams(queryParams).toString();
  window.location.hash = queryString ? `${hash}?${queryString}` : hash;
}

/* ------------------------------------------------
   ÉCOUTER LES CHANGEMENTS DE HASH (navigation SPA)
   ------------------------------------------------ */
window.addEventListener('hashchange', () => {
  const { vue, params } = parserHash(window.location.hash);
  afficherVue(vue, params);
});

/* ------------------------------------------------
   TOGGLE THÈME CLAIR / SOMBRE
   ------------------------------------------------ */
function initialiserTheme() {
  const btnToggle = document.getElementById('btn-theme-toggle');
  const htmlEl = document.documentElement;

  /* Lire la préférence sauvegardée ou la préférence système */
  const prefSystem = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const prefSaved = localStorage.getItem('sb_theme');
  const theme = prefSaved || prefSystem;

  htmlEl.setAttribute('data-theme', theme);
  mettreAJourIconeTheme(theme);

  btnToggle.addEventListener('click', () => {
    const actuel = htmlEl.getAttribute('data-theme');
    const nouveau = actuel === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', nouveau);
    localStorage.setItem('sb_theme', nouveau);
    mettreAJourIconeTheme(nouveau);
  });
}

function mettreAJourIconeTheme(theme) {
  const icone = document.querySelector('#btn-theme-toggle .icon-theme');
  if (icone) {
    icone.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

/* ------------------------------------------------
   POINT D'ENTRÉE — initialisation au chargement de la page
   ------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Study Jay] Initialisation...');

  /* 1. Thème */
  initialiserTheme();

  /* 2. Storage — charge ou initialise les données localStorage */
  Storage.init();

  /* 3. Gamification — branche le header XP sur les données réelles */
  Gamification.init();

  /* 4. Afficher la vue correspondant au hash actuel
        Si aucun hash → dashboard par défaut           */
  const { vue, params } = parserHash(window.location.hash);
  afficherVue(vue, params);

  console.log('[Study Jay] Prêt.');
});

/* ------------------------------------------------
   EXPOSITION GLOBALE pour les pages HTML inline
   ------------------------------------------------ */
window.naviguer = naviguer;
window.routerState = routerState;

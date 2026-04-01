'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { AppProvider, useApp } from '@/lib/AppContext';
import { getNiveauConfig, getPalierSuivant, getPctProgression } from '@/lib/gamification';

function AppShell({ children }) {
  const { session, profil, toasts } = useApp();
  const pathname = usePathname();

  const config   = getNiveauConfig(profil.niveau);
  const palier   = getPalierSuivant(profil.xp);
  const pct      = getPctProgression(profil.xp);
  const xpMax    = palier ? palier.xp_requis : profil.xp;

  const navItems = [
    { href: '/',                icon: '🏠', label: 'Accueil',  active: pathname === '/' },
    { href: '/matiere/maths',   icon: '📐', label: 'Maths',    active: pathname.includes('/maths') },
    { href: '/matiere/histoire-geo', icon: '🗺️', label: 'Histoire', active: pathname.includes('/histoire') },
    { href: '/matiere/physique-chimie', icon: '⚗️', label: 'Physique', active: pathname.includes('/physique') },
    { href: '/matiere/svt',     icon: '🌿', label: 'SVT',      active: pathname.includes('/svt') },
  ];

  return (
    <>
      {/* ---- HEADER ---- */}
      <header className="app-header" id="app-header">
        <div className="header-inner">
          <Link href="/" className="header-logo" aria-label="Accueil Study Jay">
            <span className="logo-icon">📚</span>
            <span className="logo-text">Study Jay</span>
          </Link>

          <div className="header-player" aria-live="polite">
            <span className="player-niveau">{config.emoji} {config.nom}</span>
            <div className="player-xp-bar" role="progressbar"
              aria-valuenow={profil.xp} aria-valuemin={0} aria-valuemax={xpMax}
              aria-label="Barre XP">
              <div className="player-xp-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="player-xp-label">
              {profil.xp} / {palier ? xpMax : '∞'} XP
            </span>
          </div>

          <div className="header-actions">
            <Link href="/profil" className="btn-icon" aria-label="Mon profil">
              <span>👤</span>
            </Link>
            <button
              className="btn-icon"
              onClick={() => signOut({ callbackUrl: '/login' })}
              aria-label="Se déconnecter"
              title="Déconnexion"
            >
              <span>🚪</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---- CONTENU ---- */}
      <main className="app-main" id="app-main" role="main">
        {children}
      </main>

      {/* ---- NAV BAS (mobile) ---- */}
      <nav className="bottom-nav" aria-label="Navigation principale">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item${item.active ? ' active' : ''}`}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* ---- TOASTS ---- */}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`} role="status">
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

export default function AppLayout({ children }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (status !== 'authenticated') return null;

  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}

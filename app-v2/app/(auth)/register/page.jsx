'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [erreur, setErreur]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setErreur('');

    if (form.password.length < 6) {
      setErreur('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setLoading(true);

    /* Inscription */
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setErreur(data.error || 'Erreur lors de la création du compte.');
      setLoading(false);
      return;
    }

    /* Connexion automatique après inscription */
    await signIn('credentials', {
      email:    form.email,
      password: form.password,
      redirect: false,
    });

    router.push('/');
    router.refresh();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span>📚</span>
          <h1>Study Jay</h1>
        </div>

        <h2 className="auth-titre">Créer un compte</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Prénom</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Jay"
              required
              autoComplete="given-name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ton@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="6 caractères minimum"
              required
              autoComplete="new-password"
            />
          </div>

          {erreur && <p className="auth-erreur" role="alert">{erreur}</p>}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-lien">
          Déjà un compte ?{' '}
          <Link href="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

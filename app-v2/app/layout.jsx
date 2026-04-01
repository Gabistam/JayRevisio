import './globals.css';
import { SessionProvider } from 'next-auth/react';

export const metadata = {
  title: 'Study Jay — Révision Brevet',
  description: 'Application de révision pour le Brevet des collèges',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" data-theme="dark">
      <head>
        <link rel="stylesheet" href="/css/main.css" />
        <link rel="stylesheet" href="/css/dashboard.css" />
        <link rel="stylesheet" href="/css/matiere.css" />
        <link rel="stylesheet" href="/css/quiz.css" />
      </head>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

/* ================================================
   lib/auth.js
   Configuration NextAuth v5 — credentials uniquement
   ================================================ */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',          type: 'email' },
        password: { label: 'Mot de passe',   type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        /* Chercher l'utilisateur — password exclu par défaut, on le force */
        const user = await User.findOne({ email: credentials.email })
          .select('+password');

        if (!user) return null;

        const mdpValide = await user.verifierMotDePasse(credentials.password);
        if (!mdpValide) return null;

        return {
          id:    user._id.toString(),
          name:  user.name,
          email: user.email,
        };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    /* Ajouter l'id MongoDB dans le token JWT */
    async jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    /* Rendre l'userId accessible côté client via useSession() */
    async session({ session, token }) {
      if (token?.userId) session.user.id = token.userId;
      return session;
    },
  },

  pages: {
    signIn:  '/login',
    error:   '/login',
  },
});

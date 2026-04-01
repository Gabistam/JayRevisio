import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Profil from '@/models/Profil';
import Progression from '@/models/Progression';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis.' },
        { status: 400 }
      );
    }

    await connectDB();

    /* Vérifier si l'email existe déjà */
    const existant = await User.findOne({ email: email.toLowerCase() });
    if (existant) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé.' },
        { status: 409 }
      );
    }

    /* Créer l'utilisateur */
    const user = await User.create({ name, email, password });

    /* Créer le profil par défaut */
    await Profil.create({ userId: user._id });

    /* Créer les 4 progressions par défaut */
    const MATIERES = ['maths', 'histoire-geo', 'physique-chimie', 'svt'];
    await Progression.insertMany(
      MATIERES.map(matiere => ({ userId: user._id, matiere }))
    );

    return NextResponse.json(
      { message: 'Compte créé avec succès.', userId: user._id },
      { status: 201 }
    );
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json(
      { error: 'Erreur serveur.' },
      { status: 500 }
    );
  }
}

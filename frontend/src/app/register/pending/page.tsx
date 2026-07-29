'use client';

import Link from 'next/link';
import { IconClockHour4, IconShieldCheck, IconArrowRight } from '@tabler/icons-react';

export default function RegisterPendingPage() {
    return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg text-center">
                {/* Logo */}
                <Link href="/" className="inline-flex items-center gap-2 group mb-10">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 transition-transform group-hover:scale-105">
                        <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-7 h-7" />
                    </div>
                    <span className="text-xl font-extrabold text-brand-teal">Simple<span className="text-brand-coral">Ô</span>Quotidien</span>
                </Link>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 sm:p-10">
                    {/* Icon */}
                    <div className="mx-auto w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-6">
                        <IconClockHour4 className="w-10 h-10 text-amber-500" />
                    </div>

                    <h1 className="text-2xl font-extrabold text-brand-dark mb-3">
                        Demande en cours de traitement
                    </h1>

                    <p className="text-slate-500 mb-6 leading-relaxed">
                        Votre candidature en tant que prestataire a été soumise avec succès.
                        Notre équipe va examiner vos documents et valider votre profil.
                    </p>

                    <div className="bg-brand-tealLight/30 rounded-xl border border-brand-teal/10 p-4 mb-8">
                        <div className="flex items-start gap-3 text-left">
                            <IconShieldCheck className="w-5 h-5 text-brand-teal flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-slate-600">
                                <p className="font-semibold text-brand-teal mb-1">Prochaines étapes :</p>
                                <ul className="space-y-1 list-disc list-inside text-slate-500">
                                    <li>Vérification de votre pièce d&apos;identité</li>
                                    <li>Validation de votre profil par un administrateur</li>
                                    <li>Notification par email une fois votre compte activé</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-slate-400 mb-6">
                        Le délai de traitement est généralement de 24 à 48 heures.
                    </p>

                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-teal text-white font-semibold rounded-xl hover:bg-brand-tealDark transition-colors"
                    >
                        Aller à la connexion
                        <IconArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

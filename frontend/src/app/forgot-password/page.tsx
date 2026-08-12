'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { IconMail, IconArrowLeft, IconMailCheck } from '@tabler/icons-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Veuillez saisir votre adresse e-mail.');
            return;
        }
        setError('');
        setSubmitting(true);
        const result = await authService.forgotPassword(email.trim());
        setSubmitting(false);
        if (!result.success) {
            setError(result.error ?? 'Une erreur est survenue.');
            return;
        }
        setSent(true);
    };

    return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 transition-transform group-hover:scale-105">
                            <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-7 h-7" />
                        </div>
                        <span className="text-xl font-extrabold text-brand-teal">Simple<span className="text-brand-coral">Ô</span>Quotidien</span>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 sm:p-10">
                    {sent ? (
                        <div className="text-center">
                            <div className="mx-auto w-20 h-20 rounded-full bg-brand-tealLight/40 border-2 border-brand-teal/20 flex items-center justify-center mb-6">
                                <IconMailCheck className="w-10 h-10 text-brand-teal" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-brand-dark mb-3">Vérifiez votre boîte mail</h1>
                            <p className="text-slate-500 mb-6 leading-relaxed">
                                Si un compte existe pour <strong className="text-brand-dark">{email}</strong>, un e-mail contenant
                                un lien de réinitialisation vient de vous être envoyé. Le lien est valable 24 heures.
                            </p>
                            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-teal hover:text-brand-tealDark transition-colors">
                                <IconArrowLeft className="w-4 h-4" /> Retour à la connexion
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-extrabold text-brand-dark mb-2 text-center">Mot de passe oublié ?</h1>
                            <p className="text-slate-500 text-center mb-8">
                                Indiquez votre adresse e-mail, nous vous enverrons un lien pour choisir un nouveau mot de passe.
                            </p>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    icon={<IconMail className="w-5 h-5" />}
                                    required
                                />
                                <Button type="submit" fullWidth size="lg" disabled={submitting}>
                                    {submitting ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
                                </Button>
                            </form>

                            <p className="text-center text-sm text-slate-500 mt-6">
                                <Link href="/login" className="font-bold text-brand-teal hover:text-brand-tealDark transition-colors inline-flex items-center gap-1.5">
                                    <IconArrowLeft className="w-4 h-4" /> Retour à la connexion
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

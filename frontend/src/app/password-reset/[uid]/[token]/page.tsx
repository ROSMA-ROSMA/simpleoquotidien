'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { IconLock, IconCircleCheck, IconAlertTriangle } from '@tabler/icons-react';

export default function PasswordResetConfirmPage() {
    const params = useParams<{ uid: string; token: string }>();
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, string> = {};
        if (!password) errors.password = 'Le mot de passe est obligatoire.';
        else if (password.length < 8) errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
        if (!confirmPassword) errors.confirmPassword = 'Veuillez confirmer le mot de passe.';
        else if (password && confirmPassword !== password) errors.confirmPassword = 'Les mots de passe ne correspondent pas.';

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            setError('Veuillez corriger les champs indiqués ci-dessous.');
            return;
        }

        setError('');
        setSubmitting(true);
        const uid = decodeURIComponent(params.uid);
        const token = decodeURIComponent(params.token);
        const result = await authService.resetPasswordConfirm(uid, token, password);
        setSubmitting(false);

        if (!result.success) {
            setError(result.error ?? "Ce lien de réinitialisation est invalide ou a expiré.");
            return;
        }
        setSuccess(true);
        setTimeout(() => router.push('/login?passwordReset=true'), 1500);
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
                    {success ? (
                        <div className="text-center">
                            <div className="mx-auto w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-6">
                                <IconCircleCheck className="w-10 h-10 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-brand-dark mb-3">Mot de passe modifié !</h1>
                            <p className="text-slate-500 leading-relaxed">Redirection vers la connexion…</p>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-extrabold text-brand-dark mb-2 text-center">Nouveau mot de passe</h1>
                            <p className="text-slate-500 text-center mb-8">Choisissez un nouveau mot de passe pour votre compte.</p>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2">
                                    <IconAlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>
                                        {error}
                                        {error.toLowerCase().includes('expiré') || error.toLowerCase().includes('invalide') ? (
                                            <>
                                                {' '}
                                                <Link href="/forgot-password" className="font-bold underline underline-offset-2">
                                                    Demander un nouveau lien
                                                </Link>
                                            </>
                                        ) : null}
                                    </span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Input
                                    label="Nouveau mot de passe"
                                    type="password"
                                    placeholder="Minimum 8 caractères"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => { const n = { ...p }; delete n.password; return n; }); }}
                                    icon={<IconLock className="w-5 h-5" />}
                                    error={fieldErrors.password}
                                    required
                                />
                                <Input
                                    label="Confirmer le mot de passe"
                                    type="password"
                                    placeholder="Ressaisissez le mot de passe"
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => { const n = { ...p }; delete n.confirmPassword; return n; }); }}
                                    icon={<IconLock className="w-5 h-5" />}
                                    error={fieldErrors.confirmPassword}
                                    required
                                />
                                <Button type="submit" fullWidth size="lg" disabled={submitting}>
                                    {submitting ? 'Enregistrement…' : 'Réinitialiser mon mot de passe'}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

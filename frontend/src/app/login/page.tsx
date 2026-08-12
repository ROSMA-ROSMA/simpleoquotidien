'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { UserRole } from '@/types';
import { IconMail, IconLock, IconStar } from '@tabler/icons-react';

/** Un `redirect` venant de l'URL n'est suivi que s'il correspond au rôle réellement connecté,
 * sinon un client renvoyé depuis /agent/... par le middleware se retrouverait ramené
 * sur l'espace agent après connexion (« accès réservé aux agents »). */
function isRedirectAllowedForRole(path: string, role: UserRole): boolean {
    if (path.startsWith('/agent')) return role === UserRole.AGENT || role === UserRole.ADMIN;
    if (path.startsWith('/admin') || path.startsWith('/dashboard/admin')) return role === UserRole.ADMIN;
    if (path.startsWith('/dashboard/provider')) return role === UserRole.PROVIDER;
    if (path.startsWith('/dashboard/client')) return role === UserRole.CLIENT;
    return true;
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [errorCode, setErrorCode] = useState<string | undefined>();
    const [submitting, setSubmitting] = useState(false);
    const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const registered = searchParams.get('registered') === 'true';
    const passwordReset = searchParams.get('passwordReset') === 'true';
    const redirect = searchParams.get('redirect');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setErrorCode(undefined);
        setResendState('idle');
        setSubmitting(true);
        const result = await login(email, password);
        setSubmitting(false);
        if (result.success) {
            const target = redirect && result.user && isRedirectAllowedForRole(redirect, result.user.role)
                ? redirect
                : (result.redirectPath || '/dashboard/client');
            router.push(target);
        } else {
            setError(result.error || 'Erreur de connexion');
            setErrorCode(result.errorCode);
        }
    };

    const handleResend = async () => {
        if (!email.trim()) return;
        setResendState('sending');
        await authService.resendActivation(email.trim());
        setResendState('sent');
    };

    return (
        <div className="min-h-screen flex">
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-brand-surface">
                <div className="w-full max-w-md">
                    <Link href="/" className="flex items-center gap-2 mb-10 group">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 transition-transform group-hover:scale-105">
                            <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-7 h-7" />
                        </div>
                        <span className="text-xl font-extrabold text-brand-teal">Simple<span className="text-brand-coral">Ô</span>Quotidien</span>
                    </Link>

                    <h1 className="text-3xl font-extrabold text-brand-dark mb-2">Bon retour !</h1>
                    <p className="text-slate-500 mb-8">Connectez-vous pour accéder à votre espace.</p>

                    {registered && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6 text-sm">
                            Inscription réussie ! Un e-mail de confirmation vient de vous être envoyé — cliquez sur le lien qu&apos;il contient pour activer votre compte, puis connectez-vous.
                        </div>
                    )}

                    {passwordReset && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6 text-sm">
                            Votre mot de passe a été modifié avec succès. Connectez-vous avec votre nouveau mot de passe.
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 text-sm">
                            <p>{error}</p>
                            {errorCode === 'EMAIL_NOT_CONFIRMED' && (
                                resendState === 'sent' ? (
                                    <p className="mt-2 text-green-700 font-medium">
                                        E-mail de confirmation renvoyé — vérifiez votre boîte de réception.
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resendState === 'sending' || !email.trim()}
                                        className="mt-2 font-bold text-red-900 underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
                                    >
                                        {resendState === 'sending' ? 'Envoi…' : "Renvoyer l'e-mail de confirmation"}
                                    </button>
                                )
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<IconMail className="w-5 h-5" />}
                            required
                        />
                        <div>
                            <Input
                                label="Mot de passe"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={<IconLock className="w-5 h-5" />}
                                required
                            />
                            <Link href="/forgot-password" className="inline-block mt-2 text-sm font-semibold text-brand-teal hover:text-brand-tealDark transition-colors">
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        <Button type="submit" fullWidth size="lg" disabled={submitting}>
                            {submitting ? 'Connexion…' : 'Se connecter'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-8">
                        Pas encore de compte ?{' '}
                        <Link href="/register" className="font-bold text-brand-teal hover:text-brand-tealDark transition-colors">
                            Créer un compte
                        </Link>
                    </p>

                    <p className="mt-8 text-xs text-slate-400 text-center">
                        Authentification sécurisée via le serveur (cookies httpOnly).
                    </p>
                </div>
            </div>

            <div className="hidden lg:flex flex-1 bg-brand-teal relative items-center justify-center overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-white opacity-5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-brand-mint opacity-10 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-md text-center px-8">
                    <div className="flex justify-center mb-6 gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <IconStar key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                    <blockquote className="text-white text-xl font-medium italic mb-6 leading-relaxed">
                        &ldquo;J&apos;ai trouvé un plombier en 10 minutes un dimanche. Simple, efficace et rassurant !&rdquo;
                    </blockquote>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                            S
                        </div>
                        <div className="text-left">
                            <p className="text-white font-bold">Sophie M.</p>
                            <p className="text-brand-tealLight text-sm">Cliente depuis 2025</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-brand-surface" />}>
            <LoginForm />
        </Suspense>
    );
}

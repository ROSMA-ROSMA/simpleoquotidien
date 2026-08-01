'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
    IconCircleCheck,
    IconAlertTriangle,
    IconLoader2,
    IconMail,
} from '@tabler/icons-react';

type Status = 'loading' | 'success' | 'error';

/**
 * Page ouverte depuis le lien du mail de confirmation :
 * {protocol}://{domain}/activate/{uid}/{token}
 *
 * Elle fonctionne à l'identique quel que soit l'appareil sur lequel le lien
 * est ouvert (téléphone ou PC) : il ne s'agit que d'une page web classique,
 * pas d'un deep-link applicatif. Cliquer sur le lien active le compte ET
 * connecte automatiquement l'utilisateur sur CET appareil-là (cookies
 * httpOnly posés par la route /api/auth/activate). Si le compte a été créé
 * sur un autre appareil que celui où l'e-mail est ouvert, l'utilisateur se
 * retrouve donc connecté sur l'appareil où il a cliqué — ce qui est le
 * comportement attendu.
 */
export default function ActivatePage() {
    const params = useParams<{ uid: string; token: string }>();
    const router = useRouter();
    const { activate } = useAuth();

    const [status, setStatus] = useState<Status>('loading');
    const [error, setError] = useState('');
    const [redirectPath, setRedirectPath] = useState('/dashboard/client');
    const ranOnce = useRef(false);

    // Formulaire de renvoi d'e-mail (affiché si le lien est invalide/expiré)
    const [resendEmail, setResendEmail] = useState('');
    const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

    useEffect(() => {
        if (ranOnce.current) return;
        ranOnce.current = true;

        (async () => {
            const uid = decodeURIComponent(params.uid);
            const token = decodeURIComponent(params.token);
            const result = await activate(uid, token);

            if (result.success) {
                setStatus('success');
                setRedirectPath(result.redirectPath || '/dashboard/client');
                setTimeout(() => {
                    router.push(result.redirectPath || '/dashboard/client');
                    router.refresh();
                }, 1500);
                return;
            }

            // Le lien peut avoir déjà été utilisé (ex : ouvert deux fois, ou sur
            // un autre onglet où l'utilisateur est déjà connecté depuis le 1er
            // clic) : un jeton "expiré" côté Django ne veut pas forcément dire
            // que le compte n'est pas activé. On vérifie la session en cours
            // avant d'afficher une erreur.
            const existing = await authService.getMe();
            if (existing) {
                setStatus('success');
                setRedirectPath('/dashboard/client');
                setTimeout(() => {
                    router.push('/dashboard/client');
                    router.refresh();
                }, 1200);
                return;
            }

            setStatus('error');
            setError(result.error || "Ce lien d'activation est invalide ou a expiré.");
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resendEmail.trim()) return;
        setResendState('sending');
        await authService.resendActivation(resendEmail.trim());
        setResendState('sent');
    };

    return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md text-center">
                <Link href="/" className="inline-flex items-center gap-2 group mb-10">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 transition-transform group-hover:scale-105">
                        <img src="/favicon.svg" alt="SimpleÔQuotidien" className="w-7 h-7" />
                    </div>
                    <span className="text-xl font-extrabold text-brand-teal">
                        Simple<span className="text-brand-coral">Ô</span>Quotidien
                    </span>
                </Link>

                <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 sm:p-10">
                    {status === 'loading' && (
                        <>
                            <div className="mx-auto w-20 h-20 rounded-full bg-brand-tealLight/40 border-2 border-brand-teal/20 flex items-center justify-center mb-6">
                                <IconLoader2 className="w-10 h-10 text-brand-teal animate-spin" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-brand-dark mb-3">
                                Activation en cours…
                            </h1>
                            <p className="text-slate-500 leading-relaxed">
                                Un instant, nous confirmons votre compte.
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="mx-auto w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-6">
                                <IconCircleCheck className="w-10 h-10 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-brand-dark mb-3">
                                Compte activé !
                            </h1>
                            <p className="text-slate-500 mb-6 leading-relaxed">
                                Vous êtes connecté. Redirection vers votre tableau de bord…
                            </p>
                            <Button fullWidth size="lg" onClick={() => router.push(redirectPath)}>
                                Accéder à mon tableau de bord
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mx-auto w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mb-6">
                                <IconAlertTriangle className="w-10 h-10 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-brand-dark mb-3">
                                Lien invalide ou expiré
                            </h1>
                            <p className="text-slate-500 mb-6 leading-relaxed">
                                {error}
                                {error.toLowerCase().includes('expiré') && (
                                    <>
                                        {' '}
                                        Si vous avez déjà cliqué sur ce lien ailleurs (autre onglet
                                        ou appareil), votre compte est peut-être déjà actif —
                                        essayez simplement de vous connecter.
                                    </>
                                )}
                            </p>

                            {resendState === 'sent' ? (
                                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm mb-2">
                                    Si un compte existe pour cette adresse, un nouvel e-mail
                                    d&apos;activation vient d&apos;être envoyé.
                                </div>
                            ) : (
                                <form onSubmit={handleResend} className="space-y-4 text-left mb-2">
                                    <Input
                                        label="Recevoir un nouveau lien"
                                        type="email"
                                        placeholder="votre@email.com"
                                        value={resendEmail}
                                        onChange={(e) => setResendEmail(e.target.value)}
                                        icon={<IconMail className="w-5 h-5" />}
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="secondary"
                                        disabled={resendState === 'sending'}
                                    >
                                        {resendState === 'sending' ? 'Envoi…' : "Renvoyer l'e-mail d'activation"}
                                    </Button>
                                </form>
                            )}

                            <Link
                                href="/login"
                                className="inline-block mt-2 text-sm font-semibold text-brand-teal hover:text-brand-tealDark transition-colors"
                            >
                                Retour à la connexion
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useProviderProfile } from '@/hooks/useProviderProfile';
import { subscriptionService } from '@/services/subscription.service';
import { PLANS, SUBSCRIPTION_STATUS_LABELS } from '@/lib/plans';
import { formatPrice } from '@/lib/utils';
import { Subscription } from '@/types';
import { IconCheck, IconStar, IconArrowRight, IconSparkles } from '@tabler/icons-react';

function statusVariant(statut: string) {
    switch (statut) {
        case 'ACTIF': return 'success' as const;
        case 'EN_ATTENTE': return 'warning' as const;
        case 'EXPIRE':
        case 'ANNULE': return 'danger' as const;
        default: return 'neutral' as const;
    }
}

export default function ProviderSubscriptionPage() {
    const { currentUser } = useAuth();
    const { profile, loading: profileLoading } = useProviderProfile();
    const [current, setCurrent] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) { setLoading(false); return; }
        setLoading(true);
        subscriptionService.getCurrentForProvider(profile.id)
            .then(setCurrent)
            .catch(() => setCurrent(null))
            .finally(() => setLoading(false));
    }, [profile]);

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-brand-dark mb-2">Connexion requise</h1>
                    <Link href="/login" className="text-brand-teal font-bold">Se connecter →</Link>
                </div>
            </div>
        );
    }

    const currentPlanId = current && current.statut === 'ACTIF' ? current.plan : null;

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar activeTab="abonnement" />
            <main className="flex-1 py-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-tealLight text-brand-teal rounded-full text-xs font-bold mb-4">
                            <IconSparkles className="w-3.5 h-3.5" /> Plans d&apos;abonnement
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mb-2">Choisissez votre plan</h1>
                        <p className="text-slate-500 text-sm">
                            Un plan gratuit pour tester, des plans payants pour débloquer plus de leads et de visibilité.
                        </p>
                        {!profileLoading && !loading && current && (
                            <div className="mt-4 inline-flex items-center gap-2">
                                <span className="text-xs text-slate-400">Statut actuel :</span>
                                <Badge variant={statusVariant(current.statut)}>{SUBSCRIPTION_STATUS_LABELS[current.statut] ?? current.statut}</Badge>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {PLANS.map(plan => {
                            const isCurrent = currentPlanId === plan.id;
                            return (
                                <div
                                    key={plan.id}
                                    className={`relative flex flex-col rounded-2xl border-2 p-6 bg-white transition-all ${
                                        plan.highlight ? 'border-brand-teal shadow-xl shadow-brand-teal/10 md:-translate-y-2' : 'border-slate-100 shadow-card'
                                    }`}
                                >
                                    {plan.highlight && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-brand-teal text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                                            <IconStar className="w-3 h-3" /> Recommandé
                                        </span>
                                    )}
                                    {isCurrent && (
                                        <span className="absolute -top-3 right-4 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                                            Plan actuel
                                        </span>
                                    )}

                                    <h2 className="font-extrabold text-brand-dark text-base mb-1">{plan.name}</h2>
                                    <p className="text-xs text-slate-400 mb-4 min-h-[2.5em]">{plan.tagline}</p>

                                    <div className="mb-4">
                                        {plan.price !== null ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-extrabold text-brand-dark">{plan.price === 0 ? '0' : formatPrice(plan.price)}</span>
                                                <span className="text-xs text-slate-400 font-semibold">FCFA / mois</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="text-lg font-extrabold text-brand-dark">Sur devis</span>
                                                <p className="text-xs text-slate-400 mt-0.5">{plan.priceNote}</p>
                                            </div>
                                        )}
                                    </div>

                                    <ul className="space-y-2.5 mb-6 flex-1">
                                        {plan.features.map((f, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                                                <IconCheck className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <p className="text-[11px] text-slate-400 mb-4">{plan.target}</p>

                                    <Link href={`/dashboard/provider/abonnement/paiement/${plan.slug}`}>
                                        <Button
                                            variant={plan.highlight ? 'primary' : isCurrent ? 'secondary' : 'outline'}
                                            fullWidth
                                            disabled={isCurrent}
                                            icon={!isCurrent ? <IconArrowRight className="w-4 h-4" /> : undefined}
                                        >
                                            {isCurrent ? 'Plan actif' : plan.price === 0 ? 'Activer gratuitement' : plan.price === null ? 'Demander un devis' : 'Choisir ce plan'}
                                        </Button>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-10">
                        Des options complémentaires (visibilité renforcée, multi-villes, SMS illimités) sont proposées à l&apos;étape de paiement.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}

'use client';

import { use, useState, ReactNode } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useProviderProfile } from '@/hooks/useProviderProfile';
import { subscriptionService } from '@/services/subscription.service';
import { getPlanBySlug, PLAN_ADDONS } from '@/lib/plans';
import { formatPrice } from '@/lib/utils';
import {
    IconArrowLeft, IconDeviceMobile, IconCreditCard, IconBuildingBank,
    IconCheck, IconLock, IconCircleCheck, IconHome, IconReceipt2, IconCopy,
    IconMail, IconPhone, IconSend,
} from '@tabler/icons-react';

interface Props { params: Promise<{ plan: string }>; }

type Step = 'form' | 'processing' | 'success';
type Method = 'mobile_money' | 'card' | 'bank_transfer';
type Operator = 'orange' | 'moov' | 'telecel';

const paymentMethods: { id: Method; label: string; description: string; icon: ReactNode; color: string }[] = [
    { id: 'mobile_money', label: 'Mobile Money', description: 'Orange, Moov, Telecel', icon: <IconDeviceMobile className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600' },
    { id: 'card', label: 'Carte bancaire', description: 'Visa, Mastercard', icon: <IconCreditCard className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
    { id: 'bank_transfer', label: 'Virement bancaire', description: 'Transfert direct', icon: <IconBuildingBank className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
];

const operators: { id: Operator; label: string; dot: string }[] = [
    { id: 'orange', label: 'Orange Money', dot: 'bg-orange-500' },
    { id: 'moov', label: 'Moov Money', dot: 'bg-blue-500' },
    { id: 'telecel', label: 'Telecel Money', dot: 'bg-red-500' },
];

const methodLabel: Record<Method, string> = {
    mobile_money: 'Mobile Money',
    card: 'Carte bancaire',
    bank_transfer: 'Virement bancaire',
};

function formatCardNumber(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function StepIndicator({ step, labels }: { step: Step; labels: [string, string, string] }) {
    const order: Step[] = ['form', 'processing', 'success'];
    const currentIndex = order.indexOf(step);
    return (
        <div className="flex items-center mb-6 sm:mb-8">
            {order.map((key, idx) => {
                const done = idx < currentIndex;
                const active = idx === currentIndex;
                return (
                    <div key={key} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                done ? 'bg-brand-teal text-white' : active ? 'bg-brand-teal text-white ring-4 ring-brand-tealLight' : 'bg-slate-100 text-slate-400'
                            }`}>
                                {done ? <IconCheck className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${active || done ? 'text-brand-teal' : 'text-slate-400'}`}>
                                {labels[idx]}
                            </span>
                        </div>
                        {idx < order.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-2 rounded-full transition-colors ${done ? 'bg-brand-teal' : 'bg-slate-100'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function ProviderSubscriptionCheckoutPage({ params }: Props) {
    const { plan: slug } = use(params);
    const { currentUser } = useAuth();
    const { profile, loading: profileLoading } = useProviderProfile();
    const plan = getPlanBySlug(slug);

    const [step, setStep] = useState<Step>('form');
    const [error, setError] = useState('');
    const [method, setMethod] = useState<Method | null>(null);
    const [operator, setOperator] = useState<Operator | null>(null);
    const [phone, setPhone] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardName, setCardName] = useState('');
    const [bankConfirmed, setBankConfirmed] = useState(false);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [quoteMessage, setQuoteMessage] = useState('');
    const [txnRef, setTxnRef] = useState('');
    const [copied, setCopied] = useState(false);
    const [finalMethodLabel, setFinalMethodLabel] = useState('');

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

    if (profileLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-brand-surface"><p className="text-slate-500">Chargement…</p></div>;
    }

    if (!plan) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Plan introuvable</h1>
                    <Link href="/dashboard/provider/abonnement" className="text-brand-teal font-bold">← Voir les plans</Link>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Profil prestataire introuvable</h1>
                    <p className="text-slate-500 text-sm mb-4">Complétez votre profil avant de souscrire à un abonnement.</p>
                    <Link href="/profile" className="text-brand-teal font-bold">Compléter mon profil →</Link>
                </div>
            </div>
        );
    }

    const isFree = plan.price === 0;
    const isQuote = plan.price === null;
    const addonsTotal = selectedAddons.reduce((sum, id) => sum + (PLAN_ADDONS.find(a => a.id === id)?.price ?? 0), 0);
    const totalDue = (plan.price ?? 0) + addonsTotal;

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    };

    const isValid = (): boolean => {
        if (isFree) return true;
        if (isQuote) return quoteMessage.trim().length > 4;
        switch (method) {
            case 'mobile_money': return !!operator && phone.replace(/\D/g, '').length >= 8;
            case 'card':
                return cardNumber.replace(/\s/g, '').length === 16 && /^\d{2}\/\d{2}$/.test(cardExpiry) && cardCvc.length === 3 && cardName.trim().length > 1;
            case 'bank_transfer': return bankConfirmed;
            default: return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid()) return;
        setError('');
        setStep('processing');
        try {
            const modePayment = isFree ? 'Aucun' : isQuote ? 'Devis' : method ? methodLabel[method] : 'Aucun';
            const statut = isQuote ? 'EN_ATTENTE' : 'ACTIF';
            await subscriptionService.create({
                prestataire_id: profile.id,
                plan: plan.id,
                statut,
                mode_payment: modePayment + (selectedAddons.length ? ` + ${selectedAddons.length} option(s)` : ''),
            });
            setFinalMethodLabel(modePayment);
            setTxnRef(`SUB-${plan.slug.toUpperCase()}-${Date.now().toString().slice(-8)}`);
            await new Promise(r => setTimeout(r, 600));
            setStep('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
            setStep('form');
        }
    };

    const handleCopy = () => {
        navigator.clipboard?.writeText(txnRef);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const stepLabels: [string, string, string] = isQuote
        ? ['Demande', 'Envoi', 'Confirmation']
        : ['Paiement', 'Traitement', 'Confirmation'];

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar activeTab="abonnement" />
            <main className="flex-1 pt-8 pb-16">
                <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                    {step === 'form' && (
                        <Link href="/dashboard/provider/abonnement" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-5 transition-colors">
                            <IconArrowLeft className="w-4 h-4" /> Retour aux plans
                        </Link>
                    )}

                    <StepIndicator step={step} labels={stepLabels} />

                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                        {step === 'form' && (
                            <form onSubmit={handleSubmit}>
                                {/* Récap plan */}
                                <div className="p-5 sm:p-8 border-b border-slate-100">
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark mb-1">{plan.name}</h1>
                                    <p className="text-slate-400 text-sm mb-5">{plan.tagline}</p>

                                    {!isQuote && (
                                        <div className="space-y-2">
                                            {PLAN_ADDONS.map(addon => (
                                                <label key={addon.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAddons.includes(addon.id)}
                                                        onChange={() => toggleAddon(addon.id)}
                                                        className="mt-0.5 w-4 h-4 accent-brand-teal shrink-0"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm font-bold text-brand-dark">{addon.label}</span>
                                                            <span className="text-xs font-bold text-brand-teal whitespace-nowrap">+{formatPrice(addon.price)} FCFA</span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-0.5">{addon.description}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {!isQuote && (
                                        <div className="mt-5 pt-5 border-t border-dashed border-slate-200 flex items-center justify-between gap-3">
                                            <span className="text-slate-500 font-medium">Total {isFree ? '' : '/ mois'}</span>
                                            <span className="text-2xl sm:text-3xl font-extrabold text-brand-teal whitespace-nowrap">
                                                {formatPrice(totalDue)} <span className="text-sm sm:text-base text-slate-400 font-semibold">FCFA</span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {isQuote ? (
                                    /* ─── Enterprise: demande de devis ─── */
                                    <div className="p-5 sm:p-8 border-b border-slate-100">
                                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Votre demande</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Besoin / contexte</label>
                                                <textarea
                                                    rows={4}
                                                    placeholder="Nombre d'agences, de techniciens, besoins spécifiques (API, multi-entités)…"
                                                    value={quoteMessage}
                                                    onChange={e => setQuoteMessage(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-teal focus:ring-2 focus:ring-brand-tealLight outline-none transition-all text-sm resize-none"
                                                />
                                            </div>
                                            <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50">
                                                <IconMail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                                <p className="text-sm text-blue-800">
                                                    Notre équipe vous recontacte sous 48h avec un devis personnalisé, à partir de {formatPrice(100000)} FCFA/mois.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : isFree ? (
                                    /* ─── Plan gratuit: pas de paiement ─── */
                                    <div className="p-5 sm:p-8 border-b border-slate-100">
                                        <div className="flex items-start gap-3 p-4 rounded-xl border border-green-100 bg-green-50">
                                            <IconCircleCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                            <p className="text-sm text-green-800">
                                                Le plan Découverte est gratuit et s&apos;active immédiatement, sans moyen de paiement.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    /* ─── Plans payants: choix du moyen de paiement ─── */
                                    <div className="p-5 sm:p-8 border-b border-slate-100">
                                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Moyen de paiement</h2>
                                        <div className="grid grid-cols-3 gap-3">
                                            {paymentMethods.map(m => (
                                                <button
                                                    type="button"
                                                    key={m.id}
                                                    onClick={() => setMethod(m.id)}
                                                    className={`relative flex flex-col items-start gap-2 p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all ${
                                                        method === m.id ? 'border-brand-teal bg-brand-tealLight/40 shadow-sm' : 'border-slate-200 hover:border-brand-teal/40 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {method === m.id && (
                                                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-teal text-white flex items-center justify-center">
                                                            <IconCheck className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${m.color} flex items-center justify-center`}>{m.icon}</div>
                                                    <div>
                                                        <h3 className="font-bold text-brand-dark text-xs sm:text-sm">{m.label}</h3>
                                                        <p className="text-[10px] sm:text-xs text-slate-400">{m.description}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {method === 'mobile_money' && (
                                            <div className="mt-5 animate-in space-y-4">
                                                <div className="grid grid-cols-3 gap-2">
                                                    {operators.map(op => (
                                                        <button
                                                            type="button"
                                                            key={op.id}
                                                            onClick={() => setOperator(op.id)}
                                                            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                                                                operator === op.id ? 'border-brand-teal bg-brand-tealLight/40 text-brand-teal' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            <span className={`w-2.5 h-2.5 rounded-full ${op.dot}`} />
                                                            {op.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Numéro de téléphone</label>
                                                    <input
                                                        type="tel"
                                                        inputMode="tel"
                                                        placeholder="+226 70 00 00 00"
                                                        value={phone}
                                                        onChange={e => setPhone(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-teal focus:ring-2 focus:ring-brand-tealLight outline-none transition-all text-sm"
                                                    />
                                                    <p className="text-xs text-slate-400 mt-1.5">Une demande de confirmation sera envoyée sur ce numéro.</p>
                                                </div>
                                            </div>
                                        )}

                                        {method === 'card' && (
                                            <div className="mt-5 animate-in space-y-4">
                                                <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-teal to-brand-tealDark text-white shadow-lg shadow-brand-teal/20 relative overflow-hidden">
                                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
                                                    <div className="absolute -right-2 top-10 w-20 h-20 bg-white/10 rounded-full" />
                                                    <div className="flex items-center justify-between mb-6 relative">
                                                        <IconCreditCard className="w-8 h-8 opacity-80" />
                                                        <span className="text-xs font-bold tracking-widest opacity-70">CARTE</span>
                                                    </div>
                                                    <p className="text-base sm:text-xl font-mono tracking-wide sm:tracking-widest mb-4 relative truncate">
                                                        {cardNumber || '•••• •••• •••• ••••'}
                                                    </p>
                                                    <div className="flex items-end justify-between relative">
                                                        <div>
                                                            <span className="text-[10px] uppercase opacity-60 block">Titulaire</span>
                                                            <span className="text-sm font-semibold uppercase">{cardName || 'NOM PRÉNOM'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase opacity-60 block">Exp.</span>
                                                            <span className="text-sm font-semibold">{cardExpiry || 'MM/AA'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Numéro de carte</label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        placeholder="4242 4242 4242 4242"
                                                        value={cardNumber}
                                                        onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-teal focus:ring-2 focus:ring-brand-tealLight outline-none transition-all text-sm font-mono"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expiration</label>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="MM/AA"
                                                            value={cardExpiry}
                                                            onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-teal focus:ring-2 focus:ring-brand-tealLight outline-none transition-all text-sm font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">CVC</label>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="123"
                                                            value={cardCvc}
                                                            onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-teal focus:ring-2 focus:ring-brand-tealLight outline-none transition-all text-sm font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Titulaire de la carte</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Nom Prénom"
                                                        value={cardName}
                                                        onChange={e => setCardName(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-teal focus:ring-2 focus:ring-brand-tealLight outline-none transition-all text-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {method === 'bank_transfer' && (
                                            <div className="mt-5 animate-in space-y-4">
                                                <div className="rounded-xl border border-slate-200 p-4 space-y-2.5 text-sm bg-slate-50">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-500">Banque</span>
                                                        <span className="font-bold text-brand-dark">Coris Bank International</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-500">Titulaire</span>
                                                        <span className="font-bold text-brand-dark">SimpleÔQuotidien SARL</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-500">RIB</span>
                                                        <span className="font-bold text-brand-dark font-mono">BF87 4001 2000 8899 7712</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-500">Référence à indiquer</span>
                                                        <span className="font-bold text-brand-coral font-mono">ABO-{plan.slug.toUpperCase()}-{profile.id}</span>
                                                    </div>
                                                </div>
                                                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={bankConfirmed}
                                                        onChange={e => setBankConfirmed(e.target.checked)}
                                                        className="mt-0.5 w-4 h-4 accent-brand-teal shrink-0"
                                                    />
                                                    <span className="text-sm text-slate-600">J&apos;ai effectué le virement avec la référence ci-dessus.</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="p-5 sm:p-8">
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={!isValid()}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-coral hover:bg-brand-coralHover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-base font-extrabold transition-all shadow-lg shadow-brand-coral/20 disabled:shadow-none hover:-translate-y-0.5 disabled:translate-y-0"
                                    >
                                        {isQuote ? (<><IconSend className="w-4 h-4" /> Envoyer la demande</>) : isFree ? 'Activer gratuitement' : `Payer ${formatPrice(totalDue)} FCFA`}
                                    </button>
                                    <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                                        <IconLock className="w-3.5 h-3.5" /> {isQuote ? 'Aucun engagement, réponse sous 48h' : 'Paiement simulé et sécurisé'}
                                    </p>
                                </div>
                            </form>
                        )}

                        {step === 'processing' && (
                            <div className="p-12 sm:p-20 flex flex-col items-center justify-center text-center">
                                <div className="relative w-16 h-16 mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-brand-tealLight" />
                                    <div className="absolute inset-0 rounded-full border-4 border-brand-teal border-t-transparent animate-spin" />
                                </div>
                                <h2 className="text-lg font-bold text-brand-dark mb-1">{isQuote ? 'Envoi de votre demande…' : 'Traitement du paiement…'}</h2>
                                <p className="text-sm text-slate-400">Merci de ne pas fermer cette page</p>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="p-6 sm:p-10 text-center animate-in">
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5">
                                    <span className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-75" />
                                    <span className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-white">
                                        {isQuote ? <IconPhone className="w-9 h-9 sm:w-11 sm:h-11" /> : <IconCircleCheck className="w-9 h-9 sm:w-11 sm:h-11" />}
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark mb-1">
                                    {isQuote ? 'Demande envoyée !' : 'Abonnement activé !'}
                                </h1>
                                <p className="text-slate-500 text-sm mb-6">
                                    {isQuote ? 'Notre équipe vous recontacte sous 48h.' : `Vous êtes maintenant sur le plan ${plan.name}.`}
                                </p>

                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-left space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-1.5"><IconReceipt2 className="w-4 h-4" /> Référence</span>
                                        <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 font-mono font-bold text-brand-dark hover:text-brand-teal transition-colors">
                                            {txnRef} <IconCopy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    {copied && <p className="text-xs text-brand-teal text-right -mt-2">Copié !</p>}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">{isQuote ? 'Mode' : 'Moyen de paiement'}</span>
                                        <span className="font-bold text-brand-dark">{finalMethodLabel}</span>
                                    </div>
                                    {!isQuote && (
                                        <div className="flex items-center justify-between text-sm pt-3 border-t border-dashed border-slate-200">
                                            <span className="text-slate-500 font-medium">Montant {isFree ? '' : 'payé'}</span>
                                            <span className="text-xl font-extrabold text-brand-teal">{formatPrice(totalDue)} FCFA</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/dashboard/provider"
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-teal hover:bg-brand-tealDark text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-teal/20 hover:-translate-y-0.5"
                                    >
                                        <IconHome className="w-4 h-4" /> Tableau de bord
                                    </Link>
                                    <Link
                                        href="/dashboard/provider/abonnement"
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all"
                                    >
                                        Voir les plans
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

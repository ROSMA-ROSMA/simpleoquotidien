'use client';

import { use, useState, ReactNode } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import { useBooking } from '@/hooks/useOrders';
import { orderService } from '@/services/order.service';
import { formatPrice, formatDateTime, getBookingTitle } from '@/lib/utils';
import { PaymentMethod } from '@/types';
import {
    IconArrowLeft, IconDeviceMobile, IconCash, IconBuildingBank, IconCreditCard,
    IconCheck, IconCalendar, IconMapPin, IconUser, IconLock, IconCopy,
    IconCircleCheck, IconHome, IconReceipt2,
} from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

type Step = 'form' | 'processing' | 'success';
type Operator = 'orange' | 'moov' | 'telecel';

const paymentMethods: { id: PaymentMethod; label: string; description: string; icon: ReactNode; color: string }[] = [
    { id: PaymentMethod.MOBILE_MONEY, label: 'Mobile Money', description: 'Orange, Moov, Telecel', icon: <IconDeviceMobile className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600' },
    { id: PaymentMethod.CARD, label: 'Carte bancaire', description: 'Visa, Mastercard', icon: <IconCreditCard className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
    { id: PaymentMethod.BANK_TRANSFER, label: 'Virement bancaire', description: 'Transfert direct', icon: <IconBuildingBank className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
    { id: PaymentMethod.CASH, label: 'Espèces', description: 'À la prestation', icon: <IconCash className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
];

const operators: { id: Operator; label: string; dot: string }[] = [
    { id: 'orange', label: 'Orange Money', dot: 'bg-orange-500' },
    { id: 'moov', label: 'Moov Money', dot: 'bg-blue-500' },
    { id: 'telecel', label: 'Telecel Money', dot: 'bg-red-500' },
];

function formatCardNumber(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function StepIndicator({ step }: { step: Step }) {
    const items: { key: Step; label: string }[] = [
        { key: 'form', label: 'Paiement' },
        { key: 'processing', label: 'Traitement' },
        { key: 'success', label: 'Confirmation' },
    ];
    const order: Step[] = ['form', 'processing', 'success'];
    const currentIndex = order.indexOf(step);

    return (
        <div className="flex items-center mb-6 sm:mb-8">
            {items.map((item, idx) => {
                const done = idx < currentIndex;
                const active = idx === currentIndex;
                return (
                    <div key={item.key} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                            <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                    done
                                        ? 'bg-brand-teal text-white'
                                        : active
                                            ? 'bg-brand-teal text-white ring-4 ring-brand-tealLight'
                                            : 'bg-slate-100 text-slate-400'
                                }`}
                            >
                                {done ? <IconCheck className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${active || done ? 'text-brand-teal' : 'text-slate-400'}`}>
                                {item.label}
                            </span>
                        </div>
                        {idx < items.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-2 rounded-full transition-colors ${done ? 'bg-brand-teal' : 'bg-slate-100'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function PaymentInitiatePage({ params }: Props) {
    const { id } = use(params);
    const { booking, loading, reload } = useBooking(id);

    const [step, setStep] = useState<Step>('form');
    const [payError, setPayError] = useState('');
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [operator, setOperator] = useState<Operator | null>(null);
    const [phone, setPhone] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardName, setCardName] = useState('');
    const [bankConfirmed, setBankConfirmed] = useState(false);
    const [txnRef, setTxnRef] = useState('');
    const [copied, setCopied] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <p className="text-slate-500">Chargement…</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Réservation introuvable</h1>
                    <Link href="/dashboard/client" className="text-brand-teal font-bold">← Retour</Link>
                </div>
            </div>
        );
    }

    const title = getBookingTitle(booking);

    const isValid = (): boolean => {
        switch (method) {
            case PaymentMethod.MOBILE_MONEY:
                return !!operator && phone.replace(/\D/g, '').length >= 8;
            case PaymentMethod.CARD:
                return (
                    cardNumber.replace(/\s/g, '').length === 16 &&
                    /^\d{2}\/\d{2}$/.test(cardExpiry) &&
                    cardCvc.length === 3 &&
                    cardName.trim().length > 1
                );
            case PaymentMethod.BANK_TRANSFER:
                return bankConfirmed;
            case PaymentMethod.CASH:
                return true;
            default:
                return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid() || !method) return;
        setPayError('');
        setStep('processing');
        try {
            const res = await orderService.pay(id, method);
            setTxnRef(res.data.payment?.transaction_ref ?? '');
            await reload();
            setStep('success');
        } catch (err) {
            setPayError(err instanceof Error ? err.message : 'Le paiement a échoué. Veuillez réessayer.');
            setStep('form');
        }
    };

    const handleCopy = () => {
        navigator.clipboard?.writeText(txnRef);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const selectedMethod = paymentMethods.find(m => m.id === method);

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-24 sm:pt-28 pb-16">
                <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                    {step === 'form' && (
                        <Link href={`/booking/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-5 transition-colors">
                            <IconArrowLeft className="w-4 h-4" /> Retour à la commande
                        </Link>
                    )}

                    <StepIndicator step={step} />

                    <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                        {/* ─── Step: form ─── */}
                        {step === 'form' && (
                            <form onSubmit={handleSubmit}>
                                {/* Order summary */}
                                <div className="p-5 sm:p-8 border-b border-slate-100">
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark mb-1">Récapitulatif</h1>
                                    <p className="text-slate-400 text-sm mb-5">Vérifiez les détails avant de payer</p>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="text-slate-500 shrink-0">Service</span>
                                            <span className="font-bold text-brand-dark text-right break-words">{title}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><IconCalendar className="w-4 h-4" /> Date</span>
                                            <span className="font-semibold text-slate-700 text-right">{formatDateTime(booking.scheduled_datetime)}</span>
                                        </div>
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><IconMapPin className="w-4 h-4" /> Adresse</span>
                                            <span className="font-semibold text-slate-700 text-right break-words min-w-0">{booking.address}</span>
                                        </div>
                                        {booking.assigned_provider && (
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-slate-500 flex items-center gap-1.5 shrink-0"><IconUser className="w-4 h-4" /> Prestataire</span>
                                                <span className="font-semibold text-slate-700 text-right">{booking.assigned_provider.first_name} {booking.assigned_provider.last_name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 pt-5 border-t border-dashed border-slate-200 flex items-center justify-between gap-3">
                                        <span className="text-slate-500 font-medium">Total à payer</span>
                                        <span className="text-2xl sm:text-3xl font-extrabold text-brand-teal whitespace-nowrap">
                                            {formatPrice(booking.total_amount)} <span className="text-sm sm:text-base text-slate-400 font-semibold">FCFA</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Method selection */}
                                <div className="p-5 sm:p-8 border-b border-slate-100">
                                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Moyen de paiement</h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        {paymentMethods.map(m => (
                                            <button
                                                type="button"
                                                key={m.id}
                                                onClick={() => setMethod(m.id)}
                                                className={`relative flex flex-col items-start gap-2 p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all ${
                                                    method === m.id
                                                        ? 'border-brand-teal bg-brand-tealLight/40 shadow-sm'
                                                        : 'border-slate-200 hover:border-brand-teal/40 hover:bg-slate-50'
                                                }`}
                                            >
                                                {method === m.id && (
                                                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-teal text-white flex items-center justify-center">
                                                        <IconCheck className="w-3 h-3" />
                                                    </span>
                                                )}
                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${m.color} flex items-center justify-center`}>{m.icon}</div>
                                                <div>
                                                    <h3 className="font-bold text-brand-dark text-sm">{m.label}</h3>
                                                    <p className="text-xs text-slate-400">{m.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Dynamic fields per method */}
                                    {method === PaymentMethod.MOBILE_MONEY && (
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

                                    {method === PaymentMethod.CARD && (
                                        <div className="mt-5 animate-in space-y-4">
                                            {/* Card preview */}
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
                                                        maxLength={3}
                                                        value={cardCvc}
                                                        onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-teal focus:ring-2 focus:ring-brand-tealLight outline-none transition-all text-sm font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nom du titulaire</label>
                                                <input
                                                    type="text"
                                                    placeholder="Comme indiqué sur la carte"
                                                    value={cardName}
                                                    onChange={e => setCardName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-teal focus:ring-2 focus:ring-brand-tealLight outline-none transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {method === PaymentMethod.BANK_TRANSFER && (
                                        <div className="mt-5 animate-in space-y-4">
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-sm">
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
                                                    <span className="font-bold text-brand-coral font-mono">CMD-{booking.id}</span>
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

                                    {method === PaymentMethod.CASH && (
                                        <div className="mt-5 animate-in">
                                            <div className="flex items-start gap-3 p-4 rounded-xl border border-green-100 bg-green-50">
                                                <IconCash className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                                <p className="text-sm text-green-800">
                                                    Vous réglerez <strong>{formatPrice(booking.total_amount)} FCFA</strong> en espèces directement au prestataire à la fin de la prestation.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
                                <div className="p-5 sm:p-8">
                                    {payError && (
                                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-4 text-sm">{payError}</div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={!isValid()}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-coral hover:bg-brand-coralHover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-base font-extrabold transition-all shadow-lg shadow-brand-coral/20 disabled:shadow-none hover:-translate-y-0.5 disabled:translate-y-0"
                                    >
                                        Payer {formatPrice(booking.total_amount)} FCFA
                                    </button>
                                    <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                                        <IconLock className="w-3.5 h-3.5" /> Paiement simulé et sécurisé
                                    </p>
                                </div>
                            </form>
                        )}

                        {/* ─── Step: processing ─── */}
                        {step === 'processing' && (
                            <div className="p-12 sm:p-20 flex flex-col items-center justify-center text-center">
                                <div className="relative w-16 h-16 mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-brand-tealLight" />
                                    <div className="absolute inset-0 rounded-full border-4 border-brand-teal border-t-transparent animate-spin" />
                                </div>
                                <h2 className="text-lg font-bold text-brand-dark mb-1">Traitement du paiement…</h2>
                                <p className="text-sm text-slate-400">Merci de ne pas fermer cette page</p>
                            </div>
                        )}

                        {/* ─── Step: success ─── */}
                        {step === 'success' && selectedMethod && (
                            <div className="p-6 sm:p-10 text-center animate-in">
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5">
                                    <span className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-75" />
                                    <span className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-white">
                                        <IconCircleCheck className="w-9 h-9 sm:w-11 sm:h-11" />
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark mb-1">Paiement réussi !</h1>
                                <p className="text-slate-500 text-sm mb-6">Votre commande est confirmée.</p>

                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-left space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-1.5"><IconReceipt2 className="w-4 h-4" /> Référence</span>
                                        <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 font-mono font-bold text-brand-dark hover:text-brand-teal transition-colors">
                                            {txnRef} <IconCopy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    {copied && <p className="text-xs text-brand-teal text-right -mt-2">Copié !</p>}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Moyen de paiement</span>
                                        <span className="font-bold text-brand-dark">{selectedMethod.label}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm pt-3 border-t border-dashed border-slate-200">
                                        <span className="text-slate-500 font-medium">Montant payé</span>
                                        <span className="text-xl font-extrabold text-brand-teal">{formatPrice(booking.total_amount)} FCFA</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href={`/booking/${id}`}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-teal hover:bg-brand-tealDark text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-teal/20 hover:-translate-y-0.5"
                                    >
                                        Voir ma réservation
                                    </Link>
                                    <Link
                                        href="/dashboard/client"
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all"
                                    >
                                        <IconHome className="w-4 h-4" /> Tableau de bord
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

'use client';

import { use, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/lib/utils';
import { PaymentMethod } from '@/types';
import { IconArrowLeft, IconDeviceMobile, IconCash, IconBuildingBank, IconCreditCard } from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

const paymentMethods: { id: PaymentMethod; label: string; description: string; icon: ReactNode; color: string }[] = [
    { id: PaymentMethod.MOBILE_MONEY, label: 'Mobile Money', description: 'Orange, Moov, Free Money', icon: <IconDeviceMobile className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600' },
    { id: PaymentMethod.CASH, label: 'Espèces', description: 'Paiement à la prestation', icon: <IconCash className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
    { id: PaymentMethod.BANK_TRANSFER, label: 'Virement bancaire', description: 'Transfert bancaire direct', icon: <IconBuildingBank className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
    { id: PaymentMethod.CARD, label: 'Carte bancaire', description: 'Visa, Mastercard', icon: <IconCreditCard className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
];

export default function PaymentInitiatePage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const bookingId = parseInt(id);
    const booking = useAppStore(s => s.bookings.find(b => b.id === bookingId));
    const simulatePayment = useAppStore(s => s.simulatePayment);

    if (!booking) {
        return <div className="min-h-screen flex items-center justify-center bg-brand-surface"><div className="text-center"><h1 className="text-2xl font-bold text-brand-dark mb-2">Réservation introuvable</h1><Link href="/dashboard/client" className="text-brand-teal font-bold">← Retour</Link></div></div>;
    }

    const handlePay = (method: PaymentMethod) => {
        simulatePayment(booking.id, method);
        router.push(`/booking/${booking.id}?payment_success=true`);
    };

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href={`/booking/${booking.id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour
                    </Link>

                    <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                        <h1 className="text-2xl font-extrabold text-brand-dark mb-2 text-center">Paiement</h1>
                        <p className="text-slate-500 text-center mb-2">{booking.service?.name}</p>
                        <div className="text-center mb-8">
                            <span className="text-4xl font-extrabold text-brand-teal">{formatPrice(booking.total_amount)}</span>
                            <span className="text-lg text-slate-400 ml-1">FCFA</span>
                        </div>

                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Choisir un moyen de paiement</h2>
                        <div className="space-y-3">
                            {paymentMethods.map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => handlePay(method.id)}
                                    className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-brand-teal hover:bg-brand-tealLight/10 transition-all text-left group"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                        {method.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-brand-dark">{method.label}</h3>
                                        <p className="text-xs text-slate-500">{method.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

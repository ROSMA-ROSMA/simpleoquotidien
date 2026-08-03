'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { useBooking } from '@/hooks/useOrders';
import { orderService } from '@/services/order.service';
import { getBookingTitle } from '@/lib/utils';
import { IconCircleCheck, IconArrowLeft, IconSend } from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

export default function SubmitQuotePage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const { booking, loading } = useBooking(id);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <p className="text-slate-500">Chargement…</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Réservation introuvable</h1>
                    <Link href="/dashboard/provider" className="text-brand-teal font-bold">← Retour</Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await orderService.submitQuote(id, Number(amount), description || undefined);
            router.push('/dashboard/provider/bookings');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du devis");
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/dashboard/provider/bookings" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour à mes réservations
                    </Link>

                    <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <IconCircleCheck className="w-7 h-7 text-emerald-500" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-brand-dark">Établir votre devis</h1>
                            <p className="text-slate-500 text-sm mt-1">{getBookingTitle(booking)}</p>
                            <p className="text-slate-400 text-xs mt-2">Mission acceptée — soumettez immédiatement votre devis pour que le client puisse le consulter.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Montant (FCFA)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="15000"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Détails du devis</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                    placeholder="Détail des prestations, matériel, délai d'intervention…"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all resize-none"
                                />
                            </div>

                            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

                            <Button type="submit" fullWidth icon={<IconSend className="w-4 h-4" />} disabled={submitting || !amount}>
                                {submitting ? 'Envoi…' : 'Envoyer le devis au client'}
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

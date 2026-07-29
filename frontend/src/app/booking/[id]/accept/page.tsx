'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/hooks/useOrders';
import { orderService } from '@/services/order.service';
import { getBookingTitle } from '@/lib/utils';
import { IconCircleCheck, IconArrowLeft, IconMail } from '@tabler/icons-react';

interface Props { params: Promise<{ id: string }>; }

export default function AcceptBookingPage({ params }: Props) {
    const { id } = use(params);
    const bookingId = parseInt(id, 10);
    const { currentUser } = useAuth();
    const { booking, loading } = useBooking(bookingId);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!booking) return;
        const clientName = booking.client?.first_name ?? 'client';
        const providerName = currentUser?.first_name ?? '';
        setMessage(
            `Bonjour ${clientName},\n\nJ'ai bien reçu votre demande pour "${getBookingTitle(booking)}" et je m'en occupe. Je vous contacterai prochainement pour organiser l'intervention.\n\nÀ bientôt,\n${providerName}`,
        );
    }, [booking, currentUser]);

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

    const handleSend = async () => {
        setSending(true);
        setError(null);
        try {
            await orderService.contactClient(booking.id, message);
            setSent(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur lors de l’envoi');
        } finally {
            setSending(false);
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
                            <h1 className="text-2xl font-extrabold text-brand-dark">Commande acceptée</h1>
                            <p className="text-slate-500 text-sm mt-1">{getBookingTitle(booking)}</p>
                        </div>

                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message au client (modifiable)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={7}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all resize-none mb-4"
                        />

                        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</p>}
                        {sent && (
                            <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                                <IconCircleCheck className="w-4 h-4" /> Message envoyé au client par email.
                            </p>
                        )}

                        <div className="flex gap-3">
                            <Button fullWidth icon={<IconMail className="w-4 h-4" />} disabled={sending || !message.trim()} onClick={handleSend}>
                                {sending ? 'Envoi…' : sent ? 'Renvoyer au client' : 'Contacter le client'}
                            </Button>
                            <Link href="/dashboard/provider/bookings" className="w-full"><Button variant="secondary" fullWidth>Terminer</Button></Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

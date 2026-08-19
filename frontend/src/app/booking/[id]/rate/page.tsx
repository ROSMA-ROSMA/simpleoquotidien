'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import { useBooking } from '@/hooks/useOrders';
import { orderService } from '@/services/order.service';
import { getBookingTitle } from '@/lib/utils';
import { IconArrowLeft, IconStar, IconCircleCheck } from '@tabler/icons-react';

interface Props {
    params: Promise<{ id: string }>;
}

/** Le modèle Notes (backend) ne rattache une note qu'au prestataire, pas à la commande —
 * on empêche donc côté frontend de noter deux fois la même réservation. */
function ratedFlagKey(bookingId: string) {
    return `sq_rated_booking_${bookingId}`;
}

export default function RateServicePage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const { booking, loading } = useBooking(id);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alreadyRated, setAlreadyRated] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setAlreadyRated(window.localStorage.getItem(ratedFlagKey(id)) === '1');
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!booking) return;
        setSubmitting(true);
        setError('');
        try {
            await orderService.review(id, rating, comment.trim() || undefined, booking.assigned_provider_id);
            window.localStorage.setItem(ratedFlagKey(id), '1');
            router.push(`/booking/${id}/rating-success`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Impossible d\'envoyer l\'avis');
            setSubmitting(false);
        }
    };

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
                    <Link href="/dashboard/client" className="text-brand-teal font-bold">← Retour</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />
            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href={`/booking/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour
                    </Link>

                    <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-slate-100">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <IconStar className="w-8 h-8 text-yellow-400" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-brand-dark mb-2">Évaluer le service</h1>
                            <p className="text-slate-500">{getBookingTitle(booking)}</p>
                        </div>

                        {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

                        {alreadyRated ? (
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-6">
                                    <IconCircleCheck className="w-5 h-5" />
                                    <span className="text-sm font-semibold">Vous avez déjà évalué cette prestation. Merci !</span>
                                </div>
                                <Link href={`/booking/${id}`}>
                                    <Button variant="secondary" fullWidth>Retour à la réservation</Button>
                                </Link>
                            </div>
                        ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="text-center">
                                <label className="block text-sm font-semibold text-slate-700 mb-3">Votre note</label>
                                <div className="flex justify-center">
                                    <StarRating rating={rating} size="lg" interactive onChange={setRating} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Votre commentaire</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Partagez votre expérience..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all resize-none"
                                />
                            </div>

                            <Button type="submit" fullWidth size="lg" disabled={rating === 0 || submitting}>
                                {submitting ? 'Envoi…' : 'Envoyer mon avis'}
                            </Button>
                        </form>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

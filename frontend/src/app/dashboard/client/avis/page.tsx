'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StarRating from '@/components/ui/StarRating';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/hooks/useOrders';
import { useMyReviews } from '@/hooks/useReviews';
import { mapReviewFromBackend } from '@/lib/mappers/backend';
import { formatDateTime, getBookingTitle } from '@/lib/utils';
import { IconArrowLeft, IconMessageStar } from '@tabler/icons-react';

export default function MyReviewsPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const { bookings, loading: bookingsLoading } = useBookings(
        currentUser ? { client_id: currentUser.id } : undefined,
        { enabled: Boolean(currentUser) },
    );
    const { notes, loading: reviewsLoading } = useMyReviews(currentUser?.id);

    const reviews = useMemo(() => {
        const bookingByUuid = new Map(bookings.filter(b => b.uuid).map(b => [b.uuid as string, b]));
        return notes
            .map(n => mapReviewFromBackend(n, n.order ? bookingByUuid.get(n.order) : undefined))
            .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
    }, [notes, bookings]);

    const loading = authLoading || (currentUser && (bookingsLoading || reviewsLoading));

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <p className="text-slate-500">Chargement…</p>
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar activeTab="avis" />

            <main className="flex-1 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/dashboard/client" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour au tableau de bord
                    </Link>

                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Mes avis</h1>

                    {reviews.length === 0 ? (
                        <EmptyState
                            icon={<IconMessageStar className="w-8 h-8" />}
                            title="Vous n'avez laissé aucun avis"
                            description="Une fois une commande terminée, vous pourrez noter le prestataire depuis le détail de la commande."
                            action={<Link href="/dashboard/client" className="text-brand-teal font-bold text-[11px] hover:text-brand-tealDark">Voir mes commandes →</Link>}
                        />
                    ) : (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <article key={review.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                        <h3 className="font-bold text-brand-dark">
                                            {review.booking ? getBookingTitle(review.booking) : 'Commande'}
                                        </h3>
                                        <StarRating rating={review.rating} size="sm" />
                                    </div>
                                    {review.comment && (
                                        <p className="text-sm text-slate-600 mb-3">{review.comment}</p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>{review.created_at ? formatDateTime(review.created_at) : ''}</span>
                                        {review.booking?.uuid && (
                                            <Link href={`/booking/${review.booking.uuid}`} className="font-bold text-brand-teal hover:text-brand-tealDark">
                                                Voir la commande →
                                            </Link>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

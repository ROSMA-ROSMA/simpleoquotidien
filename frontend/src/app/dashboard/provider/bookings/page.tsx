'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BookingCard from '@/components/bookings/BookingCard';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/hooks/useOrders';
import { orderService } from '@/services/order.service';
import { providerService } from '@/services/provider.service';
import { getBookingTitle } from '@/lib/utils';
import { Booking, BookingStatus, Provider } from '@/types';
import { IconCalendar, IconCheck, IconX, IconClockPause, IconPlayerPlay, IconMail, IconCircleCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProviderBookingsPage() {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState<Provider | null>(null);
    const [profileLoaded, setProfileLoaded] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        providerService.getProviders()
            .then(res => setProfile(res.data.find(p => p.user_id === currentUser.id) ?? null))
            .catch(() => setProfile(null))
            .finally(() => setProfileLoaded(true));
    }, [currentUser]);

    const { bookings, loading, reload } = useBookings(
        profile ? { provider_id: profile.id } : undefined,
        { enabled: Boolean(currentUser && profile) },
    );
    const [actionId, setActionId] = useState<number | null>(null);

    const [acceptedBooking, setAcceptedBooking] = useState<Booking | null>(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    if (!currentUser) {
        return <div className="min-h-screen flex items-center justify-center"><Link href="/login" className="text-brand-teal font-bold">Se connecter →</Link></div>;
    }

    if (loading || !profileLoaded) {
        return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-500">Chargement…</p></div>;
    }

    const myBookings = profile ? bookings.filter(b => b.assigned_provider_id === profile.id) : [];

    const handleAccept = async (booking: Booking) => {
        if (!booking.assignment_id) return;
        setActionId(booking.id);
        try {
            await orderService.accept(booking.assignment_id);
            const clientName = booking.client?.first_name ?? 'client';
            const providerName = currentUser.first_name ?? '';
            setMessage(
                `Bonjour ${clientName},\n\nJ'ai bien reçu votre demande pour "${getBookingTitle(booking)}" et je m'en occupe. Je vous contacterai prochainement pour organiser l'intervention.\n\nÀ bientôt,\n${providerName}`,
            );
            setSent(false);
            setSendError(null);
            setAcceptedBooking(booking);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Erreur');
        } finally {
            setActionId(null);
        }
    };

    const closeAcceptModal = () => {
        setAcceptedBooking(null);
        reload();
    };

    const handleSendMessage = async () => {
        if (!acceptedBooking) return;
        setSending(true);
        setSendError(null);
        try {
            await orderService.contactClient(acceptedBooking.id, message);
            setSent(true);
        } catch (e) {
            setSendError(e instanceof Error ? e.message : "Erreur lors de l'envoi");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar activeTab="bookings" />
            <main className="flex-1 py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Toutes mes réservations</h1>
                    {myBookings.length > 0 ? (
                        <div className="space-y-4">
                            {myBookings.map(booking => (
                                <div key={booking.id} className="space-y-2">
                                    <BookingCard booking={booking} role="provider" />
                                    {booking.assignment_status === 'EN_ATTENTE' && booking.assigned_provider_id === profile?.id && (
                                        <div className="flex flex-wrap gap-2 px-2">
                                            <Button size="sm" variant="primary" icon={<IconCheck className="w-4 h-4" />} disabled={actionId === booking.id} onClick={() => handleAccept(booking)}>Accepter</Button>
                                            <Link href={`/booking/${booking.id}/postpone`}>
                                                <Button size="sm" variant="ghost" icon={<IconClockPause className="w-4 h-4" />}>Reporter</Button>
                                            </Link>
                                            <Link href={`/booking/${booking.id}/reject`}>
                                                <Button size="sm" variant="danger" icon={<IconX className="w-4 h-4" />}>Refuser</Button>
                                            </Link>
                                        </div>
                                    )}
                                    {booking.status === BookingStatus.CONFIRMED && booking.assigned_provider_id === profile?.id && (
                                        <div className="flex flex-wrap gap-2 px-2">
                                            <Button size="sm" variant="primary" icon={<IconPlayerPlay className="w-4 h-4" />} disabled={actionId === booking.id} onClick={async () => { setActionId(booking.id); try { await orderService.startExecution(booking.id); await reload(); } finally { setActionId(null); } }}>Démarrer l&apos;intervention</Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<IconCalendar className="w-8 h-8" />} title="Aucune réservation" description="Les réservations de vos clients apparaîtront ici." />
                    )}
                </div>
            </main>
            <Footer />

            <Modal open={Boolean(acceptedBooking)} onClose={closeAcceptModal} title="Commande acceptée">
                {acceptedBooking && (
                    <>
                        <p className="text-slate-500 text-sm mb-4">{getBookingTitle(acceptedBooking)}</p>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message au client (modifiable)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={7}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all resize-none mb-4"
                        />
                        {sendError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{sendError}</p>}
                        {sent && (
                            <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                                <IconCircleCheck className="w-4 h-4" /> Message envoyé au client par email.
                            </p>
                        )}
                        <div className="flex gap-3">
                            <Button fullWidth icon={<IconMail className="w-4 h-4" />} disabled={sending || !message.trim()} onClick={handleSendMessage}>
                                {sending ? 'Envoi…' : sent ? 'Renvoyer au client' : 'Envoyer au client'}
                            </Button>
                            <Button variant="secondary" fullWidth onClick={closeAcceptModal}>Fermer</Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}

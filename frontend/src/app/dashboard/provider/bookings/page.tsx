'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BookingCard from '@/components/bookings/BookingCard';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/hooks/useOrders';
import { orderService } from '@/services/order.service';
import { providerService } from '@/services/provider.service';
import { Booking, BookingStatus, Provider } from '@/types';
import { IconCalendar, IconCheck, IconX, IconPlayerPlay } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProviderBookingsPage() {
    const { currentUser } = useAuth();
    const router = useRouter();
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

    if (!currentUser) {
        return <div className="min-h-screen flex items-center justify-center"><Link href="/login" className="text-brand-teal font-bold">Se connecter →</Link></div>;
    }

    if (loading || !profileLoaded) {
        return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-500">Chargement…</p></div>;
    }

    const myBookings = profile ? bookings.filter(b => b.assigned_provider_id === profile.id) : [];

    const handleAccept = async (booking: Booking) => {
        if (!booking.assignment_id || !booking.uuid) return;
        setActionId(booking.id);
        try {
            await orderService.accept(booking.assignment_id);
            router.push(`/booking/${booking.uuid}/accept`);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Erreur');
            setActionId(null);
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
                                            <Link href={`/booking/${booking.uuid}/reject`}>
                                                <Button size="sm" variant="danger" icon={<IconX className="w-4 h-4" />}>Refuser</Button>
                                            </Link>
                                        </div>
                                    )}
                                    {booking.status === BookingStatus.CONFIRMED && booking.assigned_provider_id === profile?.id && (
                                        <div className="flex flex-wrap gap-2 px-2">
                                            <Button size="sm" variant="primary" icon={<IconPlayerPlay className="w-4 h-4" />} disabled={actionId === booking.id} onClick={async () => { if (!booking.uuid) return; setActionId(booking.id); try { await orderService.startExecution(booking.uuid); await reload(); } finally { setActionId(null); } }}>Démarrer l&apos;intervention</Button>
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
        </div>
    );
}

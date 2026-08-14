'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BookingCard from '@/components/bookings/BookingCard';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/hooks/useOrders';
import { BookingStatus } from '@/types';
import { getInitials } from '@/lib/utils';
import { IconCalendar, IconCircleCheck, IconClock, IconSearch, IconUser, IconMessage, IconStar } from '@tabler/icons-react';

export default function ClientDashboardPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const { bookings, loading: bookingsLoading } = useBookings(
        currentUser ? { client_id: currentUser.id } : undefined,
        { enabled: Boolean(currentUser) },
    );

    if (authLoading || (currentUser && bookingsLoading)) {
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

    const myBookings = bookings.filter(b => b.client_id === currentUser.id);
    const activeStatuses = [
        BookingStatus.PENDING, BookingStatus.PROCESSING, BookingStatus.ASSIGNED,
        BookingStatus.REASSIGNMENT_NEEDED, BookingStatus.QUOTE_SENT, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS,
    ];
    const upcoming = myBookings.filter(b => activeStatuses.includes(b.status));
    const completed = myBookings.filter(b => b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CLOSED);
    const totalSpent = completed.reduce((sum, b) => sum + b.total_amount, 0);

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar activeTab="dashboard" />

            <main className="flex-1 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-brand-teal to-brand-tealDark rounded-2xl p-5 sm:p-8 mb-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
                            Bonjour {currentUser.first_name} 👋
                        </h1>
                        <p className="text-brand-tealLight/80 text-[11px]">
                            Bienvenue sur votre espace personnel. Gérez vos réservations et découvrez de nouveaux services.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-4">
                            <Link href="/services" className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-brand-coral text-white rounded-full text-base font-extrabold hover:bg-brand-coralHover transition-all shadow-xl shadow-brand-coral/30 hover:-translate-y-0.5">
                                <IconSearch className="w-5 h-5" /> Demander une réservation
                            </Link>
                            <Link href="/messages" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-[11px] font-bold hover:bg-white/20 transition-all border border-white/20">
                                <IconMessage className="w-4 h-4" /> Messages
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Stats + Bookings */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <StatCard label="En attente" value={upcoming.length} icon={<IconClock className="w-6 h-6" />} color="amber" />
                                <StatCard label="Terminées" value={completed.length} icon={<IconCircleCheck className="w-6 h-6" />} color="emerald" />
                                <StatCard label="Total dépensé" value={`${(totalSpent / 1000).toFixed(0)}k`} icon={<IconStar className="w-6 h-6" />} color="teal" />
                            </div>

                            {/* Upcoming Bookings */}
                            <div>
                                <h2 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                                    <IconCalendar className="w-5 h-5 text-brand-mint" /> Réservations à venir
                                </h2>
                                {upcoming.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcoming.map(booking => (
                                            <BookingCard key={booking.id} booking={booking} showPayButton role="client" />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<IconCalendar className="w-8 h-8" />}
                                        title="Aucune réservation à venir"
                                        description="Explorez nos services pour réserver votre prochain prestataire."
                                        action={<Link href="/services" className="text-brand-teal font-bold text-[11px] hover:text-brand-tealDark">Découvrir les services →</Link>}
                                    />
                                )}
                            </div>

                            {/* History */}
                            {completed.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-bold text-brand-dark mb-4">Historique récent</h2>
                                    <div className="space-y-4">
                                        {completed.map(booking => (
                                            <BookingCard key={booking.id} booking={booking} showActions={false} role="client" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: profile card */}
                        <div>
                            <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 sticky top-28">
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center text-2xl font-bold mx-auto ring-4 ring-brand-tealLight mb-3">
                                        {getInitials(currentUser.first_name, currentUser.last_name)}
                                    </div>
                                    <h3 className="font-bold text-brand-dark text-lg">{currentUser.first_name} {currentUser.last_name}</h3>
                                    <p className="text-slate-500 text-[11px]">{currentUser.email}</p>
                                </div>
                                <div className="space-y-3 text-[11px]">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <IconUser className="w-4 h-4 text-slate-400" />
                                        <span>Client</span>
                                    </div>
                                    {currentUser.phone_number && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <span className="text-slate-400">📞</span>
                                            <span>{currentUser.phone_number}</span>
                                        </div>
                                    )}
                                </div>
                                <Link href="/profile" className="block mt-6 text-center py-2.5 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-teal transition-colors">
                                    Modifier le profil
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

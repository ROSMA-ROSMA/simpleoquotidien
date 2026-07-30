'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BookingCard from '@/components/bookings/BookingCard';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import FeatureBanner from '@/components/ui/FeatureBanner';
import { useAuth } from '@/context/AuthContext';
import { useBookings } from '@/hooks/useOrders';
import { providerService } from '@/services/provider.service';
import { BookingStatus, Provider } from '@/types';
import { formatPrice, getInitials } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { IconCurrencyDollar, IconCalendar, IconCircleCheck, IconClock, IconPlus, IconBriefcase, IconShieldCheck, IconMessage, IconAlertTriangle, IconHourglass } from '@tabler/icons-react';

export default function ProviderDashboardPage() {
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

    const { bookings, loading } = useBookings(
        profile ? { provider_id: profile.id } : undefined,
        { enabled: Boolean(currentUser && profile) },
    );

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

    if (loading || !profileLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <p className="text-slate-500">Chargement…</p>
            </div>
        );
    }

    const myBookings = profile ? bookings.filter(b => b.assigned_provider_id === profile.id) : [];
    const pendingBookings = myBookings.filter(b => b.assignment_status === 'EN_ATTENTE');
    const completedBookings = myBookings.filter(b => b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CLOSED);
    const revenue = completedBookings.reduce((sum, b) => sum + b.total_amount, 0);

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <Navbar activeTab="dashboard" />

            <main className="flex-1 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mb-1">
                                Bienvenue, {currentUser.first_name} 👋
                            </h1>
                            <p className="text-slate-500 text-[11px]">Gérez vos interventions et réservations depuis votre espace.</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-3">
                            {currentUser.is_verified && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[11px] font-bold border border-green-100">
                                    <IconShieldCheck className="w-3.5 h-3.5" /> Vérifié
                                </span>
                            )}
                            <Link href="/messages">
                                <Button variant="secondary" size="sm" icon={<IconMessage className="w-4 h-4" />}>Messages</Button>
                            </Link>
                        </div>
                    </div>

                    {profile?.verification_status === 'EN_ATTENTE' && (
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
                            <IconHourglass className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">Profil en cours de vérification</p>
                                <p className="text-[11px] text-amber-700 mt-0.5">
                                    Votre compte est actif, mais nos équipes valident encore vos documents
                                    (pièce d&apos;identité, justificatif). Vous ne recevrez de demandes de
                                    clients qu&apos;une fois votre profil validé — généralement sous 24 à 48h.
                                </p>
                            </div>
                        </div>
                    )}

                    {profile?.verification_status === 'SUSPENDU' && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-8">
                            <IconAlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-800">Profil suspendu</p>
                                <p className="text-[11px] text-red-700 mt-0.5">
                                    Votre profil prestataire a été suspendu par notre équipe et n&apos;est
                                    plus visible des clients. Contactez le support pour en savoir plus.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard label="Revenus" value={`${formatPrice(revenue)} F`} icon={<IconCurrencyDollar className="w-6 h-6" />} color="emerald" />
                        <StatCard label="Zones" value={profile?.zones_couvertes ? '1+' : '0'} icon={<IconBriefcase className="w-6 h-6" />} color="teal" />
                        <StatCard label="En attente" value={pendingBookings.length} icon={<IconClock className="w-6 h-6" />} color="amber" />
                        <StatCard label="Terminées" value={completedBookings.length} icon={<IconCircleCheck className="w-6 h-6" />} color="blue" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                                    <IconCalendar className="w-5 h-5 text-brand-mint" /> Nouvelles demandes
                                </h2>
                                {pendingBookings.length > 0 ? (
                                    <div className="space-y-4">
                                        {pendingBookings.map(booking => (
                                            <BookingCard key={booking.id} booking={booking} role="provider" />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<IconCalendar className="w-8 h-8" />}
                                        title="Aucune demande en attente"
                                        description="Les nouvelles réservations apparaîtront ici."
                                    />
                                )}
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-brand-dark mb-4">Mes prestations</h2>
                                <FeatureBanner
                                    title="Catalogue services"
                                    message="Le backend ne gère pas encore de catalogue « service par service ». Vos prestations sont décrites dans votre profil prestataire."
                                />
                                {profile?.services ? (
                                    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                                        <p className="text-[11px] text-slate-600 whitespace-pre-wrap">{profile.services}</p>
                                        {profile.tarif && (
                                            <p className="text-brand-teal font-extrabold text-[11px] mt-3">Tarif : {profile.tarif}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-500">Aucune description de prestations renseignée.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                                <h3 className="font-bold text-brand-dark mb-4">Actions rapides</h3>
                                <div className="space-y-3">
                                    <Link href="/dashboard/provider/bookings" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-brand-tealLight/30 rounded-xl transition-colors group">
                                        <div className="w-10 h-10 bg-brand-tealLight rounded-lg flex items-center justify-center text-brand-teal group-hover:scale-105 transition-transform">
                                            <IconCalendar className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-semibold text-slate-700">Toutes les réservations</span>
                                    </Link>
                                    <Link href="/profile" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-brand-tealLight/30 rounded-xl transition-colors group">
                                        <div className="w-10 h-10 bg-brand-tealLight rounded-lg flex items-center justify-center text-brand-teal group-hover:scale-105 transition-transform">
                                            <IconPlus className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-semibold text-slate-700">Mettre à jour mon profil</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="profile-section rounded-2xl p-6 shadow-card">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold text-white mx-auto ring-4 ring-white/20 mb-3">
                                        {getInitials(currentUser.first_name, currentUser.last_name)}
                                    </div>
                                    <h3 className="font-bold text-white">{currentUser.first_name} {currentUser.last_name}</h3>
                                    <p className="text-brand-tealLight/70 text-[11px]">{currentUser.email}</p>
                                </div>
                                <Link href="/profile" className="block mt-4 text-center py-2 bg-white/10 backdrop-blur-sm rounded-xl text-[11px] font-bold text-white hover:bg-white/20 transition-colors border border-white/20">
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

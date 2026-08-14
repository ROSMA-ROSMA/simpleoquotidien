'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/lib/utils';
import { IconMapPin, IconLanguage, IconUser, IconArrowLeft, IconCalendar, IconStar } from '@tabler/icons-react';

interface Props {
    params: Promise<{ id: string }>;
}

export default function ServiceDetailPage({ params }: Props) {
    const { id } = use(params);
    const serviceId = parseInt(id);
    const service = useAppStore(s => s.services.find(sv => sv.id === serviceId));
    const allReviews = useAppStore(s => s.reviews);
    // Dérivé via useMemo plutôt que dans le sélecteur Zustand : un sélecteur qui renvoie un
    // nouveau tableau à chaque appel (filter/map) casse le contrat de useSyncExternalStore et
    // provoque une boucle de rendu infinie ("Maximum update depth exceeded" — React error #185).
    const reviews = useMemo(
        () => allReviews.filter(r => r.booking?.service_id === serviceId),
        [allReviews, serviceId],
    );
    const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    if (!service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Service introuvable</h1>
                    <Link href="/services" className="text-brand-teal font-bold">← Retour aux services</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />

            <main className="flex-1 pt-28 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/services" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-teal font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" /> Retour aux services
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Image + Description */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Image */}
                            <div className="rounded-2xl overflow-hidden h-80 shadow-card">
                                {service.image ? (
                                    <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-brand-tealLight to-brand-mint/20 flex items-center justify-center">
                                        <span className="text-6xl">🔧</span>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-slate-100">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                    <div className="min-w-0">
                                        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mb-2 break-words">{service.name}</h1>
                                        {service.category && (
                                            <span className="inline-block bg-brand-tealLight text-brand-teal text-xs font-bold px-3 py-1 rounded-full">
                                                {service.category.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="sm:text-right flex-shrink-0">
                                        <span className="text-2xl sm:text-3xl font-extrabold text-brand-teal">{formatPrice(service.price)}</span>
                                        <span className="text-sm text-slate-500 block">FCFA</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={avgRating} size="sm" />
                                        <span className="text-sm font-bold text-slate-700">{avgRating.toFixed(1)}</span>
                                        <span className="text-sm text-slate-400">({reviews.length} avis)</span>
                                    </div>
                                </div>

                                <p className="text-slate-600 leading-relaxed mb-6">{service.description}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                                    {service.location && (
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                                <IconMapPin className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <span>{service.location}</span>
                                        </div>
                                    )}
                                    {service.languages && (
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                                <IconLanguage className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <span>{service.languages}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reviews */}
                            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-slate-100">
                                <h2 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2">
                                    <IconStar className="w-5 h-5 text-yellow-400" /> Avis clients ({reviews.length})
                                </h2>

                                {reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map(review => (
                                            <div key={review.id} className="pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center text-xs font-bold">
                                                        {review.booking?.client?.first_name?.[0] ?? 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-brand-dark">{review.booking?.client?.first_name}</p>
                                                        <StarRating rating={review.rating} size="sm" />
                                                    </div>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-slate-600 italic">&ldquo;{review.comment}&rdquo;</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm">Aucun avis pour le moment.</p>
                                )}
                            </div>
                        </div>

                        {/* Right: Provider card + Book CTA */}
                        <div className="space-y-6">
                            {/* Provider Card */}
                            {service.provider && (
                                <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Prestataire</h3>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-full bg-brand-tealLight text-brand-teal flex items-center justify-center text-xl font-bold ring-4 ring-brand-tealLight">
                                            {service.provider.first_name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-brand-dark">{service.provider.first_name} {service.provider.last_name}</p>
                                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                                <IconUser className="w-3.5 h-3.5" /> Prestataire vérifié
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Booking CTA */}
                            <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 sticky top-28">
                                <div className="text-center mb-4">
                                    <span className="text-3xl font-extrabold text-brand-teal">{formatPrice(service.price)}</span>
                                    <span className="text-sm text-slate-500 ml-1">FCFA</span>
                                </div>
                                <Link href={`/service/${service.id}/book`}>
                                    <Button fullWidth size="lg" icon={<IconCalendar className="w-5 h-5" />}>
                                        Réserver maintenant
                                    </Button>
                                </Link>
                                <p className="text-center text-xs text-slate-400 mt-3">Réservation minimum 24h à l&apos;avance</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

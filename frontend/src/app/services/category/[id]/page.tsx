'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import ProviderRating from '@/components/reviews/ProviderRating';
import { useCategory } from '@/hooks/useCategories';
import { serviceService } from '@/services/service.service';
import { reviewService, RatingSummary } from '@/services/review.service';
import { formatPrice } from '@/lib/utils';
import { ProviderService } from '@/types';
import { IconArrowLeft, IconMapPin, IconUser, IconBriefcase } from '@tabler/icons-react';

interface Props {
    params: Promise<{ id: string }>;
}

type SortMode = 'rating_desc' | 'price_asc' | 'price_desc';

export default function CategoryServicesPage({ params }: Props) {
    const { id } = use(params);
    const categoryId = parseInt(id, 10);
    const { category, loading, error } = useCategory(categoryId);
    const [services, setServices] = useState<ProviderService[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [ratings, setRatings] = useState<Map<number, RatingSummary>>(new Map());
    const [sort, setSort] = useState<SortMode>('rating_desc');

    useEffect(() => {
        serviceService.getAll({ category_id: categoryId })
            .then(res => setServices(res.data))
            .catch(() => setServices([]))
            .finally(() => setServicesLoading(false));
        reviewService.getSummaryByProvider()
            .then(setRatings)
            .catch(() => setRatings(new Map()));
    }, [categoryId]);

    // Les prestataires les mieux notés apparaissent en premier par défaut : la note
    // client a ainsi un impact direct sur le matching / le choix du client.
    const sortedServices = useMemo(() => {
        const ratingOf = (s: ProviderService) => ratings.get(s.prestataire_id)?.average ?? 0;
        const list = [...services];
        list.sort((a, b) => {
            if (sort === 'price_asc') return a.price - b.price;
            if (sort === 'price_desc') return b.price - a.price;
            return ratingOf(b) - ratingOf(a);
        });
        return list;
    }, [services, ratings, sort]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <p className="text-slate-500">Chargement…</p>
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-brand-dark mb-2">Catégorie introuvable</h1>
                    <Link href="/services" className="text-brand-teal font-bold">← Retour aux services</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <LandingNavbar />

            <section className="pt-28 pb-12 relative overflow-hidden bg-brand-teal">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <Link href="/services" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium mb-6 transition-colors">
                        <IconArrowLeft className="w-4 h-4" />
                        Toutes les catégories
                    </Link>
                    <h1 className="text-4xl font-extrabold text-white mb-3">{category.name}</h1>
                    <p className="text-white/70 text-lg max-w-2xl">{category.description}</p>
                    <div className="mt-8">
                        {servicesLoading ? null : services.length > 0 ? (
                            <Link href={`/services/category/${category.id}/book`}>
                                <Button size="lg">Demander une intervention</Button>
                            </Link>
                        ) : (
                            <p className="text-white/80 text-sm bg-white/10 border border-white/20 rounded-xl px-4 py-3 max-w-md">
                                Aucun prestataire ne propose ce service pour l&apos;instant. Revenez bientôt ou explorez une autre catégorie.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-12 flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <h2 className="text-lg font-bold text-brand-dark">Services disponibles dans cette catégorie</h2>
                        {services.length > 1 && (
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortMode)}
                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-teal"
                            >
                                <option value="rating_desc">Mieux notés</option>
                                <option value="price_asc">Prix croissant</option>
                                <option value="price_desc">Prix décroissant</option>
                            </select>
                        )}
                    </div>

                    {servicesLoading ? (
                        <p className="text-center text-slate-500 py-12">Chargement des services…</p>
                    ) : sortedServices.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedServices.map(service => {
                                const rating = ratings.get(service.prestataire_id);
                                return (
                                <div key={service.id} className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                                    {service.image ? (
                                        <img src={service.image} alt={category.name} className="w-full h-40 object-cover" />
                                    ) : (
                                        <div className="w-full h-40 bg-brand-tealLight flex items-center justify-center">
                                            <IconBriefcase className="w-8 h-8 text-brand-teal/50" />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xl font-extrabold text-brand-teal">{formatPrice(service.price)} FCFA</p>
                                            <ProviderRating average={rating?.average ?? 0} count={rating?.count ?? 0} showCount={false} />
                                        </div>
                                        {service.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{service.description}</p>}
                                        <div className="flex items-center justify-between text-sm text-slate-500">
                                            {service.prestataire_name && (
                                                <span className="flex items-center gap-1.5"><IconUser className="w-3.5 h-3.5" /> {service.prestataire_name}</span>
                                            )}
                                            <span className="flex items-center gap-1.5"><IconMapPin className="w-3.5 h-3.5" /> {service.city}</span>
                                        </div>
                                        <Link href={`/service/${service.id}`} className="block mt-3 pt-3 border-t border-slate-50 text-sm font-bold text-brand-teal hover:text-brand-tealDark text-center">
                                            Voir le détail
                                        </Link>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-card">
                            <h3 className="text-lg font-bold text-brand-dark mb-1">Aucun service publié pour l&apos;instant</h3>
                            <p className="text-slate-500 text-sm mb-6">Aucun prestataire ne propose ce service pour le moment dans cette catégorie.</p>
                            <Link href="/services" className="text-brand-teal font-bold hover:text-brand-tealDark">Explorer une autre catégorie →</Link>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}

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
import { ProviderService } from '@/types';
import { IconArrowLeft, IconBriefcase, IconQuote } from '@tabler/icons-react';

interface Props {
    params: Promise<{ id: string }>;
}

export default function CategoryServicesPage({ params }: Props) {
    const { id } = use(params);
    const categoryId = parseInt(id, 10);
    const { category, loading, error } = useCategory(categoryId);
    const [services, setServices] = useState<ProviderService[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [ratings, setRatings] = useState<Map<number, RatingSummary>>(new Map());

    useEffect(() => {
        serviceService.getAll({ category_id: categoryId })
            .then(res => setServices(res.data))
            .catch(() => setServices([]))
            .finally(() => setServicesLoading(false));
        reviewService.getSummaryByProvider()
            .then(setRatings)
            .catch(() => setRatings(new Map()));
    }, [categoryId]);

    // Les prestataires les mieux notés apparaissent en premier : la note client
    // a ainsi un impact direct sur la mise en avant, sans jamais afficher qui ils sont.
    const sortedServices = useMemo(() => {
        const ratingOf = (s: ProviderService) => ratings.get(s.prestataire_id)?.average ?? 0;
        return [...services].sort((a, b) => ratingOf(b) - ratingOf(a));
    }, [services, ratings]);

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

            {/* Hero — image de la catégorie chargée par l'admin en fond, avec nom + description */}
            <section className="relative pt-28 pb-16 sm:pb-20 overflow-hidden bg-brand-dark">
                {category.image ? (
                    <img
                        src={category.image}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <Link href="/services" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-5 transition-colors">
                        <IconArrowLeft className="w-4 h-4" />
                        Toutes les catégories
                    </Link>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 drop-shadow-sm">{category.name}</h1>
                    <p className="text-white/85 text-base sm:text-lg max-w-2xl leading-relaxed">{category.description}</p>
                    <div className="mt-7">
                        {servicesLoading ? null : services.length > 0 ? (
                            <Link href={`/services/category/${category.id}/book`}>
                                <Button size="lg">Demander une intervention</Button>
                            </Link>
                        ) : (
                            <p className="text-white/90 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 max-w-md">
                                Aucun prestataire ne propose ce service pour l&apos;instant. Revenez bientôt ou explorez une autre catégorie.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-12 sm:py-16 flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mb-2">Nos services {category.name.toLowerCase()}</h2>
                        <p className="text-slate-500 max-w-xl mx-auto">Découvrez les prestations proposées par nos partenaires, avec leurs propres mots.</p>
                    </div>

                    {servicesLoading ? (
                        <p className="text-center text-slate-500 py-12">Chargement des services…</p>
                    ) : sortedServices.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                            {sortedServices.map(service => {
                                const rating = ratings.get(service.prestataire_id);
                                return (
                                    <article
                                        key={service.id}
                                        className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow duration-300"
                                    >
                                        {service.image ? (
                                            <img src={service.image} alt={category.name} className="w-full h-48 object-cover" />
                                        ) : (
                                            <div className="w-full h-48 bg-gradient-to-br from-brand-tealLight to-brand-mint/20 flex items-center justify-center">
                                                <IconBriefcase className="w-9 h-9 text-brand-teal/50" />
                                            </div>
                                        )}
                                        <div className="p-6">
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <h3 className="font-bold text-brand-dark text-lg leading-tight">{category.name}</h3>
                                                {(rating?.count ?? 0) > 0 && (
                                                    <ProviderRating average={rating?.average ?? 0} count={rating?.count ?? 0} showCount={false} />
                                                )}
                                            </div>
                                            {service.description ? (
                                                <div className="flex gap-2 text-sm text-slate-500 italic leading-relaxed">
                                                    <IconQuote className="w-4 h-4 text-brand-teal/40 flex-shrink-0 mt-0.5" />
                                                    <p className="line-clamp-4">{service.description}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic">Aucune description fournie par le prestataire.</p>
                                            )}
                                        </div>
                                    </article>
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

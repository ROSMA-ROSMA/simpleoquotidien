'use client';

import { use } from 'react';
import Link from 'next/link';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { useCategory } from '@/hooks/useCategories';
import { providerService } from '@/services/provider.service';
import { useEffect, useState } from 'react';
import { User } from '@/types';
import { IconArrowLeft, IconMapPin } from '@tabler/icons-react';

interface Props {
    params: Promise<{ id: string }>;
}

export default function CategoryServicesPage({ params }: Props) {
    const { id } = use(params);
    const categoryId = parseInt(id, 10);
    const { category, loading, error } = useCategory(categoryId);
    const [providers, setProviders] = useState<User[]>([]);

    useEffect(() => {
        providerService.getAll().then(res => setProviders(res.data)).catch(() => setProviders([]));
    }, []);

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
                        <Link href={`/services/category/${category.id}/book`}>
                            <Button size="lg">Demander une intervention</Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-12 flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-lg font-bold text-brand-dark mb-4">Prestataires disponibles</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Le catalogue « service par service » n&apos;existe pas encore côté API : voici les prestataires inscrits.
                    </p>

                    {providers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {providers.map(p => (
                                <div key={p.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
                                    <p className="font-bold text-brand-dark">{p.first_name} {p.last_name}</p>
                                    {p.intervention_city && (
                                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-2">
                                            <IconMapPin className="w-4 h-4" /> {p.intervention_city}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-card">
                            <p className="text-4xl mb-4">📭</p>
                            <h3 className="text-lg font-bold text-brand-dark mb-1">Aucun prestataire listé</h3>
                            <p className="text-slate-500 text-sm">Vous pouvez quand même créer une demande ; un agent vous contactera.</p>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
